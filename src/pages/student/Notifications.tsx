import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Notification } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Bell, Check, CheckCheck, ExternalLink, Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const loadData = async () => {
    if (!user?.id) return;
    const list = await dataProvider.getNotifications(user.id);
    setNotifications(list);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('notifications-updated', handleUpdate);
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }, [user?.id]);

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user?.id) return;
    await dataProvider.markNotificationRead(user.id, id);
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
    );
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!user?.id) return;

    if (!n.is_read) {
      await dataProvider.markNotificationRead(user.id, n.id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      );
    }

    if (n.link_url && n.link_url.trim()) {
      navigate(n.link_url.trim());
    } else {
      setSelectedNotification(n);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    await dataProvider.markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'alert':
        return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <Info className="w-4 h-4 text-brand-600 dark:text-brand-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Stay informed on enrollment approvals, assignment evaluations, exams, and live masterclass alerts.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            leftIcon={<CheckCheck className="w-4 h-4" />}
            className="text-xs font-bold shrink-0"
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500">
          <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          No notifications to display.
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 transition-all cursor-pointer hover:shadow-md flex items-start justify-between gap-4 border ${
                !n.is_read
                  ? 'border-brand-500/60 bg-brand-50/20 dark:bg-brand-950/20 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  {getTypeIcon(n.type)}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{n.title}</span>
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-brand-600 shrink-0"></span>}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">{n.message}</p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                    <span>{formatDate(n.created_at)}</span>
                    {n.link_url && (
                      <span className="text-brand-600 hover:underline flex items-center gap-1 font-semibold">
                        Open <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!n.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleMarkRead(n.id, e)}
                  className="shrink-0"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Notification Details View Modal */}
      <Modal
        isOpen={Boolean(selectedNotification)}
        onClose={() => setSelectedNotification(null)}
        title={selectedNotification?.title || 'Notification Details'}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span>{selectedNotification ? formatDate(selectedNotification.created_at) : ''}</span>
            <span className="capitalize font-bold text-slate-600 dark:text-slate-300">
              {selectedNotification?.type || 'info'} notification
            </span>
          </div>

          <p className="text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap text-sm">
            {selectedNotification?.message}
          </p>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedNotification(null)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
