import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { LiveSession, Attendance } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Video, Calendar, Clock, ExternalLink, CheckCircle2, UserCheck } from 'lucide-react';

export const LiveSessions: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      dataProvider.getLiveSessions(),
      dataProvider.getAttendance(undefined, user.id),
    ]).then(([sList, aList]) => {
      setSessions(sList);
      setAttendanceRecords(aList);
      setIsLoading(false);
    });
  }, [user?.id]);

  const getAttendanceFor = (sessionId: string) =>
    attendanceRecords.find((a) => a.live_session_id === sessionId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Live Interactive Masterclasses
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Attend scheduled live architectural walkthroughs and mentorship sessions via Google Meet. Attendance is tracked for certification.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500">
          No live masterclasses scheduled at this time.
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => {
            const att = getAttendanceFor(s.id);
            return (
              <Card key={s.id} className="p-6 hover:shadow-md transition-all border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="brand">{s.platform}</Badge>
                      {att ? (
                        <StatusBadge status={att.status} />
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">Attendance Pending</span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{s.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{s.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-brand-600" /> {formatDate(s.scheduled_date)}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-brand-600" /> {s.start_time} - {s.end_time}
                      </span>
                      <span>Instructor: {s.instructor_name || 'Dr. T. N. Venkatesh'}</span>
                    </div>
                  </div>

                  <a href={s.meeting_link} target="_blank" rel="noreferrer" className="shrink-0">
                    <Button variant="primary" size="md" rightIcon={<ExternalLink className="w-4 h-4" />}>
                      Join Live Session
                    </Button>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
