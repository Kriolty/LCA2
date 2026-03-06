import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { CheckCircle, XCircle, CreditCard, Calendar, TrendingUp } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  lead_credits: number;
  features: string[];
  active: boolean;
}

interface ClientSubscription {
  id: string;
  plan_id: string;
  status: string;
  stripe_subscription_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  subscription_plans: SubscriptionPlan;
}

export const SubscriptionManagement = () => {
  const { profile } = useAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<ClientSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('price_monthly', { ascending: true });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', profile?.user_id)
        .single();

      if (clientError) throw clientError;

      if (clientData) {
        const { data: subData, error: subError } = await supabase
          .from('client_subscriptions')
          .select(`
            *,
            subscription_plans (*)
          `)
          .eq('client_id', clientData.id)
          .eq('status', 'active')
          .single();

        if (subError && subError.code !== 'PGRST116') throw subError;
        setCurrentSubscription(subData);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (planId: string) => {
    alert('Stripe integration would handle this. Plan ID: ' + planId);
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      if (currentSubscription) {
        const { error } = await supabase
          .from('client_subscriptions')
          .update({ cancel_at_period_end: true })
          .eq('id', currentSubscription.id);

        if (error) throw error;
        alert('Your subscription will be cancelled at the end of the billing period.');
        loadData();
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
          <p className="text-gray-600 mt-1">Manage your subscription plan</p>
        </div>

        {currentSubscription && (
          <Card>
            <CardHeader title="Current Subscription">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentSubscription.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {currentSubscription.status.toUpperCase()}
              </div>
            </CardHeader>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <CreditCard className="h-5 w-5" />
                    <span className="text-sm">Plan</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {currentSubscription.subscription_plans.name}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {currentSubscription.subscription_plans.lead_credits} leads/month
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <Calendar className="h-5 w-5" />
                    <span className="text-sm">Billing Period</span>
                  </div>
                  <p className="text-sm text-gray-900">
                    {formatDate(currentSubscription.current_period_start)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Renews: {formatDate(currentSubscription.current_period_end)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm">Monthly Cost</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    ${currentSubscription.subscription_plans.price_monthly}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    per month
                  </p>
                </div>
              </div>

              {currentSubscription.cancel_at_period_end && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Your subscription will be cancelled on {formatDate(currentSubscription.current_period_end)}
                  </p>
                </div>
              )}

              {!currentSubscription.cancel_at_period_end && (
                <div className="mt-6">
                  <Button variant="outline" onClick={handleCancelSubscription}>
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        <div className="flex items-center justify-center space-x-4 py-4">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg font-medium ${
              billingCycle === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-2 rounded-lg font-medium ${
              billingCycle === 'annual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Annual
            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
              Save 17%
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan_id === plan.id;
            const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_annual;
            const priceLabel = billingCycle === 'monthly' ? '/month' : '/year';

            return (
              <Card key={plan.id} className={isCurrentPlan ? 'border-2 border-blue-600' : ''}>
                <div className="p-6">
                  {isCurrentPlan && (
                    <div className="mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900">${price}</span>
                      <span className="text-gray-600 ml-2">{priceLabel}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {plan.lead_credits} leads included
                    </p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrentPlan}
                    className="w-full"
                  >
                    {isCurrentPlan ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader title="Need Help?" />
          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Have questions about your subscription? Our support team is here to help.
            </p>
            <Button variant="outline">Contact Support</Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
