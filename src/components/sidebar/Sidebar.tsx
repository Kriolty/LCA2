import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import {
  Home,
  Users,
  Folder,
  BarChart3,
  Settings,
  Bell,
  CreditCard,
  ClipboardList,
  DollarSign,
  Calendar,
  FileText,
  Mail,
  Globe,
  Lightbulb,
  PieChart,
  MessageSquare,
  Database,
  Scale,
  MapPin,
  FileType,
  Sparkles,
  Shield,
  Sliders,
  Banknote,
  ExternalLink,
  RefreshCw,
  Layers,
  HelpCircle,
  Search,
  Target,
  GitBranch,
  Gavel,
  Phone,
  Zap,
  Send,
  Award,
  Briefcase,
  Percent,
  Grid,
  Webhook,
  Gift,
  AlertCircle
} from 'lucide-react';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const adminMenuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Interactive Dashboard', href: '/dashboard/interactive', icon: Grid },
  { name: 'Prospects', href: '/dashboard/prospects', icon: Target },
  { name: 'Leads', href: '/dashboard/leads', icon: Layers },
  { name: 'Lead Assignments', href: '/dashboard/lead-assignments', icon: GitBranch },
  { name: 'Auctions Admin', href: '/dashboard/auctions-admin', icon: Gavel },
  { name: 'Territory Management', href: '/dashboard/territories', icon: MapPin },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Email Campaigns', href: '/dashboard/campaigns', icon: Mail },
  { name: 'Payment Tracking', href: '/dashboard/payments', icon: DollarSign },
  { name: 'Automation Engine', href: '/dashboard/automation', icon: Zap },
  { name: 'Background Jobs', href: '/dashboard/jobs', icon: RefreshCw },
  { name: 'Voice Bot Management', href: '/dashboard/voice-bot', icon: Phone },
  { name: 'Template Management', href: '/dashboard/templates', icon: FileType },
  { name: 'Lead Scoring Dashboard', href: '/dashboard/lead-scoring', icon: Award },
  { name: 'Voice Bot Analytics', href: '/dashboard/voice-analytics', icon: BarChart3 },
  { name: 'Territory Heatmap', href: '/dashboard/territory-heatmap', icon: MapPin },
  { name: 'Competitor Intelligence', href: '/dashboard/competitor-intelligence', icon: Briefcase },
  { name: 'Nurturing Campaigns', href: '/dashboard/nurturing', icon: Send },
  { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: Shield },
  { name: 'Dynamic Pricing', href: '/dashboard/dynamic-pricing', icon: Percent },
  { name: 'Competition Management', href: '/dashboard/competitions', icon: Scale },
  { name: 'Voice Drop Campaigns', href: '/dashboard/voice-drops', icon: MessageSquare },
  { name: 'Consent Management', href: '/dashboard/consent', icon: Shield },
  { name: 'User Management', href: '/dashboard/users', icon: Users },
];

const salesSupportMenuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Leads', href: '/dashboard/my-leads', icon: Layers },
  { name: 'Pipeline', href: '/dashboard/pipeline', icon: ClipboardList },
  { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
  { name: 'Client Onboarding', href: '/dashboard/onboarding', icon: ExternalLink },
  { name: 'Commission Dashboard', href: '/dashboard/commissions', icon: Banknote },
  { name: 'Data Export', href: '/dashboard/data-export', icon: Database },
  { name: 'Referral Program', href: '/dashboard/referrals', icon: Gift },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
];

const clientMenuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Interactive Dashboard', href: '/dashboard/interactive', icon: Grid },
  { name: 'My Leads', href: '/dashboard/my-leads', icon: Layers },
  { name: 'Auctions', href: '/dashboard/auctions', icon: Gavel },
  { name: 'Pipeline', href: '/dashboard/pipeline', icon: ClipboardList },
  { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
  { name: 'Subscription', href: '/dashboard/subscription', icon: CreditCard },
  { name: 'Usage Reports', href: '/dashboard/usage', icon: FileText },
  { name: 'Onboarding Wizard', href: '/dashboard/onboarding', icon: ExternalLink },
  { name: 'Webhooks', href: '/dashboard/webhooks', icon: Webhook },
  { name: 'Data Export', href: '/dashboard/data-export', icon: Database },
  { name: 'Referral Program', href: '/dashboard/referrals', icon: Gift },
  { name: 'Quality Disputes', href: '/dashboard/quality-disputes', icon: AlertCircle },
  { name: 'Territory Settings', href: '/dashboard/territory', icon: MapPin },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
];

const leadSellerMenuItems: MenuItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Leads', href: '/dashboard/my-leads', icon: Layers },
  { name: 'Auctions', href: '/dashboard/auctions', icon: Gavel },
  { name: 'Pipeline', href: '/dashboard/pipeline', icon: ClipboardList },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
];

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const { profile } = useAuthStore();
  const location = useLocation();

  let menuItems: MenuItem[] = [];
  if (profile?.role === 'admin') {
    menuItems = adminMenuItems;
  } else if (profile?.role === 'sales_support') {
    menuItems = salesSupportMenuItems;
  } else if (profile?.role === 'lead_buyer') {
    menuItems = clientMenuItems;
  } else if (profile?.role === 'lead_seller') {
    menuItems = leadSellerMenuItems;
  }

  return (
    <>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black opacity-50 transition-opacity lg:hidden"
        ></div>
      )}

      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto bg-gray-800 transition duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in'
        }`}
      >
        <div className="flex items-center justify-center mt-8">
          <div className="flex items-center">
            <Home className="h-8 w-8 text-blue-500" />
            <span className="text-white text-2xl mx-2 font-semibold">Leads Club</span>
          </div>
        </div>

        <nav className="mt-10">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              className={`flex items-center mt-4 py-2 px-6 border-l-4 ${
                location.pathname === item.href
                  ? 'bg-gray-600 bg-opacity-25 text-white border-blue-500'
                  : 'text-gray-500 border-gray-900 hover:bg-gray-600 hover:bg-opacity-25 hover:text-white hover:border-gray-700'
              }`}
              to={item.href}
            >
              <item.icon className="h-6 w-6" />
              <span className="mx-3">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};
