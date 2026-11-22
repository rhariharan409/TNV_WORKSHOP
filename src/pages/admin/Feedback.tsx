import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { Feedback } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { MessageSquareWarning, MessageSquare, CheckCircle2 } from 'lucide-react';

export const AdminFeedback: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [activeFb, setActiveFb] = useState<Feedback | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [status, setStatus] = useState<Feedback['status']>('resolved');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const list = await dataProvider.getFeedbacks();
    setFeedbacks(list);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenRespond = (fb: Feedback) => {
    setActiveFb(fb);
    setAdminResponse(fb.admin_response || '');
    setStatus(fb.status === 'open' ? 'in_progress' : fb.status);
  };

  const handleSaveResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFb) return;
    setIsUpdating(true);
    await dataProvider.respondToFeedback(activeFb.id, adminResponse, status);
    setIsUpdating(false);
    setActiveFb(null);
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Student Feedback & Complaint Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review student issue tickets, assign status flags, and deliver official administrative resolution replies.
        </p>
      </div>

      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Subject & Description</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    No student feedback or support tickets submitted yet.
                  </td>
                </tr>
              ) : (
                feedbacks.map((fb) => (
                  <tr key={fb.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">{fb.student?.full_name || 'Enrolled Student'}</span>
                      <span className="text-[11px] text-slate-400">{fb.student?.email}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant="outline" className="capitalize">
                        {fb.category.replace('_', ' ')}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">{fb.subject}</span>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{fb.description}</p>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      {formatDate(fb.created_at)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={fb.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button variant="primary" size="sm" onClick={() => handleOpenRespond(fb)}>
                        Reply / Resolve
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Response Modal */}
      <Modal
        isOpen={Boolean(activeFb)}
        onClose={() => setActiveFb(null)}
        title="Respond to Student Ticket"
        description="Provide feedback and update ticket resolution status"
        maxWidth="md"
      >
        {activeFb && (
          <form onSubmit={handleSaveResponse} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeFb.student?.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Subject:</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeFb.subject}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                {activeFb.description}
              </p>
            </div>

            <Select
              label="Ticket Status *"
              value={status}
              onChange={(e) => setStatus(e.target.value as Feedback['status'])}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved (Issue Solved)' },
                { value: 'closed', label: 'Closed' },
              ]}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Official Administrative Response *
              </label>
              <textarea
                rows={4}
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Detail resolution steps or answers for the student..."
                className="w-full rounded-2xl border-none bg-[#eef3f8] dark:bg-slate-800 p-3.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                required
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveFb(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isUpdating}>
                Save Response
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
