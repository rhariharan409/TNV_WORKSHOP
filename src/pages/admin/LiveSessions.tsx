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

export const AdminLiveSessions: React.FC = () => {
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
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingLinkError, setMeetingLinkError] = useState<string | null>(null);
  const [platform, setPlatform] = useState('Google Meet');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sList, allCourses] = await Promise.all([
        dataProvider.getLiveSessions(),
        dataProvider.getCourses(),
      ]);

      setSessions(sList);

      // Filter published and active courses
      const published = allCourses.filter(
        (c) => c.is_published && (!c.status || (c.status as string) !== 'archived')
      );
      const activeCourses = published.length > 0 ? published : allCourses;
      setCourses(activeCourses);

      if (activeCourses.length > 0 && !courseId) {
        setCourseId(activeCourses[0].id);
      }
    } catch (err) {
      console.error('Failed to load live sessions or courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleOpenModal = () => {
    if (courses.length > 0 && !courseId) {
      setCourseId(courses[0].id);
    }
    setTitle('');
    setDescription('');
    setScheduledDate(todayStr);
    setStartTime('18:00');
    setEndTime('19:30');
    setMeetingLink('');
    setMeetingLinkError(null);
    setPlatform('Google Meet');
    setModalOpen(true);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) {
      alert('Please select an associated published course.');
      return;
    }

    const trimmedLink = meetingLink.trim();
    const GOOGLE_MEET_REGEX = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/;
    if (!trimmedLink) {
      setMeetingLinkError('Meeting link is required');
      return;
    }
    if (!GOOGLE_MEET_REGEX.test(trimmedLink)) {
      setMeetingLinkError('Invalid meeting link. Must match format: https://meet.google.com/xxx-yyyy-zzz (e.g. https://meet.google.com/abc-defg-hij)');
      return;
    }
    setMeetingLinkError(null);

    const selectedCourse = courses.find((c) => c.id === courseId);

    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      await dataProvider.createLiveSession({
        title: title.trim(),
        description: description.trim() || `Live technical masterclass for ${selectedCourse?.title || 'the course'}`,
        course_id: courseId,
        scheduled_date: scheduledDate,
        start_time: startTime,
        end_time: endTime,
        meeting_link: trimmedLink,
        platform: platform.trim() || 'Google Meet',
        instructor_name: user?.full_name || 'Thamilaran (Admin)',
        is_published: true,
        course: selectedCourse,
      });

      setModalOpen(false);
      setMeetingLink('');
      setMeetingLinkError(null);
      setSuccessMessage(
        `Live Masterclass "${title}" scheduled successfully! Real-time notification dispatched to all enrolled students for ${selectedCourse?.title}.`
      );

      await loadData();
    } catch (err: any) {
      console.error('Failed to create live session:', err);
      alert(`Could not schedule live session: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSession = async (id: string, sessionTitle: string) => {
    if (confirm(`Are you sure you want to cancel and remove "${sessionTitle}"?`)) {
      try {
        await dataProvider.deleteLiveSession(id);
        await loadData();
      } catch (err: any) {
        alert(`Failed to delete session: ${err.message}`);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Video className="w-8 h-8 text-brand-600 dark:text-brand-400" />
            Live Session Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Schedule live video conferences, dispatch real-time student notifications, and track attendance.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Schedule Live Session
        </Button>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Session List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <Video className="w-10 h-10 mx-auto text-slate-400 mb-3" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
              No live masterclasses scheduled yet
            </h3>
            <p className="text-slate-400 mt-1 max-w-sm mx-auto">
              Click &quot;Schedule Live Session&quot; to pick an active course, set your Google Meet link, and notify students.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenModal}
              className="mt-4"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Schedule Live Session
            </Button>
          </Card>
        ) : (
          sessions.map((s) => {
            const timing = getSessionTimingStatus(s.scheduled_date, s.start_time, s.end_time);
            const courseTitle = s.course?.title || 'Published Course';

            return (
              <Card
                key={s.id}
                className="p-6 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all bg-white dark:bg-slate-900 rounded-2xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Live status badge */}
                      {timing.isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                          LIVE NOW
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            timing.label === 'Upcoming'
                              ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {timing.label}
                        </span>
                      )}

                      {/* Associated Course Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                        <BookOpen className="w-3 h-3" />
                        {courseTitle}
                      </span>

                      {/* Platform */}
                      <Badge variant="brand">{s.platform || 'Google Meet'}</Badge>

                      <span className="text-[11px] text-slate-400">
                        Instructor: {s.instructor_name || 'Thamilaran'}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {s.title}
                    </h3>

                    {s.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                        {s.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-brand-600" />
                        {formatDate(s.scheduled_date)}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-brand-600" />
                        {s.start_time} - {s.end_time}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px] truncate max-w-[200px]">
                        Link: {s.meeting_link}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a href={s.meeting_link} target="_blank" rel="noreferrer">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Test Link
                      </Button>
                    </a>

                    <Link to={`/admin/attendance?session=${s.id}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                      >
                        Attendance
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSession(s.id, s.title)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Schedule Live Masterclass Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setMeetingLinkError(null);
        }}
        title="Schedule Live Masterclass"
        description="Set course, date, time and video conference link"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
          {/* Associated Course Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Associated Course *
            </label>
            {courses.length === 0 ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No courses available. Please publish a course in the Courses section first.</span>
              </div>
            ) : (
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-2xl border-none bg-[#eef3f8] dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} {c.is_published ? '(Published & Active)' : ''}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[10px] text-slate-400 mt-1">
              All students enrolled in this course will immediately receive an announcement notification.
            </p>
          </div>

          <Input
            label="Session Title *"
            placeholder="e.g. Live Q&A and Full Stack Architecture Workshop"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Session Agenda / Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Topics covered, reference materials to review before joining..."
              className="w-full rounded-2xl border-none bg-[#eef3f8] dark:bg-slate-800 p-3.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Scheduled Date *"
              type="date"
              min={todayStr}
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Meeting Platform *
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl border-none bg-[#eef3f8] dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
              >
                <option value="Google Meet">Google Meet</option>
                <option value="Zoom">Zoom</option>
                <option value="Microsoft Teams">Microsoft Teams</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time *"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time *"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <Input
            label="Meeting Link URL (Google Meet / G Meet / Drive Link) *"
            placeholder="https://meet.google.com/abc-defg-hij"
            value={meetingLink}
            onChange={(e) => {
              setMeetingLink(e.target.value);
              if (meetingLinkError) setMeetingLinkError(null);
            }}
            error={meetingLinkError || undefined}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setModalOpen(false);
                setMeetingLinkError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={courses.length === 0}
            >
              Schedule Masterclass
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
