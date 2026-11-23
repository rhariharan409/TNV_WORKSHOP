import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Assignment, AssignmentSubmission } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Clock, CheckCircle2 } from 'lucide-react';

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

  const getSubmissionFor = (a: Assignment) => {
    const directSub = submissions.find((s) => s.assignment_id === a.id);
    if (directSub) return directSub;

    // Check localStorage submissions recorded inside the course
    if (typeof window !== 'undefined' && user?.id) {
      try {
        if (a.session_id) {
          const cachedSess = localStorage.getItem(`assignment_sub_${user.id}_${a.session_id}`);
          if (cachedSess) {
            const parsed = JSON.parse(cachedSess);
            return {
              id: 'local-' + a.id,
              assignment_id: a.id,
              student_id: user.id,
              submission_text: parsed.text,
              status: 'submitted',
              submitted_at: parsed.submitted_at || new Date().toISOString(),
            } as any;
          }
        }

        const cachedAsn = localStorage.getItem(`assignment_sub_${user.id}_${a.id}`);
        if (cachedAsn) {
          const parsed = JSON.parse(cachedAsn);
          return {
            id: 'local-' + a.id,
            assignment_id: a.id,
            student_id: user.id,
            submission_text: parsed.text,
            status: 'submitted',
            submitted_at: parsed.submitted_at || new Date().toISOString(),
          } as any;
        }

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`assignment_sub_${user.id}_`)) {
            const val = localStorage.getItem(key);
            if (val) {
              const parsed = JSON.parse(val);
              if (
                parsed.title &&
                a.title &&
                (parsed.title.toLowerCase().includes(a.title.toLowerCase()) ||
                  a.title.toLowerCase().includes(parsed.title.toLowerCase()))
              ) {
                return {
                  id: 'local-' + a.id,
                  assignment_id: a.id,
                  student_id: user.id,
                  submission_text: parsed.text,
                  status: 'submitted',
                  submitted_at: parsed.submitted_at || new Date().toISOString(),
                } as any;
              }
            }
          }
        }
      } catch {}
    }
    return undefined;
  };

  const filtered = assignments.filter((a) => {
    const sub = getSubmissionFor(a);
    if (filter === 'pending') return !sub;
    if (filter === 'submitted') return Boolean(sub);
    return true;
  });

  const submittedTotal = assignments.filter((a) => Boolean(getSubmissionFor(a))).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Technical Assignments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Overview of required practical assignments. All submissions must be completed directly inside the course curriculum.
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
            Pending ({assignments.length - submittedTotal})
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'submitted' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
            }`}
          >
            Submitted ({submittedTotal})
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
            const sub = getSubmissionFor(a);
            return (
              <Card key={a.id} className="p-6 hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                        {a.course?.title ? `${a.course.title} • ` : ''}Max Marks: {a.max_marks} (Passing: {a.passing_marks})
                      </span>
                      {sub ? <StatusBadge status={sub.status || 'submitted'} /> : <Badge variant="warning">Pending Submission</Badge>}
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

                  {/* Submission Status Indicator - No external submit button as requested */}
                  <div className="shrink-0">
                    {sub ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs border border-emerald-200 dark:border-emerald-800 shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Already Submitted</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Pending (Submit inside course)</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
