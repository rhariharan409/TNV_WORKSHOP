import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { ProjectSubmission } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { ExternalLink, Github, CheckCircle2, XCircle, AlertTriangle, Eye } from 'lucide-react';

export const AdminProjects: React.FC = () => {
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);
  const [activeSub, setActiveSub] = useState<ProjectSubmission | null>(null);
  const [status, setStatus] = useState<ProjectSubmission['status']>('approved');
  const [marks, setMarks] = useState('95');
  const [feedback, setFeedback] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const list = await dataProvider.getProjectSubmissions();
    setSubmissions(list);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenReview = (sub: ProjectSubmission) => {
    setActiveSub(sub);
    setStatus(sub.status);
    setMarks(sub.marks_obtained !== null && sub.marks_obtained !== undefined ? sub.marks_obtained.toString() : '90');
    setFeedback(sub.feedback || 'Architectural structure verified. Clean separation of concerns and robust database RLS.');
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSub) return;
    setIsUpdating(true);
    await dataProvider.reviewProject(activeSub.id, status, Number(marks) || 0, feedback);
    setIsUpdating(false);
    setActiveSub(null);
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Capstone Project Submissions
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review GitHub codebases, inspect deployed cloud platforms, assign grades, and verify certificate eligibility.
        </p>
      </div>

      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Project Title</th>
                <th className="py-3.5 px-4">Live Links</th>
                <th className="py-3.5 px-4">Submission Date</th>
                <th className="py-3.5 px-4">Status & Score</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-white block">{s.student?.full_name}</span>
                    <span className="text-[11px] text-slate-400">{s.student?.email}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-900 dark:text-white block truncate max-w-[200px]">
                      {s.project_title}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap space-x-2">
                    <a
                      href={s.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-brand-600 font-medium"
                    >
                      <Github className="w-3.5 h-3.5" /> Code
                    </a>
                    {s.live_demo_url && (
                      <a
                        href={s.live_demo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-brand-600 hover:underline font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                      </a>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {formatDate(s.submitted_at)}
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={s.status} />
                      {s.marks_obtained !== null && s.marks_obtained !== undefined && (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {s.marks_obtained}/100
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Button variant="primary" size="sm" onClick={() => handleOpenReview(s)}>
                      Review Submission
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Project Review Modal */}
      <Modal
        isOpen={Boolean(activeSub)}
        onClose={() => setActiveSub(null)}
        title="Review & Grade Capstone Project"
        description="Inspect deliverables, update status, and provide feedback"
        maxWidth="lg"
      >
        {activeSub && (
          <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeSub.student?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Title:</span>
                <span className="font-bold text-brand-600">{activeSub.project_title}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700 leading-relaxed">
                {activeSub.project_description}
              </p>

              <div className="flex items-center gap-4 pt-2">
                <a
                  href={activeSub.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold flex items-center gap-1.5"
                >
                  <Github className="w-3.5 h-3.5" /> Inspect GitHub Repository
                </a>
                {activeSub.live_demo_url && (
                  <a
                    href={activeSub.live_demo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-brand-600 text-white font-semibold flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Live Application
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Review Status *"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectSubmission['status'])}
                options={[
                  { value: 'approved', label: 'Approved (Qualifies for Certificate)' },
                  { value: 'resubmission_required', label: 'Resubmission Required' },
                  { value: 'under_review', label: 'Under Review' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
              />

              <Input
                label="Marks Obtained (Max: 100) *"
                type="number"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Architect Evaluation Feedback *
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                required
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveSub(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isUpdating}>
                Save Project Review
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
