import React, { useState, useEffect } from 'react';
import { Examination, ExamAttempt, Profile } from '../../../types/database';
import { dataProvider } from '../../../lib/dataProvider';
import { exportToCSV } from '../../../lib/csvExport';
import { formatDate } from '../../../lib/utils';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import {
  Users,
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  Clock,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';

interface ExamResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Examination | null;
}

export const ExamResultsModal: React.FC<ExamResultsModalProps> = ({
  isOpen,
  onClose,
  exam,
}) => {
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Profile[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed' | 'not_attempted'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && exam) {
      setIsLoading(true);
      Promise.all([
        dataProvider.getExamResults(exam.id),
        dataProvider.getEnrollments(),
      ])
        .then(([attList, enrList]) => {
          setAttempts(attList);
          const studentProfiles: Profile[] = [];
          enrList.forEach((e: any) => {
            if (e.workshop_id === exam.course_id || e.course_id === exam.course_id) {
              if (e.student && !studentProfiles.some((s) => s.id === e.student.id)) {
                studentProfiles.push(e.student);
              }
            }
          });
          setEnrolledStudents(studentProfiles);
        })
        .catch((err) => {
          console.error('Failed to load exam results:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, exam?.id]);

  if (!exam) return null;

  // Summary Metrics
  const attemptedStudentIds = new Set(attempts.map((a) => a.student_id));
  const attemptedCount = attemptedStudentIds.size;
  const passedAttempts = attempts.filter((a) => a.is_passed);
  const passedStudentsCount = new Set(passedAttempts.map((a) => a.student_id)).size;
  const passRate = attemptedCount > 0 ? Math.round((passedStudentsCount / attemptedCount) * 100) : 0;
  const totalScorePct = attempts.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0);
  const avgPct = attempts.length > 0 ? Math.round(totalScorePct / attempts.length) : 0;

  // Not attempted students list
  const notAttemptedStudents = enrolledStudents.filter((s) => !attemptedStudentIds.has(s.id));

  // Filtered rows
  const filteredAttempts = attempts.filter((a) => {
    if (filterStatus === 'passed') return a.is_passed;
    if (filterStatus === 'failed') return !a.is_passed;
    return true;
  });

  const formatDuration = (startedAt: string, submittedAt?: string | null) => {
    if (!submittedAt) return 'In progress';
    const start = new Date(startedAt).getTime();
    const end = new Date(submittedAt).getTime();
    const diffSecs = Math.max(0, Math.floor((end - start) / 1000));
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    return `${mins}m ${secs}s`;
  };

  const handleExportCSV = () => {
    if (attempts.length === 0 && notAttemptedStudents.length === 0) {
      alert('No student attempts to export.');
      return;
    }

    const rows = attempts.map((a, idx) => ({
      Attempt_ID: a.id,
      Student_Name: a.student?.full_name || 'Student',
      Email: a.student?.email || 'N/A',
      Phone: a.student?.phone || 'N/A',
      College: a.student?.college_name || 'N/A',
      Department: a.student?.department || 'N/A',
      Exam_Title: exam.title,
      Score: `${a.score} / ${a.total_marks}`,
      Percentage: `${a.percentage}%`,
      Result_Status: a.is_passed ? 'PASSED' : 'FAILED',
      Time_Taken: formatDuration(a.started_at, a.submitted_at),
      Tab_Switches: a.tab_switches ?? 0,
      Status: a.status,
      Started_At: formatDate(a.started_at),
      Submitted_At: a.submitted_at ? formatDate(a.submitted_at) : 'N/A',
    }));

    // If filtering not attempted, append them
    if (filterStatus === 'not_attempted' || filterStatus === 'all') {
      notAttemptedStudents.forEach((st) => {
        rows.push({
          Attempt_ID: 'N/A',
          Student_Name: st.full_name || 'Student',
          Email: st.email || 'N/A',
          Phone: st.phone || 'N/A',
          College: st.college_name || 'N/A',
          Department: st.department || 'N/A',
          Exam_Title: exam.title,
          Score: '0 / 0',
          Percentage: '0%',
          Result_Status: 'NOT ATTEMPTED',
          Time_Taken: '0m',
          Tab_Switches: 0,
          Status: 'not_started' as any,
          Started_At: 'N/A',
          Submitted_At: 'N/A',
        });
      });
    }

    const safeTitle = exam.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    exportToCSV(`TNV_Exam_Results_${safeTitle}`, rows);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Examination Results: ${exam.title}`}
      description={`Cohorts performance, telemetry telemetry logs, and passing status for ${exam.course?.title || 'Course'}`}
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block">
              Attempted Students
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-blue-900 dark:text-blue-100">
                {attemptedCount}
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                / {enrolledStudents.length} Enrolled
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">
              Passed Students
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
                {passedStudentsCount}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                ({passRate}% Pass Rate)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
            <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block">
              Average Score %
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-purple-900 dark:text-purple-100">
                {avgPct}%
              </span>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                Across {attempts.length} Attempt(s)
              </span>
            </div>
          </div>
        </div>

        {/* Filter bar & CSV Download */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              All Attempts ({attempts.length})
            </button>
            <button
              onClick={() => setFilterStatus('passed')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'passed'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              Passed ({passedAttempts.length})
            </button>
            <button
              onClick={() => setFilterStatus('failed')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'failed'
                ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              Failed ({attempts.filter((a) => !a.is_passed).length})
            </button>
            <button
              onClick={() => setFilterStatus('not_attempted')}
              className={`px-3 py-1.5 rounded-lg transition-all ${filterStatus === 'not_attempted'
                ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
                }`}
            >
              Not Attempted ({notAttemptedStudents.length})
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="font-bold shrink-0"
          >
            Download CSV
          </Button>
        </div>

        {/* Results Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto max-h-[50vh] text-xs">
          <table className="w-full text-left text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3">Student Name</th>
                <th className="p-3">Score & %</th>
                <th className="p-3">Status</th>
                <th className="p-3">Time Taken</th>
                <th className="p-3">Tab Switches</th>
                <th className="p-3">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                    Loading results...
                  </td>
                </tr>
              ) : filterStatus === 'not_attempted' ? (
                notAttemptedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                      All enrolled students have attempted this examination.
                    </td>
                  </tr>
                ) : (
                  notAttemptedStudents.map((st) => (
                    <tr key={st.id}>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-white block">{st.full_name}</span>
                        <span className="text-[11px] text-slate-400">{st.email}</span>
                      </td>
                      <td className="p-3 text-slate-400">—</td>
                      <td className="p-3">
                        <Badge variant="outline">Not Attempted</Badge>
                      </td>
                      <td className="p-3 text-slate-400">—</td>
                      <td className="p-3 text-slate-400">—</td>
                      <td className="p-3 text-slate-400">—</td>
                    </tr>
                  ))
                )
              ) : filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-slate-400">
                    No examination attempt records matching this filter.
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((att, idx) => (
                  <tr key={att.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {att.student?.full_name || 'Student'}
                      </span>
                      <span className="text-[11px] text-slate-400">{att.student?.email}</span>
                    </td>

                    <td className="p-3">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {att.score} / {att.total_marks}
                      </span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {att.percentage}%
                      </span>
                    </td>

                    <td className="p-3">
                      <Badge variant={att.is_passed ? 'brand' : 'default'}>
                        {att.is_passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </td>

                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {formatDuration(att.started_at, att.submitted_at)}
                    </td>

                    <td className="p-3">
                      {(att.tab_switches ?? 0) > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          {att.tab_switches} switch{(att.tab_switches ?? 0) > 1 ? 'es' : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>

                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {att.submitted_at ? formatDate(att.submitted_at) : 'In progress'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

