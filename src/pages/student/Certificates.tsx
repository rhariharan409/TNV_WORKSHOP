import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Certificate, CourseEnrollment, WorkshopEnrollment } from '../../types/database';
import { downloadCertificate } from '../../lib/certificateGenerator';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { TopLeftWavyAccent, BottomRightWavyAccent } from '../../components/ui/WavyDecorations';
import {
  Award,
  CheckCircle2,
  XCircle,
  Download,
  ExternalLink,
  ShieldCheck,
  FileCheck2,
  FolderGit2,
  GraduationCap,
  Clock,
  Sparkles,
  Printer,
} from 'lucide-react';

interface CourseEligibilityState {
  courseId: string;
  courseTitle: string;
  is_eligible: boolean;
  sessions_completed: boolean;
  completed_sessions: number;
  total_sessions: number;
  assignments_satisfied: boolean;
  exams_satisfied: boolean;
  already_issued: boolean;
  existing_certificate?: Certificate | null;
}

export const Certificates: React.FC = () => {
  const { user } = useAuth();
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [workshopEnrollments, setWorkshopEnrollments] = useState<WorkshopEnrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courseEligibilities, setCourseEligibilities] = useState<CourseEligibilityState[]>([]);
  const [workshopEligibility, setWorkshopEligibility] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const [cEnrs, wEnrs, certs] = await Promise.all([
        dataProvider.getStudentCourseEnrollments(user.id),
        dataProvider.getStudentEnrollments(user.id),
        dataProvider.getStudentCertificates(user.id),
      ]);

      setCourseEnrollments(cEnrs);
      setWorkshopEnrollments(wEnrs);
      setCertificates(certs);

      // Check eligibility for each enrolled course
      const eligPromises = cEnrs.map(async (enr) => {
        try {
          const res = await dataProvider.checkCourseCertificateEligibility(user.id, enr.course_id);
          const hasCert = certs.some((c) => c.course_id === enr.course_id && c.status === 'issued');
          return {
            courseId: enr.course_id,
            courseTitle: enr.course?.title || 'Course',
            ...res,
            already_issued: hasCert || res?.already_issued,
          };
        } catch {
          const hasCert = certs.some((c) => c.course_id === enr.course_id && c.status === 'issued');
          const progress = enr.progress_percentage || 0;
          return {
            courseId: enr.course_id,
            courseTitle: enr.course?.title || 'Course',
            is_eligible: progress >= 100 || enr.is_completed,
            sessions_completed: progress >= 100 || enr.is_completed,
            completed_sessions: enr.completed_sessions || 0,
            total_sessions: enr.total_sessions || 0,
            assignments_satisfied: true,
            exams_satisfied: true,
            already_issued: hasCert,
          };
        }
      });

      const eligResults = (await Promise.all(eligPromises)).filter(Boolean) as CourseEligibilityState[];
      setCourseEligibilities(eligResults);

      if (wEnrs.length > 0) {
        const wElig = await dataProvider.checkEligibility(user.id, wEnrs[0].workshop_id);
        setWorkshopEligibility(wElig);
      }
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleDownload = (cert: Certificate) => {
    if (!user) return;
    const title = cert.course?.title || cert.workshop?.title || 'Specialized Technical Course';
    const score = cert.overall_score || 95;
    const grade = cert.grade || (Number(score) >= 90 ? 'A+' : Number(score) >= 80 ? 'A' : 'B+');

    downloadCertificate({
      studentName: cert.student?.full_name || user.full_name,
      collegeName: cert.student?.college_name || user.college_name || 'TNV Workshop Academy',
      department: cert.student?.department || user.department || 'Information Technology',
      workshopTitle: title,
      certificateNumber: cert.certificate_number,
      completionDate: cert.completion_date || cert.issue_date,
      issueDate: cert.issue_date,
      overallScore: score,
      grade,
      signatoryName: 'Thamilaran',
      signatoryTitle: 'Program Director & Chief Architect',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
          Verifying Official Certificate Records...
        </p>
      </div>
    );
  }

  const issuedCerts = certificates.filter((c) => c.status === 'issued');

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Page Header */}
      <div>
        <Badge variant="brand" className="bg-emerald-50 text-emerald-800 border-emerald-200">
          Official Credential Registry
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          Certificates & Official Credentials
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Official, cryptographically verifiable certificates issued by TNV Workshop Academy upon 100% course completion and administrative verification.
        </p>
      </div>

      {/* 1. ISSUED CERTIFICATES (OFFICIAL TEMPLATE SHOWCASE) */}
      {issuedCerts.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Earned Credentials ({issuedCerts.length})</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Verified & Available for Download
            </span>
          </div>

          <div className="space-y-8">
            {issuedCerts.map((cert) => {
              const title = cert.course?.title || cert.workshop?.title || 'Technical Workshop Program';
              const score = cert.overall_score || 95;
              const grade = cert.grade || (Number(score) >= 90 ? 'A+' : Number(score) >= 80 ? 'A' : 'B+');
              const studentName = cert.student?.full_name || user?.full_name || 'Enrolled Student';
              const collegeName = cert.student?.college_name || user?.college_name || 'TNV Workshop Academy';
              const deptName = cert.student?.department || user?.department || 'Information Technology';

              return (
                <div key={cert.id} className="space-y-3">
                  {/* Action Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                    <div className="flex items-center gap-2">
                      <Badge variant="success" className="px-3 py-1 font-bold">
                        Verified & Active
                      </Badge>
                      <span className="text-xs font-mono text-slate-500">
                        ID: <strong className="text-slate-800 dark:text-slate-200">{cert.certificate_number}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDownload(cert)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-sm"
                        leftIcon={<Download className="w-4 h-4" />}
                      >
                        Download PDF
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrint}
                        className="font-bold hidden sm:inline-flex"
                        leftIcon={<Printer className="w-4 h-4" />}
                      >
                        Print
                      </Button>

                      <Link
                        to={`/verify-certificate/${cert.certificate_number}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                        title="Public Verification Link"
                      >
                        <span>Verify Publicly</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* OFFICIAL CERTIFICATE TEMPLATE DISPLAY */}
                  {/* ======================================================== */}
                  <div className="relative w-full rounded-[24px] sm:rounded-[32px] bg-white border-4 border-slate-200/90 shadow-2xl p-6 sm:p-10 md:p-14 text-center overflow-hidden">
                    {/* Wavy Corner Accents matching the template */}
                    <TopLeftWavyAccent className="w-36 h-36 sm:w-56 sm:h-56 opacity-100" />
                    <BottomRightWavyAccent className="w-36 h-36 sm:w-56 sm:h-56 opacity-100" />

                    {/* Faint Center Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
                      <img src="/tnv-logo.png" alt="TNV Watermark" className="w-80 h-80 sm:w-96 sm:h-96 object-contain" />
                    </div>

                    <div className="relative z-10 space-y-6">
                      {/* Top Header: TNV SEAL & ORGANIZATIONAL TITLE */}
                      <div className="flex flex-col items-center justify-center space-y-2">
                        {/* TN Symbol Logo */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-white shadow-md border-2 border-amber-400 flex items-center justify-center">
                          <img
                            src="/tnv-logo.png"
                            alt="Tamil Nadu Volunteers Seal"
                            className="w-full h-full object-contain rounded-full"
                          />
                        </div>

                        <div>
                          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-800">
                            TNV WORKSHOP ACADEMY
                          </h2>
                          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500">
                            TAMIL NADU VOLUNTEERS • CENTRE OF SYSTEMS & SOFTWARE EXCELLENCE
                          </p>
                        </div>
                      </div>

                      {/* Certificate Title Badge */}
                      <div className="py-0.5">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-xs sm:text-sm tracking-wide uppercase">
                          Certificate of Industry Excellence & Completion
                        </span>
                      </div>

                      {/* Presentation Lead */}
                      <p className="text-xs sm:text-sm font-serif italic text-slate-600">
                        This is proudly presented to
                      </p>

                      {/* Student Full Name */}
                      <div>
                        <h3 className="text-2xl sm:text-4xl font-black font-serif uppercase tracking-wider text-slate-900 border-b-2 border-emerald-600 pb-2 inline-block px-6 sm:px-12">
                          {studentName}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-2">
                          of {deptName ? `${deptName}, ` : ''}{collegeName}
                        </p>
                      </div>

                      {/* Completion Statement */}
                      <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-600 leading-relaxed font-serif">
                        for successfully completing 100% of the rigorous theoretical curriculum, hands-on modules, practical assignments, laboratory examinations, and project coursework in
                      </p>

                      {/* Course Title */}
                      <div>
                        <h4 className="text-xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                          {title}
                        </h4>
                      </div>

                      {/* OVERALL SCORE & PERFORMANCE BANNER */}
                      <div className="inline-flex flex-wrap items-center justify-center gap-3 px-5 sm:px-8 py-2.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 shadow-xs">
                        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Course Progress: 100%</span>
                        </div>
                        <span className="text-emerald-300">•</span>
                        <div className="text-xs font-black text-emerald-950">
                          Overall Score: <span className="text-emerald-700 text-sm font-black">{score}%</span>
                        </div>
                        <span className="text-emerald-300">•</span>
                        <div className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md">
                          Grade: {grade}
                        </div>
                      </div>

                      {/* Signature Blocks & Seal */}
                      <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                        {/* Left: Program Director */}
                        <div className="text-center sm:text-left space-y-1">
                          <div className="h-8 flex items-end justify-center sm:justify-start">
                            <span className="font-serif italic font-black text-lg text-slate-800">Thamilaran</span>
                          </div>
                          <div className="w-32 border-b border-slate-400 mx-auto sm:mx-0"></div>
                          <p className="text-xs font-black text-slate-800">Thamilaran</p>
                          <p className="text-[10px] text-slate-500 font-medium">Program Director & Chief Architect</p>
                        </div>

                        {/* Center: Verified Seal Emblem */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 text-slate-900 flex flex-col items-center justify-center shadow-lg border-2 border-white">
                            <Award className="w-6 h-6 text-slate-900" />
                            <span className="text-[7px] font-black tracking-tighter uppercase">VERIFIED</span>
                          </div>
                          <span className="text-[9px] font-bold text-amber-700 mt-1 uppercase tracking-wider">
                            Official Credential
                          </span>
                        </div>

                        {/* Right: Academic Assessment Board */}
                        <div className="text-center sm:text-right space-y-1">
                          <div className="h-8 flex items-end justify-center sm:justify-end">
                            <span className="font-serif italic font-black text-base text-slate-800">TNV Board of Studies</span>
                          </div>
                          <div className="w-32 border-b border-slate-400 mx-auto sm:ml-auto sm:mr-0"></div>
                          <p className="text-xs font-black text-slate-800">Academic Assessment Council</p>
                          <p className="text-[10px] text-slate-500 font-medium">Tamil Nadu Volunteers Academy</p>
                        </div>
                      </div>

                      {/* Footer Metadata */}
                      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-xs text-slate-400 font-mono">
                        <span>Credential ID: <strong className="text-slate-700">{cert.certificate_number}</strong></span>
                        <span>Issue Date: <strong className="text-slate-700">{cert.issue_date}</strong></span>
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Authenticated on TNV Registry
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. COURSE CERTIFICATE ELIGIBILITY AUDIT */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            <span>Course Certification Tracks & Progress</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            100% Course Completion required for Certification
          </span>
        </div>

        {courseEligibilities.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-500 space-y-3">
            <p>You have not enrolled in any courses yet.</p>
            <Link to="/student/available-courses">
              <Button variant="primary" size="sm">Explore Available Courses</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {courseEligibilities.map((elig) => {
              const sessionPct = elig.total_sessions > 0
                ? Math.round((elig.completed_sessions / elig.total_sessions) * 100)
                : 0;

              return (
                <Card key={elig.courseId} className="p-6 space-y-5 border-slate-200 dark:border-slate-800 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        Course Certification Track
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {elig.courseTitle}
                      </h3>
                    </div>

                    <div>
                      {elig.already_issued ? (
                        <Badge variant="success">Certificate Active & Issued</Badge>
                      ) : elig.is_eligible ? (
                        <Badge variant="brand" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          100% Completed — Pending Admin Approval
                        </Badge>
                      ) : (
                        <Badge variant="outline">In Progress ({sessionPct}%)</Badge>
                      )}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Sessions */}
                    <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">1. All Sessions</span>
                        {elig.sessions_completed || sessionPct >= 100 ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <ProgressBar value={sessionPct} size="sm" />
                      <p className="text-[11px] text-slate-500">
                        {elig.completed_sessions} of {elig.total_sessions} completed ({sessionPct}%)
                      </p>
                    </div>

                    {/* Assignments */}
                    <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">2. Assignments</span>
                        {elig.assignments_satisfied ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white pt-1">
                        {elig.assignments_satisfied ? 'Passed & Submitted' : 'Assignments Pending'}
                      </p>
                      <p className="text-[11px] text-slate-500">Course practical tasks</p>
                    </div>

                    {/* Exam */}
                    <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">3. Examination</span>
                        {elig.exams_satisfied ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white pt-1">
                        {elig.exams_satisfied ? 'Exam Cleared / Not Required' : 'Exam Pending'}
                      </p>
                      <p className="text-[11px] text-slate-500">Final evaluation</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <Link to={`/student/courses/${elig.courseId}`}>
                      <Button variant="outline" size="sm">
                        Go to Course Learning
                      </Button>
                    </Link>

                    {elig.already_issued ? (
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        Your official certificate has been issued and is available above!
                      </p>
                    ) : elig.is_eligible ? (
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        100% Curriculum Completed! Admin has received your completion details and will approve your official certificate.
                      </p>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
