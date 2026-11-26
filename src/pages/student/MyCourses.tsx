import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { CourseEnrollment } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Modal } from '../../components/ui/Modal';
import {
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

export const MyCourses: React.FC = () => {
  const { user } = useAuth();
  const [courseEnrollments, setCourseEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unenrollTarget, setUnenrollTarget] = useState<{ id: string; courseId: string; title: string } | null>(null);
  const [isUnenrolling, setIsUnenrolling] = useState(false);

  const loadData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const cEnrs = await dataProvider.getStudentCourseEnrollments(user.id);
    setCourseEnrollments(cEnrs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleConfirmUnenroll = async () => {
    if (!unenrollTarget || !user?.id) return;
    setIsUnenrolling(true);
    try {
      await dataProvider.unenrollCourse(unenrollTarget.id, user.id, unenrollTarget.courseId);
      setUnenrollTarget(null);
      await loadData();
    } catch (err: any) {
      alert(`Failed to unenroll: ${err.message}`);
    } finally {
      setIsUnenrolling(false);
    }
  };

  const totalEnrollments = courseEnrollments.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Enrolled Courses & Tracks
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track individual progress across your enrolled technical courses. Each curriculum progress is calculated independently.
          </p>
        </div>

        <Link to="/student/available-courses">
          <Button variant="outline" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
            Explore More Courses
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : totalEnrollments === 0 ? (
        <Card className="p-12 text-center space-y-4 border-slate-200 dark:border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">No Enrolled Courses Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You haven't enrolled in any courses yet. Browse the course directory to begin your hands-on journey.
          </p>
          <Link to="/student/available-courses">
            <Button variant="primary" size="sm" leftIcon={<Compass className="w-4 h-4" />}>
              Browse Available Courses
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Direct Course Enrollments */}
          {courseEnrollments.map((enr) => {
            const course = (Array.isArray(enr.course) ? enr.course[0] : enr.course) || {};
            const courseId = course?.id || enr.course_id;
            const courseTitle = course?.title || (enr as any).course_title || 'Enrolled Course';
            const progress = enr.progress_percentage || 0;
            const isCompleted = enr.is_completed || progress >= 100;

            return (
              <Card
                key={enr.id}
                className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6 sm:p-8 space-y-6">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                    <div className="flex items-start gap-4">
                      <img
                        src={course?.thumbnail_url || '/tnv-logo.png'}
                        alt={courseTitle}
                        className="w-16 h-16 rounded-xl object-contain shrink-0 hidden sm:block p-1 bg-white border border-slate-100 dark:border-slate-800"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="brand">{course?.category || 'Technical Track'}</Badge>
                          <Badge variant={course?.is_paid ? 'warning' : 'outline'}>
                            {course?.is_paid ? `Paid • ₹${course.price || 0}` : 'Free'}
                          </Badge>
                          <Badge variant={isCompleted ? 'success' : progress > 0 ? 'brand' : 'outline'}>
                            {isCompleted ? 'COMPLETED' : progress > 0 ? 'IN PROGRESS' : 'NOT STARTED'}
                          </Badge>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          {courseTitle}
                        </h2>
                        {course?.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">{course.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUnenrollTarget({ id: enr.id, courseId, title: courseTitle })}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-xs font-semibold"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Unenroll from Course
                      </Button>

                      <Link to={`/student/courses/${courseId}`}>
                        <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                          Continue Learning
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Real Database Progress Statistics */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Curriculum Mastery Progress
                      </span>
                      <span className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">
                        {progress}%
                      </span>
                    </div>
                    <ProgressBar value={progress} size="md" />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 block mb-0.5">Sessions Completed:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {enr.completed_sessions || 0} / {enr.total_sessions || 0} Sessions
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 block mb-0.5">Next Activity:</span>
                        <span className="font-semibold text-brand-600 dark:text-brand-400 truncate block">
                          {enr.next_activity || 'All sessions completed'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                        <span className="text-slate-400 block mb-0.5">Enrolled Date:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(enr.enrolled_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Unenroll Confirmation Modal */}
      <Modal
        isOpen={Boolean(unenrollTarget)}
        onClose={() => setUnenrollTarget(null)}
        title="Unenroll from Course"
        description="Please confirm your unenrollment decision"
        maxWidth="sm"
      >
        <div className="space-y-4 py-2 text-xs">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sm block">Are you sure? Your progress may be lost.</span>
              <p className="text-[11px] leading-relaxed">
                You are about to unenroll from <strong>"{unenrollTarget?.title}"</strong>. If you unenroll, your progress percentage and attendance records may need to be reset.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUnenrolling}
              onClick={() => setUnenrollTarget(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isUnenrolling}
              onClick={handleConfirmUnenroll}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              Confirm Unenroll
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
