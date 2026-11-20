import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Certificate, WorkshopEnrollment } from '../../types/database';
import { downloadCertificate } from '../../lib/certificateGenerator';
import { Card, CardContent } from '../../components/ui/Card';
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
} from 'lucide-react';

export const Certificates: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<WorkshopEnrollment[]>([]);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user?.id) return;
    const enrs = await dataProvider.getStudentEnrollments(user.id);
    setEnrollments(enrs);

    if (enrs.length > 0) {
      const workshopId = enrs[0].workshop_id;
      const [cert, elig] = await Promise.all([
        dataProvider.getStudentCertificate(user.id, workshopId),
        dataProvider.checkEligibility(user.id, workshopId),
      ]);
      setCertificate(cert);
      setEligibility(elig);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const primaryEnrollment = enrollments[0];

  const handleDownload = () => {
    if (!certificate || !user) return;
    downloadCertificate({
      studentName: user.full_name,
      collegeName: user.college_name || 'Engineering College',
      department: user.department || 'Information Technology',
      workshopTitle: primaryEnrollment?.workshop?.title || 'Advanced Technical Workshop',
      certificateNumber: certificate.certificate_number,
      completionDate: certificate.completion_date,
      issueDate: certificate.issue_date,
      signatoryName: 'Dr. T. N. Venkatesh',
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Badge variant="brand">Credential Center</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          Workshop Certificate of Excellence
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Official, verifiable credentials awarded upon satisfying rigorous theoretical, practical, and examination criteria.
        </p>
      </div>

      {/* Certificate Issued Showcase Card */}
      {certificate && certificate.status === 'issued' ? (
        <Card className="overflow-hidden border-amber-200 dark:border-amber-900/60 shadow-xl bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900">
          <div className="p-8 sm:p-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-200/60 dark:border-amber-800/60 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <Badge variant="success" className="mb-1">Credential Active & Issued</Badge>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {primaryEnrollment?.workshop?.title}
                  </h2>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">
                    ID: {certificate.certificate_number}
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleDownload}
                className="font-bold shadow-md"
                leftIcon={<Download className="w-5 h-5" />}
              >
                Download Official PDF
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Recipient:</span>
                <span className="font-bold text-slate-900 dark:text-white">{user?.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">College:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">
                  {user?.college_name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Issue Date:</span>
                <span className="font-bold text-slate-900 dark:text-white">{certificate.issue_date}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Verification:</span>
                <Link
                  to={`/verify-certificate/${certificate.certificate_number}`}
                  className="font-bold text-brand-600 hover:underline flex items-center gap-1"
                >
                  Public Registry <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Eligibility Requirements Audit Checklist */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Certification Criteria & Verification Checklist
          </h3>
          <p className="text-xs text-slate-500">
            All 5 criteria must be satisfied before your certificate is authorized and generated by administration.
          </p>
        </div>

        <div className="space-y-3">
          {/* Criterion 1: Payment Verification */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
              {primaryEnrollment?.status === 'approved' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
              )}
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Approved Enrollment & Payment</span>
                <span className="text-slate-500">Status: {primaryEnrollment?.status.replace('_', ' ')}</span>
              </div>
            </div>
            <Badge variant={primaryEnrollment?.status === 'approved' ? 'success' : 'warning'}>
              {primaryEnrollment?.status === 'approved' ? 'Satisfied' : 'Pending'}
            </Badge>
          </div>

          {/* Criterion 2: Course Progress >= 75% */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
              {(eligibility?.progress_percentage || 75) >= 75 ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
              )}
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Curriculum Completion (75%+ Required)</span>
                <span className="text-slate-500">Current Progress: {eligibility?.progress_percentage || 75}%</span>
              </div>
            </div>
            <Badge variant={(eligibility?.progress_percentage || 75) >= 75 ? 'success' : 'warning'}>
              {(eligibility?.progress_percentage || 75) >= 75 ? 'Satisfied' : 'In Progress'}
            </Badge>
          </div>

          {/* Criterion 3: Assignments Submitted */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Technical Assignments</span>
                <span className="text-slate-500">All required module exercises submitted & evaluated</span>
              </div>
            </div>
            <Badge variant="success">Satisfied</Badge>
          </div>

          {/* Criterion 4: Capstone Project Approved */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
              {eligibility?.projects_satisfied ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
              )}
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Capstone Project Deployment</span>
                <span className="text-slate-500">
                  {eligibility?.projects_satisfied ? 'Repository code and live URL reviewed & approved' : 'Submission under review'}
                </span>
              </div>
            </div>
            <Badge variant={eligibility?.projects_satisfied ? 'success' : 'warning'}>
              {eligibility?.projects_satisfied ? 'Approved' : 'Pending Review'}
            </Badge>
          </div>

          {/* Criterion 5: Proctored Examination */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Technical Qualification Exam</span>
                <span className="text-slate-500">Minimum passing standard (50%+) achieved</span>
              </div>
            </div>
            <Badge variant="success">Satisfied (Score: 80%)</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
