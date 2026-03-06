export interface Prospect {
  id: string;
  business_name: string;
  trading_name?: string;
  abn?: string;
  acn?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  address_line1?: string;
  suburb?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  industry?: string;
  vertical?: string;
  employee_count?: number;
  estimated_revenue?: number;
  quality_score?: number;
  verification_status?: string;
  status: string;
  conversion_status?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface Lead {
  id: string;
  prospect_id?: string;
  first_name?: string;
  last_name?: string;
  business_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  source?: string;
  vertical: string;
  status: string;
  owner_id?: string;
  value?: number;
  score?: number;
  quality_rating?: string;
  tags?: string[];
  notes?: string;
  enriched?: boolean;
  sold?: boolean;
  sold_price?: number;
  sold_to?: string;
  created_at: string;
  updated_at?: string;
}

export interface LeadVertical {
  id: string;
  lead_id: string;
  vertical: string;
  value: number;
  confidence_score?: number;
  notes?: string;
  created_at: string;
}

export interface CompanyEnrichment {
  id: string;
  lead_id: string;
  company_name?: string;
  domain?: string;
  revenue?: number;
  employees?: number;
  ceo?: string;
  industry?: string;
  location?: string;
  founded_year?: number;
  tech_stack?: string[];
  linkedin?: string;
  confidence_score?: number;
  enrichment_source?: string;
  created_at: string;
  updated_at?: string;
}

export interface AITask {
  id: string;
  type: 'nudge' | 'summary' | 'script' | 'email' | 'suggestion' | 'query';
  lead_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  payload?: Record<string, any>;
  result?: Record<string, any> | string;
  priority?: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

export interface Competition {
  id: string;
  name: string;
  description?: string;
  prize_description?: string;
  prize_value?: number;
  entry_type?: string;
  start_date?: string;
  end_date?: string;
  terms_conditions?: string;
  status: string;
  target_audience?: string;
  verticals?: string[];
  landing_page_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface CompetitionEntry {
  id: string;
  competition_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  business_name?: string;
  abn?: string;
  industry?: string;
  audience_type?: string;
  consent_voice?: boolean;
  consent_sms?: boolean;
  consent_email?: boolean;
  entry_source?: string;
  referral_code?: string;
  status: string;
  created_at: string;
}

export interface LeadAssignment {
  id: string;
  lead_id: string;
  assigned_to: string;
  assigned_at: string;
  price?: number;
  method?: 'direct' | 'auction' | 'vip' | 'round_robin';
  notes?: string;
}

export type Vertical =
  | 'solar'
  | 'battery'
  | 'property'
  | 'finance'
  | 'home_improvement'
  | 'ev_charger'
  | 'heat_pump'
  | 'pool'
  | 'spa'
  | 'roofing'
  | 'painting'
  | 'other';

export type LeadStatus =
  | 'new'
  | 'open'
  | 'working'
  | 'contacted'
  | 'qualified'
  | 'converted'
  | 'lost'
  | 'closed';

export type LeadScore = 'hot' | 'warm' | 'cold';

export interface ValueStack {
  vertical: Vertical;
  value: number;
  confidence: number;
}

export interface AINudge {
  id: string;
  type: 'idle_lead' | 'high_value' | 'upsell' | 'reengagement' | 'enrichment';
  title: string;
  message: string;
  lead_id?: string;
  priority: 'low' | 'medium' | 'high';
  action_url?: string;
  created_at: string;
  dismissed?: boolean;
}
