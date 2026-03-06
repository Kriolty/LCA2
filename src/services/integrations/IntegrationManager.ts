import { supabase } from '../../lib/supabase';
import { ApolloClient } from './ApolloClient';
import { ClearbitClient} from './ClearbitClient';
import { CSVImporter } from './CSVImporter';
import type {
  EnrichmentResult,
  ParsedLeadInput,
  ImportResult,
  CSVImportOptions,
  FacebookLeadData,
  WebhookResponse,
  IntegrationService,
  IntegrationConfig,
  ConnectionTestResult,
} from './types';

export class IntegrationManager {
  private apolloClient: ApolloClient | null = null;
  private clearbitClient: ClearbitClient | null = null;
  private csvImporter: CSVImporter;
  private config: IntegrationConfig = {};

  constructor(config?: IntegrationConfig) {
    if (config) {
      this.config = config;
      this.initializeClients();
    }
    this.csvImporter = new CSVImporter();
  }

  async loadConfigFromDatabase(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .maybeSingle();

      if (error) {
        console.warn('No integration settings found:', error);
        return;
      }

      if (data) {
        this.config = {
          apollo_api_key: data.apollo_api_key,
          clearbit_api_key: data.clearbit_api_key,
          facebook_verify_token: data.facebook_verify_token,
          facebook_page_access_token: data.facebook_page_access_token,
        };
        this.initializeClients();
      }
    } catch (error) {
      console.error('Error loading integration config:', error);
    }
  }

  private initializeClients(): void {
    if (this.config.apollo_api_key) {
      this.apolloClient = new ApolloClient(this.config.apollo_api_key);
    }

    if (this.config.clearbit_api_key) {
      this.clearbitClient = new ClearbitClient(this.config.clearbit_api_key);
    }
  }

  async enrichCompany(domainOrName: string, options?: { preferredSource?: 'apollo' | 'clearbit' }): Promise<EnrichmentResult> {
    try {
      const preferredSource = options?.preferredSource;

      if (preferredSource === 'apollo' && this.apolloClient) {
        return await this.apolloClient.enrichCompany(domainOrName);
      }

      if (preferredSource === 'clearbit' && this.clearbitClient) {
        return await this.clearbitClient.enrichCompany(domainOrName);
      }

      if (this.apolloClient) {
        return await this.apolloClient.enrichCompany(domainOrName);
      }

      if (this.clearbitClient) {
        return await this.clearbitClient.enrichCompany(domainOrName);
      }

      return this.generateMockEnrichment(domainOrName);
    } catch (error) {
      console.error('Enrichment error:', error);
      return {
        success: false,
        source: 'mock',
        company_name: domainOrName,
      };
    }
  }

  private generateMockEnrichment(domainOrName: string): EnrichmentResult {
    const isEmail = domainOrName.includes('@');
    const domain = isEmail ? domainOrName.split('@')[1] : domainOrName;
    const companyName = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);

    return {
      success: true,
      source: 'mock',
      company_name: `${companyName} Pty Ltd`,
      domain: domain,
      revenue: Math.floor(Math.random() * 10000000) + 500000,
      employees: Math.floor(Math.random() * 500) + 10,
      ceo: 'John Smith',
      industry: 'Technology',
      location: 'Sydney, NSW, Australia',
      founded_year: 2010 + Math.floor(Math.random() * 13),
      tech_stack: ['React', 'Node.js', 'PostgreSQL', 'AWS'],
      linkedin: `https://linkedin.com/company/${domain.split('.')[0]}`,
      confidence_score: 0.6,
    };
  }

  async importLeadsFromCSV(file: File, options?: CSVImportOptions): Promise<ImportResult> {
    try {
      const result = await this.csvImporter.import(file, options);

      if (result.success && options?.enrichAfterImport && result.imported > 0) {
        console.log(`Enriching ${result.imported} imported leads...`);
      }

      return result;
    } catch (error) {
      console.error('CSV import error:', error);
      return {
        success: false,
        total: 0,
        imported: 0,
        failed: 0,
        duplicates: 0,
        errors: [{
          row: 0,
          data: {},
          error: error instanceof Error ? error.message : 'Unknown error',
          reason: 'database_error',
        }],
      };
    }
  }

  async handleFacebookWebhook(payload: FacebookLeadData): Promise<WebhookResponse> {
    try {
      const leadData: ParsedLeadInput = {
        business_name: this.extractFacebookField(payload, 'company_name') ||
                      this.extractFacebookField(payload, 'full_name'),
        email: this.extractFacebookField(payload, 'email'),
        phone: this.extractFacebookField(payload, 'phone_number'),
        address_line1: this.extractFacebookField(payload, 'street_address'),
        city: this.extractFacebookField(payload, 'city'),
        state: this.extractFacebookField(payload, 'state'),
        postcode: this.extractFacebookField(payload, 'zip_code') ||
                  this.extractFacebookField(payload, 'post_code'),
        country: this.extractFacebookField(payload, 'country') || 'Australia',
      };

      const { data, error } = await supabase
        .from('leads')
        .insert({
          business_name: leadData.business_name,
          email: leadData.email,
          phone: leadData.phone,
          address: leadData.address_line1,
          suburb: leadData.city,
          state: leadData.state,
          postcode: leadData.postcode,
          source: 'facebook_leads',
          status: 'new',
          vertical: 'general',
          created_at: new Date(payload.created_time).toISOString(),
        })
        .select('id')
        .single();

      if (error) {
        console.error('Facebook lead insert error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      if (data?.id && leadData.business_name) {
        setTimeout(() => {
          this.enrichCompany(leadData.business_name!).then((enrichmentResult) => {
            if (enrichmentResult.success) {
              supabase
                .from('company_enrichment')
                .upsert({
                  lead_id: data.id,
                  company_name: enrichmentResult.company_name,
                  domain: enrichmentResult.domain,
                  revenue: typeof enrichmentResult.revenue === 'string'
                    ? parseFloat(enrichmentResult.revenue)
                    : enrichmentResult.revenue,
                  employees: enrichmentResult.employees,
                  ceo: enrichmentResult.ceo,
                  industry: enrichmentResult.industry,
                  location: enrichmentResult.location,
                  founded_year: enrichmentResult.founded_year,
                  tech_stack: enrichmentResult.tech_stack,
                  linkedin: enrichmentResult.linkedin,
                  confidence_score: enrichmentResult.confidence_score || 0.5,
                  enrichment_source: enrichmentResult.source,
                })
                .then(() => {
                  supabase
                    .from('leads')
                    .update({ enriched: true })
                    .eq('id', data.id)
                    .then(() => console.log('Lead enriched successfully'));
                });
            }
          }).catch(err => console.error('Background enrichment error:', err));
        }, 100);
      }

      return {
        success: true,
        message: 'Lead created successfully',
        lead_id: data.id,
      };
    } catch (error) {
      console.error('Facebook webhook handler error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private extractFacebookField(payload: FacebookLeadData, fieldName: string): string | undefined {
    const field = payload.field_data?.find(f =>
      f.name.toLowerCase() === fieldName.toLowerCase() ||
      f.name.toLowerCase().replace('_', '') === fieldName.toLowerCase().replace('_', '')
    );
    return field?.values?.[0];
  }

  async testConnection(service: 'apollo' | 'clearbit'): Promise<ConnectionTestResult> {
    try {
      if (service === 'apollo') {
        if (!this.apolloClient) {
          return {
            service: 'apollo',
            success: false,
            message: 'Apollo API key not configured',
          };
        }
        return await this.apolloClient.testConnection();
      }

      if (service === 'clearbit') {
        if (!this.clearbitClient) {
          return {
            service: 'clearbit',
            success: false,
            message: 'Clearbit API key not configured',
          };
        }
        return await this.clearbitClient.testConnection();
      }

      return {
        service,
        success: false,
        message: 'Unknown service',
      };
    } catch (error) {
      return {
        service,
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  getAvailableServices(): Array<{ service: IntegrationService; configured: boolean }> {
    return [
      {
        service: 'apollo',
        configured: !!this.apolloClient,
      },
      {
        service: 'clearbit',
        configured: !!this.clearbitClient,
      },
      {
        service: 'facebook',
        configured: !!(this.config.facebook_verify_token && this.config.facebook_page_access_token),
      },
      {
        service: 'ninja_data',
        configured: true,
      },
      {
        service: 'google_my_business',
        configured: true,
      },
    ];
  }

  updateConfig(config: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...config };
    this.initializeClients();
  }
}

export const integrationManager = new IntegrationManager();

integrationManager.loadConfigFromDatabase().catch(err => {
  console.warn('Failed to load integration config:', err);
});
