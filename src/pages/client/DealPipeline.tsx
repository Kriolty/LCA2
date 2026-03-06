import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Clock, TrendingUp, Target, AlertCircle, Calendar } from 'lucide-react';

interface Lead {
  id: string;
  business_name: string;
  current_stage: string;
  stage_changed_at: string;
  lead_score: number;
  assigned_at: string;
  value_estimate: number;
}

interface VelocityData {
  lead_id: string;
  stage: string;
  entered_at: string;
  exited_at: string;
  duration_hours: number;
}

const STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const STAGE_COLORS = {
  new: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-green-100 text-green-700',
  proposal: 'bg-yellow-100 text-yellow-700',
  negotiation: 'bg-orange-100 text-orange-700',
  won: 'bg-purple-100 text-purple-700',
  lost: 'bg-red-100 text-red-700',
};

export const DealPipeline = () => {
  const { profile } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [velocityData, setVelocityData] = useState<Record<string, VelocityData[]>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban');
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    loadClientId();
  }, []);

  useEffect(() => {
    if (clientId) {
      loadLeads();
    }
  }, [clientId]);

  const loadClientId = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', profile?.user_id)
        .single();

      if (error) throw error;
      setClientId(data.id);
    } catch (error) {
      console.error('Error loading client ID:', error);
    }
  };

  const loadLeads = async () => {
    if (!clientId) return;

    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', clientId)
        .order('stage_changed_at', { ascending: false });

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);

      const leadIds = leadsData?.map(l => l.id) || [];
      if (leadIds.length > 0) {
        const { data: velocityData, error: velocityError } = await supabase
          .from('deal_velocity_tracking')
          .select('*')
          .in('lead_id', leadIds)
          .order('entered_at', { ascending: true });

        if (velocityError) throw velocityError;

        const grouped = (velocityData || []).reduce((acc, item) => {
          if (!acc[item.lead_id]) acc[item.lead_id] = [];
          acc[item.lead_id].push(item);
          return acc;
        }, {} as Record<string, VelocityData[]>);

        setVelocityData(grouped);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const moveToStage = async (leadId: string, newStage: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          current_stage: newStage,
          stage_changed_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      if (error) throw error;
      loadLeads();
    } catch (error) {
      console.error('Error moving lead:', error);
      alert('Failed to update lead stage');
    }
  };

  const getStageLeads = (stage: string) => {
    return leads.filter(l => l.current_stage === stage);
  };

  const calculateStageDuration = (leadId: string, stage: string) => {
    const velocity = velocityData[leadId]?.find(v => v.stage === stage);
    if (velocity && velocity.duration_hours) {
      return velocity.duration_hours;
    }
    return null;
  };

  const getTimeInCurrentStage = (lead: Lead) => {
    const stageDate = new Date(lead.stage_changed_at);
    const now = new Date();
    const hours = (now.getTime() - stageDate.getTime()) / (1000 * 60 * 60);
    return Math.round(hours);
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const getTimelineWidth = (lead: Lead) => {
    const assignedDate = new Date(lead.assigned_at);
    const now = new Date();
    const totalDays = (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);
    return Math.min(totalDays * 10, 100);
  };

  const stats = {
    total: leads.length,
    active: leads.filter(l => !['won', 'lost'].includes(l.current_stage)).length,
    won: leads.filter(l => l.current_stage === 'won').length,
    avgDealTime: leads.length > 0
      ? leads.reduce((sum, l) => sum + getTimeInCurrentStage(l), 0) / leads.length
      : 0,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deal Pipeline</h1>
            <p className="text-gray-600 mt-1">Track deals through your sales process</p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'outline'}
              onClick={() => setViewMode('timeline')}
            >
              Timeline
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Total Deals</div>
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Active Deals</div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{stats.active}</div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Won Deals</div>
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{stats.won}</div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">Avg Deal Time</div>
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">
                {formatDuration(stats.avgDealTime)}
              </div>
            </div>
          </Card>
        </div>

        {viewMode === 'kanban' ? (
          <div className="overflow-x-auto">
            <div className="flex space-x-4 pb-4" style={{ minWidth: 'max-content' }}>
              {STAGES.map((stage) => {
                const stageLeads = getStageLeads(stage);
                return (
                  <div key={stage} className="flex-shrink-0" style={{ width: '300px' }}>
                    <Card>
                      <div className="p-4 bg-gray-50 border-b">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 capitalize">{stage}</h3>
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                            {stageLeads.length}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3" style={{ minHeight: '400px' }}>
                        {stageLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-move"
                          >
                            <div className="font-medium text-sm text-gray-900 mb-2">
                              {lead.business_name}
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDuration(getTimeInCurrentStage(lead))}
                              </span>
                              <span className="font-medium text-green-600">
                                ${lead.value_estimate?.toLocaleString() || '0'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                lead.lead_score >= 80 ? 'bg-green-100 text-green-700' :
                                lead.lead_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                Score: {lead.lead_score}
                              </span>
                              <select
                                onChange={(e) => moveToStage(lead.id, e.target.value)}
                                value={lead.current_stage}
                                className="text-xs border border-gray-300 rounded px-1 py-0.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {STAGES.map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <Card>
            <CardHeader title="Deal Timeline">
              <p className="text-sm text-gray-500">Gantt-style view of deal progression</p>
            </CardHeader>
            <div className="p-6 space-y-4">
              {leads.map((lead) => {
                const velocity = velocityData[lead.id] || [];
                const totalDuration = velocity.reduce((sum, v) => sum + (v.duration_hours || 0), 0);

                return (
                  <div key={lead.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{lead.business_name}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          Started: {new Date(lead.assigned_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[lead.current_stage as keyof typeof STAGE_COLORS]}`}>
                          {lead.current_stage}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDuration(totalDuration)} total
                        </p>
                      </div>
                    </div>

                    <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                      {velocity.length > 0 ? (
                        <div className="flex h-full">
                          {velocity.map((v, index) => {
                            const percentage = totalDuration > 0 ? (v.duration_hours / totalDuration) * 100 : 0;
                            const stageColor = {
                              new: 'bg-gray-400',
                              contacted: 'bg-blue-400',
                              qualified: 'bg-green-400',
                              proposal: 'bg-yellow-400',
                              negotiation: 'bg-orange-400',
                              won: 'bg-purple-400',
                              lost: 'bg-red-400',
                            }[v.stage] || 'bg-gray-400';

                            return (
                              <div
                                key={index}
                                className={`${stageColor} flex items-center justify-center text-white text-xs font-medium relative group`}
                                style={{ width: `${percentage}%` }}
                              >
                                {percentage > 10 && (
                                  <span className="truncate px-1">{v.stage}</span>
                                )}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                                  <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                    {v.stage}: {formatDuration(v.duration_hours)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-xs text-gray-500">
                          No velocity data
                        </div>
                      )}
                    </div>

                    {velocity.length > 0 && (
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                        <span>
                          {velocity.length} stage{velocity.length !== 1 ? 's' : ''}
                        </span>
                        <span>
                          Avg: {formatDuration(totalDuration / velocity.length)} per stage
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {leads.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No deals in pipeline</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};
