import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Examination, ExamQuestion, ExamAttempt } from '../../types/database';
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
  Send,
} from 'lucide-react';

export const ExamTake: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Examination | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState<number>(45 * 60); // seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [examResult, setExamResult] = useState<ExamAttempt | null>(null);

  useEffect(() => {
    if (!id || !user?.id) return;
    dataProvider.getExamById(id).then((e) => {
      if (!e) {
        navigate('/student/examinations');
        return;
      }
      setExam(e);
      setQuestions(e.questions || []);
      setTimeLeft(e.duration_minutes * 60);
    });
  }, [id, user?.id, navigate]);

  // Countdown Timer
  useEffect(() => {
    if (examResult) return;
    if (timeLeft <= 0) {
      handleFinalSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, examResult]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleFinalSubmit = async () => {
    if (!exam || !user?.id || isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    const attempt = await dataProvider.submitExam(exam.id, user.id, answers);
    setExamResult(attempt);
    setIsSubmitting(false);
  };

  if (!exam) {
    return (
      <div className="py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-semibold uppercase">Preparing Proctored Environment...</p>
      </div>
    );
  }

  // Result screen after submission
  if (examResult) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-6 animate-in fade-in">
        <Card className="p-8 text-center space-y-6 border-brand-200 dark:border-brand-800 shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            {examResult.is_passed ? <CheckCircle2 className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10 text-amber-500" />}
          </div>

          <div className="space-y-1">
            <Badge variant={examResult.is_passed ? 'success' : 'destructive'} className="text-xs px-3 py-1 font-bold">
              {examResult.is_passed ? 'Examination Passed' : 'Minimum Score Not Met'}
            </Badge>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              Official Examination Result
            </h2>
            <p className="text-xs text-slate-500">{exam.title}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block">Total Marks:</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-base">
                {examResult.score} / {examResult.total_marks}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Percentage:</span>
              <span className="font-extrabold text-brand-600 dark:text-brand-400 text-base">
                {examResult.percentage}%
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            {examResult.is_passed
              ? 'Your score has been certified on the database. You are now qualified for workshop certificate generation.'
              : 'You require at least 50% to satisfy certification requirements. Review the course sessions and attempt the retake.'}
          </p>

          <div className="flex justify-center gap-3 pt-2">
            <Link to="/student/examinations">
              <Button variant="outline" size="md">
                Return to Exam Center
              </Button>
            </Link>
            <Link to="/student/certificates">
              <Button variant="primary" size="md" rightIcon={<Award className="w-4 h-4" />}>
                Check Certificate Eligibility
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Proctored Exam Header Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-lg">
        <div>
          <h2 className="font-bold text-sm tracking-tight truncate max-w-md">{exam.title}</h2>
          <span className="text-[11px] text-slate-400">
            Question {currentIdx + 1} of {questions.length} • {answeredCount} Answered
          </span>
        </div>

        {/* Countdown Timer */}
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold shadow-inner ${
          timeLeft < 300 ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-800 text-amber-400'
        }`}>
          <Clock className="w-4 h-4" />
          <span>{formatTimer(timeLeft)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Question Interface */}
        <div className="lg:col-span-8 space-y-6">
          {currentQ && (
            <Card className="p-6 sm:p-8 space-y-6 shadow-md border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  Question {currentIdx + 1} ({currentQ.marks} Marks)
                </span>
                <span className="text-xs text-slate-400">Single Choice</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                {currentQ.question_text}
              </h3>

              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = answers[currentQ.id] === optIdx;
                  return (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-3.5 p-4 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-semibold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`exam-q-${currentQ.id}`}
                        checked={isSelected}
                        onChange={() => handleSelectOption(currentQ.id, optIdx)}
                        className="text-brand-600 focus:ring-brand-500 h-4 w-4"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>

                {currentIdx < questions.length - 1 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setShowConfirmModal(true)}
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Review & Submit Exam
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Question Palette Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Question Palette ({answeredCount} / {questions.length})
            </h4>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentIdx;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 w-full rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                      isCurrent
                        ? 'ring-2 ring-brand-500 ring-offset-2 bg-brand-600 text-white'
                        : isAnswered
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-1.5 text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-600"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700"></span>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded ring-2 ring-brand-500 bg-brand-600"></span>
                <span>Current Question</span>
              </div>
            </div>

            <Button
              variant="success"
              size="md"
              className="w-full font-bold mt-4"
              onClick={() => setShowConfirmModal(true)}
            >
              Submit Examination
            </Button>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Examination Submission"
        description="Are you ready to submit your answers for evaluation?"
        maxWidth="sm"
      >
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <p>
            You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
          </p>
          <p className="text-amber-600 font-medium">
            Once submitted, your answers will be locked and graded on the server immediately.
          </p>

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)}>
              Keep Answering
            </Button>
            <Button variant="success" size="sm" onClick={handleFinalSubmit} isLoading={isSubmitting}>
              Confirm and Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
