import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Course, CourseEnrollment } from '../../types/database';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { ProgressBar } from '../../components/ui/ProgressBar';
import {
  Users,
  CheckCircle2,
  Clock,
  BookOpen,
  FileCheck2,
  FolderGit2,
  GraduationCap,
  Award,
  ArrowRight,
  TrendingUp,
  Layers,
  Sparkles,
  Eye,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [courseActivityData, setCourseActivityData] = useState<{
    enrollments: any[];
    assignments: any[];
    submissions: any[];
    exams: any[];
    attempts: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const loadDashboard = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const adminId = user.role === 'super_admin' ? undefined : user.id;

      const [m, cList] = await Promise.all([
        dataProvider.getAdminDashboardMetrics(adminId),
        dataProvider.getCourses({ adminId }),
      ]);

      setMetrics(m);
      setCourses(cList);
      if (cList.length > 0) {
        setSelectedCourseId(cList[0].id);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user?.id]);

  // Load course-specific activity when selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseActivityData(null);
      return;
    }

    const loadCourseDrilldown = async () => {
      setLoadingActivity(true);
      try {
        const [enrs, asns, subs, exams, attempts] = await Promise.all([
          dataProvider.getCourseEnrollments(selectedCourseId),
          dataProvider.getAssignments(selectedCourseId),
          dataProvider.getAssignmentSubmissions(),
          dataProvider.getExaminations(selectedCourseId),
          dataProvider.getExamAttempts(),
        ]);

        const cSubs = subs.filter((s) => s.assignment?.course_id === selectedCourseId);
        const cAttempts = attempts.filter((a) => a.examination?.course_id === selectedCourseId);

        setCourseActivityData({
          enrollments: enrs,
          assignments: asns,
          submissions: cSubs,
          exams,
          attempts: cAttempts,
        });
      } catch (err) {
        console.error('Failed to load course drilldown:', err);
      } finally {
        setLoadingActivity(false);
      }
    };

    loadCourseDrilldown();
  }, [selectedCourseId]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. ADMIN HEADER */}
      <div className="rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Instructor Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Academic Operations & Course Activity
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Displaying telemetry and student activity strictly scoped to your managed courses ({user?.full_name || 'Admin'}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/admin/courses/create">
            <Button variant="primary" size="sm" leftIcon={<BookOpen className="w-4 h-4" />}>
              Create Course
            </Button>
          </Link>
          <Link to="/admin/students">
            <Button variant="outline" size="sm" leftIcon={<Users className="w-4 h-4" />}>
              View Enrolled Students
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. REAL DATABASE METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 space-y-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Published Courses</span>
            <BookOpen className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {metrics?.totalPublishedCourses || 0}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            <span>{metrics?.totalCourses || 0} Total Curricula Created</span>
          </div>
        </Card>

        <Card className="p-5 space-y-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Enrolled Students</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics?.totalEnrolledStudents || 0}
          </div>
          <div className="text-xs text-emerald-600 font-medium">
            <span>{metrics?.totalActiveEnrollments || 0} Active Track Enrollments</span>
          </div>
        </Card>

        <Card className="p-5 space-y-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Evaluations</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {metrics?.pendingAssignmentEvaluations || 0}
          </div>
          <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            <Link to="/admin/submissions" className="hover:underline">
              {metrics?.totalAssignmentsSubmitted || 0} Submissions awaiting grade →
            </Link>
          </div>
        </Card>

        <Card className="p-5 space-y-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Certificates Issued</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
            {metrics?.totalCertificatesIssued || 0}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            <span>{metrics?.totalCompletedEnrollments || 0} Track Completions</span>
          </div>
        </Card>
      </div>

      {/* 3. COURSE-SPECIFIC ACTIVITY DRILLDOWN (Part 9 Requirement) */}
      <Card className="p-6 sm:p-8 space-y-6 border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="brand">Course-Specific Telemetry</Badge>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Course Progress & Cohort Activity View
            </h2>
            <p className="text-xs text-slate-500">
              Select any of your courses to inspect enrolled students, their completion velocity, assignments, and exam records.
            </p>
          </div>

          {courses.length > 0 && (
            <div className="w-full sm:w-72">
              <Select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                options={courses.map((c) => ({
                  value: c.id,
                  label: `${c.title} (${c.is_published ? 'Published' : 'Draft'})`,
                }))}
              />
            </div>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p>You have not created any courses yet. Create a course to view activity telemetry.</p>
            <Link to="/admin/courses/create">
              <Button variant="primary" size="sm">Create Course</Button>
            </Link>
          </div>
        ) : loadingActivity ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent mx-auto mb-2"></div>
            Loading course activity metrics...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Course Telemetry Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-0.5">Enrolled Students:</span>
                <span className="font-extrabold text-base text-slate-900 dark:text-white">
                  {courseActivityData?.enrollments.length || 0}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-0.5">Assignments Submitted:</span>
                <span className="font-extrabold text-base text-brand-600 dark:text-brand-400">
                  {courseActivityData?.submissions.length || 0}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-0.5">Exam Attempts:</span>
                <span className="font-extrabold text-base text-purple-600 dark:text-purple-400">
                  {courseActivityData?.attempts.length || 0}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-0.5">Completed Students:</span>
                <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                  {courseActivityData?.enrollments.filter((e) => e.is_completed).length || 0}
                </span>
              </div>
            </div>

            {/* Enrolled Students Table for this Course */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Students Enrolled in {selectedCourse?.title} ({courseActivityData?.enrollments.length || 0})
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="p-3">Student</th>
                      <th className="p-3">Progress</th>
                      <th className="p-3">Assignments</th>
                      <th className="p-3">Exams</th>
                      <th className="p-3">Certificate Eligibility</th>
                      <th className="p-3">Enrolled On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {courseActivityData?.enrollments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400 text-xs">
                          No students enrolled in this course yet.
                        </td>
                      </tr>
                    ) : (
                      courseActivityData?.enrollments.map((enr) => {
                        const studentSubs = (courseActivityData?.submissions || []).filter(
                          (s) => s.student_id === enr.student_id
                        );
                        const studentAttempts = (courseActivityData?.attempts || []).filter(
                          (a) => a.student_id === enr.student_id
                        );
                        const isEligible = (enr.progress_percentage || 0) >= 75;

                        return (
                          <tr key={enr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="p-3">
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {enr.student?.full_name}
                              </span>
                              <span className="text-[11px] text-slate-400">{enr.student?.email}</span>
                            </td>

                            <td className="p-3 w-40">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px]">
                                  <span>{enr.progress_percentage || 0}%</span>
                                  <span>{enr.is_completed ? 'Done' : 'Learning'}</span>
                                </div>
                                <ProgressBar value={enr.progress_percentage || 0} size="sm" />
                              </div>
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {studentSubs.length} Submitted
                              </span>
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {studentAttempts.length} Attempts
                              </span>
                            </td>

                            <td className="p-3 whitespace-nowrap">
                              <Badge variant={isEligible ? 'success' : 'warning'}>
                                {isEligible ? 'Criteria Satisfied' : 'Requirements Pending'}
                              </Badge>
                            </td>

                            <td className="p-3 whitespace-nowrap text-slate-400">
                              {formatDate(enr.enrolled_at)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
