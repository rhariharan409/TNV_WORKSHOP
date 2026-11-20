import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Assignment, AssignmentSubmission } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { FileCheck2, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export const Assignments: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      dataProvider.getAssignments(),
      dataProvider.getAssignmentSubmissions(undefined, user.id),
    ]).then(([asns, subs]) => {
      setAssignments(asns);
      setSubmissions(subs);
      setIsLoading(false);
    });
  }, [user?.id]);

  const getSubmissionFor = (asnId: string) => submissions.find((s) => s.assignment_id === asnId);

  const filtered = assignments.filter((a) => {
    const sub = getSubmissionFor(a.id);
    if (filter === 'pending') return !sub;
    if (filter === 'submitted') return Boolean(sub);
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Technical Assignments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete practical coding exercises, database migrations, and architectural designs to qualify for certification.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'pending' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'submitted' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Submitted ({submissions.length})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500">
          No assignments found matching this filter.
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const sub = getSubmissionFor(a.id);
            return (
              <Card key={a.id} className="p-6 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                        Max Marks: {a.max_marks} (Passing: {a.passing_marks})
                      </span>
                      {sub ? <StatusBadge status={sub.status} /> : <Badge variant="warning">Not Started</Badge>}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{a.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl line-clamp-2">
                      {a.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Due {formatDate(a.due_date)}
                      </span>
                      {sub?.marks_obtained !== null && sub?.marks_obtained !== undefined && (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          Score: {sub.marks_obtained} / {a.max_marks}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link to={`/student/assignments/${a.id}`} className="shrink-0">
                    <Button variant={sub ? 'outline' : 'primary'} size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      {sub ? 'View Submission' : 'Submit Assignment'}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
