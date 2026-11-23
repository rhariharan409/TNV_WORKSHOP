import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Certificate, Course, CourseEnrollment, Profile, Workshop } from '../../types/database';
import { downloadCertificate } from '../../lib/certificateGenerator';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Award, Download, ShieldCheck, XCircle, CheckCircle2, Search, Filter, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminCertificates: React.FC = () => {
  const { user } = useAuth();
  const isAdminUser = user?.role === 'admin' || user?.role === 'super_admin';
  const adminId = user?.role === 'super_admin' ? undefined : user?.id;

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [revokeModalCert, setRevokeModalCert] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cList, courseList, wList, allCourseEnrs] = await Promise.all([
        dataProvider.getCertificates(adminId),
        dataProvider.getCourses({ adminId }),
        dataProvider.getWorkshops(adminId),
        dataProvider.getCourseEnrollments(undefined, undefined, adminId),
      ]);
      setCertificates(cList);
      setCourses(courseList);
      setWorkshops(wList);
      setCourseEnrollments(allCourseEnrs);
    } catch (err) {
      console.error('Failed to load certificates data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleIssueCourseCert = async (studentId: string, courseId: string, score: number = 95) => {
    setIsProcessing(true);
    try {
      const res = await dataProvider.issueCourseCertificate(studentId, courseId, user?.id, score);
      if (res && res.success === false) {
        throw new Error(res.error || 'Certificate issuance rejected');
      }
      await loadData();
      alert('Course Certificate successfully approved, issued, and student credential activated!');
    } catch (err: any) {
      alert(`Certificate issuance failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPDF = (cert: Certificate) => {
    const title = cert.course?.title || cert.workshop?.title || 'Technical Workshop Program';
    downloadCertificate({
      studentName: cert.student?.full_name || 'Enrolled Student',
      collegeName: cert.student?.college_name || 'TNV Workshop Academy',
      department: cert.student?.department || 'Information Technology',
      workshopTitle: title,
      certificateNumber: cert.certificate_number,
      completionDate: cert.completion_date,
      issueDate: cert.issue_date,
      overallScore: cert.overall_score || 95,
      grade: cert.grade || 'A+',
      signatoryName: 'Thamilaran',
      signatoryTitle: 'Program Director & Chief Architect',
    });
  };

  const handleRevoke = async () => {
    if (!revokeModalCert) return;
    try {
      await dataProvider.revokeCertificate(revokeModalCert.id, revokeReason || 'Administrative revocation');
      setRevokeModalCert(null);
      setRevokeReason('');
      await loadData();
    } catch (err: any) {
      alert(`Revocation failed: ${err.message}`);
    }
  };

  const filteredCerts = certificates.filter((c) => {
    if (selectedCourseId === 'all') return true;
    if (selectedCourseId === 'workshops') return Boolean(c.workshop_id);
    return c.course_id === selectedCourseId;
  });

  // Filter candidate students enrolled in courses for issuance review
  const activeCourseEnrs = courseEnrollments.filter((enr) => {
    if (selectedCourseId !== 'all' && selectedCourseId !== 'workshops') {
      return enr.course_id === selectedCourseId;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Certificate Issuance & Distribution
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authorize verifiable certificates of completion, dispatch PDF credentials, and review completion records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Scoped Credentials</option>
            <option value="workshops">Workshop Credentials</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                Course: {c.title}
              </option>
            ))}
          </select>

          <Badge variant="brand" className="text-xs px-3 py-1 font-bold">
            Issued: {certificates.filter((c) => c.status === 'issued').length}
          </Badge>
        </div>
      </div>

      {/* Issued Certificates Table */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Active Issued Credentials
          </h3>
          <span className="text-xs text-slate-400">Total: {filteredCerts.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Certificate ID</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Program / Course</th>
                <th className="py-3.5 px-4">Overall Score</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No certificates issued for this selection.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => {
                  const programTitle = cert.course?.title || cert.workshop?.title || 'Certification';
                  return (
                    <tr key={cert.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">
                          {cert.certificate_number}
                        </span>
                        <Link
                          to={`/verify-certificate/${cert.certificate_number}`}
                          className="text-[10px] text-brand-600 hover:underline"
                        >
                          Public Verify URL
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {cert.student?.full_name}
                        </span>
                        <span className="text-[11px] text-slate-400">{cert.student?.email}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 dark:text-white truncate block max-w-[200px]">
                          {programTitle}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          {cert.course_id ? 'Course' : 'Workshop'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {cert.overall_score || 95}%
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1 font-bold">
                          ({cert.grade || 'A+'})
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {formatDate(cert.issue_date)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={cert.status === 'issued' ? 'success' : 'destructive'}>
                          {cert.status === 'issued' ? 'Active & Issued' : 'Revoked'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(cert)}
                          leftIcon={<Download className="w-3.5 h-3.5" />}
                        >
                          Download PDF
                        </Button>

                        {cert.status === 'issued' && (
                          <button
                            onClick={() => setRevokeModalCert(cert)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Revoke Certificate"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Course Completion & Pending Issuance Section */}
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Enrolled Students Course Progress & Certificate Issuance
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate student curriculum completion, assignment submissions, and issue official course credentials.
          </p>
        </div>

        <div className="space-y-3">
          {activeCourseEnrs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No students enrolled in the selected courses.
            </p>
          ) : (
            activeCourseEnrs.map((enr) => {
              const alreadyHas = certificates.some(
                (c) => c.student_id === enr.student_id && c.course_id === enr.course_id && c.status === 'issued'
              );
              const progress = enr.progress_percentage || 0;
              const isEligible = progress >= 100 || enr.is_completed;

              return (
                <div
                  key={enr.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {enr.student?.full_name || 'Enrolled Student'}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {enr.student?.email}
                      </span>
                    </div>
                    <p className="text-slate-500">
                      Course: <strong>{enr.course?.title}</strong> • Progress: <strong>{progress}%</strong> ({enr.completed_sessions || 0}/{enr.total_sessions || 0} sessions)
                    </p>
                  </div>

                  <div>
                    {alreadyHas ? (
                      <Badge variant="success">Certificate Active</Badge>
                    ) : (
                      <Button
                        variant={isEligible ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => handleIssueCourseCert(enr.student_id, enr.course_id)}
                        leftIcon={<Award className="w-3.5 h-3.5" />}
                        disabled={isProcessing}
                      >
                        {isEligible ? 'Approve & Issue Certificate' : 'Force Issue Certificate'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Revocation Modal */}
      <Modal
        isOpen={Boolean(revokeModalCert)}
        onClose={() => setRevokeModalCert(null)}
        title="Revoke Certificate"
        description="Permanently revoke public validity of this issued credential"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Are you sure you want to revoke certificate <strong>{revokeModalCert?.certificate_number}</strong>?
          </p>

          <Input
            label="Revocation Audit Reason *"
            placeholder="e.g. Academic integrity discrepancy"
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setRevokeModalCert(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleRevoke}>
              Confirm Revocation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
