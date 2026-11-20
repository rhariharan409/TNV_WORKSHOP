import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { Certificate, Profile, Workshop } from '../../types/database';
import { downloadCertificate } from '../../lib/certificateGenerator';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Award, Download, ShieldCheck, XCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [revokeModalCert, setRevokeModalCert] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [cList, pList, wList] = await Promise.all([
      dataProvider.getCertificates(),
      dataProvider.getProfiles(),
      dataProvider.getWorkshops(),
    ]);
    setCertificates(cList);
    setStudents(pList.filter((p) => p.role === 'student'));
    setWorkshops(wList);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleIssueCertificate = async (studentId: string, workshopId: string) => {
    setIsProcessing(true);
    await dataProvider.issueCertificate(studentId, workshopId);
    setIsProcessing(false);
    await loadData();
    alert('Certificate successfully generated and issued to student!');
  };

  const handleDownloadPDF = (cert: Certificate) => {
    downloadCertificate({
      studentName: cert.student?.full_name || 'Enrolled Student',
      collegeName: cert.student?.college_name || 'PSG College of Technology',
      department: cert.student?.department || 'Information Technology',
      workshopTitle: cert.workshop?.title || 'Full-Stack Cloud & AI Engineering',
      certificateNumber: cert.certificate_number,
      completionDate: cert.completion_date,
      issueDate: cert.issue_date,
      signatoryName: 'Dr. T. N. Venkatesh',
      signatoryTitle: 'Program Director & Chief Architect',
    });
  };

  const handleRevoke = async () => {
    if (!revokeModalCert) return;
    await dataProvider.revokeCertificate(revokeModalCert.id, revokeReason || 'Administrative revocation');
    setRevokeModalCert(null);
    setRevokeReason('');
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Certificate Issuance & Distribution
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authorize verifiable certificates of completion, dispatch PDF credentials, and manage credentials revocation.
          </p>
        </div>

        <Badge variant="brand" className="text-xs px-3 py-1 font-bold">
          Issued Certificates: {certificates.filter((c) => c.status === 'issued').length}
        </Badge>
      </div>

      {/* Issued Certificates Table */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Certificate ID</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Workshop</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {certificates.map((cert) => (
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
                      {cert.workshop?.title}
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Eligible Students for Issuance Section */}
      <Card className="p-6 space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">
          Eligible Students Pending Certificate Generation
        </h3>
        <p className="text-xs text-slate-500">
          Students who have completed course requirements and are awaiting administrative certificate generation.
        </p>

        <div className="space-y-3">
          {students.map((st) => {
            const defaultWorkshop = workshops[0];
            const alreadyHas = certificates.some(
              (c) => c.student_id === st.id && c.workshop_id === defaultWorkshop?.id && c.status === 'issued'
            );

            return (
              <div
                key={st.id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{st.full_name}</h4>
                  <p className="text-slate-500">{st.college_name} • {st.department}</p>
                </div>

                <div>
                  {alreadyHas ? (
                    <Badge variant="success">Certificate Already Issued</Badge>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleIssueCertificate(st.id, defaultWorkshop?.id)}
                      leftIcon={<Award className="w-3.5 h-3.5" />}
                    >
                      Generate & Issue Certificate
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
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
