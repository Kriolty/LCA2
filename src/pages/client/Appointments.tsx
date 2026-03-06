import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import {
  Calendar,
  Clock,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Filter,
} from 'lucide-react';
import { format, parseISO, isFuture, isPast } from 'date-fns';

interface Appointment {
  id: string;
  lead_id: string;
  client_id: string;
  scheduled_at: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes: string;
  location: string;
  lead_name?: string;
  lead_phone?: string;
  lead_vertical?: string;
  created_at: string;
}

export const Appointments = () => {
  const { profile } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [editModal, setEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    scheduled_at: '',
    notes: '',
    location: '',
  });

  useEffect(() => {
    loadAppointments();
  }, [profile]);

  const loadAppointments = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          leads (
            contact_name,
            phone,
            vertical
          )
        `)
        .eq('client_id', profile.id)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      const formattedData = data.map((apt: any) => ({
        ...apt,
        lead_name: apt.leads?.contact_name,
        lead_phone: apt.leads?.phone,
        lead_vertical: apt.leads?.vertical,
      }));

      setAppointments(formattedData);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (filter === 'upcoming') {
      return (
        isFuture(parseISO(apt.scheduled_at)) &&
        apt.status === 'scheduled'
      );
    }
    if (filter === 'past') {
      return (
        isPast(parseISO(apt.scheduled_at)) ||
        ['completed', 'cancelled', 'no_show'].includes(apt.status)
      );
    }
    return true;
  });

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      scheduled_at: appointment.scheduled_at.slice(0, 16),
      notes: appointment.notes || '',
      location: appointment.location || '',
    });
    setEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedAppointment) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          scheduled_at: formData.scheduled_at,
          notes: formData.notes,
          location: formData.location,
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      setEditModal(false);
      loadAppointments();
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment');
    }
  };

  const handleStatusChange = async (id: string, status: Appointment['status']) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      loadAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadAppointments();
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Failed to delete appointment');
    }
  };

  const getStatusBadge = (status: Appointment['status']) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      no_show: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
            <p className="text-gray-600">Loading appointments...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-1">
              Manage your scheduled meetings with leads
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant={filter === 'upcoming' ? 'primary' : 'outline'}
              onClick={() => setFilter('upcoming')}
            >
              Upcoming
            </Button>
            <Button
              size="sm"
              variant={filter === 'past' ? 'primary' : 'outline'}
              onClick={() => setFilter('past')}
            >
              Past
            </Button>
            <Button
              size="sm"
              variant={filter === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredAppointments.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No appointments found
                </h3>
                <p className="text-gray-600">
                  {filter === 'upcoming'
                    ? 'You have no upcoming appointments scheduled.'
                    : filter === 'past'
                    ? 'You have no past appointments.'
                    : 'You have no appointments yet.'}
                </p>
              </div>
            </Card>
          ) : (
            filteredAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {appointment.lead_name || 'Unnamed Lead'}
                        </h3>
                        {getStatusBadge(appointment.status)}
                      </div>
                      {appointment.lead_vertical && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {appointment.lead_vertical}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {appointment.status === 'scheduled' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(appointment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(appointment.id, 'completed')}
                          >
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(appointment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{format(parseISO(appointment.scheduled_at), 'PPP')}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{format(parseISO(appointment.scheduled_at), 'p')}</span>
                    </div>
                    {appointment.lead_phone && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{appointment.lead_phone}</span>
                      </div>
                    )}
                  </div>

                  {appointment.location && (
                    <div className="flex items-center space-x-2 text-gray-600 text-sm mt-2">
                      <MapPin className="h-4 w-4" />
                      <span>{appointment.location}</span>
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={editModal}
        onClose={() => setEditModal(false)}
        title="Edit Appointment"
      >
        <div className="space-y-4">
          <Input
            label="Date & Time"
            type="datetime-local"
            value={formData.scheduled_at}
            onChange={(e) =>
              setFormData({ ...formData, scheduled_at: e.target.value })
            }
            required
          />

          <Input
            label="Location"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="e.g., Client's home, Office, Phone call"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any notes about this appointment..."
            />
          </div>

          <div className="flex space-x-3">
            <Button onClick={handleUpdate} className="flex-1">
              Update Appointment
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};
