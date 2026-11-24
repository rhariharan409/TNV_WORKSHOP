import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Feedback } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { MessageSquareWarning, Send, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

export const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [category, setCategory] = useState<Feedback['category']>('improvement');
  const [subject, setSubject] = useState('Course Content');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user?.id) return;
    const list = await dataProvider.getFeedbacks(user.id);
    setFeedbacks(list);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    await dataProvider.submitFeedback(user.id, category, subject, description);
    setIsSubmitting(false);
    setSuccess(true);
    setSubject('Course Content');
    setDescription('');
    await loadData();
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Badge variant="brand">Student Support & Feedback</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          Issue & Feedback Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Submit technical issues, report portal bugs, or suggest curriculum enhancements. Track administrator replies in real-time.
        </p>
      </div>

      {/* Ticket Submission Form */}
      <Card wavy className="p-6 sm:p-8 space-y-5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquareWarning className="w-4 h-4 text-brand-600" />
          <span>Open a New Ticket / Suggestion</span>
        </h2>

        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Ticket successfully submitted. Administration will review and respond.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Issue Category *"
              value={category}
              onChange={(e) => setCategory(e.target.value as Feedback['category'])}
              options={[
                { value: 'complaint', label: 'Complaint' },
                { value: 'technical_issue', label: 'Technical Issue' },
                { value: 'improvement', label: 'Curriculum Improvement' },
                { value: 'general', label: 'General Inquiry' },
              ]}
            />

            <Select
              label="Subject *"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              options={[
                { value: 'Course Content', label: 'Course Content' },
                { value: 'Video/Playback Issue', label: 'Video/Playback Issue' },
                { value: 'Assignment', label: 'Assignment' },
                { value: 'Examination', label: 'Examination' },
                { value: 'Certificate', label: 'Certificate' },
                { value: 'Payment', label: 'Payment' },
                { value: 'Technical Issue', label: 'Technical Issue' },
                { value: 'Account/Profile', label: 'Account/Profile' },
                { value: 'Other', label: 'Other' },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Description & Details *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue or suggested enhancement clearly..."
              className="w-full rounded-2xl border-none bg-[#eef3f8] dark:bg-slate-800 p-3.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
              required
            ></textarea>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            rightIcon={<Send className="w-4 h-4" />}
          >
            Submit Ticket
          </Button>
        </form>
      </Card>

      {/* Ticket History */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          My Previous Tickets ({feedbacks.length})
        </h3>

        {feedbacks.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-500">
            You have not submitted any feedback tickets yet.
          </Card>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((fb) => (
              <Card key={fb.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{fb.category.replace('_', ' ')}</Badge>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{fb.subject}</span>
                  </div>
                  <StatusBadge status={fb.status} />
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg">
                  {fb.description}
                </p>

                {fb.admin_response && (
                  <div className="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900/60 text-xs space-y-1">
                    <span className="font-bold text-brand-900 dark:text-brand-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> Administrator Response:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300">{fb.admin_response}</p>
                  </div>
                )}

                <div className="text-[10px] text-slate-400">
                  Submitted on {formatDate(fb.created_at)}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
