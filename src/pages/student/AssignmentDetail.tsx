import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Assignment, AssignmentSubmission } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ArrowLeft, Clock, Send, CheckCircle2, MessageSquare } from 'lucide-react';

export const AssignmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  const loadData = async () => {
    if (!id || !user?.id) return;
    const [assignmentsList, subsList] = await Promise.all([
      dataProvider.getAssignments(),
      dataProvider.getAssignmentSubmissions(id, user.id),
    ]);

    const target = assignmentsList.find((a) => a.id === id);
    if (!target) {
      navigate('/student/assignments');
      return;
    }
    setAssignment(target);

    if (subsList.length > 0) {
      setSubmission(subsList[0]);
      setSubmissionText(subsList[0].submission_text || '');
      setFileUrl(subsList[0].file_url || '');
    }
  };

  useEffect(() => {
    loadData();
  }, [id, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignment || !user?.id || !submissionText.trim()) return;

    setIsSubmitting(true);
    await dataProvider.submitAssignment(assignment.id, user.id, submissionText, fileUrl);
    setIsSubmitting(false);
    setSuccessMessage(true);
    await loadData();
    setTimeout(() => setSuccessMessage(false), 3000);
  };

  if (!assignment) {
    return (
      <div className="py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-semibold uppercase">Loading Assignment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/student/assignments"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 mb-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Assignments List
      </Link>

      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
              Max Marks: {assignment.max_marks} (Pass: {assignment.passing_marks})
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{assignment.title}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
              <Clock className="w-3.5 h-3.5" /> Deadline: {formatDate(assignment.due_date)}
            </p>
          </div>

          <div>
            {submission ? (
              <StatusBadge status={submission.status} />
            ) : (
              <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-900">
                Not Submitted
              </span>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Assignment Brief & Description
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            {assignment.description}
          </p>
        </div>

        {assignment.instructions && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Submission Guidelines
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">{assignment.instructions}</p>
          </div>
        )}

        {/* Evaluator Review and Feedback */}
        {submission?.status === 'evaluated' && (
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Evaluation Published</span>
              </div>
              <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                Score: {submission.marks_obtained} / {assignment.max_marks}
              </span>
            </div>
            {submission.feedback && (
              <div className="text-xs text-emerald-800 dark:text-emerald-300/90 pt-1 flex items-start gap-2">
                <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Mentor Feedback:</span>
                  <span>{submission.feedback}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {submission ? 'Update Your Submission' : 'Submit Your Solution'}
          </h3>

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
              Assignment submission successfully recorded!
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Solution Notes / GitHub Code Link *
            </label>
            <textarea
              rows={4}
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Paste your GitHub repository link or solution code description..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              required
            ></textarea>
          </div>

          <Input
            label="Supporting Document / Drive File URL (Optional)"
            placeholder="https://drive.google.com/file/d/..."
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            helperText="Link to PDF or repository documentation"
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            rightIcon={<Send className="w-4 h-4" />}
          >
            {submission ? 'Update Submission' : 'Submit Assignment'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
