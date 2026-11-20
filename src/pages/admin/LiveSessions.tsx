import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dataProvider } from '../../lib/dataProvider';
import { LiveSession, Course } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Video, Calendar, Clock, ExternalLink, UserCheck } from 'lucide-react';

export const AdminLiveSessions: React.FC = () => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:30');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/tnv-work-live');
  const [platform, setPlatform] = useState('Google Meet');

  const loadData = async () => {
    const [sList, cList] = await Promise.all([
      dataProvider.getLiveSessions(),
      dataProvider.getCourses(),
    ]);
    setSessions(sList);
    setCourses(cList);
    if (cList.length > 0) setCourseId(cList[0].id);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    await dataProvider.createLiveSession({
      title,
      course_id: courseId,
      scheduled_date: scheduledDate,
      start_time: startTime,
      end_time: endTime,
      meeting_link: meetingLink,
      platform,
    });
    setModalOpen(false);
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Live Session Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Schedule live masterclasses, dispatch Google Meet links, and record student attendance.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Schedule Live Session
        </Button>
      </div>

      <div className="space-y-4">
        {sessions.map((s) => (
          <Card key={s.id} className="p-6 border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="brand">{s.platform}</Badge>
                  <span className="text-xs text-slate-400">Instructor: {s.instructor_name || 'Dr. T. N. Venkatesh'}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{s.title}</h3>
                <p className="text-xs text-slate-500 max-w-2xl">{s.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" /> {formatDate(s.scheduled_date)}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-brand-600" /> {s.start_time} - {s.end_time}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a href={s.meeting_link} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Test Link
                  </Button>
                </a>
                <Link to={`/admin/attendance?session=${s.id}`}>
                  <Button variant="primary" size="sm" leftIcon={<UserCheck className="w-3.5 h-3.5" />}>
                    Record Attendance
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Live Masterclass"
        description="Set date, time and video conference link"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
          <Select
            label="Associated Course *"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            options={courses.map((c) => ({ value: c.id, label: c.title }))}
          />

          <Input
            label="Session Title *"
            placeholder="e.g. Live Q&A and PostgreSQL Performance Workshop"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Scheduled Date *"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              required
            />
            <Input
              label="Meeting Platform *"
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              required
            />
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
            label="Meeting Link URL *"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Schedule Masterclass
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
