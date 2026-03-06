import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { GlobalSearch } from './GlobalSearch';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Target,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  Gavel,
  DollarSign,
  FileText,
  BarChart3,
  Bell,
  Columns3,
  HelpCircle,
  Zap,
  Cog,
  Phone,
  Calendar,
  GitBranch,
  Mail,
  Award,
  MapPin,
  Briefcase,
  Send,
  Webhook,
  Shield,
  Database,
  Percent,
  Gift,
  AlertCircle,
  Grid,
  User,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const navigate = useNavigate();
  const { profile, signOut, user, isSigningOut } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  console.log('DashboardLayout - Profile:', profile);
  console.log('DashboardLayout - User:', user);

  const handleSignOut = async () => {
    if (isSigningOut) {
      console.log('Sign out already in progress, ignoring...');
      return;
    }

    try {
      console.log('Signing out...');
      setUserMenuOpen(false);

      await signOut();

      console.log('Sign out successful, navigating to login...');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const menuItems = profile?.role === 'admin' ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Grid, label: 'Interactive Dashboard', path: '/dashboard/interactive' },
    { icon: Sparkles, label: 'AI Assistant', path: '/dashboard/ai-assistant' },
    { icon: Target, label: 'Prospects', path: '/dashboard/prospects' },
    { icon: TrendingUp, label: 'Leads', path: '/dashboard/leads' },
    { icon: GitBranch, label: 'Lead Assignments', path: '/dashboard/lead-assignments' },
    { icon: Gavel, label: 'Auctions Admin', path: '/dashboard/auctions-admin' },
    { icon: MapPin, label: 'Territory Management', path: '/dashboard/territories' },
    { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: FileText, label: 'Reports', path: '/dashboard/reports' },
    { icon: Mail, label: 'Email Campaigns', path: '/dashboard/campaigns' },
    { icon: DollarSign, label: 'Payment Tracking', path: '/dashboard/payments' },
    { icon: Zap, label: 'Automation Engine', path: '/dashboard/automation' },
    { icon: Cog, label: 'Background Jobs', path: '/dashboard/jobs' },
    { icon: Phone, label: 'Voice Bot Management', path: '/dashboard/voice-bot' },
    { icon: FileText, label: 'Template Management', path: '/dashboard/templates' },
    { icon: Award, label: 'Lead Scoring Dashboard', path: '/dashboard/lead-scoring' },
    { icon: BarChart3, label: 'Voice Bot Analytics', path: '/dashboard/voice-analytics' },
    { icon: MapPin, label: 'Territory Heatmap', path: '/dashboard/territory-heatmap' },
    { icon: Briefcase, label: 'Competitor Intelligence', path: '/dashboard/competitor-intelligence' },
    { icon: Send, label: 'Nurturing Campaigns', path: '/dashboard/nurturing' },
    { icon: Shield, label: 'Audit Logs', path: '/dashboard/audit-logs' },
    { icon: Percent, label: 'Dynamic Pricing', path: '/dashboard/dynamic-pricing' },
    { icon: Gavel, label: 'Competition Management', path: '/dashboard/competitions' },
    { icon: MessageSquare, label: 'Voice Drop Campaigns', path: '/dashboard/voice-drops' },
    { icon: Shield, label: 'Consent Management', path: '/dashboard/consent' },
    { icon: Users, label: 'User Management', path: '/dashboard/users' },
  ] : profile?.role === 'sales' ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Sparkles, label: 'AI Assistant', path: '/dashboard/ai-assistant' },
    { icon: Target, label: 'Prospects', path: '/dashboard/prospects' },
    { icon: TrendingUp, label: 'Leads', path: '/dashboard/leads' },
    { icon: TrendingUp, label: 'My Leads', path: '/dashboard/my-leads' },
    { icon: Gavel, label: 'Auctions', path: '/dashboard/auctions' },
    { icon: Columns3, label: 'Pipeline', path: '/dashboard/pipeline' },
    { icon: Calendar, label: 'Appointments', path: '/dashboard/appointments' },
    { icon: Target, label: 'Territory', path: '/dashboard/territory' },
    { icon: DollarSign, label: 'Subscription', path: '/dashboard/subscription' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="md:hidden">
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">Leads Club</span>
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <div className="flex">
        <aside className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-white shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-gray-900">Leads Club</h1>
                  <p className="text-xs text-gray-600 capitalize">{profile?.role}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg
                    text-gray-700 hover:bg-gray-100 transition-colors
                    ${window.location.pathname === item.path ? 'bg-blue-50 text-blue-600' : ''}
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <div className="mb-3 px-4">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-gray-600">{profile?.user_id}</p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 flex flex-col">
          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <GlobalSearch />

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {profile?.first_name && profile?.last_name
                          ? `${profile.first_name} ${profile.last_name}`
                          : user?.email || 'User'}
                      </p>
                      <p className="text-xs text-gray-600 capitalize flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          profile?.role === 'admin' ? 'bg-red-500' :
                          profile?.role === 'sales' ? 'bg-green-500' :
                          'bg-gray-400'
                        }`}></span>
                        {profile?.role || 'No role'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">
                          {profile?.first_name && profile?.last_name
                            ? `${profile.first_name} ${profile.last_name}`
                            : 'User'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{user?.email}</p>
                        <div className="mt-2 flex items-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            profile?.role === 'admin' ? 'bg-red-100 text-red-700' :
                            profile?.role === 'sales' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {profile?.role?.toUpperCase() || 'NO ROLE'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigate('/dashboard/settings');
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 p-6 md:p-8 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
