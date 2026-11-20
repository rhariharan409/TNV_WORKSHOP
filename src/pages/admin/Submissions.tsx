import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { AssignmentSubmission } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { CheckCircle2, MessageSquare, ExternalLink, Eye } from 'lucide-react';

export const AdminSubmissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [activeSub, setActiveSub] = useState<AssignmentSubmission | null>(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const list = await dataProvider.getAssignmentSubmissions();
    setSubmissions(list);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenGradeModal = (sub: AssignmentSubmission) => {
    setActiveSub(sub);
    setMarks(sub.marks_obtained !== null && sub.marks_obtained !== undefined ? sub.marks_obtained.toString() : '90');
    setFeedback(sub.feedback || 'Code adheres to architectural standards. Good job!');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSub) return;
    setIsGrading(true);
    await dataProvider.evaluateSubmission(activeSub.id, Number(marks) || 0, feedback);
    setIsGrading(false);
    setActiveSub(null);
    await loadData();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Assignment Submissions & Evaluation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review student code submissions, assign marks, and publish structured technical feedback.
        </p>
      </div>

      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Assignment Title</th>
                <th className="py-3.5 px-4">Submitted Solution</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status & Score</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {submissions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {s.student?.full_name || 'Student'}
                    </span>
                    <span className="text-[11px] text-slate-400">{s.student?.email}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-slate-900 dark:text-white truncate block max-w-[200px]">
                      {s.assignment?.title}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-mono text-[11px] truncate max-w-[220px] text-brand-600 dark:text-brand-400">
                      {s.submission_text}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
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
                    <Button variant="primary" size="sm" onClick={() => handleOpenGradeModal(s)}>
                      {s.status === 'evaluated' ? 'Re-Evaluate' : 'Grade Submission'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Grade Submission Modal */}
      <Modal
        isOpen={Boolean(activeSub)}
        onClose={() => setActiveSub(null)}
        title="Grade Assignment Submission"
        description="Review student solution, assign score and provide feedback"
        maxWidth="md"
      >
        {activeSub && (
          <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeSub.student?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assignment:</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">{activeSub.assignment?.title}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">Submitted Content:</span>
                <p className="font-mono text-[11px] bg-slate-100 dark:bg-slate-900 p-2 rounded text-slate-800 dark:text-slate-200 break-all">
                  {activeSub.submission_text}
                </p>
              </div>
            </div>

            <Input
              label="Marks Obtained (Max: 100) *"
              type="number"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Mentor Written Feedback *
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Give actionable feedback on code structure, test coverage, and design..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                required
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveSub(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isGrading}>
                Publish Marks & Feedback
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
