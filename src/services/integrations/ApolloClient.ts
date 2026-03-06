import type { EnrichmentResult, ConnectionTestResult } from './types';

export class ApolloClient {
  private apiKey: string;
  private baseUrl = 'https://api.apollo.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async enrichCompany(domainOrName: string): Promise<EnrichmentResult> {
    try {
      const isDomain = domainOrName.includes('.') || domainOrName.includes('@');
      const searchDomain = domainOrName.includes('@')
        ? domainOrName.split('@')[1]
        : domainOrName;

      const response = await fetch(`${this.baseUrl}/organizations/enrich`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify({
          domain: isDomain ? searchDomain : undefined,
          name: !isDomain ? domainOrName : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
          errorData.error ||
          `Apollo API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const org = data.organization;

      if (!org) {
        return {
          success: false,
          source: 'apollo',
          company_name: domainOrName,
        };
      }

      return {
        success: true,
        source: 'apollo',
        company_name: org.name,
        domain: org.website_url?.replace(/^https?:\/\//, '').replace(/\/$/, ''),
        revenue: org.estimated_num_employees ? this.estimateRevenue(org.estimated_num_employees) : undefined,
        employees: org.estimated_num_employees,
        ceo: org.founded_year ? undefined : undefined,
        industry: org.industry,
        location: [org.city, org.state, org.country].filter(Boolean).join(', '),
        founded_year: org.founded_year,
        tech_stack: org.technologies?.map((t: any) => t.name) || [],
        linkedin: org.linkedin_url,
        confidence_score: 0.85,
        raw: org,
      };
    } catch (error) {
      console.error('Apollo enrichment error:', error);
      return {
        success: false,
        source: 'apollo',
        company_name: domainOrName,
      };
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/health`, {
        method: 'GET',
        headers: {
          'X-Api-Key': this.apiKey,
        },
      });

      if (response.ok) {
        return {
          service: 'apollo',
          success: true,
          message: 'Apollo.io API connection successful',
        };
      }

      const errorData = await response.json().catch(() => ({}));
      return {
        service: 'apollo',
        success: false,
        message: errorData.message || `API returned status ${response.status}`,
        details: errorData,
      };
    } catch (error) {
      return {
        service: 'apollo',
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  private estimateRevenue(employees: number): number {
    if (employees < 10) return 500000;
    if (employees < 50) return 2000000;
    if (employees < 100) return 5000000;
    if (employees < 500) return 25000000;
    if (employees < 1000) return 50000000;
    return 100000000;
  }
}
