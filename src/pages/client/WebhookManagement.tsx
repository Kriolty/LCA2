import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import {
  Webhook,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Copy,
  Activity,
} from 'lucide-react';

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret_key: string;
  is_active: boolean;
  retry_count: number;
  timeout_seconds: number;
  last_triggered_at: string | null;
  created_at: string;
}

export const WebhookManagement = () => {
  const { profile } = useAuthStore();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [logsModal, setLogsModal] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookConfig | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    retry_count: '3',
    timeout_seconds: '30',
  });

  const availableEvents = [
    'lead_created',
    'lead_assigned',
    'lead_status_changed',
    'appointment_booked',
    'appointment_cancelled',
    'payment_received',
  ];

  useEffect(() => {
    loadWebhooks();
  }, [profile]);

  const loadWebhooks = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error('Error loading webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    try {
      const webhookData = {
        client_id: profile.id,
        name: formData.name,
        url: formData.url,
        events: formData.events,
        retry_count: parseInt(formData.retry_count),
        timeout_seconds: parseInt(formData.timeout_seconds),
      };

      if (selectedWebhook) {
        const { error } = await supabase
          .from('webhooks')
          .update(webhookData)
          .eq('id', selectedWebhook.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('webhooks')
          .insert(webhookData);
        if (error) throw error;
      }

      setModalOpen(false);
      resetForm();
      loadWebhooks();
    } catch (error) {
      console.error('Error saving webhook:', error);
      alert('Failed to save webhook');
    }
  };

  const handleEdit = (webhook: WebhookConfig) => {
    setSelectedWebhook(webhook);
    setFormData({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      retry_count: webhook.retry_count.toString(),
      timeout_seconds: webhook.timeout_seconds.toString(),
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      alert('Failed to delete webhook');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadWebhooks();
    } catch (error) {
      console.error('Error toggling webhook:', error);
      alert('Failed to update webhook status');
    }
  };

  const handleViewLogs = async (webhook: WebhookConfig) => {
    setSelectedWebhook(webhook);
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .eq('webhook_id', webhook.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
      setLogsModal(true);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const resetForm = () => {
    setSelectedWebhook(null);
    setFormData({
      name: '',
      url: '',
      events: [],
      retry_count: '3',
      timeout_seconds: '30',
    });
  };

  const toggleEvent = (event: string) => {
    if (formData.events.includes(event)) {
      setFormData({
        ...formData,
        events: formData.events.filter(e => e !== event),
      });
    } else {
      setFormData({
        ...formData,
        events: [...formData.events, event],
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Webhook Management</h1>
            <p className="text-gray-600 mt-1">
              Configure real-time notifications for your application
            </p>
          </div>
          <Button onClick={() => { resetForm(); setModalOpen(true); }}>
            <Plus className="h-5 w-5 mr-2" />
            New Webhook
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Webhook className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {webhook.name}
                      </h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          webhook.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {webhook.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 mb-3">
                      <code className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded">
                        {webhook.url}
                      </code>
                      <button
                        onClick={() => copyToClipboard(webhook.url)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Copy className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {webhook.events.map((event) => (
                        <span
                          key={event}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                        >
                          {event}
                        </span>
                      ))}
                    </div>

                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Retry:</span> {webhook.retry_count} attempts
                      {' • '}
                      <span className="font-medium">Timeout:</span> {webhook.timeout_seconds}s
                      {webhook.last_triggered_at && (
                        <>
                          {' • '}
                          <span className="font-medium">Last triggered:</span>{' '}
                          {new Date(webhook.last_triggered_at).toLocaleString()}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewLogs(webhook)}
                    >
                      <Activity className="h-4 w-4 mr-1" />
                      Logs
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(webhook.id, webhook.is_active)}
                    >
                      {webhook.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(webhook)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(webhook.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 text-sm">
                    <Eye className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-600">Secret Key:</span>
                    <code className="bg-gray-50 px-2 py-1 rounded text-xs font-mono">
                      {webhook.secret_key.substring(0, 16)}...
                    </code>
                    <button
                      onClick={() => copyToClipboard(webhook.secret_key)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {webhooks.length === 0 && (
            <Card>
              <div className="text-center py-12">
                <Webhook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No webhooks configured
                </h3>
                <p className="text-gray-600 mb-4">
                  Set up webhooks to receive real-time notifications
                </p>
                <Button onClick={() => { resetForm(); setModalOpen(true); }}>
                  <Plus className="h-5 w-5 mr-2" />
                  Create Webhook
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={selectedWebhook ? 'Edit Webhook' : 'Create Webhook'}
      >
        <div className="space-y-4">
          <Input
            label="Webhook Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="My Application Webhook"
          />

          <Input
            label="Endpoint URL"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            required
            placeholder="https://your-app.com/webhooks/leads"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Events to Subscribe
            </label>
            <div className="space-y-2">
              {availableEvents.map((event) => (
                <label key={event} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{event}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Retry Count"
              type="number"
              value={formData.retry_count}
              onChange={(e) => setFormData({ ...formData, retry_count: e.target.value })}
              required
            />

            <Input
              label="Timeout (seconds)"
              type="number"
              value={formData.timeout_seconds}
              onChange={(e) => setFormData({ ...formData, timeout_seconds: e.target.value })}
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Signature Verification:</strong> All webhooks are signed with HMAC-SHA256.
              Use the secret key to verify the authenticity of incoming requests.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button onClick={handleSave} className="flex-1">
              {selectedWebhook ? 'Update' : 'Create'} Webhook
            </Button>
            <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={logsModal}
        onClose={() => setLogsModal(false)}
        title={`Webhook Logs - ${selectedWebhook?.name}`}
        size="large"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`p-4 rounded-lg border ${
                log.response_status >= 200 && log.response_status < 300
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {log.response_status >= 200 && log.response_status < 300 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium text-gray-900">{log.event_type}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-gray-700">
                <div>Status: {log.response_status || 'No response'}</div>
                <div>Attempt: {log.attempt_number}</div>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-center text-gray-600 py-8">No logs available</p>
          )}
        </div>
      </Modal>
    </DashboardLayout>
  );
};
