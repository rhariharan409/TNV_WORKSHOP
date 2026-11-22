import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { LiveSession, Attendance, CourseEnrollment } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle2,
  Lock,
  Radio,
  BookOpen,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const LiveSessions: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);

  // Update clock every 10 seconds for real-time unlock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [sList, enrs, aList] = await Promise.all([
        dataProvider.getLiveSessions(),
        dataProvider.getStudentCourseEnrollments(user.id),
        dataProvider.getAttendance(undefined, user.id),
      ]);

      setEnrollments(enrs);
      setAttendanceRecords(aList);

      // Filter sessions for courses the student is enrolled in
      const enrolledCourseIds = new Set(enrs.map((e) => e.course_id));
      if (enrolledCourseIds.size > 0) {
        const studentSessions = sList.filter((s) => enrolledCourseIds.has(s.course_id));
        setSessions(studentSessions.length > 0 ? studentSessions : sList);
      } else {
        setSessions(sList);
      }
    } catch (err) {
      console.error('Failed to load student live sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const getAttendanceFor = (sessionId: string) =>
    attendanceRecords.find((a) => a.live_session_id === sessionId);

  // Calculate live session timing state against current local time
  const getTimingState = (scheduledDate: string, startTime: string, endTime: string) => {
    try {
      const now = currentTime;
      const [y, m, d] = scheduledDate.split('-').map(Number);
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);

      const startDateTime = new Date(y, m - 1, d, sh, sm, 0);
      const endDateTime = new Date(y, m - 1, d, eh, em, 0);

      // Access opens 10 minutes prior to scheduled start time up to end time
      const accessOpenTime = new Date(startDateTime.getTime() - 10 * 60 * 1000);

      if (now < accessOpenTime) {
        // Upcoming / Locked
        const diffMs = startDateTime.getTime() - now.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        let countdown = '';
        if (diffHrs > 24) {
          const days = Math.floor(diffHrs / 24);
          countdown = `Opens in ${days} day${days > 1 ? 's' : ''}`;
        } else if (diffHrs > 0) {
          countdown = `Opens in ${diffHrs}h ${diffMins}m`;
        } else {
          countdown = `Opens in ${diffMins} min${diffMins > 1 ? 's' : ''}`;
        }

        return {
          status: 'upcoming',
          canJoin: false,
          countdown,
          label: 'Scheduled',
        };
      } else if (now >= accessOpenTime && now <= endDateTime) {
        // LIVE NOW
        return {
          status: 'live',
          canJoin: true,
          countdown: 'Session in progress',
          label: 'LIVE NOW',
        };
      } else {
        // Ended
        return {
          status: 'ended',
          canJoin: false,
          countdown: 'Concluded',
          label: 'Session Ended',
        };
      }
    } catch {
      return {
        status: 'upcoming',
        canJoin: false,
        countdown: 'Scheduled',
        label: 'Scheduled',
      };
    }
  };

  // Join Live Session handler
  const handleJoinLiveSession = async (session: LiveSession) => {
    if (!user?.id) return;
    setJoiningSessionId(session.id);

    try {
      // Mark attendance automatically in database
      await dataProvider.markAttendance(session.id, user.id, 'present', 'Student joined Google Meet room');

      // Refresh attendance records
      const updatedAttendance = await dataProvider.getAttendance(undefined, user.id);
      setAttendanceRecords(updatedAttendance);
    } catch (err) {
      console.warn('Could not auto-mark attendance:', err);
    } finally {
      setJoiningSessionId(null);
    }

    // Open meeting link in new tab
    window.open(session.meeting_link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Radio className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          Live Interactive Masterclasses
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Attend scheduled live architectural walkthroughs and mentorship sessions via Google Meet. Meeting rooms unlock exclusively at the scheduled time.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
            />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
          <Video className="w-10 h-10 mx-auto text-slate-400 mb-3" />
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
            No live masterclasses scheduled at this time
          </h3>
          <p className="text-slate-400 mt-1 max-w-sm mx-auto">
            Your instructor will schedule live architectural workshops here. You will receive an immediate notification when a new live session is announced.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => {
            const att = getAttendanceFor(s.id);
            const timing = getTimingState(s.scheduled_date, s.start_time, s.end_time);
            const isLive = timing.status === 'live';
            const isEnded = timing.status === 'ended';
            const courseTitle = s.course?.title || 'Enrolled Course';

            return (
              <Card
                key={s.id}
                className={`p-6 transition-all border rounded-2xl ${
                  isLive
                    ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20 ring-2 ring-brand-500/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Live Indicator */}
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 animate-pulse">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                          ● LIVE NOW
                        </span>
                      ) : isEnded ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Session Ended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                          <Clock className="w-3 h-3" />
                          {timing.countdown}
                        </span>
                      )}

                      {/* Course Badge */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                        <BookOpen className="w-3 h-3" />
                        {courseTitle}
                      </span>

                      {/* Platform */}
                      <Badge variant="brand">{s.platform || 'Google Meet'}</Badge>

                      {/* Attendance Badge */}
                      {att && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Attendance Verified: Present
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {s.title}
                    </h3>

                    {s.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                        {s.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                        <Calendar className="w-4 h-4 text-brand-600" />
                        {formatDate(s.scheduled_date)}
                      </span>
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                        <Clock className="w-4 h-4 text-brand-600" />
                        {s.start_time} - {s.end_time}
                      </span>
                      <span>Instructor: {s.instructor_name || 'Thamilaran'}</span>
                    </div>

                    {/* Participation Policy Notice */}
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      {isLive ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Google Meet room is open. Click Join below to enter and record attendance.
                        </span>
                      ) : !isEnded ? (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Access unlocks strictly at scheduled time ({s.start_time}). Early entry is prohibited.
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          This session has concluded. Contact instructor for workshop recordings or handouts.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Join / Lock Button */}
                  <div className="shrink-0 flex flex-col items-start sm:items-end gap-2">
                    {isLive ? (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => handleJoinLiveSession(s)}
                        isLoading={joiningSessionId === s.id}
                        rightIcon={<ExternalLink className="w-4 h-4" />}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-lg shadow-brand-600/20 px-6 py-2.5 text-xs"
                      >
                        Join Live Class (Google Meet)
                      </Button>
                    ) : isEnded ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="opacity-60 cursor-not-allowed"
                      >
                        Session Concluded
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        leftIcon={<Lock className="w-3.5 h-3.5" />}
                        className="opacity-60 cursor-not-allowed text-xs font-semibold"
                      >
                        Locked (Opens at {s.start_time})
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
