import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Examination } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Award,
  Flag,
  RotateCcw,
  WifiOff,
  ShieldAlert,
  Send,
  Layers,
  ChevronUp,
  ChevronDown,
  Menu,
  GraduationCap,
} from 'lucide-react';

interface QuestionPayload {
  id: string;
  question_text: string;
  options: string[];
  marks: number;
  order_index: number;
}

interface SubmitResult {
  success: boolean;
  score: number;
  total_marks: number;
  percentage: number;
  is_passed: boolean;
  timed_out?: boolean;
  attempts_left?: number;
  review?: Array<{
    question_id: string;
    question_text?: string;
    options?: string[];
    selected_option_index?: number;
    correct_option_index?: number;
    selected?: number;
    correct?: number;
    is_correct: boolean;
    marks_awarded?: number;
  }>;
  error?: string;
}

// Deterministic seed shuffle for per-attempt question stability across refresh
function seededShuffle<T>(array: T[], seedStr: string): T[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const ExamTake: React.FC = () => {
  const { id: examId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Session & Proctored State
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [deadlineAt, setDeadlineAt] = useState<string | null>(null);
  const [exam, setExam] = useState<Examination | null>(null);
  const [questions, setQuestions] = useState<QuestionPayload[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // User input state
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // Submission & Result state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [examResult, setExamResult] = useState<SubmitResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);

  // Refs for background intervals and listeners
  const answersRef = useRef<Record<string, number>>({});
  answersRef.current = answers;
  const tabSwitchesRef = useRef<number>(0);
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSubmittingRef = useRef(false);

  // 1. Initialize or Resume Examination Attempt
  useEffect(() => {
    if (!examId || !user?.id) return;

    let isMounted = true;
    setIsLoading(true);

    (async () => {
      try {
        // Start or resume attempt via RPC
        const startRes = await dataProvider.startExamAttempt(examId);
        if (!startRes.success || !startRes.attempt_id) {
          alert(startRes.error || 'Could not start examination attempt.');
          navigate('/student/examinations');
          return;
        }

        if (!isMounted) return;
        setAttemptId(startRes.attempt_id);
        setDeadlineAt(startRes.deadline_at || null);

        // Fetch examination details & student questions via RPC
        const [examDetails, questionsList] = await Promise.all([
          dataProvider.getExamByIdAdmin(examId),
          dataProvider.getExamQuestions(startRes.attempt_id),
        ]);

        if (!isMounted) return;
        setExam(examDetails);

        // Shuffle questions if configured
        let finalQuestions = questionsList;
        if (examDetails?.shuffle_questions) {
          finalQuestions = seededShuffle(questionsList, startRes.attempt_id);
        }
        setQuestions(finalQuestions);

        // Restore offline/cached draft answers if any
        const offlineKey = `tnv_exam_offline_answers_${startRes.attempt_id}`;
        const cached = localStorage.getItem(offlineKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setAnswers(parsed);
          } catch (e) {
            console.warn('Failed to parse cached answers:', e);
          }
        }
      } catch (err: any) {
        console.error('Initialization error:', err);
        alert(err.message || 'Error initializing examination session.');
        navigate('/student/examinations');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [examId, user?.id, navigate]);

  // 2. Server-Synced Countdown Timer computed from deadline_at
  useEffect(() => {
    if (!deadlineAt || examResult) return;

    const deadlineTime = new Date(deadlineAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((deadlineTime - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0 && !isSubmittingRef.current && !examResult) {
        // Auto-submit when time runs out
        handleFinalSubmit(true);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deadlineAt, examResult]);

  // 3. Tab Switch Detection (visibilitychange & window blur)
  useEffect(() => {
    if (!attemptId || examResult) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchesRef.current += 1;
        setTabSwitches(tabSwitchesRef.current);
        setShowTabWarning(true);
        setTimeout(() => setShowTabWarning(false), 5000);

        // Save progress with incremented switch count
        dataProvider.saveExamProgress(attemptId, answersRef.current, tabSwitchesRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [attemptId, examResult]);

  // 4. BeforeUnload Warning
  useEffect(() => {
    if (examResult) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'An examination is in progress. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [examResult]);

  // 5. Autosave handler (debounced on answer change + recurring every 20s)
  const saveProgress = useCallback(
    async (currentAnswers: Record<string, number>) => {
      if (!attemptId || examResult) return;

      // Persist locally first for complete offline resilience
      const offlineKey = `tnv_exam_offline_answers_${attemptId}`;
      localStorage.setItem(offlineKey, JSON.stringify(currentAnswers));

      try {
        await dataProvider.saveExamProgress(attemptId, currentAnswers, tabSwitchesRef.current);
        setIsOffline(false);
      } catch (err) {
        console.warn('Network autosave error, answers saved locally:', err);
        setIsOffline(true);
      }
    },
    [attemptId, examResult]
  );

  const handleSelectOption = (qId: string, optionIdx: number) => {
    const updated = { ...answers, [qId]: optionIdx };
    setAnswers(updated);

    // Debounced autosave (1 second)
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(() => {
      saveProgress(updated);
    }, 1000);
  };

  // 20-second recurring background autosave
  useEffect(() => {
    if (!attemptId || examResult) return;
    const interval = setInterval(() => {
      saveProgress(answersRef.current);
    }, 20000);
    return () => clearInterval(interval);
  }, [attemptId, examResult, saveProgress]);

  // 6. Toggle Flag Question
  const handleToggleFlag = (qId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // 7. Final Submit
  const handleFinalSubmit = async (isTimeout: boolean = false) => {
    if (!attemptId || isSubmittingRef.current || examResult) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      const res = await dataProvider.submitExamAttempt(attemptId, answersRef.current);
      setExamResult(res);

      // Trigger Confetti on Pass
      if (res.is_passed) {
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        } catch (e) {
          console.warn('Confetti note:', e);
        }
      }

      // Cleanup local cache
      localStorage.removeItem(`tnv_exam_offline_answers_${attemptId}`);
    } catch (err: any) {
      console.error('Submit error:', err);
      alert(`Submission error: ${err.message || 'Please try again.'}`);
      isSubmittingRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (secs: number | null) => {
    if (secs === null || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isLoading || !exam) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mx-auto"></div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Preparing Secure Examination Environment...
        </p>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: EXAMINATION RESULT SCREEN
  // =========================================================================
  if (examResult) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
        <Card className="p-7 sm:p-10 text-center space-y-6 border-slate-200 dark:border-slate-800 shadow-xl">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${examResult.is_passed
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
              : 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
              }`}
          >
            {examResult.is_passed ? (
              <CheckCircle2 className="w-12 h-12" />
            ) : (
              <AlertTriangle className="w-12 h-12" />
            )}
          </div>

          <div className="space-y-1.5">
            <Badge
              variant={examResult.is_passed ? 'brand' : 'destructive'}
              className="text-xs px-3.5 py-1 font-bold"
            >
              {examResult.is_passed ? 'Examination Passed' : 'Qualification Criteria Not Met'}
            </Badge>

            <h1 className="text-3xl font-black text-slate-900 dark:text-white pt-2">
              Official Examination Results
            </h1>
            <p className="text-xs text-slate-500">{exam.title}</p>
          </div>

          {/* Scoreboard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Marks Scored</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {examResult.score} / {examResult.total_marks}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Percentage</span>
              <span
                className={`text-xl font-black ${examResult.is_passed
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
                  }`}
              >
                {examResult.percentage}%
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Attempts Left</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {examResult.attempts_left ?? 0}
              </span>
            </div>
          </div>

          {/* Certificate or Retake Messaging */}
          <div className="max-w-md mx-auto text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {examResult.is_passed ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-medium">
                Congratulations! Your qualification has been certified on the database and your official course certificate has been issued.
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 font-medium">
                You scored {examResult.percentage}%. The passing threshold is {exam.passing_percentage ?? 50}%. Review the course curriculum to retake.
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link to="/student/examinations">
              <Button variant="outline" size="md">
                Return to Exam Center
              </Button>
            </Link>

            {examResult.is_passed && (
              <Link to="/student/certificates">
                <Button variant="primary" size="md" leftIcon={<Award className="w-4 h-4" />}>
                  View Official Certificate
                </Button>
              </Link>
            )}

            {!examResult.is_passed && (examResult.attempts_left ?? 0) > 0 && (
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/student/examinations')}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Retake Exam ({examResult.attempts_left} attempt left)
              </Button>
            )}
          </div>
        </Card>

        {/* Question-by-Question Review (If show_answer_review is enabled and returned by RPC) */}
        {examResult.review && examResult.review.length > 0 && (
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              Examination Question & Answer Review ({examResult.review.length})
            </h3>

            <div className="space-y-3">
              {examResult.review.map((item, idx) => {
                const q = questions.find((quest) => quest.id === item.question_id);
                const qText = q?.question_text || item.question_text || `Question #${idx + 1}`;
                const options = q?.options || item.options || [];
                const selected_option_index = item.selected ?? item.selected_option_index;
                const correct_option_index = item.correct ?? item.correct_option_index;
                const marks_awarded = item.marks_awarded ?? (item.is_correct ? (q?.marks || 0) : 0);

                return (
                  <Card
                    key={item.question_id || idx}
                    className={`p-5 border space-y-3 ${item.is_correct
                      ? 'border-emerald-200 dark:border-emerald-800/80'
                      : 'border-rose-200 dark:border-rose-800/80'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${item.is_correct
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                        >
                          Q{idx + 1} • {item.is_correct ? 'Correct' : 'Incorrect'} ({marks_awarded} Marks)
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white pt-1">
                          {qText}
                        </h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {options.map((opt, oIdx) => {
                        const isStudentChoice = selected_option_index === oIdx;
                        const isCorrectChoice = correct_option_index === oIdx;

                        let style = 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400';
                        if (isCorrectChoice) {
                          style = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold';
                        } else if (isStudentChoice && !item.is_correct) {
                          style = 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 font-bold';
                        }

                        return (
                          <div key={oIdx} className={`p-2 rounded-xl border flex items-center justify-between ${style}`}>
                            <span>
                              <span className="font-bold mr-1">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                            </span>
                            {isCorrectChoice && <span className="text-[10px] font-extrabold uppercase text-emerald-600">Correct</span>}
                            {isStudentChoice && !isCorrectChoice && (
                              <span className="text-[10px] font-extrabold uppercase text-rose-600">Your Choice</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: ACTIVE PROCTORED EXAMINATION INTERACTION
  // =========================================================================
  const currentQ = questions[currentIdx];
  const isLastQuestion = currentIdx === questions.length - 1;
  const isFirstQuestion = currentIdx === 0;
  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;
  const isTimerCritical = remainingSeconds !== null && remainingSeconds < 300;

  return (
    <div className="min-h-screen pb-16">
      {/* Sticky Top Proctoring Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <GraduationCap className="w-5 h-5 text-brand-600 shrink-0" />
            <div className="truncate">
              <h1 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {exam.title}
              </h1>
              <span className="text-[10px] text-slate-400 block truncate">
                {exam.course?.title || 'Technical Workshop'} • Proctored Mode
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Live Countdown Timer */}
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-mono font-black text-sm transition-colors ${isTimerCritical
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>

            {/* Finish & Submit Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowConfirmModal(true)}
              className="font-bold shadow-md shadow-brand-600/20"
            >
              Submit Exam
            </Button>

            {/* Mobile Palette Toggle Button */}
            <button
              onClick={() => setMobilePaletteOpen(!mobilePaletteOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Toggle question palette"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Warning Toasts (Offline or Tab Switch Alert) */}
      {isOffline && (
        <div className="bg-amber-600 text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 animate-in fade-in">
          <WifiOff className="w-4 h-4" />
          <span>Network connection lost. Reconnecting... (Your answers are safely preserved locally)</span>
        </div>
      )}

      {showTabWarning && (
        <div className="bg-rose-600 text-white text-xs font-bold py-2.5 px-4 text-center flex items-center justify-center gap-2 animate-in slide-in-from-top">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Notice: Switching tabs/windows is recorded by the platform proctoring log ({tabSwitches} logged).</span>
        </div>
      )}

      {/* Main Examination Layout */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Active Question Form (3 Columns) */}
        <div className="lg:col-span-3 space-y-5">
          {currentQ ? (
            <Card className="p-6 sm:p-8 border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              {/* Question Meta Header */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400">
                    Question {currentIdx + 1} of {totalCount}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    • {currentQ.marks || 2} Marks
                  </span>
                </div>

                {/* Flag for Review Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggleFlag(currentQ.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${flaggedQuestions.has(currentQ.id)
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flaggedQuestions.has(currentQ.id) ? 'Flagged for Review' : 'Flag Question'}</span>
                </button>
              </div>

              {/* Question Text (Protected from selection and context menu) */}
              <div
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                onContextMenu={(e) => e.preventDefault()}
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed pt-1"
              >
                {currentQ.question_text}
              </div>

              {/* 4 Interactive Option Cards */}
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = answers[currentQ.id] === oIdx;

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, oIdx)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${isSelected
                        ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 text-brand-950 dark:text-brand-100 ring-2 ring-brand-500/30 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${isSelected
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="text-sm pt-0.5 leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Bar (Previous / Next / Clear Answer) */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  disabled={isFirstQuestion}
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>

                {answers[currentQ.id] !== undefined && (
                  <button
                    type="button"
                    onClick={() => {
                      const copy = { ...answers };
                      delete copy[currentQ.id];
                      setAnswers(copy);
                      saveProgress(copy);
                    }}
                    className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    Clear answer
                  </button>
                )}

                {isLastQuestion ? (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => setShowConfirmModal(true)}
                    className="font-bold shadow-md shadow-brand-600/20"
                  >
                    Review & Submit
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => setCurrentIdx((prev) => Math.min(totalCount - 1, prev + 1))}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="font-bold"
                  >
                    Next Question
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-xs text-slate-400">
              No questions found for this examination.
            </Card>
          )}
        </div>

        {/* Right Column: Question Palette Grid (Desktop) */}
        <div className="hidden lg:block lg:col-span-1 space-y-4">
          <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Question Palette
              </span>
              <span className="text-xs font-mono font-bold text-brand-600">
                {answeredCount}/{totalCount} Answered
              </span>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400"></span>
                <span>Flagged</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700"></span>
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded ring-2 ring-brand-500 bg-white"></span>
                <span>Current</span>
              </div>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isCurrent = currentIdx === idx;
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = flaggedQuestions.has(q.id);

                let badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
                if (isFlagged) {
                  badgeStyle = 'bg-amber-400 text-slate-900 font-bold';
                } else if (isAnswered) {
                  badgeStyle = 'bg-emerald-600 text-white font-bold';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition-all ${badgeStyle} ${isCurrent ? 'ring-2 ring-brand-500 scale-105 shadow-sm' : 'hover:opacity-80'
                      }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Submit Trigger */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmModal(true)}
                className="w-full font-bold"
              >
                Submit Examination
              </Button>
            </div>
          </Card>
        </div>

        {/* Mobile Palette Bottom Drawer / Modal */}
        {mobilePaletteOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex flex-col justify-end">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Question Palette ({answeredCount}/{totalCount})
                </span>
                <button
                  onClick={() => setMobilePaletteOpen(false)}
                  className="text-xs font-bold text-slate-500"
                >
                  Close
                </button>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = currentIdx === idx;
                  const isAnswered = answers[q.id] !== undefined;
                  const isFlagged = flaggedQuestions.has(q.id);

                  let badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
                  if (isFlagged) {
                    badgeStyle = 'bg-amber-400 text-slate-900 font-bold';
                  } else if (isAnswered) {
                    badgeStyle = 'bg-emerald-600 text-white font-bold';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setCurrentIdx(idx);
                        setMobilePaletteOpen(false);
                      }}
                      className={`h-10 rounded-xl text-xs font-mono font-bold flex items-center justify-center ${badgeStyle} ${isCurrent ? 'ring-2 ring-brand-500 scale-105' : ''
                        }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Submit Dialog */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Finalize & Submit Examination"
        description="Verify your answers before completing your proctored attempt"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <p className="font-extrabold text-sm text-slate-900 dark:text-white">
              You answered {answeredCount} of {totalCount} questions.
            </p>
            {totalCount - answeredCount > 0 ? (
              <p className="text-rose-600 dark:text-rose-400 font-semibold">
                You have {totalCount - answeredCount} unanswered question{totalCount - answeredCount !== 1 ? 's' : ''}. Unanswered questions will receive 0 marks.
              </p>
            ) : (
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                All {totalCount} questions have been answered!
              </p>
            )}
          </div>

          <p className="text-slate-500 leading-relaxed">
            Once submitted, your responses are securely evaluated by the server. Your score, percentage, and qualification certificate status will be finalized immediately.
          </p>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmModal(false)}
            >
              Back to Questions
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={() => handleFinalSubmit(false)}
              className="font-bold"
            >
              Confirm & Submit Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
