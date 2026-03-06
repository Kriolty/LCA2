import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Building2,
  User,
  Calendar,
  Tag,
  Globe,
  Linkedin,
  Users,
  DollarSign,
  Briefcase,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Edit3,
  Save,
  Facebook,
  Instagram,
  Twitter,
  Star,
  Navigation,
  ExternalLink,
} from 'lucide-react';

interface ProspectDetailModalProps {
  prospectId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

interface ProspectData {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  mobile: string;
  location: string;
  suburb: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  vertical: string;
  business_type: string;
  source: string;
  status: string;
  quality_score: number;
  quality_score_details: any;
  data_completeness: number;
  tags: string[];
  notes: string;
  website: string;
  linkedin_url: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  company_size: string;
  annual_revenue: string;
  decision_maker_role: string;
  qualification_status: string;
  qualified_by: string;
  qualified_at: string;
  enrichment_data: any;
  enrichment_source: string;
  original_data: any;
  created_at: string;
  updated_at: string;
}

interface ProspectNote {
  id: string;
  note: string;
  note_type: string;
  created_at: string;
  user_profiles: {
    first_name: string;
    last_name: string;
  };
}

export const ProspectDetailModal = ({
  prospectId,
  isOpen,
  onClose,
  onUpdate,
  onNext,
  onPrevious,
  currentIndex,
  totalCount
}: ProspectDetailModalProps) => {
  const { profile } = useAuthStore();
  const [prospect, setProspect] = useState<ProspectData | null>(null);
  const [notes, setNotes] = useState<ProspectNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ProspectData>>({});
  const [newNote, setNewNote] = useState('');
  const [newTags, setNewTags] = useState('');
  const [qualificationReason, setQualificationReason] = useState('');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    if (isOpen && prospectId) {
      fetchProspectDetails();
      fetchNotes();
    }
  }, [isOpen, prospectId]);

  const handlePrevious = useCallback(() => {
    if (onPrevious) {
      setSlideDirection('right');
      setTimeout(() => {
        onPrevious();
        setSlideDirection(null);
      }, 150);
    }
  }, [onPrevious]);

  const handleNext = useCallback(() => {
    if (onNext) {
      setSlideDirection('left');
      setTimeout(() => {
        onNext();
        setSlideDirection(null);
      }, 150);
    }
  }, [onNext]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowLeft' && onPrevious) {
      e.preventDefault();
      handlePrevious();
    } else if (e.key === 'ArrowRight' && onNext) {
      e.preventDefault();
      handleNext();
    }
  }, [isOpen, handleNext, handlePrevious, onNext, onPrevious]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const fetchProspectDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('id', prospectId)
        .single();

      if (error) throw error;
      setProspect(data);
      setEditData(data);
      setNewTags(data.tags?.join(', ') || '');
    } catch (error) {
      console.error('Error fetching prospect:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('prospect_notes')
        .select(`
          id,
          note,
          note_type,
          created_at,
          user_profiles (first_name, last_name)
        `)
        .eq('prospect_id', prospectId)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          setNotes([]);
          return;
        }
        throw error;
      }
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setNotes([]);
    }
  };

  const handleSave = async () => {
    try {
      const tagsArray = newTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { error } = await supabase
        .from('prospects')
        .update({
          ...editData,
          tags: tagsArray,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prospectId);

      if (error) throw error;

      setEditing(false);
      fetchProspectDetails();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating prospect:', error);
      alert('Failed to update prospect');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { error } = await supabase
        .from('prospect_notes')
        .insert({
          prospect_id: prospectId,
          user_id: profile?.user_id,
          note: newNote,
          note_type: 'general',
        });

      if (error) {
        if (error.code === '42P01') {
          alert('Notes feature is not yet set up. Please contact support.');
          return;
        }
        throw error;
      }

      setNewNote('');
      fetchNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    }
  };

  const handleQualify = async (status: string) => {
    try {
      const oldStatus = prospect?.qualification_status || 'unqualified';

      const { error: historyError } = await supabase
        .from('prospect_qualification_history')
        .insert({
          prospect_id: prospectId,
          user_id: profile?.user_id,
          from_status: oldStatus,
          to_status: status,
          reason: qualificationReason,
          quality_score_before: prospect?.quality_score,
          quality_score_after: prospect?.quality_score,
        });

      if (historyError) throw historyError;

      const { error } = await supabase
        .from('prospects')
        .update({
          qualification_status: status,
          qualified_by: profile?.user_id,
          qualified_at: new Date().toISOString(),
        })
        .eq('id', prospectId);

      if (error) throw error;

      setQualificationReason('');
      fetchProspectDetails();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating qualification:', error);
      alert('Failed to update qualification status');
    }
  };

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'qualified': return 'text-green-600 bg-green-100';
      case 'in_review': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Modal>
    );
  }

  if (!prospect) return null;

  const NavigationBar = () => (
    <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handlePrevious}
          disabled={!onPrevious}
          className="bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          ← Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleNext}
          disabled={!onNext}
          className="bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          Next →
        </Button>
      </div>
      <div className="flex flex-col items-center gap-1">
        {currentIndex !== undefined && totalCount !== undefined && (
          <span className="text-sm font-medium text-gray-700">
            {currentIndex + 1} of {totalCount}
          </span>
        )}
        <span className="text-xs text-gray-500">
          Use ← → arrow keys
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onClose}
        className="bg-white shadow-sm hover:shadow-md transition-shadow"
      >
        <X className="h-4 w-4 mr-1" />
        Close
      </Button>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Prospect Details" size="large">
      <div className={`space-y-6 transition-all duration-150 ${
        slideDirection === 'left' ? 'opacity-0 -translate-x-4' :
        slideDirection === 'right' ? 'opacity-0 translate-x-4' :
        'opacity-100 translate-x-0'
      }`}>
        {(onNext || onPrevious) && (
          <div className="-mt-4 -mx-6">
            <NavigationBar />
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(prospect.qualification_status || 'unqualified')}`}>
              {(prospect.qualification_status || 'unqualified').replace('_', ' ').toUpperCase()}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityScoreColor(prospect.quality_score)}`}>
              Quality: {prospect.quality_score}/100
            </div>
            <div className="text-sm text-gray-500">
              {prospect.data_completeness}% Complete
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {editing ? (
              <>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Business Information</h3>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Business Name</label>
                  {editing ? (
                    <Input
                      value={editData.business_name || ''}
                      onChange={(e) => setEditData({ ...editData, business_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{prospect.business_name || 'N/A'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Location</label>
                  {editing ? (
                    <Input
                      value={editData.location || ''}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{prospect.location || 'N/A'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Vertical</label>
                  {editing ? (
                    <Input
                      value={editData.vertical || ''}
                      onChange={(e) => setEditData({ ...editData, vertical: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{prospect.vertical || 'N/A'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Website</label>
                  {editing ? (
                    <Input
                      value={editData.website || ''}
                      onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                      placeholder="https://example.com"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {prospect.website ? (
                        <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          {prospect.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : 'N/A'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Business Type</label>
                  {editing ? (
                    <Input
                      value={editData.business_type || ''}
                      onChange={(e) => setEditData({ ...editData, business_type: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{prospect.business_type || 'N/A'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Company Size</label>
                  {editing ? (
                    <Input
                      value={editData.company_size || ''}
                      onChange={(e) => setEditData({ ...editData, company_size: e.target.value })}
                      placeholder="e.g., 10-50 employees"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{prospect.company_size || 'N/A'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Annual Revenue</label>
                  {editing ? (
                    <Input
                      value={editData.annual_revenue || ''}
                      onChange={(e) => setEditData({ ...editData, annual_revenue: e.target.value })}
                      placeholder="e.g., $1M - $5M"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{prospect.annual_revenue || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Contact Information</h3>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Contact Name</label>
                  {editing ? (
                    <Input
                      value={editData.contact_name || ''}
                      onChange={(e) => setEditData({ ...editData, contact_name: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{prospect.contact_name || 'N/A'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Decision Maker Role</label>
                  {editing ? (
                    <Input
                      value={editData.decision_maker_role || ''}
                      onChange={(e) => setEditData({ ...editData, decision_maker_role: e.target.value })}
                      placeholder="e.g., CEO, CFO, Operations Manager"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{prospect.decision_maker_role || 'N/A'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Email</label>
                  {editing ? (
                    <Input
                      type="email"
                      value={editData.email || ''}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {prospect.email ? (
                        <a href={`mailto:${prospect.email}`} className="text-blue-600 hover:underline">
                          {prospect.email}
                        </a>
                      ) : 'N/A'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Phone</label>
                  {editing ? (
                    <Input
                      type="tel"
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {prospect.phone ? (
                        <a href={`tel:${prospect.phone}`} className="text-blue-600 hover:underline">
                          {prospect.phone}
                        </a>
                      ) : 'N/A'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Mobile</label>
                  {editing ? (
                    <Input
                      type="tel"
                      value={editData.mobile || ''}
                      onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {prospect.mobile ? (
                        <a href={`tel:${prospect.mobile}`} className="text-blue-600 hover:underline">
                          {prospect.mobile}
                        </a>
                      ) : 'N/A'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Linkedin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">LinkedIn</label>
                  {editing ? (
                    <Input
                      value={editData.linkedin_url || ''}
                      onChange={(e) => setEditData({ ...editData, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {prospect.linkedin_url ? (
                        <a href={prospect.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                          View Profile
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : 'N/A'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Source</label>
                  <p className="text-sm font-medium text-gray-900">{prospect.source || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Social Media & Online Presence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Facebook className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <label className="text-xs text-gray-500">Facebook</label>
                {editing ? (
                  <Input
                    value={editData.facebook_url || ''}
                    onChange={(e) => setEditData({ ...editData, facebook_url: e.target.value })}
                    placeholder="https://facebook.com/..."
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    {prospect.facebook_url ? (
                      <a href={prospect.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        View Page
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : 'N/A'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Instagram className="h-5 w-5 text-pink-600 mt-0.5" />
              <div className="flex-1">
                <label className="text-xs text-gray-500">Instagram</label>
                {editing ? (
                  <Input
                    value={editData.instagram_url || ''}
                    onChange={(e) => setEditData({ ...editData, instagram_url: e.target.value })}
                    placeholder="https://instagram.com/..."
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    {prospect.instagram_url ? (
                      <a href={prospect.instagram_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        View Profile
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : 'N/A'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Twitter className="h-5 w-5 text-sky-600 mt-0.5" />
              <div className="flex-1">
                <label className="text-xs text-gray-500">Twitter / X</label>
                {editing ? (
                  <Input
                    value={editData.twitter_url || ''}
                    onChange={(e) => setEditData({ ...editData, twitter_url: e.target.value })}
                    placeholder="https://twitter.com/..."
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    {prospect.twitter_url ? (
                      <a href={prospect.twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        View Profile
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : 'N/A'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {(prospect.latitude || prospect.longitude || prospect.timezone) && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Location Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {prospect.latitude && prospect.longitude && (
                <div className="flex items-start space-x-3">
                  <Navigation className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Coordinates</label>
                    <p className="text-sm font-medium text-gray-900">
                      {prospect.latitude}, {prospect.longitude}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${prospect.latitude},${prospect.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      View on Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
              {prospect.timezone && (
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Timezone</label>
                    <p className="text-sm font-medium text-gray-900">{prospect.timezone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {prospect.original_data && Object.keys(prospect.original_data).length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Google My Business Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prospect.original_data['Reviews_count'] && (
                <div className="flex items-start space-x-3">
                  <Star className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Google Reviews</label>
                    <p className="text-sm font-medium text-gray-900">
                      {prospect.original_data['Reviews_count']} reviews
                      {prospect.original_data['Average_rating'] && (
                        <span className="ml-2 text-yellow-600">
                          ★ {prospect.original_data['Average_rating']}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
              {prospect.original_data['Claimed_google_my_business'] && (
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">GMB Status</label>
                    <p className="text-sm font-medium text-gray-900">
                      {prospect.original_data['Claimed_google_my_business'] === 'true' ? 'Claimed' : 'Unclaimed'}
                    </p>
                  </div>
                </div>
              )}
              {prospect.original_data['GMB_URL'] && (
                <div className="flex items-start space-x-3 md:col-span-2">
                  <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-xs text-gray-500">Google My Business</label>
                    <a
                      href={prospect.original_data['GMB_URL']}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View GMB Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Tags</h3>
          {editing ? (
            <Input
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="Enter tags separated by commas"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {prospect.tags && prospect.tags.length > 0 ? (
                prospect.tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm">No tags</span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Quality Score Breakdown</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">Data Completeness</div>
              <div className="text-2xl font-bold text-gray-900">
                {prospect.quality_score_details?.completeness || 0}/40
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">Verification</div>
              <div className="text-2xl font-bold text-gray-900">
                {prospect.quality_score_details?.verification || 0}/30
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-1">Engagement</div>
              <div className="text-2xl font-bold text-gray-900">
                {prospect.quality_score_details?.engagement || 0}/30
              </div>
            </div>
          </div>
        </div>

        {profile?.role === 'admin' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Qualification</h3>
            <div className="space-y-3">
              <textarea
                value={qualificationReason}
                onChange={(e) => setQualificationReason(e.target.value)}
                placeholder="Reason for status change..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleQualify('in_review')}
                  disabled={prospect.qualification_status === 'in_review'}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  In Review
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleQualify('qualified')}
                  disabled={prospect.qualification_status === 'qualified'}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Qualify
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleQualify('rejected')}
                  disabled={prospect.qualification_status === 'rejected'}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Notes</h3>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <Button onClick={handleAddNote}>Add</Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notes.map((note) => (
                <div key={note.id} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-900">{note.note}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {note.user_profiles?.first_name} {note.user_profiles?.last_name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
          <span>Created: {new Date(prospect.created_at).toLocaleString()}</span>
          <span>Updated: {new Date(prospect.updated_at).toLocaleString()}</span>
        </div>

        {(onNext || onPrevious) && (
          <div className="-mb-6 -mx-6 border-t">
            <NavigationBar />
          </div>
        )}
      </div>
    </Modal>
  );
};
