import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Search, Target, Users, Gavel, TrendingUp, FileText, X } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'lead' | 'prospect' | 'client' | 'auction' | 'campaign';
  title: string;
  subtitle: string;
  path: string;
}

export const GlobalSearch = () => {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      performSearch(query);
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      const searchTerm = `%${searchQuery.toLowerCase()}%`;

      if (profile?.role === 'admin') {
        const [leadsRes, prospectsRes, clientsRes, auctionsRes, campaignsRes] = await Promise.all([
          supabase
            .from('leads')
            .select('id, business_name, city, state, suburb, vertical')
            .or(`business_name.ilike.${searchTerm},city.ilike.${searchTerm},suburb.ilike.${searchTerm},state.ilike.${searchTerm},vertical.ilike.${searchTerm}`)
            .limit(5),
          supabase
            .from('prospects')
            .select('id, business_name, city, state, suburb')
            .or(`business_name.ilike.${searchTerm},city.ilike.${searchTerm},suburb.ilike.${searchTerm},state.ilike.${searchTerm}`)
            .limit(5),
          supabase
            .from('clients')
            .select('id, company_name, user_id')
            .ilike('company_name', searchTerm)
            .limit(5),
          supabase
            .from('lead_auctions')
            .select('id, lead_id, leads(business_name)')
            .limit(5),
          supabase
            .from('email_campaigns')
            .select('id, name, subject')
            .or(`name.ilike.${searchTerm},subject.ilike.${searchTerm}`)
            .limit(5),
        ]);

        if (leadsRes.data) {
          leadsRes.data.forEach((lead: any) => {
            const location = [lead.suburb, lead.city, lead.state].filter(Boolean).join(', ') || 'No location';
            searchResults.push({
              id: lead.id,
              type: 'lead',
              title: lead.business_name || 'Unnamed Lead',
              subtitle: `${location} • ${lead.vertical || 'Unknown vertical'}`,
              path: '/dashboard/leads',
            });
          });
        }

        if (prospectsRes.data) {
          prospectsRes.data.forEach((prospect: any) => {
            const location = [prospect.suburb, prospect.city, prospect.state].filter(Boolean).join(', ') || 'No location';
            searchResults.push({
              id: prospect.id,
              type: 'prospect',
              title: prospect.business_name || 'Unnamed Prospect',
              subtitle: location,
              path: '/dashboard/prospects',
            });
          });
        }

        if (clientsRes.data) {
          clientsRes.data.forEach((client) => {
            searchResults.push({
              id: client.id,
              type: 'client',
              title: client.company_name || 'Unnamed Client',
              subtitle: `Client ID: ${client.user_id.slice(0, 8)}...`,
              path: '/dashboard/users',
            });
          });
        }

        if (auctionsRes.data) {
          auctionsRes.data.forEach((auction) => {
            const leadName = (auction.leads as any)?.business_name || 'Unnamed Lead';
            searchResults.push({
              id: auction.id,
              type: 'auction',
              title: leadName,
              subtitle: 'Active Auction',
              path: '/dashboard/auctions-admin',
            });
          });
        }

        if (campaignsRes.data) {
          campaignsRes.data.forEach((campaign) => {
            searchResults.push({
              id: campaign.id,
              type: 'campaign',
              title: campaign.name,
              subtitle: campaign.subject,
              path: '/dashboard/campaigns',
            });
          });
        }
      } else if (profile?.role === 'sales') {
        const [leadsRes, auctionsRes] = await Promise.all([
          supabase
            .from('leads')
            .select('id, business_name, city, state, suburb, vertical')
            .eq('assigned_to', profile.user_id)
            .or(`business_name.ilike.${searchTerm},city.ilike.${searchTerm},suburb.ilike.${searchTerm},state.ilike.${searchTerm}`)
            .limit(10),
          supabase
            .from('lead_auctions')
            .select('id, lead_id, leads(business_name)')
            .eq('status', 'active')
            .limit(5),
        ]);

        if (leadsRes.data) {
          leadsRes.data.forEach((lead: any) => {
            const location = [lead.suburb, lead.city, lead.state].filter(Boolean).join(', ') || 'No location';
            searchResults.push({
              id: lead.id,
              type: 'lead',
              title: lead.business_name || 'Unnamed Lead',
              subtitle: `${location} • ${lead.vertical || 'Unknown vertical'}`,
              path: '/dashboard/my-leads',
            });
          });
        }

        if (auctionsRes.data) {
          auctionsRes.data.forEach((auction) => {
            const leadName = (auction.leads as any)?.business_name || 'Unnamed Lead';
            if (leadName.toLowerCase().includes(searchQuery.toLowerCase())) {
              searchResults.push({
                id: auction.id,
                type: 'auction',
                title: leadName,
                subtitle: 'Active Auction',
                path: '/dashboard/auctions',
              });
            }
          });
        }
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'lead':
        return <Target className="h-5 w-5 text-green-600" />;
      case 'prospect':
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'client':
        return <Users className="h-5 w-5 text-purple-600" />;
      case 'auction':
        return <Gavel className="h-5 w-5 text-yellow-600" />;
      case 'campaign':
        return <FileText className="h-5 w-5 text-pink-600" />;
      default:
        return <Search className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative" ref={searchRef}>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 w-full md:w-64 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <span className="ml-auto text-xs text-gray-500">⌘K</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 md:w-96">
          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search leads, prospects, clients..."
                className="flex-1 outline-none text-sm"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {result.subtitle}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 capitalize">
                      {result.type}
                    </span>
                  </button>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-8 text-center">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No results found</p>
                <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Start typing to search</p>
                <p className="text-xs text-gray-400 mt-1">Search across leads, prospects, and more</p>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Press ESC to close</span>
              <span>⌘K to open</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
