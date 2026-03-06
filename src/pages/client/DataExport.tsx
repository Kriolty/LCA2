import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Download, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface DataExport {
  id: string;
  export_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_url: string | null;
  file_size_bytes: number | null;
  expires_at: string;
  created_at: string;
  completed_at: string | null;
}

export const DataExport = () => {
  const { profile } = useAuthStore();
  const [exports, setExports] = useState<DataExport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExports();
  }, [profile]);

  const loadExports = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('data_exports')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExports(data || []);
    } catch (error) {
      console.error('Error loading exports:', error);
    }
  };

  const requestExport = async (exportType: string) => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('data_exports')
        .insert({
          user_id: profile.id,
          export_type: exportType,
          status: 'pending',
        });

      if (error) throw error;
      loadExports();
    } catch (error) {
      console.error('Error requesting export:', error);
      alert('Failed to request export');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Export & Backup</h1>
          <p className="text-gray-600 mt-1">
            Export your data for backup or migration purposes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="p-6">
              <FileText className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All Data</h3>
              <p className="text-sm text-gray-600 mb-4">
                Complete export of all your leads, prospects, and settings
              </p>
              <Button onClick={() => requestExport('full')} loading={loading} className="w-full">
                Export All Data
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <FileText className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Leads Only</h3>
              <p className="text-sm text-gray-600 mb-4">
                Export all your assigned leads with contact information
              </p>
              <Button onClick={() => requestExport('leads')} loading={loading} className="w-full">
                Export Leads
              </Button>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <FileText className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Billing Data</h3>
              <p className="text-sm text-gray-600 mb-4">
                Export invoices, payments, and transaction history
              </p>
              <Button onClick={() => requestExport('billing')} loading={loading} className="w-full">
                Export Billing
              </Button>
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export History</h3>
            <div className="space-y-3">
              {exports.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(exp.status)}
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {exp.export_type} Export
                      </div>
                      <div className="text-sm text-gray-600">
                        {format(new Date(exp.created_at), 'MMM d, yyyy HH:mm')}
                        {exp.file_size_bytes && ` • ${formatBytes(exp.file_size_bytes)}`}
                      </div>
                    </div>
                  </div>
                  {exp.status === 'completed' && exp.file_url && (
                    <Button size="sm" variant="outline" onClick={() => window.open(exp.file_url!, '_blank')}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                  {exp.status === 'completed' && !exp.file_url && (
                    <span className="text-sm text-gray-500">Expired</span>
                  )}
                </div>
              ))}
              {exports.length === 0 && (
                <div className="text-center py-8 text-gray-600">
                  No exports yet. Create your first export above.
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Retention Policy</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Exports are available for download for 7 days</p>
              <p>• Files are encrypted and stored securely</p>
              <p>• Automated backups run daily at 2:00 AM UTC</p>
              <p>• Point-in-time restore available for the last 30 days</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
