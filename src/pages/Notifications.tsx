import { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import {
  Bell,
  Mail,
  DollarSign,
  Users,
  Gavel,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Check,
  AlertTriangle,
  TrendingUp,
  Target,
  MessageSquare,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  data?: any;
  read: boolean;
  priority: string;
  send_email: boolean;
  email_sent: boolean;
  send_sms: boolean;
  sms_sent: boolean;
  created_at: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'new_lead':
      return <Target className="h-5 w-5" />;
    case 'status_change':
      return <TrendingUp className="h-5 w-5" />;
    case 'follow_up':
      return <Clock className="h-5 w-5" />;
    case 'deal_won':
      return <CheckCircle className="h-5 w-5" />;
    case 'deal_lost':
      return <XCircle className="h-5 w-5" />;
    case 'escalation':
      return <AlertTriangle className="h-5 w-5" />;
    case 'assignment':
      return <Users className="h-5 w-5" />;
    case 'message':
      return <MessageSquare className="h-5 w-5" />;
    case 'lead_assigned':
    case 'lead_purchased':
      return <DollarSign className="h-5 w-5" />;
    case 'auction_ending':
      return <Gavel className="h-5 w-5" />;
    case 'new_message':
      return <Mail className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const getNotificationColor = (type: string, priority: string) => {
  if (priority === 'urgent') return 'bg-red-100 text-red-600';
  if (priority === 'high') return 'bg-orange-100 text-orange-600';

  switch (type) {
    case 'new_lead':
    case 'deal_won':
      return 'bg-green-100 text-green-600';
    case 'escalation':
      return 'bg-yellow-100 text-yellow-600';
    case 'deal_lost':
      return 'bg-red-100 text-red-600';
    case 'status_change':
    case 'assignment':
      return 'bg-blue-100 text-blue-600';
    case 'follow_up':
      return 'bg-purple-100 text-purple-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const getPriorityBadge = (priority: string) => {
  const colors = {
    urgent: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    normal: 'bg-blue-500 text-white',
    low: 'bg-gray-500 text-white',
  };

  return colors[priority as keyof typeof colors] || colors.normal;
};

export const Notifications = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadNotifications();

      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev]);

            if (Notification.permission === 'granted') {
              new Notification((payload.new as Notification).title, {
                body: (payload.new as Notification).message,
                icon: '/favicon.ico',
              });
            }
          }
        )
        .subscribe();

      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete all notifications?')) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const filteredNotifications = notifications
    .filter(n => filter === 'unread' ? !n.read : true)
    .filter(n => typeFilter === 'all' ? true : n.type === typeFilter);

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.read).length;

  const notificationTypes = Array.from(new Set(notifications.map(n => n.type)));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? (
                <>
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                  {urgentCount > 0 && (
                    <span className="ml-2 text-red-600 font-semibold">
                      ({urgentCount} urgent)
                    </span>
                  )}
                </>
              ) : (
                'All caught up!'
              )}
            </p>
          </div>
          <div className="flex space-x-3">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={handleMarkAllAsRead}>
                <Check className="h-4 w-4 mr-2" />
                Mark All Read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="outline" onClick={handleDeleteAll}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex space-x-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {notificationTypes.length > 1 && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              {notificationTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          )}
        </div>

        <Card>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                We'll notify you when something important happens
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => {
                const icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.type, notification.priority);

                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                        {icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-gray-900">
                                {notification.title}
                              </p>
                              {notification.priority !== 'normal' && (
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadge(notification.priority)}`}>
                                  {notification.priority.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              {notification.link && (
                                <a
                                  href={notification.link}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  View Details →
                                </a>
                              )}
                              {notification.send_email && (
                                <span className="text-xs text-gray-500 flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {notification.email_sent ? 'Email sent' : 'Email pending'}
                                </span>
                              )}
                              {notification.send_sms && (
                                <span className="text-xs text-gray-500 flex items-center">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  {notification.sms_sent ? 'SMS sent' : 'SMS pending'}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-700"
                                title="Mark as read"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="text-gray-400 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};
