import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const QualityDisputes = () => {
  const { profile } = useAuthStore();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ lead_id: '', reason: '' });

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile?.id) return;

    try {
      const { data: disputesData } = await supabase
        .from('quality_disputes')
        .select('*, leads(contact_name, vertical)')
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false });

      const { data: leadsData } = await supabase
        .from('leads')
        .select('id, contact_name, vertical')
        .eq('assigned_to', profile.id)
        .eq('status', 'assigned')
        .order('created_at', { ascending: false });

      setDisputes(disputesData || []);
      setLeads(leadsData || []);
    } catch (error) {
      console.error('Error loading disputes:', error);
    }
  };

  const handleSubmit = async () => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('quality_disputes')
        .insert({
          lead_id: formData.lead_id,
          client_id: profile.id,
          reason: formData.reason,
          status: 'pending',
        });

      if (error) throw error;

      setModalOpen(false);
      setFormData({ lead_id: '', reason: '' });
      loadData();
    } catch (error) {
      console.error('Error submitting dispute:', error);
      alert('Failed to submit dispute');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lead Quality Guarantee</h1>
            <p className="text-gray-600 mt-1">Dispute low-quality leads for refunds</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <AlertTriangle className="h-5 w-5 mr-2" />
            File Dispute
          </Button>
        </div>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quality Criteria</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Valid Contact Info</h4>
                  <p className="text-sm text-gray-600">Working phone and email required</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Recent Inquiry</h4>
                  <p className="text-sm text-gray-600">Lead generated within 48 hours</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Territory Match</h4>
                  <p className="text-sm text-gray-600">Within your service area</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Genuine Interest</h4>
                  <p className="text-sm text-gray-600">Actually seeking your services</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Disputes</h3>
            <div className="space-y-3">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatusIcon(dispute.status)}
                        <span className="font-semibold text-gray-900">
                          {dispute.leads?.contact_name}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                          {dispute.leads?.vertical}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{dispute.reason}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      dispute.status === 'approved' ? 'bg-green-100 text-green-800' :
                      dispute.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dispute.status}
                    </span>
                  </div>
                  {dispute.status === 'approved' && dispute.refund_amount && (
                    <div className="text-sm text-green-600 font-medium mt-2">
                      Refund: ${dispute.refund_amount}
                    </div>
                  )}
                  {dispute.resolution_notes && (
                    <div className="text-sm text-gray-600 mt-2 p-2 bg-white rounded">
                      <strong>Resolution:</strong> {dispute.resolution_notes}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    Filed: {format(new Date(dispute.created_at), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
              ))}
              {disputes.length === 0 && (
                <p className="text-center text-gray-600 py-8">No disputes filed yet</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="File Quality Dispute"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Lead
            </label>
            <select
              value={formData.lead_id}
              onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Choose a lead...</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.contact_name} - {lead.vertical}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Dispute
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Explain why this lead doesn't meet quality standards..."
              required
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              Disputes are reviewed within 24 hours. Approved disputes receive automatic refunds.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button onClick={handleSubmit} className="flex-1">
              Submit Dispute
            </Button>
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};
