import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { SimpleChart } from '../charts/SimpleChart';
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Target,
  Award,
  AlertTriangle,
  X,
  Maximize2,
} from 'lucide-react';

interface WidgetProps {
  id: string;
  type: 'stat' | 'chart' | 'table' | 'list' | 'progress';
  dataSource: string;
  config?: any;
  onRemove?: () => void;
  onExpand?: () => void;
}

export const DashboardWidget = ({ id, type, dataSource, config = {}, onRemove, onExpand }: WidgetProps) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [dataSource]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await fetchDataSource(dataSource);
      setData(result);
    } catch (error) {
      console.error('Error loading widget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataSource = async (source: string): Promise<any> => {
    switch (source) {
      case 'leads_count':
        const { count: leadsCount } = await supabase.from('leads').select('*', { count: 'exact', head: true });
        return { value: leadsCount || 0, label: 'Total Leads' };

      case 'leads_today':
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today);
        return { value: todayCount || 0, label: 'New Today' };

      case 'leads_by_vertical':
        const { data: verticalData } = await supabase
          .from('leads')
          .select('vertical')
          .not('vertical', 'is', null);
        const verticalCounts = verticalData?.reduce((acc: any, lead: any) => {
          acc[lead.vertical] = (acc[lead.vertical] || 0) + 1;
          return acc;
        }, {});
        return Object.entries(verticalCounts || {}).map(([label, value]) => ({ label, value }));

      case 'lead_status':
        const { data: statusData } = await supabase.from('leads').select('status');
        const statusCounts = statusData?.reduce((acc: any, lead: any) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1;
          return acc;
        }, {});
        return Object.entries(statusCounts || {}).map(([label, value]) => ({ label, value }));

      case 'recent_leads':
        const { data: recentLeads } = await supabase
          .from('leads')
          .select('id, contact_name, vertical, status, created_at')
          .order('created_at', { ascending: false })
          .limit(config.limit || 10);
        return recentLeads;

      case 'revenue_monthly':
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { data: payments } = await supabase
          .from('payment_transactions')
          .select('amount')
          .gte('created_at', startOfMonth)
          .eq('status', 'completed');
        const total = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;
        return { value: `$${total.toFixed(0)}`, label: 'Monthly Revenue' };

      case 'appointments_week':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: apptCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .gte('scheduled_at', weekAgo);
        return { value: apptCount || 0, label: 'This Week' };

      case 'conversion_rate':
        const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true });
        const { count: convertedLeads } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'converted');
        const rate = totalLeads ? ((convertedLeads || 0) / totalLeads) * 100 : 0;
        return { value: `${rate.toFixed(1)}%`, label: 'Conversion Rate' };

      case 'lead_score_avg':
        const { data: scores } = await supabase
          .from('lead_scores_history')
          .select('total_score')
          .order('scored_at', { ascending: false })
          .limit(100);
        const avgScore = scores?.length
          ? scores.reduce((sum, s) => sum + s.total_score, 0) / scores.length
          : 0;
        return { value: Math.round(avgScore), label: 'Avg Lead Score' };

      case 'active_clients':
        const { count: clientCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'sales');
        return { value: clientCount || 0, label: 'Active Sales' };

      case 'quality_disputes':
        const { count: disputeCount } = await supabase
          .from('quality_disputes')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        return { value: disputeCount || 0, label: 'Pending Disputes' };

      default:
        return null;
    }
  };

  const getIcon = (iconName: string) => {
    const icons: any = {
      TrendingUp,
      Users,
      DollarSign,
      Calendar,
      Target,
      Award,
      AlertTriangle,
    };
    return icons[iconName] || TrendingUp;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
        </div>
      );
    }

    if (!data) return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    );

    switch (type) {
      case 'stat':
        const Icon = config.icon ? getIcon(config.icon) : TrendingUp;
        const colorClass = {
          blue: 'text-blue-600 bg-blue-50',
          green: 'text-green-600 bg-green-50',
          yellow: 'text-yellow-600 bg-yellow-50',
          red: 'text-red-600 bg-red-50',
          purple: 'text-purple-600 bg-purple-50',
        }[config.color || 'blue'];

        return (
          <div className="flex items-center gap-4 h-full">
            <div className={`p-3 sm:p-4 rounded-xl ${colorClass} shrink-0`}>
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 font-medium uppercase tracking-wide">{data.label}</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 tracking-tight">{data.value}</p>
            </div>
          </div>
        );

      case 'chart':
        return (
          <div className="h-full -mx-2">
            <SimpleChart
              data={data}
              type={config.chartType || 'bar'}
              height={200}
            />
          </div>
        );

      case 'table':
        return (
          <div className="overflow-auto h-full rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Vertical</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {data.map((row: any) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{row.contact_name}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{row.vertical}</td>
                    <td className="px-3 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-2 h-full overflow-auto">
            {data.map((item: any, i: number) => (
              <div key={i} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors border border-gray-200">
                {item.label || item.name}
              </div>
            ))}
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-5 h-full overflow-auto">
            {data.map((item: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">{item.label}</span>
                  <span className="font-semibold text-blue-600">{item.value}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const displayTitle = id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <Card className="h-full hover:shadow-md transition-shadow min-w-0">
      <div className="p-4 sm:p-5 h-full flex flex-col min-w-0">
        <div className="flex items-center justify-between mb-4 gap-2 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base tracking-tight whitespace-nowrap overflow-hidden text-ellipsis min-w-0 flex-1">{displayTitle}</h3>
          <div className="flex items-center gap-1 shrink-0">
            {onExpand && (
              <button
                onClick={onExpand}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                title="Expand widget"
              >
                <Maximize2 className="h-3.5 w-3.5 text-gray-500 hover:text-gray-700" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1.5 hover:bg-red-100 rounded-md transition-colors"
                title="Remove widget"
              >
                <X className="h-3.5 w-3.5 text-gray-500 hover:text-red-600" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0">
          {renderContent()}
        </div>
      </div>
    </Card>
  );
};
