import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { dataProvider } from '../lib/dataProvider';
import { Certificate } from '../types/database';
import { downloadCertificate } from '../lib/certificateGenerator';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Award, CheckCircle2, XCircle, Download, Search, ShieldCheck } from 'lucide-react';

export const VerifyCertificatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchId, setSearchId] = useState(id || '');
  const [verifiedCert, setVerifiedCert] = useState<any>(null);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const performVerification = async (certId: string) => {
    if (!certId.trim()) return;
    setIsLoading(true);
    setSearched(true);
    try {
      const result = await dataProvider.verifyCertificate(certId.trim());
      setVerifiedCert(result);
    } catch (err) {
      console.error('Error during certificate verification:', err);
      setVerifiedCert(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setSearchId(id);
      performVerification(id);
    }
  }, [id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      performVerification(searchId);
    }
  };

  const handleDownloadPDF = () => {
    if (!verifiedCert) return;
    downloadCertificate({
      studentName: verifiedCert.student_name || 'Enrolled Student',
      collegeName: 'Verified TNV Workshop Scholar',
      department: 'Technology & Computing',
      workshopTitle: verifiedCert.workshop_title || 'TNV Workshop Program',
      certificateNumber: verifiedCert.certificate_number,
      completionDate: verifiedCert.completion_date || verifiedCert.issue_date,
      issueDate: verifiedCert.issue_date,
      signatoryName: 'Thamilaran',
      signatoryTitle: 'Program Director & Chief Architect',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300 text-xs font-semibold">
          <Award className="w-4 h-4 text-amber-600" />
          <span>Official Public Verification Registry</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Verify TNV Workshop Certificate</h1>
        <p className="text-xs text-slate-500">
          Authenticate credentials issued by the TNV Workshop Academy. Enter the certificate number printed at the bottom of the document.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="max-w-md mx-auto flex gap-2">
        <input
          type="text"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder="e.g. TNV-2024-89312"
          className="flex-1 h-11 px-4 rounded-xl border border-slate-300 bg-white text-sm uppercase font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          required
        />
        <Button type="submit" variant="primary" size="md" isLoading={isLoading} leftIcon={<Search className="w-4 h-4" />}>
          Verify
        </Button>
      </form>

      {/* Verification Result Display */}
      {searched && (
        <div className="pt-4 animate-in fade-in duration-300">
          {verifiedCert && (verifiedCert.is_valid || verifiedCert.status === 'issued') ? (
            <Card className="border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/60 dark:bg-emerald-950/20 overflow-hidden shadow-lg max-w-2xl mx-auto">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-emerald-900 dark:text-emerald-300">
                        Official Credential Verified
                      </h3>
                      <p className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
                        {verifiedCert.certificate_number}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider">
                    Valid & Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Recipient Name:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {verifiedCert.student_name || 'Enrolled Student'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Credential Status:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                      {verifiedCert.status || 'Active'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Workshop Title:</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400 text-sm">
                      {verifiedCert.workshop_title || 'TNV Workshop Curriculum'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Issue Date:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{verifiedCert.issue_date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Signatory:</span>
                    <span className="font-medium text-slate-900 dark:text-white">Thamilaran</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleDownloadPDF}
                    className="w-full"
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Download Official PDF Certificate
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="border-rose-200 bg-rose-50/30 dark:border-rose-900/60 dark:bg-rose-950/20 max-w-xl mx-auto p-8 text-center space-y-3">
              <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h3 className="font-bold text-base text-rose-900 dark:text-rose-300">Invalid or Unrecognized Certificate</h3>
              <p className="text-xs text-rose-700 dark:text-rose-400 max-w-sm mx-auto">
                No active certificate matching "{searchId}" was found in our registry. Please verify the code or contact support@tnvworkshop.edu.in.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
