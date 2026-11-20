import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { WorkshopEnrollment, Course } from '../../types/database';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { BookOpen, Clock, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';

export const MyCourses: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<WorkshopEnrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      dataProvider.getStudentEnrollments(user.id),
      dataProvider.getCourses(),
    ]).then(([enrs, crss]) => {
      setEnrollments(enrs);
      setCourses(crss);
      setIsLoading(false);
    });
  }, [user?.id]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          My Enrolled Workshops & Courses
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Access your modules, recorded Google Drive lectures, session notes, and track your graduation progress.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">No Enrolled Workshops</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You have not registered for any active workshops yet. Explore the catalog to begin learning.
          </p>
          <Link to="/workshops">
            <Button variant="primary" size="sm">Browse Workshop Directory</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {enrollments.map((enr) => {
            const isApproved = enr.status === 'approved';
            const workshopCourses = courses.filter((c) => c.workshop_id === enr.workshop_id);

            return (
              <Card key={enr.id} className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-md">
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Workshop Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="brand">{enr.workshop?.duration || '6 Weeks'}</Badge>
                        <span className="text-xs text-slate-400">Instructor: {enr.workshop?.instructor_name}</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {enr.workshop?.title}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={enr.status} />
                    </div>
                  </div>

                  {/* Progress & Status Message */}
                  {isApproved ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Curriculum Progress</span>
                        <span className="font-bold text-brand-600 dark:text-brand-400">75% Complete</span>
                      </div>
                      <ProgressBar value={75} size="md" />
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-xs text-amber-800 dark:text-amber-300">
                        <Lock className="w-5 h-5 shrink-0 text-amber-600" />
                        <div>
                          <p className="font-bold">Content Locked: Payment Verification Pending</p>
                          <p className="text-[11px] opacity-80">
                            Course modules, video lectures, and learning resources unlock upon administrator approval.
                          </p>
                        </div>
                      </div>
                      <Link to="/student/dashboard">
                        <Button variant="primary" size="sm" className="shrink-0">
                          Verify Payment
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Courses List Under this Workshop */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Enrolled Courses ({workshopCourses.length})
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {workshopCourses.map((c) => (
                        <div
                          key={c.id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-4"
                        >
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{c.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {c.duration || '36 Hours'} • {c.instructor_name}
                            </p>
                          </div>

                          {isApproved ? (
                            <Link to={`/student/courses/${c.id}`}>
                              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                                View Course
                              </Button>
                            </Link>
                          ) : (
                            <Button variant="secondary" size="sm" disabled leftIcon={<Lock className="w-3.5 h-3.5" />}>
                              Locked
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
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
