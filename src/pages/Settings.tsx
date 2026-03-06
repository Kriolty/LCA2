import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { IntegrationsSettings } from '../components/settings/IntegrationsSettings';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import {
  User,
  Lock,
  Bell,
  Mail,
  Shield,
  Save,
  CheckCircle,
  Plug,
} from 'lucide-react';

interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  lead_assignments: boolean;
  auction_updates: boolean;
  system_updates: boolean;
}

export const Settings = () => {
  const { user, profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'integrations'>('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    sms_notifications: false,
    lead_assignments: true,
    auction_updates: true,
    system_updates: true,
  });

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('notification_preferences')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.notification_preferences) {
        setPreferences(data.notification_preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ notification_preferences: preferences })
        .eq('user_id', user.id);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    ...(profile?.role === 'admin' ? [{ id: 'integrations', label: 'Integrations', icon: Plug }] : []),
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-800">Settings saved successfully!</p>
          </div>
        )}

        {activeTab === 'profile' && (
          <Card>
            <CardHeader title="Profile Information" />

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="flex items-center space-x-2 text-gray-900">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{user?.email}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    profile?.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {profile?.role || 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Status
                </label>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                  profile?.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {profile?.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'security' && (
          <Card>
            <CardHeader title="Change Password" />

            <div className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />

              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-red-600">Passwords do not match</p>
              )}

              <div className="pt-4">
                <Button
                  onClick={handlePasswordChange}
                  loading={loading}
                  disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Card>
              <CardHeader title="Notification Channels" />

              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-900">Email Notifications</div>
                    <div className="text-sm text-gray-500">Receive notifications via email</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.email_notifications}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      email_notifications: e.target.checked,
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-900">SMS Notifications</div>
                    <div className="text-sm text-gray-500">Receive notifications via SMS</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.sms_notifications}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      sms_notifications: e.target.checked,
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                  />
                </label>
              </div>
            </Card>

            <Card>
              <CardHeader title="Notification Types" />

              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-900">Lead Assignments</div>
                    <div className="text-sm text-gray-500">Notify when leads are assigned to you</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.lead_assignments}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      lead_assignments: e.target.checked,
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-900">Auction Updates</div>
                    <div className="text-sm text-gray-500">Notify about auction status changes</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.auction_updates}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      auction_updates: e.target.checked,
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-medium text-gray-900">System Updates</div>
                    <div className="text-sm text-gray-500">Notify about platform updates and announcements</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.system_updates}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      system_updates: e.target.checked,
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                  />
                </label>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSavePreferences} loading={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && profile?.role === 'admin' && (
          <IntegrationsSettings />
        )}
      </div>
    </DashboardLayout>
  );
};
