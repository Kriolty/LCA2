export interface EnrichmentResult {
  success: boolean;
  source: 'apollo' | 'clearbit' | 'mock';
  company_name?: string;
  domain?: string;
  revenue?: string | number;
  employees?: number;
  ceo?: string;
  tech_stack?: string[];
  linkedin?: string;
  industry?: string;
  location?: string;
  founded_year?: number;
  confidence_score?: number;
  raw?: any;
}

export interface ParsedLeadInput {
  business_name?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  address_line1?: string;
  address_line2?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
  industry?: string;
  vertical?: string;
  business_type?: string;
  employee_count?: number;
  estimated_revenue?: number;
  [key: string]: any;
}

export interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  duplicates: number;
  errors: Array<{
    row: number;
    data: Partial<ParsedLeadInput>;
    error: string;
    reason: 'duplicate' | 'validation' | 'database_error';
  }>;
}

export interface CSVImportOptions {
  batchSize?: number;
  detectFormat?: boolean;
  skipDuplicates?: boolean;
  enrichAfterImport?: boolean;
}

export interface FacebookLeadData {
  id: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
  ad_id?: string;
  ad_name?: string;
  adset_id?: string;
  adset_name?: string;
  campaign_id?: string;
  campaign_name?: string;
  form_id?: string;
  form_name?: string;
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  lead_id?: string;
  error?: string;
}

export type IntegrationService = 'apollo' | 'clearbit' | 'facebook' | 'ninja_data' | 'google_my_business';

export interface IntegrationConfig {
  apollo_api_key?: string;
  clearbit_api_key?: string;
  facebook_verify_token?: string;
  facebook_page_access_token?: string;
}

export interface ConnectionTestResult {
  service: IntegrationService;
  success: boolean;
  message: string;
  details?: any;
}
