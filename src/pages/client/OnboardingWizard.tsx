import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import {
  CheckCircle,
  Sun,
  Home,
  DollarSign,
  Waves,
  MapPin,
  Settings,
  CreditCard,
  Rocket,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface OnboardingProgress {
  id?: string;
  current_step: number;
  completed_steps: number[];
  verticals_selected: string[];
  territory_configured: boolean;
  lead_caps_set: boolean;
  payment_added: boolean;
  is_completed: boolean;
}

export const OnboardingWizard = () => {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<OnboardingProgress>({
    current_step: 1,
    completed_steps: [],
    verticals_selected: [],
    territory_configured: false,
    lead_caps_set: false,
    payment_added: false,
    is_completed: false,
  });
  const [loading, setLoading] = useState(true);

  const [selectedVerticals, setSelectedVerticals] = useState<string[]>([]);
  const [territoryData, setTerritoryData] = useState({
    postcodes: '',
    radius_km: '50',
  });
  const [leadCapsData, setLeadCapsData] = useState({
    daily_cap: '10',
    monthly_cap: '200',
    max_price: '100',
  });
  const [paymentData, setPaymentData] = useState({
    card_number: '',
    expiry: '',
    cvv: '',
  });

  const verticals = [
    {
      name: 'Solar',
      icon: Sun,
      color: 'bg-yellow-100 text-yellow-600',
      description: 'Solar panel installations and energy solutions',
    },
    {
      name: 'Property',
      icon: Home,
      color: 'bg-blue-100 text-blue-600',
      description: 'Property investment and real estate leads',
    },
    {
      name: 'Finance',
      icon: DollarSign,
      color: 'bg-green-100 text-green-600',
      description: 'Loans, mortgages, and financial services',
    },
    {
      name: 'Spas',
      icon: Waves,
      color: 'bg-cyan-100 text-cyan-600',
      description: 'Spa and hot tub installations',
    },
  ];

  const steps = [
    { number: 1, title: 'Choose Verticals', icon: CheckCircle },
    { number: 2, title: 'Configure Territory', icon: MapPin },
    { number: 3, title: 'Set Lead Caps', icon: Settings },
    { number: 4, title: 'Add Payment', icon: CreditCard },
    { number: 5, title: 'Go Live', icon: Rocket },
  ];

  useEffect(() => {
    loadProgress();
  }, [profile]);

  const loadProgress = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('client_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProgress(data);
        setSelectedVerticals(data.verticals_selected || []);
      } else {
        await supabase.from('onboarding_progress').insert({
          client_id: profile.id,
          current_step: 1,
        });
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (updates: Partial<OnboardingProgress>) => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('client_id', profile.id);

      if (error) throw error;

      setProgress({ ...progress, ...updates });
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Failed to save progress');
    }
  };

  const handleNext = async () => {
    const currentStep = progress.current_step;

    if (currentStep === 1 && selectedVerticals.length === 0) {
      alert('Please select at least one vertical');
      return;
    }

    if (currentStep === 2 && !territoryData.postcodes) {
      alert('Please enter at least one postcode');
      return;
    }

    if (currentStep === 3 && !leadCapsData.daily_cap) {
      alert('Please set your daily lead cap');
      return;
    }

    const newCompletedSteps = [...progress.completed_steps];
    if (!newCompletedSteps.includes(currentStep)) {
      newCompletedSteps.push(currentStep);
    }

    const updates: Partial<OnboardingProgress> = {
      current_step: currentStep + 1,
      completed_steps: newCompletedSteps,
    };

    if (currentStep === 1) {
      updates.verticals_selected = selectedVerticals;
    } else if (currentStep === 2) {
      updates.territory_configured = true;
      await saveTerritory();
    } else if (currentStep === 3) {
      updates.lead_caps_set = true;
      await saveLeadCaps();
    } else if (currentStep === 4) {
      updates.payment_added = true;
    }

    if (currentStep === 5) {
      updates.is_completed = true;
      updates.completed_at = new Date().toISOString();
      await updateProgress(updates);
      navigate('/dashboard');
      return;
    }

    await updateProgress(updates);
  };

  const handleBack = () => {
    if (progress.current_step > 1) {
      updateProgress({ current_step: progress.current_step - 1 });
    }
  };

  const saveTerritory = async () => {
    if (!profile?.id) return;

    try {
      const postcodes = territoryData.postcodes
        .split(',')
        .map(p => p.trim())
        .filter(p => p);

      const { error } = await supabase.from('client_territories').upsert({
        client_id: profile.id,
        postcodes: postcodes,
        radius_km: parseInt(territoryData.radius_km),
        verticals: selectedVerticals,
        is_active: true,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving territory:', error);
    }
  };

  const saveLeadCaps = async () => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase.from('lead_caps').upsert({
        client_id: profile.id,
        daily_cap: parseInt(leadCapsData.daily_cap),
        monthly_cap: parseInt(leadCapsData.monthly_cap),
        max_price_per_lead: parseFloat(leadCapsData.max_price),
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving lead caps:', error);
    }
  };

  const renderStep = () => {
    switch (progress.current_step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Choose Your Verticals
              </h2>
              <p className="text-gray-600">
                Select the industries you want to receive leads from
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verticals.map((vertical) => (
                <div
                  key={vertical.name}
                  onClick={() => {
                    if (selectedVerticals.includes(vertical.name)) {
                      setSelectedVerticals(selectedVerticals.filter(v => v !== vertical.name));
                    } else {
                      setSelectedVerticals([...selectedVerticals, vertical.name]);
                    }
                  }}
                  className={`
                    p-6 border-2 rounded-xl cursor-pointer transition-all
                    ${selectedVerticals.includes(vertical.name)
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${vertical.color}`}>
                      <vertical.icon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {vertical.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {vertical.description}
                      </p>
                    </div>
                    {selectedVerticals.includes(vertical.name) && (
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Configure Your Territory
              </h2>
              <p className="text-gray-600">
                Define the areas where you want to receive leads
              </p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              <Input
                label="Postcodes (comma-separated)"
                value={territoryData.postcodes}
                onChange={(e) =>
                  setTerritoryData({ ...territoryData, postcodes: e.target.value })
                }
                placeholder="e.g., 2000, 2010, 2020"
                required
              />

              <Input
                label="Radius (km)"
                type="number"
                value={territoryData.radius_km}
                onChange={(e) =>
                  setTerritoryData({ ...territoryData, radius_km: e.target.value })
                }
                placeholder="50"
                required
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  Leads within {territoryData.radius_km || '50'}km of your specified postcodes
                  will be automatically assigned to you.
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Set Lead Volume Caps
              </h2>
              <p className="text-gray-600">
                Control how many leads you receive and your budget
              </p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              <Input
                label="Daily Lead Cap"
                type="number"
                value={leadCapsData.daily_cap}
                onChange={(e) =>
                  setLeadCapsData({ ...leadCapsData, daily_cap: e.target.value })
                }
                placeholder="10"
                required
              />

              <Input
                label="Monthly Lead Cap"
                type="number"
                value={leadCapsData.monthly_cap}
                onChange={(e) =>
                  setLeadCapsData({ ...leadCapsData, monthly_cap: e.target.value })
                }
                placeholder="200"
                required
              />

              <Input
                label="Maximum Price Per Lead ($)"
                type="number"
                value={leadCapsData.max_price}
                onChange={(e) =>
                  setLeadCapsData({ ...leadCapsData, max_price: e.target.value })
                }
                placeholder="100"
                required
              />

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900">
                  Estimated monthly cost: ${(parseInt(leadCapsData.monthly_cap) * parseFloat(leadCapsData.max_price) || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Add Payment Method
              </h2>
              <p className="text-gray-600">
                Securely add your payment information
              </p>
            </div>

            <div className="space-y-4 max-w-2xl mx-auto">
              <Input
                label="Card Number"
                value={paymentData.card_number}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, card_number: e.target.value })
                }
                placeholder="4242 4242 4242 4242"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Expiry (MM/YY)"
                  value={paymentData.expiry}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, expiry: e.target.value })
                  }
                  placeholder="12/25"
                />

                <Input
                  label="CVV"
                  value={paymentData.cvv}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, cvv: e.target.value })
                  }
                  placeholder="123"
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600">
                  Your payment information is encrypted and secure. You'll only be charged
                  for leads you receive.
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 text-center">
            <div className="inline-flex p-6 bg-green-100 rounded-full mb-4">
              <Rocket className="h-16 w-16 text-green-600" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900">
              You're All Set!
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your account is configured and ready to receive leads. We'll start sending
              qualified leads that match your criteria.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-gray-900 mb-4">Your Setup Summary:</h3>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">Verticals:</span>
                  <span className="font-medium text-gray-900">
                    {selectedVerticals.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Territory:</span>
                  <span className="font-medium text-gray-900">
                    {territoryData.postcodes || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Lead Cap:</span>
                  <span className="font-medium text-gray-900">
                    {leadCapsData.daily_cap} leads
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Budget:</span>
                  <span className="font-medium text-gray-900">
                    ${(parseInt(leadCapsData.monthly_cap) * parseFloat(leadCapsData.max_price) || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
            <p className="text-gray-600">Loading onboarding...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-semibold mb-2
                    ${progress.current_step === step.number
                      ? 'bg-blue-600 text-white'
                      : progress.completed_steps.includes(step.number)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {progress.completed_steps.includes(step.number) ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    progress.completed_steps.includes(step.number)
                      ? 'bg-green-600'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <div className="p-8">
            {renderStep()}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              {progress.current_step > 1 ? (
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              <Button onClick={handleNext}>
                {progress.current_step === 5 ? 'Complete Setup' : 'Continue'}
                {progress.current_step < 5 && (
                  <ArrowRight className="h-5 w-5 ml-2" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};
