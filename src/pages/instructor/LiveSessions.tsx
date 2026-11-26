import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { LiveSession, Course } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Plus,
  Video,
  Calendar,
  Clock,
  ExternalLink,
  UserCheck,
  Trash2,
  CheckCircle2,
  BookOpen,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const InstructorLiveSessions: React.FC = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:30');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/tnv-work-live');
  const [platform, setPlatform] = useState('Google Meet');

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const assigned = await dataProvider.getInstructorCourses(user.id);
      setCourses(assigned);

      const assignedCourseIds = new Set(assigned.map((c) => c.id));
      const allSessions = await dataProvider.getLiveSessions();
      const scoped = allSessions.filter((s) => s.course_id && assignedCourseIds.has(s.course_id));
      setSessions(scoped);

      if (assigned.length > 0 && !courseId) {
        setCourseId(assigned[0].id);
      }
    } catch (err) {
      console.error('Failed to load instructor live sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Compute live timing status
  const getSessionTimingStatus = (dateStr: string, startStr: string, endStr: string) => {
    try {
      const now = new Date();
      const [y, m, d] = dateStr.split('-').map(Number);
      const [sh, sm] = startStr.split(':').map(Number);
      const [eh, em] = endStr.split(':').map(Number);

      const start = new Date(y, m - 1, d, sh, sm, 0);
      const end = new Date(y, m - 1, d, eh, em, 0);

      if (now >= start && now <= end) {
        return { label: 'LIVE NOW', variant: 'rose', isLive: true };
      }
      if (now < start) {
        return { label: 'Upcoming', variant: 'brand', isLive: false };
      }
      return { label: 'Concluded', variant: 'slate', isLive: false };
    } catch {
      return { label: 'Scheduled', variant: 'brand', isLive: false };
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseId || !scheduledDate || !startTime || !endTime) return;

    setIsSubmitting(true);
    try {
      await dataProvider.createLiveSession({
        title: title.trim(),
        description: description.trim() || undefined,
        course_id: courseId,
        scheduled_date: scheduledDate,
        start_time: startTime,
        end_time: endTime,
        meeting_link: meetingLink.trim(),
        platform: platform.trim(),
        instructor_name: user?.full_name || 'Instructor',
      });

      setTitle('');
      setDescription('');
      setMeetingLink('https://meet.google.com/tnv-work-live');
      setModalOpen(false);
      setSuccessMessage('Live session broadcast scheduled successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule live session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSession = async (sId: string, sTitle: string) => {
    if (!confirm(`Are you sure you want to cancel and delete the session "${sTitle}"?`)) return;
    try {
      await dataProvider.deleteLiveSession(sId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete live session');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Video className="w-7 h-7 text-[#1b6b3a]" />
            <span>Assigned Courses Live Broadcasts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Schedule real-time video lectures, review rosters, and initiate meeting rooms for your assigned courses.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={courses.length === 0}
        >
          Schedule Live Session
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Sessions</span>
            <Video className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{sessions.length}</div>
          <p className="text-xs text-slate-500">Across Assigned Curricula</p>
        </Card>

        <Card className="p-5 flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Live / Today</span>
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {sessions.filter((s) => s.scheduled_date === todayStr).length}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Scheduled for today</p>
        </Card>

        <Card className="p-5 flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Courses</span>
            <BookOpen className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{courses.length}</div>
          <p className="text-xs text-amber-600 dark:text-amber-400">Active faculty curriculum scope</p>
        </Card>
      </div>

      {/* Sessions Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-56 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500 space-y-3">
          <Video className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
            No live sessions scheduled yet for your courses.
          </p>
          <p className="text-slate-400 max-w-sm mx-auto">
            Click &quot;Schedule Live Session&quot; to plan interactive Google Meet classes for enrolled students.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessions.map((s) => {
            const timing = getSessionTimingStatus(s.scheduled_date, s.start_time, s.end_time);
            const parentCourse = courses.find((c) => c.id === s.course_id);

            return (
              <Card
                key={s.id}
                className="p-5 flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        timing.isLive
                          ? 'bg-rose-100 text-rose-800 animate-pulse'
                          : timing.variant === 'brand'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {timing.label}
                    </span>
                    <button
                      onClick={() => handleDeleteSession(s.id, s.title)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      title="Cancel session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mb-0.5">
                      {parentCourse?.title || 'Assigned Course'}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {s.title}
                    </h3>
                    {s.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.description}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(s.scheduled_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {s.start_time} - {s.end_time}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between gap-2">
                  <Link
                    to={`/instructor/attendance?course=${s.course_id}&session=${s.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1b6b3a] hover:underline"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Mark Roster</span>
                  </Link>

                  {s.meeting_link && (
                    <a
                      href={s.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1b6b3a] text-white text-xs font-bold hover:bg-[#14532d] transition-colors"
                    >
                      <span>Join Class</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* SCHEDULE MODAL */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Schedule Live Session">
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Select Assigned Course
            </label>
            <Select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              options={courses.map((c) => ({ value: c.id, label: c.title }))}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Session Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Masterclass: Advanced CSS Flexbox & Grid"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Session Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5"
              placeholder="Outline concepts and hands-on deliverables..."
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Date
              </label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Start Time
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                End Time
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Google Meet / Video Room URL
            </label>
            <Input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Publish Broadcast
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
