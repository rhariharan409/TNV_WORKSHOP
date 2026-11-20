import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Course, Module, Session, SessionProgress } from '../../types/database';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import {
  Layers,
  Video,
  FileText,
  CheckCircle2,
  Circle,
  PlayCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Award,
} from 'lucide-react';

export const CourseView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [sessionsMap, setSessionsMap] = useState<Record<string, Session[]>>({});
  const [progressList, setProgressList] = useState<SessionProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || !user?.id) return;

    dataProvider.getCourses().then(async (courses) => {
      const current = courses.find((c) => c.id === id);
      if (!current) {
        navigate('/student/my-courses');
        return;
      }
      setCourse(current);

      const [modList, userProg] = await Promise.all([
        dataProvider.getModules(current.id),
        dataProvider.getSessionProgress(user.id),
      ]);

      setModules(modList);
      setProgressList(userProg);

      const map: Record<string, Session[]> = {};
      for (const m of modList) {
        map[m.id] = await dataProvider.getSessions(m.id);
      }
      setSessionsMap(map);
      setIsLoading(false);
    });
  }, [id, user?.id, navigate]);

  const totalSessions = Object.values(sessionsMap).flat().length;
  const completedCount = progressList.filter((p) => p.is_completed).length;
  const progressPercent = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0;

  if (isLoading || !course) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-semibold uppercase">Loading Course Architecture...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          to="/student/my-courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to My Courses
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="brand">NPTEL Structured Syllabus</Badge>
              <span className="text-xs text-slate-400">Duration: {course.duration || '36 Hours'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {course.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Instructor: {course.instructor_name || 'Dr. T. N. Venkatesh'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="p-6 space-y-3 bg-gradient-to-r from-brand-50 to-white dark:from-brand-950/20 dark:to-slate-900 border-brand-100 dark:border-brand-900/60">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-900 dark:text-white">
            Overall Completion ({completedCount} of {totalSessions} Sessions Complete)
          </span>
          <span className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">{progressPercent}%</span>
        </div>
        <ProgressBar value={progressPercent} size="md" />
      </Card>

      {/* Hierarchical Modules and Sessions */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-brand-600" />
          <span>Curriculum Modules & Recorded Sessions</span>
        </h2>

        {modules.map((m, mIdx) => {
          const sessions = sessionsMap[m.id] || [];
          return (
            <Card key={m.id} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-xs">
                    {mIdx + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{m.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{m.description}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500">{sessions.length} Sessions</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessions.map((s, sIdx) => {
                  const isDone = progressList.some((p) => p.session_id === s.id && p.is_completed);
                  return (
                    <div
                      key={s.id}
                      className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" />
                        )}
                        <div>
                          <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{s.title}</h4>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Video className="w-3 h-3 text-brand-500" />
                              Video Lecture (Google Drive)
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {s.duration_minutes} Mins
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link to={`/student/courses/${course.id}/modules/${m.id}?session=${s.id}`}>
                        <Button
                          variant={isDone ? 'outline' : 'primary'}
                          size="sm"
                          rightIcon={<PlayCircle className="w-3.5 h-3.5" />}
                        >
                          {isDone ? 'Rewatch' : 'Watch Session'}
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
