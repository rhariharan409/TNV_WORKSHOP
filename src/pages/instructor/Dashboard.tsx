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
import { Modal } from '../../components/ui/Modal';
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
  AlertCircle,
  UserCheck,
  CheckCircle2,
  Plus,
  Send,
} from 'lucide-react';

interface CourseCardStats {
  studentCount: number;
  pendingSubmissions: number;
}

export const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseStats, setCourseStats] = useState<Record<string, CourseCardStats>>({});
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

  // Course Assignment Request modal state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [publishedCourses, setPublishedCourses] = useState<Course[]>([]);
  const [selectedRequestCourseId, setSelectedRequestCourseId] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState<string | null>(null);
  const [requestErrorMessage, setRequestErrorMessage] = useState<string | null>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

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

      // Fetch enrollments, assignments, and submissions to compute per-course stats
      let allEnrollments: CourseEnrollment[] = [];
      let allSubmissions: AssignmentSubmission[] = [];
      let allAssignments: Assignment[] = [];

      try {
        const instData = await dataProvider.getInstructorData();
        if (instData) {
          allEnrollments = instData.enrollments || [];
          allSubmissions = instData.submissions || [];
          allAssignments = instData.assignments || [];
        }
      } catch {}

      if (allEnrollments.length === 0 && allSubmissions.length === 0) {
        try {
          const [enrs, subs, asns] = await Promise.all([
            dataProvider.getCourseEnrollments(),
            dataProvider.getAssignmentSubmissions(),
            dataProvider.getAssignments(),
          ]);
          allEnrollments = enrs;
          allSubmissions = subs;
          allAssignments = asns;
        } catch {}
      }

      const statsMap: Record<string, CourseCardStats> = {};
      assignedCourses.forEach((c) => {
        const courseEnrs = allEnrollments.filter((e) => e.course_id === c.id);
        const uniqueStudents = new Set(courseEnrs.map((e) => e.student_id).filter(Boolean));
        const studentCount = uniqueStudents.size || courseEnrs.length;

        const courseAsnIds = new Set(
          allAssignments.filter((a) => a.course_id === c.id).map((a) => a.id)
        );
        const coursePendingSubs = allSubmissions.filter((s) => {
          const isThisCourse = s.assignment?.course_id === c.id || courseAsnIds.has(s.assignment_id);
          const isPending =
            s.status !== 'evaluated' ||
            s.marks_obtained === null ||
            s.marks_obtained === undefined;
          return isThisCourse && isPending;
        });

        statsMap[c.id] = {
          studentCount,
          pendingSubmissions: coursePendingSubs.length,
        };
      });
      setCourseStats(statsMap);

      if (assignedCourses.length === 0) {
        try {
          const myPending = await dataProvider.getCourseAssignmentRequests('pending', user.id);
          setPendingRequestsCount(myPending.length);
        } catch {}
      }
    } catch (err) {
      console.error('Error loading instructor dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRequestModal = async () => {
    setIsRequestModalOpen(true);
    setRequestErrorMessage(null);
    try {
      const allCourses = await dataProvider.getCourses();
      const pub = allCourses.filter((c) => c.is_published);
      setPublishedCourses(pub);
      if (pub.length > 0 && !selectedRequestCourseId) {
        setSelectedRequestCourseId(pub[0].id);
      }
    } catch (err) {
      console.error('Failed to load published courses for request:', err);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmittingRequest(true);
    setRequestErrorMessage(null);
    try {
      await dataProvider.createCourseAssignmentRequest({
        instructor_id: user.id,
        course_id: selectedRequestCourseId || null,
        message: requestMessage.trim(),
      });
      setIsRequestModalOpen(false);
      setRequestMessage('');
      setRequestSuccessMessage(
        'Your course assignment request has been submitted! Administrators have been notified.'
      );
      setTimeout(() => setRequestSuccessMessage(null), 5000);
      setPendingRequestsCount((prev) => prev + 1);
    } catch (err: any) {
      setRequestErrorMessage(err.message || 'Failed to submit course assignment request.');
    } finally {
      setIsSubmittingRequest(false);
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
          <Card className="p-12 text-center text-xs text-slate-500 space-y-4 rounded-2xl border-dashed border-2 border-slate-300 dark:border-slate-800">
            <BookOpen className="w-12 h-12 text-[#1b6b3a]/40 mx-auto" />
            <div className="space-y-1">
              <p className="font-extrabold text-base text-slate-900 dark:text-white">
                No Courses Assigned Yet
              </p>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                You do not have any courses assigned to your faculty profile. You can request assignment to one of our published academy courses.
              </p>
            </div>

            {requestSuccessMessage && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold max-w-md mx-auto flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{requestSuccessMessage}</span>
              </div>
            )}

            {pendingRequestsCount > 0 && !requestSuccessMessage && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>You have {pendingRequestsCount} course assignment request{pendingRequestsCount > 1 ? 's' : ''} pending review</span>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleOpenRequestModal}
                leftIcon={<Plus className="w-4 h-4" />}
                className="font-bold shadow-md shadow-emerald-900/10"
              >
                Request Course Assignment
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const stats = courseStats[course.id] || { studentCount: 0, pendingSubmissions: 0 };
              return (
                <Link
                  key={course.id}
                  to={`/instructor/courses/${course.id}`}
                  className="block group"
                >
                  <Card className="p-6 h-full flex flex-col justify-between border border-slate-200 dark:border-slate-800 hover:border-[#1b6b3a] dark:hover:border-emerald-500 transition-all hover:shadow-lg cursor-pointer rounded-2xl bg-white dark:bg-slate-900 group">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {course.category || 'Course'}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            course.is_published
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {course.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-[#1b6b3a] dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {course.title}
                      </h3>

                      {course.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {course.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                            <Users className="w-4 h-4 text-[#1b6b3a]" />
                            <span className="font-medium">Students</span>
                          </div>
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            {stats.studentCount}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <span className="font-medium">Pending Submissions</span>
                          </div>
                          <span
                            className={`text-2xl font-black ${
                              stats.pendingSubmissions > 0
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {stats.pendingSubmissions}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold text-[#1b6b3a] dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                        <span>Manage Course & Tabs</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
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
      {/* Course Assignment Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Request Course Assignment"
        description="Select a published course curriculum and submit an assignment request to academy administrators."
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4 pt-2">
          {requestErrorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{requestErrorMessage}</span>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Published Course <span className="text-rose-500">*</span>
            </label>
            {publishedCourses.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">Loading published courses...</p>
            ) : (
              <Select
                value={selectedRequestCourseId}
                onChange={(e) => setSelectedRequestCourseId(e.target.value)}
                options={publishedCourses.map((c) => ({
                  value: c.id,
                  label: `${c.title} (${c.category || 'Course'} • ${c.duration || '6 Weeks'})`,
                }))}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Message to Academy Admin (Optional)
            </label>
            <textarea
              rows={4}
              placeholder="Explain your domain experience, teaching availability, or reasons for requesting this track..."
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmittingRequest || !selectedRequestCourseId}
              leftIcon={<Send className="w-4 h-4" />}
            >
              {isSubmittingRequest ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
