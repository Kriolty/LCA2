import { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { useAuthStore } from '../stores/authStore';
import {
  BookOpen,
  Video,
  MessageCircle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Upload,
  Target,
  Gavel,
  Users,
  BarChart3,
  Settings as SettingsIcon,
} from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  category: 'general' | 'leads' | 'auctions' | 'billing' | 'technical';
}

const FAQS: FAQ[] = [
  {
    question: 'How do I import prospects?',
    answer: 'Navigate to the Prospects page and click "Import Prospects". Upload a CSV file with columns: business_name, contact_name, phone, email, location, vertical. The system will validate and import your data.',
    category: 'leads',
  },
  {
    question: 'What is the lead assignment process?',
    answer: 'Leads are automatically assigned based on your territory preferences. You can configure your preferred locations, verticals, and quality scores in Territory Settings. The system matches incoming leads to your criteria.',
    category: 'leads',
  },
  {
    question: 'How do lead auctions work?',
    answer: 'Admins create auctions for high-quality leads. Clients can bid in real-time. The auction has a starting price, buy-now price, and end time. The highest bidder wins when the auction ends, or someone can purchase immediately at the buy-now price.',
    category: 'auctions',
  },
  {
    question: 'How do I update my territory preferences?',
    answer: 'Go to Territory Settings in the client dashboard. Select your preferred locations, verticals, minimum quality scores, and set your maximum budget per lead. Changes apply immediately to future lead assignments.',
    category: 'leads',
  },
  {
    question: 'What are the different lead statuses?',
    answer: 'Available (ready for assignment), Assigned (given to a client), Sold (purchased in auction), Auction (currently in auction), Expired (auction ended without sale).',
    category: 'leads',
  },
  {
    question: 'How do I track my pipeline?',
    answer: 'Use the Pipeline page to manage your leads through stages: New, Contacted, Qualified, Proposal, Negotiation, Won, Lost. Drag and drop leads between stages and add notes to track progress.',
    category: 'leads',
  },
  {
    question: 'Can I export my data?',
    answer: 'Yes! Go to Reports and select the data you want to export. You can export leads, sales, territories, and more as CSV files. Apply date filters to get specific time periods.',
    category: 'general',
  },
  {
    question: 'How do notifications work?',
    answer: 'You receive notifications for lead assignments, auction updates, and system announcements. Configure your notification preferences in Settings > Notifications to choose which alerts you receive.',
    category: 'general',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept credit cards (Visa, Mastercard, American Express) and bank transfers. Payment is processed securely through Stripe. You can update your payment method in Settings.',
    category: 'billing',
  },
  {
    question: 'How do I contact support?',
    answer: 'Email support@leadsclub.com.au or use the contact form below. Our team typically responds within 24 hours on business days.',
    category: 'technical',
  },
];

const GETTING_STARTED = {
  admin: [
    {
      icon: Upload,
      title: 'Import Prospects',
      description: 'Upload your CSV file with prospect data to get started',
      path: '/dashboard/prospects',
    },
    {
      icon: Target,
      title: 'Create Leads',
      description: 'Convert prospects to leads and assign to clients',
      path: '/dashboard/leads',
    },
    {
      icon: Gavel,
      title: 'Create Auctions',
      description: 'Set up auctions for premium leads',
      path: '/dashboard/auctions-admin',
    },
    {
      icon: BarChart3,
      title: 'View Analytics',
      description: 'Monitor performance and revenue metrics',
      path: '/dashboard/analytics',
    },
  ],
  client: [
    {
      icon: SettingsIcon,
      title: 'Configure Territory',
      description: 'Set your location and vertical preferences',
      path: '/dashboard/territory',
    },
    {
      icon: Gavel,
      title: 'Browse Auctions',
      description: 'Find and bid on premium leads',
      path: '/dashboard/auctions',
    },
    {
      icon: Target,
      title: 'Manage Leads',
      description: 'View and work your assigned leads',
      path: '/dashboard/my-leads',
    },
    {
      icon: BarChart3,
      title: 'Track Pipeline',
      description: 'Manage your sales funnel',
      path: '/dashboard/pipeline',
    },
  ],
};

export const Help = () => {
  const { profile } = useAuthStore();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredFAQs = categoryFilter === 'all'
    ? FAQS
    : FAQS.filter(faq => faq.category === categoryFilter);

  const gettingStarted = profile?.role === 'admin'
    ? GETTING_STARTED.admin
    : GETTING_STARTED.client;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help & Documentation</h1>
          <p className="text-gray-600 mt-1">Everything you need to know about Leads Club</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center py-6">
              <div className="inline-flex p-4 bg-blue-100 rounded-full mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Documentation</h3>
              <p className="text-sm text-gray-600 mb-4">
                Comprehensive guides and tutorials
              </p>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Read Docs →
              </button>
            </div>
          </Card>

          <Card>
            <div className="text-center py-6">
              <div className="inline-flex p-4 bg-purple-100 rounded-full mb-4">
                <Video className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Video Tutorials</h3>
              <p className="text-sm text-gray-600 mb-4">
                Step-by-step video walkthroughs
              </p>
              <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Watch Videos →
              </button>
            </div>
          </Card>

          <Card>
            <div className="text-center py-6">
              <div className="inline-flex p-4 bg-green-100 rounded-full mb-4">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Contact Support</h3>
              <p className="text-sm text-gray-600 mb-4">
                Get help from our support team
              </p>
              <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                Contact Us →
              </button>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader title="Getting Started" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gettingStarted.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-6">
            <CardHeader title="Frequently Asked Questions" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="leads">Leads</option>
              <option value="auctions">Auctions</option>
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
            </select>
          </div>

          {filteredFAQs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No FAQs found in this category</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFAQs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {expandedFAQ === index ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="font-medium text-gray-900">{faq.question}</span>
                    </div>
                    <span className="text-xs text-gray-500 capitalize ml-4">
                      {faq.category}
                    </span>
                  </button>
                  {expandedFAQ === index && (
                    <div className="px-4 pb-4 pl-12">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Quick Tips" />
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Use Keyboard Shortcuts</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Press <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-xs">⌘K</kbd> to open global search from anywhere
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Configure Notifications</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Customize which alerts you receive in Settings &gt; Notifications
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Export Your Data</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Use the Reports page to export any data as CSV files
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Monitor Performance</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Check the Analytics dashboard regularly for insights and trends
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Still Need Help?" />
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Contact Our Support Team
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <a
                href="mailto:support@leadsclub.com.au"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Email Support
              </a>
              <p className="text-sm text-gray-500">
                Response time: 24 hours
              </p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
