import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Course, CourseEnrollment, AssignmentSubmission, ExamAttempt, Examination, Assignment } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { ProgressBar } from '../../components/ui/ProgressBar';
import {
  Users,
  BookOpen,
  FileCheck2,
  GraduationCap,
  FolderGit2,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

export const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [metrics, setMetrics] = useState<any>(null);
  const [courseActivityData, setCourseActivityData] = useState<{
    enrollments: CourseEnrollment[];
    assignments: Assignment[];
    submissions: AssignmentSubmission[];
    exams: Examination[];
    attempts: ExamAttempt[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [assignedCourses, dashMetrics] = await Promise.all([
        dataProvider.getInstructorCourses(user.id),
        dataProvider.getInstructorDashboardMetrics(user.id),
      ]);
      setCourses(assignedCourses);
      setMetrics(dashMetrics);
      if (assignedCourses.length > 0) {
        setSelectedCourseId(assignedCourses[0].id);
      }
    } catch (err) {
      console.error('Error loading instructor dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Load course drilldown whenever selectedCourseId changes
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseActivityData(null);
      return;
    }

    const loadDrilldown = async () => {
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
        console.error('Error loading course drilldown:', err);
      } finally {
        setLoadingActivity(false);
      }
    };

    loadDrilldown();
  }, [selectedCourseId]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner (Matching Referral Image) */}
      <div className="rounded-3xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1b6b3a] text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-[#1b6b3a]/20">
            {user?.full_name?.charAt(0).toUpperCase() || 'I'}
          </div>

          <div className="space-y-1">
            <p className="font-tamil font-bold text-sm text-[#1b6b3a] dark:text-emerald-400">
              வணக்கம், {user?.full_name || 'Instructor'}!
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome, {user?.full_name || 'Instructor'}!
            </h1>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {user?.email} • Faculty & Course Instructor
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-[#1b6b3a]"></span>
                Instructor Console
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                Tier 2: Assigned Scope
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link to="/instructor/submissions">
            <Button variant="primary" size="sm" leftIcon={<FileCheck2 className="w-4 h-4" />}>
              Grade Submissions
            </Button>
          </Link>
          <Link to="/instructor/materials">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FolderGit2 className="w-4 h-4 text-[#1b6b3a]" />}
              className="border-slate-300 hover:border-[#1b6b3a]"
            >
              Upload Materials
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards - Matching exact style and clean layout of Image 2 */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Published Courses */}
          <Card className="p-5 flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Published Courses
              </span>
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {metrics?.totalCourses ?? courses.length}
            </div>
            <p className="text-xs text-slate-500">
              {metrics?.totalCourses ?? courses.length} Total Curricula Created
            </p>
          </Card>

          {/* Card 2: Enrolled Students */}
          <Card className="p-5 flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Enrolled Students
              </span>
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {metrics?.totalStudents ?? 0}
            </div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {metrics?.totalEnrollments ?? metrics?.totalStudents ?? 0} Active Track Enrollments
            </p>
          </Card>

          {/* Card 3: Pending Evaluations */}
          <Card className="p-5 flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pending Evaluations
              </span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-500 dark:text-amber-400">
              {metrics?.pendingEvaluations ?? 0}
            </div>
            <Link
              to="/instructor/submissions"
              className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>
                {metrics?.totalSubmissions && metrics.totalSubmissions > 0
                  ? `${metrics.totalSubmissions} Submissions awaiting grade →`
                  : 'No submissions awaiting grade'}
              </span>
            </Link>
          </Card>

          {/* Card 4: Technical Exams */}
          <Card className="p-5 flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Certificates / Exams
              </span>
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
              {metrics?.totalExams ?? 0}
            </div>
            <p className="text-xs text-slate-500">
              {metrics?.totalExamAttempts ?? 0} Proctored Submissions Completed
            </p>
          </Card>
        </div>
      )}

      {/* Course Cohort Activity View (Matching Master Admin Page from Image 4) */}
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
              Inspect students enrolled in your assigned curricula, their progression velocity, assignments, and exam attempts.
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
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
              No courses assigned to your faculty profile yet.
            </p>
            <p className="text-slate-400 max-w-sm mx-auto">
              The academy administrator assigns courses from the Instructor Management console.
            </p>
          </div>
        ) : loadingActivity ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1b6b3a] border-t-transparent mx-auto mb-2"></div>
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

            {/* Enrolled Students Table for this Course (Matching Image 4) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Students Enrolled in {selectedCourse?.title || 'Course'} ({courseActivityData?.enrollments.length || 0})
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
                        const courseExam = (courseActivityData?.exams || []).find(
                          (e) => (e.course_id === selectedCourseId || e.course?.id === selectedCourseId) && e.is_published
                        );
                        const isExamCourse = Boolean(courseExam);

                        const studentAttempts = (courseActivityData?.attempts || []).filter(
                          (a) => a.student_id === enr.student_id && (!courseExam || a.exam_id === courseExam.id)
                        );
                        const passedAttempt = studentAttempts.find(
                          (a) => a.is_passed || (a.status === 'evaluated' && (a.percentage || 0) >= (courseExam?.passing_percentage || 50))
                        );
                        const latestAttempt = studentAttempts[0] || null;

                        const isEligible = isExamCourse
                          ? Boolean(passedAttempt) && ((enr.progress_percentage || 0) >= 100 || enr.is_completed)
                          : (enr.progress_percentage || 0) >= 100 || enr.is_completed;

                        return (
                          <tr key={enr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                            <td className="p-3">
                              <span className="font-bold text-slate-900 dark:text-white block">
                                {enr.student?.full_name || 'Enrolled Student'}
                              </span>
                              <span className="text-[11px] text-slate-400">{enr.student?.email}</span>
                            </td>

                            <td className="p-3">
                              <div className="flex items-center gap-2 max-w-[140px]">
                                <span className="font-bold text-xs min-w-[32px] text-slate-900 dark:text-white">
                                  {enr.progress_percentage || 0}%
                                </span>
                                <div className="flex-1">
                                  <ProgressBar
                                    value={enr.progress_percentage || 0}
                                    size="sm"
                                    variant={(enr.progress_percentage || 0) >= 100 ? 'success' : 'brand'}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {(enr.progress_percentage || 0) >= 100 ? 'Done' : 'Learning'}
                                </span>
                              </div>
                            </td>

                            <td className="p-3">
                              <span
                                className={`font-semibold text-xs ${
                                  studentSubs.length > 0 ? 'text-[#1b6b3a]' : 'text-slate-500'
                                }`}
                              >
                                {studentSubs.length} Submitted
                              </span>
                            </td>

                            <td className="p-3">
                              {studentAttempts.length > 0 ? (
                                <div>
                                  <span
                                    className={`font-bold block ${
                                      passedAttempt
                                        ? 'text-emerald-600'
                                        : (latestAttempt?.percentage || 0) > 0
                                        ? 'text-amber-600'
                                        : 'text-rose-600'
                                    }`}
                                  >
                                    {latestAttempt?.score ?? 0} / {latestAttempt?.total_marks ?? 20} (
                                    {Math.round(latestAttempt?.percentage || 0)}%)
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {passedAttempt ? 'Passed Benchmark' : 'Needs Retake'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">Pending Attempt</span>
                              )}
                            </td>

                            <td className="p-3">
                              {isEligible ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Recommended for Certification
                                </span>
                              ) : isExamCourse && !passedAttempt && (enr.progress_percentage || 0) >= 100 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                                  Final Exam Pending
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  Requirements Pending
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-slate-400 text-xs whitespace-nowrap">
                              {enr.enrolled_at ? formatDate(enr.enrolled_at) : 'Active'}
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

      {/* Assigned Courses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#1b6b3a]" />
            <span>My Assigned Courses</span>
          </h2>
          <Link
            to="/instructor/courses"
            className="text-xs font-bold text-[#1b6b3a] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-40 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card className="p-12 text-center text-xs text-slate-500 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
              No courses assigned yet.
            </p>
            <p className="text-slate-400 max-w-sm mx-auto">
              The academy administrator will assign your courses. Once assigned, they will appear here.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {course.category || 'Technical Workshop'}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {course.modules_count || 0} Modules • {course.sessions_count || 0} Sessions
                    </span>
                  </div>

                  <h3 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {course.description || 'No course description available.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{course.duration || '40 Hours'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={`/instructor/examinations?courseId=${course.id}`}>
                      <Button variant="outline" size="sm" className="text-xs py-1 px-2.5">
                        Exams
                      </Button>
                    </Link>
                    <Link to={`/instructor/materials?courseId=${course.id}`}>
                      <Button variant="outline" size="sm" className="text-xs py-1 px-2.5">
                        Materials
                      </Button>
                    </Link>
                    <Link to={`/instructor/courses`}>
                      <Button variant="primary" size="sm" className="text-xs py-1 px-3">
                        Curriculum
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <Link to="/instructor/assignments" className="group">
          <Card className="p-5 hover:border-[#1b6b3a] transition-all group-hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center font-bold">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Assignments & Grading</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Review code and project submissions</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/instructor/examinations" className="group">
          <Card className="p-5 hover:border-[#1b6b3a] transition-all group-hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Examinations (10-Question)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Author proctored technical exams</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/instructor/attendance" className="group">
          <Card className="p-5 hover:border-[#1b6b3a] transition-all group-hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Attendance Records</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Mark and track session presence</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
};
