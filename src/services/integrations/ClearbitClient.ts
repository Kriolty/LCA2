import type { EnrichmentResult, ConnectionTestResult } from './types';

export class ClearbitClient {
  private apiKey: string;
  private baseUrl = 'https://company.clearbit.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async enrichCompany(domainOrName: string): Promise<EnrichmentResult> {
    try {
      const isDomain = domainOrName.includes('.') || domainOrName.includes('@');

      if (!isDomain) {
        return await this.enrichByName(domainOrName);
      }

      const domain = domainOrName.includes('@')
        ? domainOrName.split('@')[1]
        : domainOrName;

      const response = await fetch(`${this.baseUrl}/companies/find?domain=${encodeURIComponent(domain)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (response.status === 404) {
        return {
          success: false,
          source: 'clearbit',
          company_name: domainOrName,
          domain: domain,
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
          errorData.message ||
          `Clearbit API error: ${response.status} ${response.statusText}`
        );
      }

      const company = await response.json();

      return {
        success: true,
        source: 'clearbit',
        company_name: company.name,
        domain: company.domain,
        revenue: company.metrics?.estimatedAnnualRevenue,
        employees: company.metrics?.employees,
        ceo: company.twitter?.followers ? undefined : undefined,
        industry: company.category?.industry,
        location: [company.geo?.city, company.geo?.state, company.geo?.country].filter(Boolean).join(', '),
        founded_year: company.foundedYear,
        tech_stack: company.tech || [],
        linkedin: company.linkedin?.handle ? `https://linkedin.com/company/${company.linkedin.handle}` : undefined,
        confidence_score: 0.9,
        raw: company,
      };
    } catch (error) {
      console.error('Clearbit enrichment error:', error);
      return {
        success: false,
        source: 'clearbit',
        company_name: domainOrName,
      };
    }
  }

  private async enrichByName(name: string): Promise<EnrichmentResult> {
    try {
      const response = await fetch(
        `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(name)}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        return {
          success: false,
          source: 'clearbit',
          company_name: name,
        };
      }

      const suggestions = await response.json();

      if (!suggestions || suggestions.length === 0) {
        return {
          success: false,
          source: 'clearbit',
          company_name: name,
        };
      }

      const topMatch = suggestions[0];

      if (topMatch.domain) {
        return await this.enrichCompany(topMatch.domain);
      }

      return {
        success: true,
        source: 'clearbit',
        company_name: topMatch.name,
        domain: topMatch.domain,
        confidence_score: 0.6,
        raw: topMatch,
      };
    } catch (error) {
      console.error('Clearbit name search error:', error);
      return {
        success: false,
        source: 'clearbit',
        company_name: name,
      };
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/companies/find?domain=clearbit.com`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      if (response.ok) {
        return {
          service: 'clearbit',
          success: true,
          message: 'Clearbit API connection successful',
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          service: 'clearbit',
          success: false,
          message: 'Invalid API key or unauthorized',
        };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        service: 'clearbit',
        success: false,
        message: errorData.error?.message || `API returned status ${response.status}`,
        details: errorData,
      };
    } catch (error) {
      return {
        service: 'clearbit',
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }
}
