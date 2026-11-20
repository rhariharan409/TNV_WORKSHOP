import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { WorkshopEnrollment, Profile, Workshop } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  CreditCard,
  ExternalLink,
  UserCheck,
  Eye,
} from 'lucide-react';

export const AdminStudents: React.FC = () => {
  const [enrollments, setEnrollments] = useState<WorkshopEnrollment[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workshopFilter, setWorkshopFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Verification Modal State
  const [activeEnrollment, setActiveEnrollment] = useState<WorkshopEnrollment | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Student Profile Drawer / Modal
  const [profileModalStudent, setProfileModalStudent] = useState<Profile | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [enrList, wList] = await Promise.all([
      dataProvider.getEnrollments(),
      dataProvider.getWorkshops(),
    ]);
    setEnrollments(enrList);
    setWorkshops(wList);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = enrollments.filter((e) => {
    const nameMatch =
      e.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.student?.college_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = statusFilter === 'all' || e.status === statusFilter;
    const workshopMatch = workshopFilter === 'all' || e.workshop_id === workshopFilter;
    return nameMatch && statusMatch && workshopMatch;
  });

  const handleApprove = async () => {
    if (!activeEnrollment) return;
    setActionLoading(true);
    await dataProvider.updateEnrollmentStatus(activeEnrollment.id, 'approved', adminNotes || 'Approved by Admin');
    setActionLoading(false);
    setActiveEnrollment(null);
    setAdminNotes('');
    await loadData();
  };

  const handleReject = async () => {
    if (!activeEnrollment) return;
    setActionLoading(true);
    await dataProvider.updateEnrollmentStatus(activeEnrollment.id, 'rejected', adminNotes || 'Rejected by Admin');
    setActionLoading(false);
    setActiveEnrollment(null);
    setAdminNotes('');
    await loadData();
  };

  const handleSuspendToggle = async (enr: WorkshopEnrollment) => {
    const newStatus = enr.status === 'suspended' ? 'approved' : 'suspended';
    await dataProvider.updateEnrollmentStatus(enr.id, newStatus, `Status updated to ${newStatus}`);
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Student Management & Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review student registrations, verify manual UPI payments, approve course access, and manage suspensions.
          </p>
        </div>

        <Badge variant="brand" className="text-xs px-3 py-1 font-bold">
          Total Students: {enrollments.length}
        </Badge>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, email, or college..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'payment_verification_pending', label: 'Payment Verification Pending' },
              { value: 'payment_pending', label: 'Payment Pending' },
              { value: 'approved', label: 'Approved Access' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />

          <Select
            value={workshopFilter}
            onChange={(e) => setWorkshopFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Workshops' },
              ...workshops.map((w) => ({ value: w.id, label: w.title })),
            ]}
          />
        </div>
      </Card>

      {/* Students Enrollment Table */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Student Name & Email</th>
                <th className="py-3.5 px-4">College & Dept</th>
                <th className="py-3.5 px-4">Workshop</th>
                <th className="py-3.5 px-4">Registered Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Loading student directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No students match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((enr) => (
                  <tr key={enr.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {enr.student?.full_name}
                      </div>
                      <div className="text-[11px] text-slate-400">{enr.student?.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="truncate max-w-[180px] font-semibold text-slate-800 dark:text-slate-200">
                        {enr.student?.college_name || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {enr.student?.department} • {enr.student?.year_of_study}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="truncate max-w-[200px] font-semibold text-slate-900 dark:text-white">
                        {enr.workshop?.title}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(enr.registered_at)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={enr.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => setProfileModalStudent(enr.student || null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View Full Student Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {enr.status !== 'approved' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setActiveEnrollment(enr);
                            setAdminNotes(enr.notes || '');
                          }}
                        >
                          Verify Payment
                        </Button>
                      )}

                      {enr.status === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSuspendToggle(enr)}
                          className="text-rose-600 dark:text-rose-400 hover:bg-rose-50"
                        >
                          Suspend Access
                        </Button>
                      )}

                      {enr.status === 'suspended' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleSuspendToggle(enr)}
                        >
                          Reactivate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Verification Modal */}
      <Modal
        isOpen={Boolean(activeEnrollment)}
        onClose={() => setActiveEnrollment(null)}
        title="Verify Student Payment & Approve Access"
        description="Confirm payment transaction details to grant full workshop resource access"
        maxWidth="md"
      >
        {activeEnrollment && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {activeEnrollment.student?.full_name} ({activeEnrollment.student?.email})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Workshop:</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">
                  {activeEnrollment.workshop?.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status:</span>
                <StatusBadge status={activeEnrollment.status} />
              </div>
              {activeEnrollment.notes && (
                <div className="pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block mb-0.5">Submitted Reference / Notes:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                    {activeEnrollment.notes}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Admin Audit Notes
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Verified via HDFC Bank statement #UPI889218319"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="danger"
                size="sm"
                onClick={handleReject}
                isLoading={actionLoading}
                leftIcon={<XCircle className="w-3.5 h-3.5" />}
              >
                Reject Payment
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={handleApprove}
                isLoading={actionLoading}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              >
                Approve & Unlock Access
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Full Student Profile Modal */}
      <Modal
        isOpen={Boolean(profileModalStudent)}
        onClose={() => setProfileModalStudent(null)}
        title="Student Academic Profile"
        description="Comprehensive records for verification and attendance checks"
        maxWidth="md"
        footer={
          <Button variant="outline" size="sm" onClick={() => setProfileModalStudent(null)}>
            Close
          </Button>
        }
      >
        {profileModalStudent && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-brand-600 text-white font-bold text-lg flex items-center justify-center">
                {profileModalStudent.full_name?.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{profileModalStudent.full_name}</h4>
                <p className="text-slate-500">{profileModalStudent.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block">Phone (WhatsApp):</span>
                <span className="font-bold text-slate-900 dark:text-white">{profileModalStudent.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Role:</span>
                <span className="font-bold uppercase text-brand-600">{profileModalStudent.role}</span>
              </div>
              <div>
                <span className="text-slate-400 block">College:</span>
                <span className="font-bold text-slate-900 dark:text-white">{profileModalStudent.college_name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Department & Year:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {profileModalStudent.department} • {profileModalStudent.year_of_study}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
