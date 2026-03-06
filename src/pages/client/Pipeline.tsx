import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Plus, Mail, Phone, DollarSign, Calendar, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
}

interface Deal {
  id: string;
  lead_id: string;
  stage_id: string;
  value: number;
  probability: number;
  expected_close_date: string;
  notes: string;
  created_at: string;
  lead: {
    id: string;
    lead_name: string;
    business_name: string;
    email: string;
    phone: string;
    vertical: string;
  };
}

const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'new', name: 'New', order: 1, color: 'bg-gray-100 text-gray-800' },
  { id: 'contacted', name: 'Contacted', order: 2, color: 'bg-blue-100 text-blue-800' },
  { id: 'qualified', name: 'Qualified', order: 3, color: 'bg-yellow-100 text-yellow-800' },
  { id: 'proposal', name: 'Proposal', order: 4, color: 'bg-purple-100 text-purple-800' },
  { id: 'negotiation', name: 'Negotiation', order: 5, color: 'bg-orange-100 text-orange-800' },
  { id: 'won', name: 'Won', order: 6, color: 'bg-green-100 text-green-800' },
];

export const Pipeline = () => {
  const { user } = useAuthStore();
  const [stages] = useState<PipelineStage[]>(DEFAULT_STAGES);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);

  useEffect(() => {
    if (user) {
      loadDeals();
    }
  }, [user]);

  const loadDeals = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pipeline_deals')
        .select(`
          *,
          lead:leads(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (deal: Deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedDeal || !user) return;

    try {
      const { error } = await supabase
        .from('pipeline_deals')
        .update({ stage_id: stageId })
        .eq('id', draggedDeal.id);

      if (error) throw error;

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'update',
        entity_type: 'deal',
        entity_id: draggedDeal.id,
        description: `Moved deal to ${stages.find(s => s.id === stageId)?.name}`,
        metadata: { old_stage: draggedDeal.stage_id, new_stage: stageId },
      });

      setDeals(deals.map(d =>
        d.id === draggedDeal.id ? { ...d, stage_id: stageId } : d
      ));
    } catch (error) {
      console.error('Error updating deal stage:', error);
    } finally {
      setDraggedDeal(null);
    }
  };

  const getDealsByStage = (stageId: string) => {
    return deals.filter(d => d.stage_id === stageId);
  };

  const getStageStats = (stageId: string) => {
    const stageDeals = getDealsByStage(stageId);
    return {
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + (d.value || 0), 0),
    };
  };

  const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
  const totalDeals = deals.length;
  const wonDeals = getDealsByStage('won');
  const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales Pipeline</h1>
            <p className="text-gray-600 mt-1">Track and manage your deals</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Deal
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pipeline Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${totalValue.toFixed(0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Deals</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalDeals}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">{totalDeals}</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Won This Month</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ${wonValue.toFixed(0)}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">{wonDeals.length}</span>
              </div>
            </div>
          </Card>
        </div>

        {loading ? (
          <Card>
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="inline-flex space-x-4 min-w-full">
              {stages.map((stage) => {
                const stageDeals = getDealsByStage(stage.id);
                const stats = getStageStats(stage.id);

                return (
                  <div
                    key={stage.id}
                    className="flex-shrink-0 w-80"
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(stage.id)}
                  >
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {stats.count} deals • ${stats.value.toFixed(0)}
                          </p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stage.color}`}>
                          {stats.count}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {stageDeals.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            No deals in this stage
                          </div>
                        ) : (
                          stageDeals.map((deal) => (
                            <div
                              key={deal.id}
                              draggable
                              onDragStart={() => handleDragStart(deal)}
                              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 cursor-move hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                                    {deal.lead.business_name || deal.lead.lead_name}
                                  </h4>
                                  <span className="inline-flex px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 mt-1">
                                    {deal.lead.vertical}
                                  </span>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="space-y-2 text-xs text-gray-600">
                                <div className="flex items-center justify-between">
                                  <span>Value</span>
                                  <span className="font-medium text-gray-900">
                                    ${deal.value?.toFixed(0) || '0'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span>Probability</span>
                                  <span className="font-medium text-gray-900">
                                    {deal.probability || 0}%
                                  </span>
                                </div>
                                {deal.expected_close_date && (
                                  <div className="flex items-center text-gray-500">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    <span>{format(new Date(deal.expected_close_date), 'MMM d')}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-100">
                                <button className="text-gray-400 hover:text-blue-600">
                                  <Mail className="h-4 w-4" />
                                </button>
                                <button className="text-gray-400 hover:text-green-600">
                                  <Phone className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
