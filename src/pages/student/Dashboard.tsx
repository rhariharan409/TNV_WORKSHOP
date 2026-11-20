import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import {
  WorkshopEnrollment,
  Course,
  LiveSession,
  Examination,
  ProjectSubmission,
  Notification,
  AdminSettings,
} from '../../types/database';
import { formatCurrency, formatDate } from '../../lib/utils';
import { downloadCertificate } from '../../lib/certificateGenerator';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
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
  HelpCircle,
  UploadCloud,
  MessageCircle,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<WorkshopEnrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [exams, setExams] = useState<Examination[]>([]);
  const [projectSubs, setProjectSubs] = useState<ProjectSubmission[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [certEligibility, setCertEligibility] = useState<any>(null);

  // Payment Verification Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<WorkshopEnrollment | null>(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const loadData = async () => {
    if (!user?.id) return;
    const [enrList, courseList, sessionList, examList, projList, notifList, appSettings] =
      await Promise.all([
        dataProvider.getStudentEnrollments(user.id),
        dataProvider.getCourses(),
        dataProvider.getLiveSessions(),
        dataProvider.getExaminations(),
        dataProvider.getProjectSubmissions(user.id),
        dataProvider.getNotifications(user.id),
        dataProvider.getAdminSettings(),
      ]);

    setEnrollments(enrList);
    setCourses(courseList);
    setLiveSessions(sessionList);
    setExams(examList);
    setProjectSubs(projList);
    setNotifications(notifList);
    setSettings(appSettings);

    if (enrList.length > 0) {
      const elig = await dataProvider.checkEligibility(user.id, enrList[0].workshop_id);
      setCertEligibility(elig);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const primaryEnrollment = enrollments[0];
  const isApproved = primaryEnrollment?.status === 'approved';

  const handleOpenPaymentModal = (enr: WorkshopEnrollment) => {
    setSelectedEnrollment(enr);
    setTransactionRef('');
    setPaymentProofUrl('');
    setPaymentSuccess(false);
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnrollment || !transactionRef.trim() || !user) return;
    setIsSubmittingPayment(true);

    await dataProvider.submitPayment(
      selectedEnrollment.id,
      user.id,
      selectedEnrollment.workshop?.price || 4999,
      transactionRef,
      paymentProofUrl
    );

    setIsSubmittingPayment(false);
    setPaymentSuccess(true);
    await loadData();
    setTimeout(() => {
      setPaymentModalOpen(false);
    }, 1500);
  };

  const handleDownloadCert = () => {
    if (!certEligibility?.existing_certificate || !user) return;
    const cert = certEligibility.existing_certificate;
    downloadCertificate({
      studentName: user.full_name,
      collegeName: user.college_name || 'Engineering College',
      department: user.department || 'Information Technology',
      workshopTitle: primaryEnrollment?.workshop?.title || 'Advanced Technical Workshop',
      certificateNumber: cert.certificate_number,
      completionDate: cert.completion_date,
      issueDate: cert.issue_date,
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. WELCOME & ACADEMIC HEADER */}
      <div className="rounded-3xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome back, {user?.full_name}!
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              Student
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {user?.college_name || 'Institution of Technology'} • {user?.department || 'Computer Science'} • {user?.year_of_study || '3rd Year'}
          </p>
        </div>

        {/* Quick Doubts Community Link */}
        <div className="flex items-center gap-3">
          <a
            href={settings?.whatsapp_group_url || 'https://chat.whatsapp.com'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Join Workshop WhatsApp</span>
          </a>
        </div>
      </div>

      {/* 2. PAYMENT / ENROLLMENT STATUS BANNER (Critical Rule 4) */}
      {primaryEnrollment && !isApproved && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/30 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-amber-950 dark:text-amber-200">
                    Workshop Access Locked: Payment Verification Required
                  </h3>
                  <StatusBadge status={primaryEnrollment.status} />
                </div>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/80 max-w-2xl leading-relaxed">
                  Your seat for <strong>{primaryEnrollment.workshop?.title}</strong> is reserved. Protected learning modules, Google Drive video lectures, and examinations unlock once manual admin verification is complete.
                </p>
              </div>
            </div>

            {primaryEnrollment.status === 'payment_pending' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenPaymentModal(primaryEnrollment)}
                className="shrink-0"
              >
                Submit Payment Proof
              </Button>
            )}

            {primaryEnrollment.status === 'payment_verification_pending' && (
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/40 px-3 py-1.5 rounded-lg shrink-0">
                Admin Review In Progress
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. CORE METRICS & PROGRESS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Progress</span>
            <BookOpen className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {certEligibility?.progress_percentage || 75}%
          </div>
          <ProgressBar value={certEligibility?.progress_percentage || 75} size="sm" />
          <p className="text-[11px] text-slate-400">Target for certificate: 75%+</p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Assignments</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {certEligibility?.assignments_satisfied ? 'Completed' : '1 Pending'}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> High score maintained
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Capstone Project</span>
            <FolderGit2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {projectSubs.length > 0 ? projectSubs[0].status.replace('_', ' ') : 'Not Submitted'}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {projectSubs.length > 0 && projectSubs[0].marks_obtained
              ? `Score: ${projectSubs[0].marks_obtained}/100`
              : 'Deploy to GitHub & Vercel'}
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Certification</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {certEligibility?.already_issued ? 'Issued' : certEligibility?.is_eligible ? 'Eligible' : 'In Progress'}
          </div>
          {certEligibility?.already_issued ? (
            <button
              onClick={handleDownloadCert}
              className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
            >
              Download PDF ({certEligibility.existing_certificate?.certificate_number})
            </button>
          ) : (
            <p className="text-[11px] text-slate-400">Complete assignments & project to unlock</p>
          )}
        </Card>
      </div>

      {/* 4. ACTIVE ENROLLED WORKSHOP OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Workshop Learning Path</h2>
            <Link to="/student/my-courses" className="text-xs font-semibold text-brand-600 hover:underline">
              View All Courses
            </Link>
          </div>

          {primaryEnrollment ? (
            <Card className="p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Badge variant="brand" className="mb-2">Enrolled Workshop</Badge>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {primaryEnrollment.workshop?.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Instructor: {primaryEnrollment.workshop?.instructor_name} • Duration: {primaryEnrollment.workshop?.duration}
                  </p>
                </div>
                <StatusBadge status={primaryEnrollment.status} />
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Curriculum Progress</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">3 of 4 Modules Completed</span>
                </div>
                <ProgressBar value={75} size="md" />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {isApproved ? (
                  <Link to="/student/my-courses">
                    <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Continue Learning
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleOpenPaymentModal(primaryEnrollment)}
                  >
                    Submit Verification Details
                  </Button>
                )}

                <Link to="/student/assignments">
                  <Button variant="outline" size="md">
                    Assignments
                  </Button>
                </Link>

                <Link to="/student/projects">
                  <Button variant="outline" size="md">
                    Capstone Project
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center space-y-3">
              <p className="text-sm text-slate-500">You are not enrolled in any workshop yet.</p>
              <Link to="/workshops">
                <Button variant="primary" size="sm">Explore Catalog</Button>
              </Link>
            </Card>
          )}

          {/* Upcoming Live Sessions */}
          <div className="space-y-4 pt-4">
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
              {liveSessions.slice(0, 2).map((ls) => (
                <div
                  key={ls.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ls.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Date: {formatDate(ls.scheduled_date)} • Time: {ls.start_time} - {ls.end_time} • Platform: {ls.platform}
                    </p>
                  </div>
                  {isApproved ? (
                    <a href={ls.meeting_link} target="_blank" rel="noreferrer">
                      <Button variant="primary" size="sm" rightIcon={<Video className="w-3.5 h-3.5" />}>
                        Join Meeting
                      </Button>
                    </a>
                  ) : (
                    <span className="text-xs text-amber-600 font-medium">Unlocks upon approval</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. SIDEBAR: NOTIFICATIONS & EXAMINATIONS */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Examination Box */}
          <Card className="p-5 space-y-4 border-brand-200/80 bg-brand-50/20 dark:border-brand-900/60 dark:bg-brand-950/20">
            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 font-bold text-sm">
              <GraduationCap className="w-5 h-5" />
              <span>Technical Examination</span>
            </div>

            {exams.length > 0 ? (
              <div className="space-y-3 text-xs">
                <p className="font-bold text-slate-900 dark:text-white text-sm">{exams[0].title}</p>
                <div className="flex justify-between text-slate-500">
                  <span>Duration: {exams[0].duration_minutes} Mins</span>
                  <span>Passing: {exams[0].passing_marks} / {exams[0].total_marks}</span>
                </div>
                {isApproved ? (
                  <Link to={`/student/examinations/${exams[0].id}`} className="block pt-1">
                    <Button variant="primary" size="sm" className="w-full font-bold">
                      Start Proctored Exam
                    </Button>
                  </Link>
                ) : (
                  <p className="text-amber-600 text-[11px] font-semibold">Locked until payment verified</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No scheduled exams at this time.</p>
            )}
          </Card>

          {/* Recent Notifications */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Recent Notifications
              </h3>
              <Link to="/student/notifications" className="text-[11px] font-semibold text-brand-600 hover:underline">
                All
              </Link>
            </div>

            <div className="space-y-3">
              {notifications.slice(0, 4).map((n) => (
                <div key={n.id} className="text-xs space-y-1">
                  <p className="font-bold text-slate-900 dark:text-white">{n.title}</p>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* 6. PAYMENT VERIFICATION MODAL */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Submit Payment Verification"
        description="Submit your transaction reference for administrator verification"
        maxWidth="md"
      >
        {paymentSuccess ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-base text-slate-900 dark:text-white">Proof Submitted Successfully</h4>
            <p className="text-xs text-slate-500">
              Your transaction has been submitted to the admin team. Once approved, your workshop resources will unlock automatically.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Workshop:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                  {selectedEnrollment?.workshop?.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payable Amount:</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">
                  {formatCurrency(selectedEnrollment?.workshop?.price || 4999)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Official UPI ID:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {settings?.payment_upi_id || 'tnvworkshop@okhdfcbank'}
                </span>
              </div>
            </div>

            <Input
              label="UPI Transaction ID / UTR / Reference No. *"
              placeholder="e.g. 408819283749"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              helperText="12-digit UPI reference number from your GPay, PhonePe, or Banking app"
              required
            />

            <Input
              label="Payment Screenshot URL (Optional)"
              placeholder="e.g. https://drive.google.com/file/d/..."
              value={paymentProofUrl}
              onChange={(e) => setPaymentProofUrl(e.target.value)}
              helperText="Optional link to screenshot or receipt image"
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingPayment}>
                Submit for Verification
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
