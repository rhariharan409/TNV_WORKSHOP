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
          return {
            courseId: enr.course_id,
            courseTitle: enr.course?.title || 'Course',
            ...res,
          };
        } catch {
          return null;
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
    const title = cert.course?.title || cert.workshop?.title || 'Technical Certification Program';
    downloadCertificate({
      studentName: user.full_name,
      collegeName: user.college_name || 'Engineering College',
      department: user.department || 'Information Technology',
      workshopTitle: title,
      certificateNumber: cert.certificate_number,
      completionDate: cert.completion_date,
      issueDate: cert.issue_date,
      signatoryName: 'Thamilaran',
      signatoryTitle: 'Program Director & Chief Architect',
    });
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-semibold uppercase">Verifying Certificate Records...</p>
      </div>
    );
  }

  const issuedCerts = certificates.filter((c) => c.status === 'issued');

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Badge variant="brand">Credential Center</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          Certificates & Official Credentials
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Official, cryptographically verifiable credentials awarded upon satisfying theoretical, practical, and examination criteria.
        </p>
      </div>

      {/* 1. ISSUED CERTIFICATES SHOWCASE */}
      {issuedCerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Earned Credentials ({issuedCerts.length})</span>
          </h2>

          <div className="grid grid-cols-1 gap-6">
            {issuedCerts.map((cert) => {
              const title = cert.course?.title || cert.workshop?.title || 'Specialized Technical Certification';
              return (
                <Card
                  key={cert.id}
                  className="overflow-hidden border-amber-200 dark:border-amber-900/60 shadow-md bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900"
                >
                  <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 dark:border-amber-800/60 pb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                          <Award className="w-7 h-7" />
                        </div>
                        <div>
                          <Badge variant="success" className="mb-1">Verified & Active</Badge>
                          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                            {title}
                          </h3>
                          <p className="text-xs font-mono text-slate-500 mt-0.5">
                            ID: {cert.certificate_number}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => handleDownload(cert)}
                          className="font-bold shadow-sm"
                          leftIcon={<Download className="w-4 h-4" />}
                        >
                          Download PDF
                        </Button>
                        <Link
                          to={`/verify-certificate/${cert.certificate_number}`}
                          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Public Verification"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Recipient:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{user?.full_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Institution:</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate block">
                          {user?.college_name || 'Institution of Technology'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Issue Date:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{cert.issue_date}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Registry Status:</span>
                        <span className="font-bold text-emerald-600 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Authenticated
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. COURSE CERTIFICATE ELIGIBILITY AUDIT */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-brand-600" />
          <span>Course Certification Eligibility</span>
        </h2>

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
                <Card key={elig.courseId} className="p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                        Course Certification Track
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                        {elig.courseTitle}
                      </h3>
                    </div>

                    <div>
                      {elig.already_issued ? (
                        <Badge variant="success">Certificate Issued</Badge>
                      ) : elig.is_eligible ? (
                        <Badge variant="brand" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                          Eligible — Pending Admin Issuance
                        </Badge>
                      ) : (
                        <Badge variant="outline">In Progress</Badge>
                      )}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Sessions */}
                    <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">1. All Sessions</span>
                        {elig.sessions_completed ? (
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

                  <div className="flex items-center justify-between pt-1">
                    <Link to={`/student/courses/${elig.courseId}`}>
                      <Button variant="outline" size="sm">
                        Go to Course Learning
                      </Button>
                    </Link>

                    {elig.is_eligible && !elig.already_issued && (
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        All requirements satisfied! Admin will verify and issue your certificate soon.
                      </p>
                    )}
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
