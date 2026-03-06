import { useState, useEffect } from 'react';
import { Card, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { integrationManager } from '../../services/integrations/IntegrationManager';
import { Key, CheckCircle, AlertCircle, ExternalLink, Loader, Link as LinkIcon } from 'lucide-react';

interface IntegrationSettings {
  apollo_api_key?: string;
  clearbit_api_key?: string;
  facebook_verify_token?: string;
  facebook_page_access_token?: string;
}

export const IntegrationsSettings = () => {
  const [settings, setSettings] = useState<IntegrationSettings>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [testingApollo, setTestingApollo] = useState(false);
  const [testingClearbit, setTestingClearbit] = useState(false);
  const [apolloTestResult, setApolloTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [clearbitTestResult, setClearbitTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-webhook`;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          apollo_api_key: data.apollo_api_key || '',
          clearbit_api_key: data.clearbit_api_key || '',
          facebook_verify_token: data.facebook_verify_token || '',
          facebook_page_access_token: data.facebook_page_access_token || '',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('integration_settings')
        .upsert({
          id: 'd1e8f3c0-0000-0000-0000-000000000001',
          apollo_api_key: settings.apollo_api_key || null,
          clearbit_api_key: settings.clearbit_api_key || null,
          facebook_verify_token: settings.facebook_verify_token || null,
          facebook_page_access_token: settings.facebook_page_access_token || null,
          webhook_url: webhookUrl,
        });

      if (error) throw error;

      integrationManager.updateConfig({
        apollo_api_key: settings.apollo_api_key,
        clearbit_api_key: settings.clearbit_api_key,
        facebook_verify_token: settings.facebook_verify_token,
        facebook_page_access_token: settings.facebook_page_access_token,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestApollo = async () => {
    if (!settings.apollo_api_key) {
      setApolloTestResult({ success: false, message: 'Please enter API key first' });
      return;
    }

    setTestingApollo(true);
    setApolloTestResult(null);

    try {
      integrationManager.updateConfig({ apollo_api_key: settings.apollo_api_key });
      const result = await integrationManager.testConnection('apollo');
      setApolloTestResult({ success: result.success, message: result.message });
    } catch (error) {
      setApolloTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    } finally {
      setTestingApollo(false);
    }
  };

  const handleTestClearbit = async () => {
    if (!settings.clearbit_api_key) {
      setClearbitTestResult({ success: false, message: 'Please enter API key first' });
      return;
    }

    setTestingClearbit(true);
    setClearbitTestResult(null);

    try {
      integrationManager.updateConfig({ clearbit_api_key: settings.clearbit_api_key });
      const result = await integrationManager.testConnection('clearbit');
      setClearbitTestResult({ success: result.success, message: result.message });
    } catch (error) {
      setClearbitTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      });
    } finally {
      setTestingClearbit(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800">Integration settings saved successfully!</p>
        </div>
      )}

      <Card>
        <CardHeader title="Apollo.io" />
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <Input
              type="password"
              value={settings.apollo_api_key || ''}
              onChange={(e) => setSettings({ ...settings, apollo_api_key: e.target.value })}
              placeholder="Enter Apollo.io API key"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from{' '}
              <a
                href="https://app.apollo.io/#/settings/integrations/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                Apollo.io Settings <ExternalLink className="inline w-3 h-3" />
              </a>
            </p>
          </div>

          <Button
            onClick={handleTestApollo}
            disabled={testingApollo || !settings.apollo_api_key}
            variant="outline"
            size="sm"
          >
            {testingApollo ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>

          {apolloTestResult && (
            <div className={`p-3 rounded-lg flex items-start space-x-2 ${
              apolloTestResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              {apolloTestResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  apolloTestResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {apolloTestResult.success ? 'Connection Successful' : 'Connection Failed'}
                </p>
                <p className={`text-xs ${
                  apolloTestResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {apolloTestResult.message}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Clearbit" />
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <Input
              type="password"
              value={settings.clearbit_api_key || ''}
              onChange={(e) => setSettings({ ...settings, clearbit_api_key: e.target.value })}
              placeholder="Enter Clearbit API key"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from{' '}
              <a
                href="https://dashboard.clearbit.com/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                Clearbit Dashboard <ExternalLink className="inline w-3 h-3" />
              </a>
            </p>
          </div>

          <Button
            onClick={handleTestClearbit}
            disabled={testingClearbit || !settings.clearbit_api_key}
            variant="outline"
            size="sm"
          >
            {testingClearbit ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>

          {clearbitTestResult && (
            <div className={`p-3 rounded-lg flex items-start space-x-2 ${
              clearbitTestResult.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              {clearbitTestResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  clearbitTestResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {clearbitTestResult.success ? 'Connection Successful' : 'Connection Failed'}
                </p>
                <p className={`text-xs ${
                  clearbitTestResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {clearbitTestResult.message}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Facebook Lead Ads" />
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verify Token
            </label>
            <Input
              type="text"
              value={settings.facebook_verify_token || ''}
              onChange={(e) => setSettings({ ...settings, facebook_verify_token: e.target.value })}
              placeholder="Enter custom verify token"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use this token when setting up your Facebook webhook
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Access Token
            </label>
            <Input
              type="password"
              value={settings.facebook_page_access_token || ''}
              onChange={(e) => setSettings({ ...settings, facebook_page_access_token: e.target.value })}
              placeholder="Enter Facebook page access token"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get this from your Facebook App dashboard
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Webhook URL
            </h4>
            <p className="text-sm text-blue-800 mb-2">
              Use this URL in your Facebook Lead Ads webhook configuration:
            </p>
            <div className="bg-white border border-blue-300 rounded p-2 font-mono text-xs break-all">
              {webhookUrl}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(webhookUrl)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Copy to clipboard
            </button>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save All Settings'
          )}
        </Button>
      </div>
    </div>
  );
};
