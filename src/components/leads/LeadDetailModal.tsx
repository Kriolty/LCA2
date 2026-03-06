import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { EmailModal } from '../communication/EmailModal';
import { SMSModal } from '../communication/SMSModal';
import { ActivityTimeline } from '../activity/ActivityTimeline';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  DollarSign,
  Calendar,
  TrendingUp,
  MessageSquare,
  FileText,
  Clock,
  Globe,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  ExternalLink,
  Star,
  Navigation
} from 'lucide-react';
import { format } from 'date-fns';

interface Lead {
  id: string;
  lead_name: string;
  business_name: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  linkedin_url: string;
  suburb: string;
  city: string;
  postcode: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  vertical: string;
  business_type: string;
  quality_score: number;
  base_price: number;
  current_price: number;
  status: string;
  assigned_to: string | null;
  original_data: any;
  created_at: string;
}

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onUpdate: () => void;
}

export const LeadDetailModal = ({ isOpen, onClose, lead, onUpdate }: LeadDetailModalProps) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'notes'>('overview');
  const [updating, setUpdating] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'notes', label: 'Notes', icon: FileText },
  ];

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true);
    try {
      const oldStatus = lead.status;
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', lead.id);

      if (error) throw error;

      if (user) {
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'update',
          entity_type: 'lead',
          entity_id: lead.id,
          description: `Updated lead status from ${oldStatus} to ${newStatus}`,
          metadata: { old_status: oldStatus, new_status: newStatus },
        });
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating lead status:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{lead.lead_name}</h2>
            <p className="text-gray-600 mt-1">{lead.business_name}</p>
          </div>
          <span className={`
            inline-flex px-3 py-1 text-sm font-medium rounded-full
            ${lead.status === 'available' ? 'bg-green-100 text-green-800' : ''}
            ${lead.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${lead.status === 'sold' ? 'bg-purple-100 text-purple-800' : ''}
            ${lead.status === 'expired' ? 'bg-gray-100 text-gray-800' : ''}
          `}>
            {lead.status}
          </span>
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
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
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

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Contact Information</h3>

                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-gray-900">{lead.email || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-gray-900">
                      {lead.phone ? (
                        <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                          {lead.phone}
                        </a>
                      ) : '-'}
                    </p>
                  </div>
                </div>

                {lead.mobile && (
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Mobile</p>
                      <p className="text-gray-900">
                        <a href={`tel:${lead.mobile}`} className="text-blue-600 hover:underline">
                          {lead.mobile}
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                {lead.website && (
                  <div className="flex items-start space-x-3">
                    <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Website</p>
                      <p className="text-gray-900">
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          {lead.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Business</p>
                    <p className="text-gray-900">{lead.business_name || '-'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="text-gray-900">
                      {lead.suburb && lead.postcode && lead.state
                        ? `${lead.suburb}, ${lead.state} ${lead.postcode}`
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Lead Details</h3>

                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Vertical</p>
                    <p className="text-gray-900">{lead.vertical || '-'}</p>
                  </div>
                </div>

                {lead.business_type && (
                  <div className="flex items-start space-x-3">
                    <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Business Type</p>
                      <p className="text-gray-900">{lead.business_type}</p>
                    </div>
                  </div>
                )}

                {lead.timezone && (
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Timezone</p>
                      <p className="text-gray-900">{lead.timezone}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="text-gray-900">${lead.current_price?.toFixed(2) || '0.00'}</p>
                    {lead.base_price !== lead.current_price && (
                      <p className="text-sm text-gray-500">
                        Base: ${lead.base_price?.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Quality Score</p>
                    <div className="flex items-center mt-1">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${lead.quality_score || 0}%` }}
                        />
                      </div>
                      <span className="text-gray-900 font-medium">{lead.quality_score || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-gray-900">
                      {format(new Date(lead.created_at), 'MMMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {(lead.facebook_url || lead.instagram_url || lead.twitter_url || lead.linkedin_url) && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Social Media & Online Presence</h3>
                <div className="grid grid-cols-2 gap-3">
                  {lead.facebook_url && (
                    <a
                      href={lead.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Facebook className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Facebook</span>
                      <ExternalLink className="h-3 w-3 text-gray-400 ml-auto" />
                    </a>
                  )}
                  {lead.instagram_url && (
                    <a
                      href={lead.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Instagram className="h-5 w-5 text-pink-600" />
                      <span className="text-sm font-medium text-gray-700">Instagram</span>
                      <ExternalLink className="h-3 w-3 text-gray-400 ml-auto" />
                    </a>
                  )}
                  {lead.twitter_url && (
                    <a
                      href={lead.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Twitter className="h-5 w-5 text-sky-600" />
                      <span className="text-sm font-medium text-gray-700">Twitter / X</span>
                      <ExternalLink className="h-3 w-3 text-gray-400 ml-auto" />
                    </a>
                  )}
                  {lead.linkedin_url && (
                    <a
                      href={lead.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Linkedin className="h-5 w-5 text-blue-700" />
                      <span className="text-sm font-medium text-gray-700">LinkedIn</span>
                      <ExternalLink className="h-3 w-3 text-gray-400 ml-auto" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {(lead.latitude || lead.longitude) && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Location Details</h3>
                <div className="flex items-start space-x-3">
                  <Navigation className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Coordinates</p>
                    <p className="text-gray-900">{lead.latitude}, {lead.longitude}</p>
                    <a
                      href={`https://www.google.com/maps?q=${lead.latitude},${lead.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      View on Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {lead.original_data && Object.keys(lead.original_data).length > 0 && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Google My Business Intelligence</h3>
                <div className="grid grid-cols-2 gap-4">
                  {lead.original_data['Reviews_count'] && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Star className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-700">Reviews</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {lead.original_data['Reviews_count']}
                        {lead.original_data['Average_rating'] && (
                          <span className="text-sm font-normal text-yellow-600 ml-2">
                            ★ {lead.original_data['Average_rating']}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {lead.original_data['Claimed_google_my_business'] && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Building2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">GMB Status</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {lead.original_data['Claimed_google_my_business'] === 'true' ? 'Claimed' : 'Unclaimed'}
                      </p>
                    </div>
                  )}
                  {lead.original_data['GMB_URL'] && (
                    <div className="col-span-2">
                      <a
                        href={lead.original_data['GMB_URL']}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-2 p-3 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Globe className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">View Google My Business Profile</span>
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setEmailModalOpen(true)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
                <Button variant="outline" onClick={() => setSmsModalOpen(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send SMS
                </Button>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Update Status</h3>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('available')}
                  loading={updating}
                >
                  Available
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('assigned')}
                  loading={updating}
                >
                  Assigned
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('sold')}
                  loading={updating}
                >
                  Sold
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate('expired')}
                  loading={updating}
                >
                  Expired
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Activity Timeline</h3>
            <ActivityTimeline leadId={lead.id} />
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Internal Notes</h3>

            <div className="border rounded-lg p-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this lead..."
                rows={4}
                className="w-full border-0 focus:ring-0 resize-none"
              />
              <div className="flex justify-end mt-2">
                <Button size="sm">Add Note</Button>
              </div>
            </div>

            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p>No notes yet</p>
            </div>
          </div>
        )}
      </div>

      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        recipient={{
          id: lead.id,
          email: lead.email || '',
          name: lead.lead_name || lead.business_name || 'Lead',
        }}
        onSent={() => {
          if (activeTab !== 'history') {
            setActiveTab('history');
          }
        }}
      />

      <SMSModal
        isOpen={smsModalOpen}
        onClose={() => setSmsModalOpen(false)}
        recipient={{
          id: lead.id,
          phone: lead.phone || '',
          name: lead.lead_name || lead.business_name || 'Lead',
        }}
        onSent={() => {
          if (activeTab !== 'history') {
            setActiveTab('history');
          }
        }}
      />
    </Modal>
  );
};
