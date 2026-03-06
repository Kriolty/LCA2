import { supabase } from './supabase';

interface Territory {
  id: string;
  client_id: string;
  postcodes: string[];
  radius_km: number;
  verticals: string[];
  max_leads_per_day: number;
  max_leads_per_month: number;
  active: boolean;
}

interface Lead {
  id: string;
  postcode: string;
  vertical: string;
  status: string;
}

interface AssignmentResult {
  success: boolean;
  assigned: boolean;
  client_id?: string;
  territory_id?: string;
  reason?: string;
}

export async function assignLeadToTerritory(lead: Lead): Promise<AssignmentResult> {
  try {
    if (lead.status !== 'available') {
      return {
        success: true,
        assigned: false,
        reason: 'Lead is not available for assignment',
      };
    }

    const { data: territories, error } = await supabase
      .from('territories')
      .select('*')
      .eq('active', true);

    if (error) throw error;

    if (!territories || territories.length === 0) {
      return {
        success: true,
        assigned: false,
        reason: 'No active territories found',
      };
    }

    const matchingTerritories = territories.filter((territory: Territory) => {
      if (!territory.verticals.includes(lead.vertical)) {
        return false;
      }

      if (!territory.postcodes.includes(lead.postcode)) {
        return false;
      }

      return true;
    });

    if (matchingTerritories.length === 0) {
      return {
        success: true,
        assigned: false,
        reason: 'No matching territories found for this postcode and vertical',
      };
    }

    for (const territory of matchingTerritories) {
      const canAssign = await checkLeadCapacity(territory.client_id, territory);

      if (canAssign) {
        const assigned = await performAssignment(lead.id, territory.client_id, territory.id);

        if (assigned) {
          return {
            success: true,
            assigned: true,
            client_id: territory.client_id,
            territory_id: territory.id,
          };
        }
      }
    }

    return {
      success: true,
      assigned: false,
      reason: 'All matching territories have reached their capacity limits',
    };
  } catch (error) {
    console.error('Error in lead assignment:', error);
    return {
      success: false,
      assigned: false,
      reason: 'Assignment error occurred',
    };
  }
}

async function checkLeadCapacity(clientId: string, territory: Territory): Promise<boolean> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const { data: dailyAssignments } = await supabase
    .from('lead_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .gte('assigned_at', startOfDay.toISOString());

  const dailyCount = dailyAssignments || 0;

  if (dailyCount >= territory.max_leads_per_day) {
    return false;
  }

  const { data: monthlyAssignments } = await supabase
    .from('lead_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .gte('assigned_at', startOfMonth.toISOString());

  const monthlyCount = monthlyAssignments || 0;

  if (monthlyCount >= territory.max_leads_per_month) {
    return false;
  }

  return true;
}

async function performAssignment(
  leadId: string,
  clientId: string,
  territoryId: string
): Promise<boolean> {
  try {
    const { data: client } = await supabase
      .from('clients')
      .select('user_id')
      .eq('id', clientId)
      .maybeSingle();

    if (!client) return false;

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: 'assigned',
        assigned_to: client.user_id,
        assigned_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (updateError) throw updateError;

    const { error: assignmentError } = await supabase
      .from('lead_assignments')
      .insert({
        lead_id: leadId,
        client_id: clientId,
        territory_id: territoryId,
        assignment_method: 'auto',
        assigned_at: new Date().toISOString(),
      });

    if (assignmentError) throw assignmentError;

    await supabase.from('activity_logs').insert({
      action: 'create',
      entity_type: 'lead',
      entity_id: leadId,
      description: `Lead automatically assigned to client via territory matching`,
      metadata: { client_id: clientId, territory_id: territoryId, method: 'auto' },
    });

    await supabase.from('notifications').insert({
      user_id: client.user_id,
      type: 'lead_assigned',
      title: 'New Lead Assigned',
      message: 'A new lead has been automatically assigned to you based on your territory settings.',
      link_url: `/dashboard/my-leads`,
      lead_id: leadId,
    });

    return true;
  } catch (error) {
    console.error('Error performing assignment:', error);
    return false;
  }
}

export async function bulkAssignLeads(leadIds: string[]): Promise<{
  total: number;
  assigned: number;
  failed: number;
}> {
  let assigned = 0;
  let failed = 0;

  for (const leadId of leadIds) {
    const { data: lead } = await supabase
      .from('leads')
      .select('id, postcode, vertical, status')
      .eq('id', leadId)
      .maybeSingle();

    if (lead) {
      const result = await assignLeadToTerritory(lead);
      if (result.assigned) {
        assigned++;
      } else {
        failed++;
      }
    } else {
      failed++;
    }
  }

  return {
    total: leadIds.length,
    assigned,
    failed,
  };
}
