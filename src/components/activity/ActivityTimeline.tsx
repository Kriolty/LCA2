import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import {
  Mail,
  Phone,
  MessageSquare,
  Edit,
  User,
  FileText,
  Clock
} from 'lucide-react';

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  description: string;
  user_email: string;
  created_at: string;
  metadata: any;
}

interface ActivityTimelineProps {
  leadId: string;
}

const getActivityIcon = (action: string, entityType: string, metadata: any) => {
  if (entityType === 'communication') {
    if (metadata?.phone) return Phone;
    if (metadata?.subject) return Mail;
    return MessageSquare;
  }

  switch (action) {
    case 'create':
      return FileText;
    case 'update':
      return Edit;
    default:
      return Clock;
  }
};

const getActivityColor = (action: string) => {
  switch (action) {
    case 'create':
      return 'text-green-600 bg-green-100';
    case 'update':
      return 'text-blue-600 bg-blue-100';
    case 'delete':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const ActivityTimeline = ({ leadId }: ActivityTimelineProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, [leadId]);

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_id', leadId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, idx) => {
          const Icon = getActivityIcon(activity.action, activity.entity_type, activity.metadata);
          const colorClass = getActivityColor(activity.action);

          return (
            <li key={activity.id}>
              <div className="relative pb-8">
                {idx !== activities.length - 1 && (
                  <span
                    className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  <div className="relative">
                    <div className={`h-10 w-10 rounded-full ${colorClass} flex items-center justify-center ring-8 ring-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div>
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        <span>{activity.user_email || 'System'}</span>
                        <span>•</span>
                        <span>{format(new Date(activity.created_at), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {activity.metadata.subject && (
                          <p>Subject: {activity.metadata.subject}</p>
                        )}
                        {activity.metadata.phone && (
                          <p>Phone: {activity.metadata.phone}</p>
                        )}
                        {activity.metadata.old_status && activity.metadata.new_status && (
                          <p>
                            Status changed from <span className="font-medium">{activity.metadata.old_status}</span> to{' '}
                            <span className="font-medium">{activity.metadata.new_status}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
