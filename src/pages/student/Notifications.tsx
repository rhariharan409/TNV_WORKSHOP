import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Notification } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user?.id) return;
    const list = await dataProvider.getNotifications(user.id);
    setNotifications(list);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleMarkRead = async (id: string) => {
    if (!user?.id) return;
    await dataProvider.markNotificationRead(user.id, id);
    await loadData();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Stay informed on enrollment approvals, assignment evaluations, exams, and live masterclass alerts.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500">
          No notifications to display.
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 transition-all flex items-start justify-between gap-4 ${
                !n.is_read ? 'border-brand-500/60 bg-brand-50/20 dark:bg-brand-950/20' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{n.title}</span>
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-brand-600"></span>}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.message}</p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                  <span>{formatDate(n.created_at)}</span>
                  {n.link_url && (
                    <Link to={n.link_url} className="text-brand-600 hover:underline flex items-center gap-1 font-semibold">
                      Open <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>

              {!n.is_read && (
                <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)}>
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
