import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import {
  Course,
  CourseEnrollment,
  LiveSession,
  Examination,
  StudentExamCardData,
  Notification,
  AdminSettings,
  SessionProgress,
} from '../../types/database';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { downloadCertificate } from '../../lib/certificateGenerator';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  BookOpen,
  FileCheck2,
  FolderGit2,
  GraduationCap,
  Award,
  Video,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Compass,
  MessageCircle,
  Lock,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [publishedCourses, setPublishedCourses] = useState<Course[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [studentExamCards, setStudentExamCards] = useState<StudentExamCardData[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [metrics, setMetrics] = useState<{
    totalEnrolledCourses: number;
    inProgressCourses: number;
    completedCourses: number;
    overallProgress: number;
    completedSessions: number;
    pendingAssignments: number;
    upcomingExams: number;
    certificatesEarned: number;
    unreadNotifications: number;
  }>({
    totalEnrolledCourses: 0,
    inProgressCourses: 0,
    completedCourses: 0,
    overallProgress: 0,
    completedSessions: 0,
    pendingAssignments: 0,
    upcomingExams: 0,
    certificatesEarned: 0,
    unreadNotifications: 0,
  });
  const [certEligibility, setCertEligibility] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const [
        courseEnrs,
        pubCourses,
        sessionList,
        examList,
        notifList,
        appSettings,
        dashMetrics,
        examCardsData,
      ] = await Promise.all([
        dataProvider.getStudentCourseEnrollments(user.id),
        dataProvider.getCourses({ publishedOnly: true }),
        dataProvider.getLiveSessions(),
        dataProvider.getExaminations(),
        dataProvider.getNotifications(user.id),
        dataProvider.getAdminSettings(),
        dataProvider.getStudentDashboardMetrics(user.id),
        dataProvider.getExamsForStudent(user.id).catch(() => []),
      ]);

      setCourseEnrollments(courseEnrs);
      setPublishedCourses(pubCourses);
      setLiveSessions(sessionList);
      setExams(examList);
      setStudentExamCards(examCardsData || []);
      setNotifications(notifList);
      setSettings(appSettings);
      setMetrics(dashMetrics);
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleDownloadCert = () => {
    if (!certEligibility?.existing_certificate || !user) return;
    const cert = certEligibility.existing_certificate;
    downloadCertificate({
      studentName: user.full_name,
      collegeName: user.college_name || 'Engineering College',
      department: user.department || 'Information Technology',
      workshopTitle: 'TNV Engineering Academy Program',
      certificateNumber: cert.certificate_number,
      completionDate: cert.completion_date,
      issueDate: cert.issue_date,
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. WELCOME & ACADEMIC HEADER (Matching Referral Image) */}
      <div className="rounded-3xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1b6b3a] text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md ring-4 ring-[#1b6b3a]/20">
            {user?.full_name?.charAt(0).toUpperCase() || 'S'}
          </div>

          <div className="space-y-1">
            <p className="font-tamil font-bold text-sm text-[#1b6b3a] dark:text-emerald-400">
              வணக்கம், {user?.full_name || 'Student'}!
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Welcome, {user?.full_name || 'Student'}!
            </h1>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {user?.email} • {user?.college_name || 'Engineering Institution'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-[#1b6b3a]"></span>
                Enrolled Student
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                Academic Year 2026-2027
              </span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link to="/student/available-courses">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Compass className="w-4 h-4 text-[#1b6b3a]" />}
              className="border-slate-300 hover:border-[#1b6b3a]"
            >
              Explore Courses
            </Button>
          </Link>
          <a
            href={settings?.whatsapp_group_url || 'https://chat.whatsapp.com'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#f5c518] hover:bg-[#e6b800] text-slate-950 font-bold text-xs shadow-sm transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Join Community</span>
          </a>
        </div>
      </div>

      {/* 2. VERIFICATION & CURRICULUM MILESTONE STEPS (Matching Referral Image) */}
      <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
            <span>Your Academic Milestone Progress</span>
          </h2>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300">
            Active Progress
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            {
              name: 'Enrolled Courses',
              status: `${metrics.totalEnrolledCourses} Active`,
              done: metrics.totalEnrolledCourses > 0,
            },
            {
              name: 'Live Attendance',
              status: `${metrics.completedSessions} Attended`,
              done: metrics.completedSessions > 0,
            },
            {
              name: 'Assignments',
              status: metrics.pendingAssignments === 0 && metrics.totalEnrolledCourses > 0 ? 'All Completed' : `${metrics.pendingAssignments} Pending`,
              done: metrics.pendingAssignments === 0 && metrics.totalEnrolledCourses > 0,
            },
            {
              name: 'Technical Exam',
              status: metrics.upcomingExams === 0 && metrics.totalEnrolledCourses > 0 ? 'Passed' : `${metrics.upcomingExams} Remaining`,
              done: metrics.upcomingExams === 0 && metrics.totalEnrolledCourses > 0,
            },
            {
              name: 'Verified Certificate',
              status: metrics.certificatesEarned > 0 ? 'Issued & Verified' : 'In Progress',
              done: metrics.certificatesEarned > 0,
            },
          ].map((step, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center space-y-2 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 transition-all hover:bg-emerald-50/30"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-transform',
                  step.done
                    ? 'bg-[#1b6b3a] text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                )}
              >
                {step.done ? <CheckCircle2 className="w-5 h-5 text-white" /> : idx + 1}
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{step.name}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{step.status}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* 3. DYNAMIC METRICS WITH GREEN & YELLOW ACCENT BORDERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card accent="green" className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Enrolled Courses
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#1b6b3a] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.totalEnrolledCourses}
          </div>
          <p className="text-xs text-slate-500">
            {metrics.inProgressCourses} in progress • {metrics.completedCourses} completed
          </p>
        </Card>

        <Card accent="yellow" className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Overall Progress
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.overallProgress}%
          </div>
          <ProgressBar value={metrics.overallProgress} size="sm" variant={metrics.overallProgress === 100 ? 'success' : 'brand'} />
          <p className="text-[11px] text-slate-400">{metrics.completedSessions} sessions completed</p>
        </Card>

        <Card accent="green" className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Pending Tasks
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#1b6b3a] flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.pendingAssignments}
          </div>
          <p className="text-xs text-slate-500">
            {metrics.upcomingExams} upcoming exam{metrics.upcomingExams === 1 ? '' : 's'}
          </p>
        </Card>

        <Card accent="yellow" className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Certificates
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.certificatesEarned}
          </div>
          <p className="text-xs text-slate-500">
            {metrics.certificatesEarned > 0 ? (
              <Link to="/student/certificates" className="text-[#1b6b3a] font-bold hover:underline">
                View Credentials →
              </Link>
            ) : (
              'Complete all sessions to unlock'
            )}
          </p>
        </Card>
      </div>

      {/* 4. ACTIVE ENROLLED COURSES SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Courses</h2>
            <Link to="/student/my-courses" className="text-xs font-semibold text-brand-600 hover:underline">
              View All Enrolled Courses ({courseEnrollments.length})
            </Link>
          </div>

          {courseEnrollments.length > 0 ? (
            <div className="space-y-4">
              {courseEnrollments.slice(0, 3).map((enr) => {
                const c = (Array.isArray(enr.course) ? enr.course[0] : enr.course) || {};
                const courseId = c?.id || enr.course_id;
                const courseTitle = c?.title || (enr as any).course_title || 'Enrolled Course';
                const progress = enr.progress_percentage || 0;
                return (
                  <Card key={enr.id} className="p-5 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300 uppercase">
                            {c?.category || 'Development'}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 capitalize">
                            {c?.level || 'All Levels'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {courseTitle}
                        </h3>
                      </div>
                      <Link to={`/student/courses/${courseId}`}>
                        <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                          Continue Course
                        </Button>
                      </Link>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">Course Progress</span>
                        <span className="font-bold text-brand-600 dark:text-brand-400">
                          {progress}% • {enr.completed_sessions || 0}/{enr.total_sessions || 0} Sessions
                        </span>
                      </div>
                      <ProgressBar value={progress} size="sm" />
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <Compass className="w-5 h-5 text-brand-green" />
                      Published Technical Courses ({publishedCourses.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      You are not enrolled in any courses yet. Explore our published courses and begin your learning path:
                    </p>
                  </div>
                  <Link to="/student/available-courses">
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      View Full Directory
                    </Button>
                  </Link>
                </div>

                {publishedCourses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {publishedCourses.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-brand-green/60 bg-slate-50/50 dark:bg-slate-800/40 transition-all flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-green-tint text-brand-green dark:bg-brand-950/50 dark:text-brand-300 uppercase">
                            Published Track
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{c.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {c.description || 'Hands-on practical course curriculum.'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                          <span className="text-[11px] text-slate-400 font-medium">{c.duration || 'Flexible'}</span>
                          <Link to="/student/available-courses">
                            <Button variant="primary" size="sm" className="text-xs font-bold">
                              Enroll Now
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No published courses available at this moment.</p>
                )}
              </Card>
            </div>
          )}

          {/* Upcoming Live Sessions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Video className="w-5 h-5 text-brand-600" />
                <span>Upcoming Live Masterclasses</span>
              </h2>
              <Link to="/student/live-sessions" className="text-xs font-semibold text-brand-600 hover:underline">
                View Schedule
              </Link>
            </div>

            <div className="space-y-3">
              {liveSessions.length === 0 ? (
                <Card className="p-5 text-center text-xs text-slate-400">
                  No upcoming live masterclasses scheduled.
                </Card>
              ) : (
                liveSessions.slice(0, 2).map((ls) => {
                  let isLive = false;
                  let isEnded = false;
                  try {
                    const now = new Date();
                    const [y, m, d] = ls.scheduled_date.split('-').map(Number);
                    const [sh, sm] = ls.start_time.split(':').map(Number);
                    const [eh, em] = ls.end_time.split(':').map(Number);
                    const start = new Date(y, m - 1, d, sh, sm, 0);
                    const end = new Date(y, m - 1, d, eh, em, 0);
                    const accessOpen = new Date(start.getTime() - 10 * 60 * 1000);
                    if (now >= accessOpen && now <= end) isLive = true;
                    if (now > end) isEnded = true;
                  } catch {}

                  return (
                    <div
                      key={ls.id}
                      className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition-all ${
                        isLive
                          ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {isLive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                              LIVE NOW
                            </span>
                          ) : isEnded ? (
                            <span className="text-[10px] font-bold text-slate-400">Ended</span>
                          ) : (
                            <span className="text-[10px] font-bold text-brand-600">Upcoming</span>
                          )}
                          <span className="text-[10px] font-semibold text-slate-400">
                            {ls.course?.title || 'Course Masterclass'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ls.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Date: {formatDate(ls.scheduled_date)} • Time: {ls.start_time} - {ls.end_time} • Platform: {ls.platform}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isLive ? (
                          <a href={ls.meeting_link} target="_blank" rel="noreferrer">
                            <Button variant="primary" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                              Join Live Class
                            </Button>
                          </a>
                        ) : isEnded ? (
                          <Button variant="outline" size="sm" disabled className="opacity-60 cursor-not-allowed text-xs">
                            Session Ended
                          </Button>
                        ) : (
                          <Link to="/student/live-sessions">
                            <Button variant="outline" size="sm" leftIcon={<Lock className="w-3 h-3" />} className="text-xs">
                              Opens at {ls.start_time}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 5. SIDEBAR: NOTIFICATIONS & EXAMINATIONS */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Examination Box */}
          <Card className="p-5 space-y-4 border-brand-200/80 bg-brand-50/20 dark:border-brand-900/60 dark:bg-brand-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 font-bold text-sm">
                <GraduationCap className="w-5 h-5" />
                <span>Technical Examination</span>
              </div>
              {(() => {
                const targetCard = studentExamCards.length > 0 ? studentExamCards[0] : null;
                const isPassed = targetCard?.status === 'passed' || targetCard?.latestAttempt?.is_passed;
                if (isPassed) {
                  return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Already Submitted
                    </span>
                  );
                }
                if (targetCard?.status === 'no_attempts_left') {
                  return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      Already Submitted
                    </span>
                  );
                }
                return null;
              })()}
            </div>

            {(studentExamCards.length > 0 || exams.length > 0) ? (() => {
              const cardData = studentExamCards.length > 0 ? studentExamCards[0] : null;
              const currentExam = cardData ? cardData.exam : exams[0];
              const isPassed = cardData?.status === 'passed' || cardData?.latestAttempt?.is_passed;
              const isNoAttempts = cardData?.status === 'no_attempts_left';
              const isInProgress = cardData?.status === 'in_progress';
              const isFailedRetake = cardData?.status === 'failed_retake';
              const isLocked = cardData?.status === 'locked';

              return (
                <div className="space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{currentExam.title}</p>
                    {isPassed && (
                      <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white shrink-0">
                        Passed
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>Duration: {currentExam.duration_minutes} Mins</span>
                    <span>Passing: {currentExam.passing_marks} / {currentExam.total_marks}</span>
                  </div>

                  {/* If exam is completed successfully (Passed) -> Remove start button, show Already Submitted + View Certificate */}
                  {isPassed ? (
                    <div className="space-y-2 pt-1">
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                        <span className="text-emerald-900 dark:text-emerald-200 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          Already Submitted
                        </span>
                        {cardData?.latestAttempt && (
                          <span className="font-black text-emerald-700 dark:text-emerald-300">
                            {cardData.latestAttempt.score} / {cardData.latestAttempt.total_marks} ({cardData.latestAttempt.percentage}%)
                          </span>
                        )}
                      </div>
                      <Link to="/student/certificates" className="block">
                        <Button variant="primary" size="sm" leftIcon={<Award className="w-3.5 h-3.5" />} className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 shadow-sm">
                          View Certificate
                        </Button>
                      </Link>
                    </div>
                  ) : isNoAttempts ? (
                    /* Attempts exhausted -> Remove start button */
                    <div className="pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-600 dark:text-slate-300">
                        Already Submitted (No attempts left)
                      </div>
                    </div>
                  ) : isInProgress ? (
                    /* Not completed yet - in progress -> Clickable Resume button */
                    <Link to={`/student/examinations/${currentExam.id}`} className="block pt-1">
                      <Button variant="primary" size="sm" className="w-full font-bold bg-amber-600 hover:bg-amber-700">
                        Resume Exam
                      </Button>
                    </Link>
                  ) : isFailedRetake ? (
                    /* Not completed yet - retake available -> Clickable Retake button */
                    <Link to="/student/examinations" className="block pt-1">
                      <Button variant="primary" size="sm" className="w-full font-bold">
                        Retake Exam ({cardData?.attemptsLeft || 1} left)
                      </Button>
                    </Link>
                  ) : isLocked ? (
                    /* Not completed yet - locked by progress */
                    <Link to="/student/examinations" className="block pt-1">
                      <Button variant="outline" size="sm" disabled className="w-full font-bold">
                        Locked ({cardData?.progressPercent ?? 0}% sessions done)
                      </Button>
                    </Link>
                  ) : (
                    /* Not yet completed - Available -> Clickable Start button */
                    <Link to="/student/examinations" className="block pt-1">
                      <Button variant="primary" size="sm" className="w-full font-bold">
                        Start Proctored Exam
                      </Button>
                    </Link>
                  )}
                </div>
              );
            })() : (
              <p className="text-xs text-slate-500">No scheduled exams at this time.</p>
            )}
          </Card>

          {/* Recent Notifications */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Recent Announcements
              </h3>
              <Link to="/student/notifications" className="text-[11px] font-semibold text-brand-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No announcements yet.</p>
              ) : (
                notifications.slice(0, 4).map((n) => (
                  <div key={n.id} className="text-xs space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">{n.title}</p>
                    <p className="text-slate-500 text-[11px] leading-relaxed">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
