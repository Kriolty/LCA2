import { supabase } from './supabase';
import type { AITask, AINudge } from '../types/crm';

export interface AIQueryRequest {
  query: string;
  leadId?: string;
  context?: Record<string, any>;
}

export interface AIQueryResponse {
  success: boolean;
  data?: any[];
  message?: string;
  sql?: string;
  error?: string;
}

export class AIService {
  async processNaturalLanguageQuery(request: AIQueryRequest): Promise<AIQueryResponse> {
    const query = request.query.toLowerCase();

    if (query.includes('show') || query.includes('list') || query.includes('find')) {
      return this.handleShowQuery(query);
    }

    if (query.includes('update') || query.includes('change') || query.includes('set')) {
      return this.handleUpdateQuery(query, request.leadId);
    }

    if (query.includes('summarize') || query.includes('summary')) {
      return this.handleSummaryQuery(query, request.leadId);
    }

    if (query.includes('script') || query.includes('call')) {
      return this.handleScriptGeneration(request.leadId);
    }

    return {
      success: false,
      error: 'I could not understand your request. Try queries like: "Show all QLD leads" or "Summarize this lead"',
    };
  }

  private async handleShowQuery(query: string): Promise<AIQueryResponse> {
    try {
      if (query.includes('qld') || query.includes('queensland')) {
        const { data, error } = await supabase
          .from('leads')
          .select('id, business_name, suburb, state, status, value, created_at')
          .eq('state', 'QLD')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        return {
          success: true,
          data: data || [],
          message: `Found ${data?.length || 0} leads in Queensland`,
          sql: 'SELECT * FROM leads WHERE state = \'QLD\' ORDER BY created_at DESC LIMIT 20',
        };
      }

      if (query.includes('hot') || query.includes('high value')) {
        const { data, error } = await supabase
          .from('leads')
          .select('id, business_name, suburb, state, status, value, score, created_at')
          .gte('score', 70)
          .order('score', { ascending: false })
          .limit(20);

        if (error) throw error;

        return {
          success: true,
          data: data || [],
          message: `Found ${data?.length || 0} hot leads (score >= 70)`,
          sql: 'SELECT * FROM leads WHERE score >= 70 ORDER BY score DESC LIMIT 20',
        };
      }

      if (query.includes('not contacted') || query.includes('idle')) {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const { data, error } = await supabase
          .from('leads')
          .select('id, business_name, suburb, state, status, created_at')
          .eq('status', 'new')
          .lt('created_at', twoDaysAgo.toISOString())
          .order('created_at', { ascending: true })
          .limit(20);

        if (error) throw error;

        return {
          success: true,
          data: data || [],
          message: `Found ${data?.length || 0} leads not contacted in 48+ hours`,
          sql: 'SELECT * FROM leads WHERE status = \'new\' AND created_at < NOW() - INTERVAL \'2 days\' ORDER BY created_at ASC LIMIT 20',
        };
      }

      const { data, error } = await supabase
        .from('leads')
        .select('id, business_name, suburb, state, status, value, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        message: `Here are the 10 most recent leads`,
        sql: 'SELECT * FROM leads ORDER BY created_at DESC LIMIT 10',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed',
      };
    }
  }

  private async handleUpdateQuery(query: string, leadId?: string): Promise<AIQueryResponse> {
    if (!leadId) {
      return {
        success: false,
        error: 'Please specify which lead to update or open a lead detail page',
      };
    }

    try {
      if (query.includes('status')) {
        const status = query.includes('working') ? 'working' :
                      query.includes('contacted') ? 'contacted' :
                      query.includes('qualified') ? 'qualified' :
                      query.includes('converted') ? 'converted' : 'open';

        const { error } = await supabase
          .from('leads')
          .update({ status })
          .eq('id', leadId);

        if (error) throw error;

        return {
          success: true,
          message: `Lead status updated to: ${status}`,
        };
      }

      return {
        success: false,
        error: 'Update query not recognized. Try: "Change status to working"',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed',
      };
    }
  }

  private async handleSummaryQuery(query: string, leadId?: string): Promise<AIQueryResponse> {
    if (!leadId) {
      return {
        success: false,
        error: 'Please specify which lead to summarize',
      };
    }

    try {
      const { data: lead, error } = await supabase
        .from('leads')
        .select('*, company_enrichment(*), lead_verticals(*)')
        .eq('id', leadId)
        .single();

      if (error) throw error;

      const summary = this.generateLeadSummary(lead);

      return {
        success: true,
        message: summary,
        data: [lead],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Summary generation failed',
      };
    }
  }

  private generateLeadSummary(lead: any): string {
    const parts: string[] = [];

    parts.push(`**${lead.business_name || 'Lead'}** (${lead.state || 'Unknown state'})`);

    if (lead.value) {
      parts.push(`Estimated value: $${lead.value.toLocaleString()}`);
    }

    if (lead.score) {
      const scoreLabel = lead.score >= 70 ? 'HOT' : lead.score >= 40 ? 'WARM' : 'COLD';
      parts.push(`Score: ${lead.score}/100 (${scoreLabel})`);
    }

    if (lead.company_enrichment) {
      const enrich = lead.company_enrichment;
      if (enrich.employees) parts.push(`${enrich.employees} employees`);
      if (enrich.revenue) parts.push(`~$${(enrich.revenue / 1000000).toFixed(1)}M revenue`);
    }

    if (lead.lead_verticals && lead.lead_verticals.length > 0) {
      const verticals = lead.lead_verticals.map((v: any) => `${v.vertical} ($${v.value})`).join(', ');
      parts.push(`Opportunities: ${verticals}`);
    }

    parts.push(`Status: ${lead.status}`);

    return parts.join(' • ');
  }

  private async handleScriptGeneration(leadId?: string): Promise<AIQueryResponse> {
    if (!leadId) {
      return {
        success: false,
        error: 'Please specify which lead to generate a script for',
      };
    }

    try {
      const { data: lead } = await supabase
        .from('leads')
        .select('*, company_enrichment(*)')
        .eq('id', leadId)
        .single();

      const script = this.generateCallScript(lead);

      await this.createAITask({
        type: 'script',
        lead_id: leadId,
        status: 'completed',
        result: { script },
      });

      return {
        success: true,
        message: script,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Script generation failed',
      };
    }
  }

  private generateCallScript(lead: any): string {
    const businessName = lead?.business_name || 'the business';
    const vertical = lead?.vertical || 'solar';

    return `
**Call Script for ${businessName}**

**Opening:**
"Hi, this is [Your Name] calling from Leads Club Australia. I'm calling to speak with someone about ${vertical} opportunities for ${businessName}. Is now a good time?"

**Discovery:**
"I understand ${businessName} is in the ${lead?.company_enrichment?.industry || 'industry'} sector. We've been working with similar businesses to help them reduce energy costs and improve sustainability."

**Value Proposition:**
${vertical === 'solar' ?
  '"With current energy prices, many businesses like yours are seeing 30-40% reductions in electricity costs with solar. Based on your business size, we estimate potential savings of $15,000-25,000 annually."' :
  '"We specialize in helping businesses find the right solutions for their needs. Would you be interested in learning more?"'}

**Next Steps:**
"I'd love to schedule a brief 15-minute consultation to discuss your specific situation. Does [day] or [day] work better for you?"

**Objection Handler:**
If "not interested": "I completely understand. May I ask, is it a timing issue or is ${vertical} just not a priority right now?"

**Close:**
"Thanks for your time today. I'll send you an email with some information. Feel free to reach out if you have any questions."
    `.trim();
  }

  async generateNudges(): Promise<AINudge[]> {
    const nudges: AINudge[] = [];

    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const { data: idleLeads } = await supabase
        .from('leads')
        .select('id, business_name, state')
        .eq('status', 'new')
        .lt('created_at', twoDaysAgo.toISOString())
        .limit(5);

      if (idleLeads) {
        idleLeads.forEach(lead => {
          nudges.push({
            id: `idle-${lead.id}`,
            type: 'idle_lead',
            title: 'Idle Lead Alert',
            message: `${lead.business_name} (${lead.state}) has been untouched for 48+ hours`,
            lead_id: lead.id,
            priority: 'high',
            action_url: `/dashboard/leads?id=${lead.id}`,
            created_at: new Date().toISOString(),
          });
        });
      }

      const { data: highValueLeads } = await supabase
        .from('leads')
        .select('id, business_name, value')
        .gte('value', 5000)
        .eq('status', 'new')
        .limit(3);

      if (highValueLeads) {
        highValueLeads.forEach(lead => {
          nudges.push({
            id: `high-value-${lead.id}`,
            type: 'high_value',
            title: 'High-Value Lead',
            message: `${lead.business_name} is worth $${lead.value?.toLocaleString()} - Priority follow-up recommended`,
            lead_id: lead.id,
            priority: 'high',
            action_url: `/dashboard/leads?id=${lead.id}`,
            created_at: new Date().toISOString(),
          });
        });
      }

      const { data: unenrichedLeads } = await supabase
        .from('leads')
        .select('id, business_name')
        .eq('enriched', false)
        .not('business_name', 'is', null)
        .limit(3);

      if (unenrichedLeads) {
        unenrichedLeads.forEach(lead => {
          nudges.push({
            id: `enrich-${lead.id}`,
            type: 'enrichment',
            title: 'Enrichment Available',
            message: `${lead.business_name} can be enriched with company intelligence data`,
            lead_id: lead.id,
            priority: 'medium',
            action_url: `/dashboard/leads?id=${lead.id}`,
            created_at: new Date().toISOString(),
          });
        });
      }
    } catch (error) {
      console.error('Error generating nudges:', error);
    }

    return nudges;
  }

  async createAITask(task: Partial<AITask>): Promise<AITask | null> {
    try {
      const { data, error } = await supabase
        .from('ai_tasks')
        .insert({
          type: task.type || 'query',
          lead_id: task.lead_id,
          status: task.status || 'pending',
          payload: task.payload || {},
          result: task.result || {},
          priority: task.priority || 'medium',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating AI task:', error);
      return null;
    }
  }

  async getAITasks(filters?: { leadId?: string; status?: string; type?: string }): Promise<AITask[]> {
    try {
      let query = supabase
        .from('ai_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.leadId) {
        query = query.eq('lead_id', filters.leadId);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching AI tasks:', error);
      return [];
    }
  }
}

export const aiService = new AIService();
