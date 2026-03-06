import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { LeadDetailModal } from '../../components/leads/LeadDetailModal';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Search, Filter, Mail, Phone, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Lead {
  id: string;
  lead_name: string;
  business_name: string;
  phone: string;
  email: string;
  suburb: string;
  postcode: string;
  state: string;
  vertical: string;
  quality_score: number;
  current_price: number;
  status: string;
  assigned_to: string | null;
  created_at: string;
}

export const MyLeads = () => {
  const { user } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [verticalFilter, setVerticalFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadLeads();
    }
  }, [user, verticalFilter]);

  const loadLeads = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (verticalFilter !== 'all') {
        query = query.eq('vertical', verticalFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDetailModalOpen(true);
  };

  const filteredLeads = leads.filter(lead =>
    lead.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone?.includes(searchTerm) ||
    lead.lead_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'assigned').length,
    contacted: 0,
    converted: 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Leads</h1>
            <p className="text-gray-600 mt-1">Manage your assigned leads</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.new}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contacted</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.contacted}</p>
              </div>
              <Phone className="h-8 w-8 text-yellow-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Converted</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.converted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={verticalFilter}
                onChange={(e) => setVerticalFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Verticals</option>
                <option value="Solar">Solar</option>
                <option value="Property">Property</option>
                <option value="Finance">Finance</option>
                <option value="Home Improvements">Home Improvements</option>
                <option value="Spas">Spas</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No leads assigned yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Leads matching your territory settings will appear here automatically
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Vertical</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id} onClick={() => handleLeadClick(lead)}>
                    <TableCell>
                      <div className="font-medium">{lead.lead_name || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{lead.business_name || '-'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{lead.email || '-'}</div>
                        <div className="text-gray-500">{lead.phone || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {lead.suburb && lead.postcode
                          ? `${lead.suburb}, ${lead.postcode}`
                          : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {lead.vertical || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${lead.quality_score || 0}%` }}
                          />
                        </div>
                        <span className="text-sm">{lead.quality_score || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {format(new Date(lead.created_at), 'MMM d')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button className="text-blue-600 hover:text-blue-700">
                          <Mail className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-700">
                          <Phone className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {selectedLead && (
        <LeadDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedLead(null);
          }}
          lead={selectedLead}
          onUpdate={loadLeads}
        />
      )}
    </DashboardLayout>
  );
};
