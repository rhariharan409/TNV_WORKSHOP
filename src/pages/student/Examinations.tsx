import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Examination, ExamAttempt } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { GraduationCap, Clock, Award, CheckCircle2, ArrowRight } from 'lucide-react';

export const Examinations: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Examination[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      dataProvider.getExaminations(),
      dataProvider.getExamAttempts(user.id),
    ]).then(([eList, aList]) => {
      setExams(eList);
      setAttempts(aList);
      setIsLoading(false);
    });
  }, [user?.id]);

  const getAttemptFor = (examId: string) => attempts.find((a) => a.exam_id === examId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Technical Examination Center
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Proctored evaluations covering database normalization, security protocols, and cloud software engineering.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1].map((n) => (
            <div key={n} className="h-40 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500">
          No examinations scheduled at this time.
        </Card>
      ) : (
        <div className="space-y-6">
          {exams.map((exam) => {
            const attempt = getAttemptFor(exam.id);
            return (
              <Card key={exam.id} className="p-6 sm:p-8 space-y-6 shadow-sm border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                  <div className="space-y-1">
                    <Badge variant="brand">{exam.course?.title ? `${exam.course.title} • Exam` : 'Qualification Exam'}</Badge>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{exam.title}</h2>
                    <p className="text-xs text-slate-500">{exam.description}</p>
                  </div>

                  <div>
                    {attempt ? (
                      <Badge variant={attempt.is_passed ? 'success' : 'destructive'} className="text-xs py-1 px-3">
                        {attempt.is_passed ? 'Passed Qualification' : 'Failed Qualification'}
                      </Badge>
                    ) : (
                      <Badge variant="warning">Ready to Take</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Time Allotted:</span>
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-brand-600" />
                      {exam.duration_minutes} Minutes
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Total & Passing Marks:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      Pass: {exam.passing_marks} / Total: {exam.total_marks} Marks
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block mb-0.5">Question Format:</span>
                    <span className="font-bold text-slate-900 dark:text-white">Multiple Choice (MCQ)</span>
                  </div>
                </div>

                {/* Attempt Result Card */}
                {attempt && (
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-950 dark:text-emerald-200">
                          Final Exam Score: {attempt.score} / {attempt.total_marks} Marks ({attempt.percentage}%)
                        </p>
                        <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                          Submitted on: {formatDate(attempt.submitted_at)}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      Criteria Met for Certificate
                    </span>
                  </div>
                )}

                {/* Instructions and CTA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <p className="text-[11px] text-slate-500 max-w-xl">
                    Once started, the countdown timer runs continuously. Do not close or switch browser tabs during examination.
                  </p>

                  <Link to={`/student/examinations/${exam.id}`}>
                    <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      {attempt ? 'Retake Examination' : 'Start Proctored Exam'}
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
