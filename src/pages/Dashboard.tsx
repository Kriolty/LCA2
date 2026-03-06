import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { AINudges } from '../components/ai/AINudges';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import {
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Gavel,
  Clock,
  ArrowRight,
  Activity,
  Plus,
  Upload,
  Settings as SettingsIcon,
  Grid,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface RecentActivity {
  id: string;
  action: string;
  description: string;
  created_at: string;
  entity_type: string;
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuthStore();
  const [stats, setStats] = useState({
    totalProspects: 0,
    totalLeads: 0,
    totalClients: 0,
    totalRevenue: 0,
    activeAuctions: 0,
    recentLeads: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [profile, user]);

  const loadDashboardData = async () => {
    try {
      if (profile?.role === 'admin') {
        await loadAdminData();
      } else if (profile?.role === 'sales') {
        await loadClientData();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    const [prospectsRes, leadsRes, clientsRes, salesRes, auctionsRes, activityRes] = await Promise.all([
      supabase.from('prospects').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('lead_sales').select('sale_price'),
      supabase.from('lead_auctions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    const revenue = salesRes.data?.reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0) || 0;

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const { count: recentLeadsCount } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', last7Days.toISOString());

    setStats({
      totalProspects: prospectsRes.count || 0,
      totalLeads: leadsRes.count || 0,
      totalClients: clientsRes.count || 0,
      totalRevenue: revenue,
      activeAuctions: auctionsRes.count || 0,
      recentLeads: recentLeadsCount || 0,
    });

    setRecentActivity(activityRes.data || []);
  };

  const loadClientData = async () => {
    if (!user) return;

    const clientData = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (clientData.data) {
      const [leadsRes, purchasesRes, auctionsRes, activityRes] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('assigned_to', user.id),
        supabase.from('lead_sales').select('sale_price').eq('client_id', clientData.data.id),
        supabase.from('lead_auctions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('activity_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      ]);

      const spent = purchasesRes.data?.reduce((sum, sale) => sum + (Number(sale.sale_price) || 0), 0) || 0;

      setStats({
        totalProspects: 0,
        totalLeads: leadsRes.count || 0,
        totalClients: 0,
        totalRevenue: spent,
        activeAuctions: auctionsRes.count || 0,
        recentLeads: 0,
      });

      setRecentActivity(activityRes.data || []);
    }
  };

  const getActivityIcon = (entityType: string) => {
    switch (entityType) {
      case 'lead':
        return <Target className="h-4 w-4" />;
      case 'auction':
        return <Gavel className="h-4 w-4" />;
      case 'client':
        return <Users className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const statCards = profile?.role === 'admin' ? [
    {
      label: 'Total Prospects',
      value: stats.totalProspects,
      icon: Target,
      color: 'blue',
      trend: `+${stats.recentLeads} this week`,
    },
    {
      label: 'Active Leads',
      value: stats.totalLeads,
      icon: TrendingUp,
      color: 'green',
    },
    {
      label: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'purple',
    },
    {
      label: 'Total Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'yellow',
    },
  ] : [
    {
      label: 'My Leads',
      value: stats.totalLeads,
      icon: TrendingUp,
      color: 'green',
    },
    {
      label: 'Active Auctions',
      value: stats.activeAuctions,
      icon: Gavel,
      color: 'blue',
    },
    {
      label: 'Total Spent',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'yellow',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {profile?.first_name || 'User'}</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => navigate('/dashboard/interactive')}>
              <Grid className="h-4 w-4 mr-2" />
              Interactive Dashboard
            </Button>
            {profile?.role === 'admin' ? (
              <>
                <Button variant="outline" onClick={() => navigate('/dashboard/prospects')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
                <Button onClick={() => navigate('/dashboard/auctions-admin')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Auction
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => navigate('/dashboard/territory')}>
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Territory
                </Button>
                <Button onClick={() => navigate('/dashboard/auctions')}>
                  <Gavel className="h-4 w-4 mr-2" />
                  Browse Auctions
                </Button>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                const colorClasses = {
                  blue: 'bg-blue-100 text-blue-600',
                  green: 'bg-green-100 text-green-600',
                  purple: 'bg-purple-100 text-purple-600',
                  yellow: 'bg-yellow-100 text-yellow-600',
                }[stat.color];

                return (
                  <Card key={stat.label}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                        {stat.trend && (
                          <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
                        )}
                      </div>
                      <div className={`p-3 rounded-lg ${colorClasses}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <AINudges />
              </div>

              <Card>
                <CardHeader title="Recent Activity" />
                {recentActivity.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg text-blue-600">
                          {getActivityIcon(activity.entity_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {activity.action}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader title="Quick Actions" />
                <div className="space-y-2">
                  {profile?.role === 'admin' ? (
                    <>
                      <button
                        onClick={() => navigate('/dashboard/prospects')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <Upload className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-gray-900">Import Prospects</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </button>
                      <button
                        onClick={() => navigate('/dashboard/leads')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <Target className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-gray-900">Manage Leads</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </button>
                      <button
                        onClick={() => navigate('/dashboard/auctions-admin')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <Gavel className="h-5 w-5 text-purple-600" />
                          <span className="font-medium text-gray-900">Create Auction</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </button>
                      <button
                        onClick={() => navigate('/dashboard/analytics')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <Activity className="h-5 w-5 text-yellow-600" />
                          <span className="font-medium text-gray-900">View Analytics</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => navigate('/dashboard/auctions')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <Gavel className="h-5 w-5 text-blue-600" />
                          <span className="font-medium text-gray-900">Browse Auctions</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </button>
                      <button
                        onClick={() => navigate('/dashboard/my-leads')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <Target className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-gray-900">My Leads</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </button>
                      <button
                        onClick={() => navigate('/dashboard/pipeline')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                          <span className="font-medium text-gray-900">Manage Pipeline</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </button>
                      <button
                        onClick={() => navigate('/dashboard/territory')}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <SettingsIcon className="h-5 w-5 text-yellow-600" />
                          <span className="font-medium text-gray-900">Territory Settings</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </button>
                    </>
                  )}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};
