import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { StudentExamCardData } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  GraduationCap,
  Clock,
  Award,
  CheckCircle2,
  Lock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const Examinations: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [examCards, setExamCards] = useState<StudentExamCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Instructions Modal State
  const [selectedExamData, setSelectedExamData] = useState<StudentExamCardData | null>(null);
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await dataProvider.getExamsForStudent(user.id);
      setExamCards(data);
    } catch (err) {
      console.error('Failed to load student exams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleOpenInstructions = (item: StudentExamCardData) => {
    setSelectedExamData(item);
    setAgreedToRules(false);
    setStartError(null);
  };

  const handleStartExam = async () => {
    if (!selectedExamData || !agreedToRules) return;
    setIsStarting(true);
    setStartError(null);

    try {
      const res = await dataProvider.startExamAttempt(selectedExamData.exam.id);
      if (res.success === false) {
        setStartError(res.error || 'Server rejected attempt initiation.');
        return;
      }

      // Navigate to proctored taking page
      navigate(`/student/examinations/${selectedExamData.exam.id}`);
    } catch (err: any) {
      setStartError(err.message || 'Failed to initialize examination.');
    } finally {
      setIsStarting(false);
    }
  };

  const formatRemainingTime = (remainingSeconds: number) => {
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <GraduationCap className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          Technical Examination Center
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Mandatory proctored assessments. Complete all course curriculum sessions to unlock your qualification examination and earn your verified certificate.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : examCards.length === 0 ? (
        <Card className="p-12 text-center space-y-3 border-slate-200 dark:border-slate-800">
          <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
            No examinations currently scheduled
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Examinations will become visible here once you are enrolled in active courses.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {examCards.map((item) => {
            const { exam, status, progressPercent, completedSessions, totalSessions, attemptsLeft, latestAttempt, activeAttempt } = item;

            return (
              <Card
                key={exam.id}
                className="p-6 sm:p-7 border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="brand">{exam.course?.title || 'Workshop Course'}</Badge>

                      {status === 'locked' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )}

                      {status === 'not_open' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Upcoming
                        </span>
                      )}

                      {status === 'in_progress' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse flex items-center gap-1">
                          <Clock className="w-3 h-3" /> In Progress
                        </span>
                      )}

                      {status === 'passed' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Passed Qualification
                        </span>
                      )}

                      {status === 'failed_retake' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          Retake Available
                        </span>
                      )}

                      {status === 'no_attempts_left' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                          Attempts Exhausted
                        </span>
                      )}

                      {status === 'closed' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          Exam Window Closed
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white pt-1">
                      {exam.title}
                    </h2>
                    {exam.description && (
                      <p className="text-xs text-slate-500 max-w-2xl">{exam.description}</p>
                    )}
                  </div>

                  {/* Top Right Quick Score or Timer */}
                  <div className="shrink-0 text-right">
                    {status === 'passed' && latestAttempt && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-right">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                          Certified Score
                        </span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                          {latestAttempt.score} / {latestAttempt.total_marks} ({latestAttempt.percentage}%)
                        </span>
                      </div>
                    )}

                    {status === 'in_progress' && activeAttempt && (
                      <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 text-right">
                        <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                          Remaining Time
                        </span>
                        <span className="text-sm font-black text-amber-700 dark:text-amber-300 font-mono">
                          {formatRemainingTime(activeAttempt.remainingSeconds)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* State Banner: Locked Progress Bar */}
                {status === 'locked' && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        Complete all sessions to unlock ({progressPercent}% done)
                      </span>
                      <span className="text-slate-500 font-medium">
                        {completedSessions} of {totalSessions} sessions completed
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* State Banner: Not Open Yet */}
                {status === 'not_open' && (
                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Opens on {exam.start_time ? formatDate(exam.start_time) : 'the scheduled start date'}
                    </span>
                  </div>
                )}

                {/* State Banner: Failed with Attempts Left */}
                {status === 'failed_retake' && latestAttempt && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between">
                    <span>
                      Previous attempt score: <strong>{latestAttempt.score} / {latestAttempt.total_marks} ({latestAttempt.percentage}%)</strong> — Minimum {exam.passing_percentage ?? 50}% required.
                    </span>
                    <span className="font-bold text-rose-700 dark:text-rose-300">
                      {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left
                    </span>
                  </div>
                )}

                {/* State Banner: No Attempts Left */}
                {status === 'no_attempts_left' && (
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>No attempts left. Contact your instructor.</span>
                  </div>
                )}

                {/* State Banner: Closed */}
                {status === 'closed' && (
                  <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Exam window closed. The deadline for this examination has passed.</span>
                  </div>
                )}

                {/* Exam Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                    <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-brand-600" />
                      {exam.duration_minutes} Minutes
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Marks</span>
                    <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                      {exam.total_marks} Marks
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Passing Criteria</span>
                    <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                      {exam.passing_percentage ?? 50}% ({exam.passing_marks} Marks)
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Attempts Left</span>
                    <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                      {attemptsLeft} of {exam.max_attempts ?? 2}
                    </span>
                  </div>
                </div>

                {/* Card Bottom CTA Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-slate-500">
                    {status === 'locked' ? (
                      <Link
                        to={`/student/courses/${exam.course_id}`}
                        className="text-brand-600 dark:text-brand-400 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        Go to course curriculum to finish remaining sessions <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span>Proctored online multiple-choice evaluation</span>
                    )}
                  </div>

                  <div>
                    {status === 'locked' && (
                      <Button variant="outline" size="sm" disabled leftIcon={<Lock className="w-3.5 h-3.5" />}>
                        Locked (Complete Sessions)
                      </Button>
                    )}

                    {status === 'not_open' && (
                      <Button variant="outline" size="sm" disabled>
                        Not Open Yet
                      </Button>
                    )}

                    {status === 'available' && (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => handleOpenInstructions(item)}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                        className="font-bold shadow-md shadow-brand-600/20"
                      >
                        Start Exam
                      </Button>
                    )}

                    {status === 'in_progress' && (
                      <Link to={`/student/examinations/${exam.id}`}>
                        <Button
                          variant="primary"
                          size="md"
                          rightIcon={<ArrowRight className="w-4 h-4" />}
                          className="font-bold bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20"
                        >
                          Resume Exam
                        </Button>
                      </Link>
                    )}

                    {status === 'passed' && (
                      <Link to="/student/certificates">
                        <Button
                          variant="primary"
                          size="md"
                          leftIcon={<Award className="w-4 h-4" />}
                          className="font-bold shadow-md shadow-brand-600/20"
                        >
                          View Certificate
                        </Button>
                      </Link>
                    )}

                    {status === 'failed_retake' && (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => handleOpenInstructions(item)}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                        className="font-bold"
                      >
                        Retake ({attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} left)
                      </Button>
                    )}

                    {status === 'no_attempts_left' && (
                      <Button variant="outline" size="sm" disabled>
                        No Attempts Left
                      </Button>
                    )}

                    {status === 'closed' && (
                      <Button variant="outline" size="sm" disabled>
                        Window Closed
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================== */}
      {/* INSTRUCTIONS SCREEN MODAL (Before Starting)                */}
      {/* ========================================================== */}
      <Modal
        isOpen={Boolean(selectedExamData)}
        onClose={() => setSelectedExamData(null)}
        title="Proctored Examination Instructions"
        description={selectedExamData?.exam.title || 'Qualification Examination'}
        maxWidth="xl"
      >
        {selectedExamData && (
          <div className="space-y-4 text-xs">
            {startError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{startError}</span>
              </div>
            )}

            {/* Exam Parameters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Duration</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {selectedExamData.exam.duration_minutes} Mins
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Marks</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {selectedExamData.exam.total_marks} Marks
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Passing Criteria</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {selectedExamData.exam.passing_percentage ?? 50}%
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Attempts Left</span>
                <span className="font-extrabold text-brand-600 dark:text-brand-400 text-sm">
                  {selectedExamData.attemptsLeft}
                </span>
              </div>
            </div>

            {/* Candidate Rules */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 text-slate-700 dark:text-slate-300">
              <h4 className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Proctoring Rules & System Directives
              </h4>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                <li>The server countdown timer begins immediately upon clicking &quot;Start Examination&quot; and runs continuously.</li>
                <li>Switching browser tabs or windows is logged by the telemetry proctoring system.</li>
                <li>Your answers are automatically saved every few seconds and whenever an answer is selected.</li>
                <li>If the allotted time reaches 0:00, the examination will automatically submit and finalize your grade.</li>
                <li>Ensure you have a stable network connection before starting.</li>
              </ul>
            </div>

            {selectedExamData.exam.instructions && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Course Instructor Notes:</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedExamData.exam.instructions}
                </p>
              </div>
            )}

            {/* Checkbox agreement */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-start gap-2.5 cursor-pointer font-bold text-slate-800 dark:text-white">
                <input
                  type="checkbox"
                  checked={agreedToRules}
                  onChange={(e) => setAgreedToRules(e.target.checked)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 mt-0.5 shrink-0"
                />
                <span>I have read and agree to follow all proctored examination rules.</span>
              </label>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex justify-end gap-2.5 pt-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedExamData(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!agreedToRules}
                isLoading={isStarting}
                onClick={handleStartExam}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="font-bold"
              >
                Start Proctored Examination
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
