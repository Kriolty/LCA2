import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Search, Filter, Gavel, TrendingDown, Clock, MapPin, DollarSign } from 'lucide-react';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';

interface AuctionLead {
  id: string;
  lead_id: string;
  start_price: number;
  current_price: number;
  reserve_price: number;
  decay_rate: number;
  start_time: string;
  end_time: string;
  status: string;
  lead: {
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
  };
}

export const Auctions = () => {
  const { user } = useAuthStore();
  const [auctions, setAuctions] = useState<AuctionLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [verticalFilter, setVerticalFilter] = useState('all');
  const [selectedAuction, setSelectedAuction] = useState<AuctionLead | null>(null);
  const [buyModalOpen, setBuyModalOpen] = useState(false);

  useEffect(() => {
    loadAuctions();
    const interval = setInterval(updatePrices, 60000);
    return () => clearInterval(interval);
  }, [verticalFilter]);

  const loadAuctions = async () => {
    try {
      let query = supabase
        .from('lead_auctions')
        .select(`
          *,
          lead:leads(*)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setAuctions(data || []);
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrices = () => {
    setAuctions(prevAuctions =>
      prevAuctions.map(auction => ({
        ...auction,
        current_price: calculateCurrentPrice(auction),
      }))
    );
  };

  const calculateCurrentPrice = (auction: AuctionLead): number => {
    const now = new Date();
    const start = new Date(auction.start_time);
    const hoursElapsed = differenceInHours(now, start);

    const decayedPrice = auction.start_price - (hoursElapsed * auction.decay_rate);
    return Math.max(decayedPrice, auction.reserve_price);
  };

  const getTimeRemaining = (endTime: string): string => {
    const now = new Date();
    const end = new Date(endTime);
    const hoursLeft = differenceInHours(end, now);
    const minutesLeft = differenceInMinutes(end, now) % 60;

    if (hoursLeft < 0) return 'Expired';
    if (hoursLeft < 1) return `${minutesLeft}m remaining`;
    return `${hoursLeft}h ${minutesLeft}m remaining`;
  };

  const handleBuyNow = (auction: AuctionLead) => {
    setSelectedAuction(auction);
    setBuyModalOpen(true);
  };

  const filteredAuctions = auctions.filter(auction => {
    if (verticalFilter !== 'all' && auction.lead.vertical !== verticalFilter) {
      return false;
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        auction.lead.business_name?.toLowerCase().includes(search) ||
        auction.lead.suburb?.toLowerCase().includes(search) ||
        auction.lead.postcode?.includes(search)
      );
    }

    return true;
  });

  const stats = {
    total: auctions.length,
    endingSoon: auctions.filter(a => {
      const hoursLeft = differenceInHours(new Date(a.end_time), new Date());
      return hoursLeft < 6;
    }).length,
    lowPrice: auctions.filter(a => calculateCurrentPrice(a) < a.start_price * 0.5).length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Auctions</h1>
            <p className="text-gray-600 mt-1">Browse available leads with dynamic pricing</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Auctions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Gavel className="h-8 w-8 text-blue-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ending Soon</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.endingSoon}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Price Drops 50%+</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.lowPrice}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-600" />
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by business, suburb, postcode..."
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
          ) : filteredAuctions.length === 0 ? (
            <div className="text-center py-12">
              <Gavel className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No active auctions</p>
              <p className="text-sm text-gray-400 mt-2">Check back soon for new opportunities</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAuctions.map((auction) => {
                const currentPrice = calculateCurrentPrice(auction);
                const priceDropPercent = ((auction.start_price - currentPrice) / auction.start_price * 100).toFixed(0);
                const timeRemaining = getTimeRemaining(auction.end_time);
                const isEndingSoon = differenceInHours(new Date(auction.end_time), new Date()) < 6;

                return (
                  <Card key={auction.id}>
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {auction.lead.business_name || auction.lead.lead_name}
                          </h3>
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 mt-1">
                            {auction.lead.vertical}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center text-xs text-gray-500">
                            <div className="w-12 bg-gray-200 rounded-full h-1.5 mr-1">
                              <div
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{ width: `${auction.lead.quality_score || 0}%` }}
                              />
                            </div>
                            <span>{auction.lead.quality_score || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">
                            {auction.lead.suburb}, {auction.lead.postcode}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="text-sm text-gray-600">Current Price</span>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">
                              ${currentPrice.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 line-through">
                              ${auction.start_price.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="text-green-600 font-medium">
                            {priceDropPercent}% off
                          </span>
                          <span className={`font-medium ${isEndingSoon ? 'text-orange-600' : 'text-gray-600'}`}>
                            <Clock className="h-3 w-3 inline mr-1" />
                            {timeRemaining}
                          </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div
                            className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${((auction.start_price - currentPrice) / (auction.start_price - auction.reserve_price)) * 100}%`
                            }}
                          />
                        </div>

                        <Button
                          onClick={() => handleBuyNow(auction)}
                          className="w-full"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {selectedAuction && buyModalOpen && (
        <BuyNowModal
          auction={selectedAuction}
          onClose={() => {
            setBuyModalOpen(false);
            setSelectedAuction(null);
          }}
          onSuccess={() => {
            loadAuctions();
          }}
        />
      )}
    </DashboardLayout>
  );
};

interface BuyNowModalProps {
  auction: AuctionLead;
  onClose: () => void;
  onSuccess: () => void;
}

const BuyNowModal = ({ auction, onClose, onSuccess }: BuyNowModalProps) => {
  const { user } = useAuthStore();
  const [purchasing, setPurchasing] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    loadClientId();
  }, [user]);

  const loadClientId = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setClientId(data.id);
    }
  };

  const handlePurchase = async () => {
    if (!user || !clientId) return;

    setPurchasing(true);
    try {
      const currentPrice = auction.current_price;

      const { error: saleError } = await supabase
        .from('lead_sales')
        .insert({
          lead_id: auction.lead_id,
          client_id: clientId,
          auction_id: auction.id,
          sale_price: currentPrice,
          payment_method: 'account_credit',
          status: 'completed',
        });

      if (saleError) throw saleError;

      const { error: auctionError } = await supabase
        .from('lead_auctions')
        .update({ status: 'sold' })
        .eq('id', auction.id);

      if (auctionError) throw auctionError;

      const { error: leadError } = await supabase
        .from('leads')
        .update({
          status: 'sold',
          assigned_to: user.id,
          assigned_at: new Date().toISOString(),
        })
        .eq('id', auction.lead_id);

      if (leadError) throw leadError;

      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'create',
        entity_type: 'lead',
        entity_id: auction.lead_id,
        description: `Purchased lead from auction for $${currentPrice.toFixed(2)}`,
        metadata: { auction_id: auction.id, price: currentPrice },
      });

      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'lead_purchased',
        title: 'Lead Purchased Successfully',
        message: `You have purchased ${auction.lead.business_name} for $${currentPrice.toFixed(2)}`,
        link_url: `/dashboard/my-leads`,
        lead_id: auction.lead_id,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error purchasing lead:', error);
      alert('Failed to purchase lead. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const currentPrice = auction.current_price;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Purchase</h2>

          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Business</p>
              <p className="font-medium text-gray-900">{auction.lead.business_name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium text-gray-900">
                {auction.lead.suburb}, {auction.lead.postcode}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Vertical</p>
              <p className="font-medium text-gray-900">{auction.lead.vertical}</p>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Purchase Price</span>
                <span className="text-3xl font-bold text-gray-900">
                  ${currentPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-yellow-800">
              This purchase will be charged to your account. The lead will be immediately assigned to you.
            </p>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handlePurchase} loading={purchasing} className="flex-1">
              Confirm Purchase
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
