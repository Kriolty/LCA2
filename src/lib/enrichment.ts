import { supabase } from './supabase';
import { integrationManager } from '../services/integrations/IntegrationManager';
import type { CompanyEnrichment } from '../types/crm';

export interface EnrichmentRequest {
  leadId: string;
  companyName?: string;
  domain?: string;
  email?: string;
}

export interface EnrichmentResult {
  companyName?: string;
  domain?: string;
  revenue?: number;
  employees?: number;
  ceo?: string;
  industry?: string;
  location?: string;
  foundedYear?: number;
  techStack?: string[];
  linkedin?: string;
  confidenceScore?: number;
}

export class EnrichmentService {
  async enrichLead(request: EnrichmentRequest): Promise<CompanyEnrichment | null> {
    try {
      const searchTerm = request.domain || request.email || request.companyName || '';

      const enrichmentResult = await integrationManager.enrichCompany(searchTerm);

      if (!enrichmentResult.success) {
        console.log('Enrichment not successful, using mock data');
      }

      const { data, error } = await supabase
        .from('company_enrichment')
        .upsert({
          lead_id: request.leadId,
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
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving enrichment data:', error);
        return null;
      }

      await supabase
        .from('leads')
        .update({ enriched: true })
        .eq('id', request.leadId);

      return data;
    } catch (error) {
      console.error('Enrichment error:', error);
      return null;
    }
  }

  async getEnrichmentForLead(leadId: string): Promise<CompanyEnrichment | null> {
    const { data, error } = await supabase
      .from('company_enrichment')
      .select('*')
      .eq('lead_id', leadId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching enrichment:', error);
      return null;
    }

    return data;
  }
}

export const enrichmentService = new EnrichmentService();

export async function enrichLeadById(leadId: string, companyInfo?: { name?: string; domain?: string; email?: string }) {
  return enrichmentService.enrichLead({
    leadId,
    companyName: companyInfo?.name,
    domain: companyInfo?.domain,
    email: companyInfo?.email,
  });
}
