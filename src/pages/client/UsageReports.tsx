import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Download, TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react';

interface UsageStats {
  total_leads: number;
  total_cost: number;
  total_credits_used: number;
  leads_by_status: Record<string, number>;
  leads_by_vertical: Record<string, number>;
  period_start: string;
  period_end: string;
}

export const UsageReports = () => {
  const { profile } = useAuthStore();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'current' | 'last' | 'custom'>('current');
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    loadClientId();
  }, []);

  useEffect(() => {
    if (clientId) {
      loadUsageStats();
    }
  }, [clientId, period]);

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

  const loadUsageStats = async () => {
    if (!clientId) return;

    try {
      setLoading(true);

      let startDate: Date;
      let endDate = new Date();

      if (period === 'current') {
        startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      } else {
        const lastMonth = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);
        startDate = lastMonth;
        endDate = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
      }

      const { data, error } = await supabase.rpc('calculate_usage_stats', {
        p_client_id: clientId,
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!clientId || !stats) return;

    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*, usage_logs(*)')
        .eq('assigned_to', clientId)
        .gte('assigned_at', stats.period_start)
        .lte('assigned_at', stats.period_end);

      if (error) throw error;

      const csv = [
        ['Lead ID', 'Business Name', 'Status', 'Vertical', 'Assigned Date', 'Cost', 'Credits Used'].join(','),
        ...leads.map((lead: any) => [
          lead.id,
          lead.business_name,
          lead.status,
          lead.vertical,
          new Date(lead.assigned_at).toLocaleDateString(),
          lead.usage_logs?.[0]?.cost || 0,
          lead.usage_logs?.[0]?.credits_used || 0,
        ].join(',')),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  if (loading && !stats) {
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
            <h1 className="text-3xl font-bold text-gray-900">Usage Reports</h1>
            <p className="text-gray-600 mt-1">Track your lead usage and spending</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="current">Current Month</option>
              <option value="last">Last Month</option>
            </select>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">Total Leads</div>
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.total_leads || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(stats.period_start).toLocaleDateString()} - {new Date(stats.period_end).toLocaleDateString()}
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">Total Spend</div>
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">
                    {formatCurrency(stats.total_cost || 0)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This period
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">Credits Used</div>
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.total_credits_used || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Lead credits
                  </p>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">Avg Cost/Lead</div>
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.total_leads > 0
                      ? formatCurrency(stats.total_cost / stats.total_leads)
                      : '$0.00'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Per lead
                  </p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader title="Leads by Status" />
                <div className="p-6">
                  {stats.leads_by_status && Object.keys(stats.leads_by_status).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(stats.leads_by_status).map(([status, count]) => {
                        const percentage = ((count as number / stats.total_leads) * 100).toFixed(1);
                        return (
                          <div key={status}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {status.replace('_', ' ')}
                              </span>
                              <span className="text-sm text-gray-600">
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No data available</p>
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader title="Leads by Vertical" />
                <div className="p-6">
                  {stats.leads_by_vertical && Object.keys(stats.leads_by_vertical).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(stats.leads_by_vertical).map(([vertical, count]) => {
                        const percentage = ((count as number / stats.total_leads) * 100).toFixed(1);
                        return (
                          <div key={vertical}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                {vertical}
                              </span>
                              <span className="text-sm text-gray-600">
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No data available</p>
                  )}
                </div>
              </Card>
            </div>

            <Card>
              <CardHeader title="Usage Summary" />
              <div className="p-6">
                <div className="prose max-w-none">
                  <p className="text-gray-600">
                    During the period from <strong>{new Date(stats.period_start).toLocaleDateString()}</strong> to{' '}
                    <strong>{new Date(stats.period_end).toLocaleDateString()}</strong>, you received{' '}
                    <strong>{stats.total_leads}</strong> lead{stats.total_leads !== 1 ? 's' : ''} with a total
                    spend of <strong>{formatCurrency(stats.total_cost)}</strong>, using{' '}
                    <strong>{stats.total_credits_used}</strong> credit{stats.total_credits_used !== 1 ? 's' : ''}.
                  </p>

                  {stats.total_leads > 0 && (
                    <p className="text-gray-600 mt-4">
                      Your average cost per lead was <strong>{formatCurrency(stats.total_cost / stats.total_leads)}</strong>.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
