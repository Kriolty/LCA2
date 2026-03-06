import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Users, DollarSign, Copy, TrendingUp, Award } from 'lucide-react';

export const ReferralProgram = () => {
  const { profile } = useAuthStore();
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, earnings: 0 });
  const [referrals, setReferrals] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile?.id) return;

    try {
      let code = referralCode;
      if (!code) {
        const { data: existingRef } = await supabase
          .from('referrals')
          .select('referral_code')
          .eq('referrer_id', profile.id)
          .limit(1)
          .single();

        if (existingRef) {
          code = existingRef.referral_code;
        } else {
          code = `REF${profile.id.substring(0, 8).toUpperCase()}`;
          await supabase.from('referrals').insert({
            referrer_id: profile.id,
            referral_code: code,
          });
        }
        setReferralCode(code);
      }

      const { data: refs } = await supabase
        .from('referrals')
        .select('*, user_profiles!referrals_referred_id_fkey(full_name, email)')
        .eq('referrer_id', profile.id);

      const { data: earningsData } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('referrer_id', profile.id)
        .order('created_at', { ascending: false });

      setReferrals(refs || []);
      setEarnings(earningsData || []);

      const totalEarnings = (earningsData || []).reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);
      const activeRefs = (refs || []).filter((r: any) => r.status === 'active').length;

      setStats({ total: refs?.length || 0, active: activeRefs, earnings: totalEarnings });
    } catch (error) {
      console.error('Error loading referral data:', error);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    alert('Referral code copied!');
  };

  const copyLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    alert('Referral link copied!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
          <p className="text-gray-600 mt-1">Earn commissions by referring new clients</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Referrals</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Referrals</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">${stats.earnings.toFixed(2)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Code</h3>
            <div className="flex items-center space-x-4">
              <code className="flex-1 text-2xl font-bold text-blue-600 bg-blue-50 px-6 py-4 rounded-lg">
                {referralCode}
              </code>
              <Button onClick={copyCode}>
                <Copy className="h-5 w-5 mr-2" />
                Copy Code
              </Button>
              <Button onClick={copyLink} variant="outline">
                <Copy className="h-5 w-5 mr-2" />
                Copy Link
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Earn 10% commission on all purchases made by your referrals for their first year!
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Referrals</h3>
              <div className="space-y-3">
                {referrals.slice(0, 5).map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{ref.user_profiles?.full_name || 'Pending'}</div>
                      <div className="text-sm text-gray-600">{ref.user_profiles?.email || 'Invited'}</div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      ref.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {ref.status}
                    </span>
                  </div>
                ))}
                {referrals.length === 0 && (
                  <p className="text-center text-gray-600 py-4">No referrals yet</p>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings History</h3>
              <div className="space-y-3">
                {earnings.slice(0, 5).map((earning) => (
                  <div key={earning.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">${earning.amount}</div>
                      <div className="text-sm text-gray-600">{earning.description}</div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      earning.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {earning.status}
                    </span>
                  </div>
                ))}
                {earnings.length === 0 && (
                  <p className="text-center text-gray-600 py-4">No earnings yet</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};
