import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import {
  Module,
  Session,
  VideoLecture,
  LearningMaterial,
  Quiz,
  QuizAttempt,
} from '../../types/database';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Video,
  FileDown,
  CheckCircle2,
  Circle,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Award,
} from 'lucide-react';

export const ModuleView: React.FC = () => {
  const { id: courseId, moduleId } = useParams<{ id: string; moduleId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [video, setVideo] = useState<VideoLecture | null>(null);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Quiz state inside session
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<QuizAttempt | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  useEffect(() => {
    if (!moduleId || !user?.id) return;

    const loadSessionData = async () => {
      setIsLoading(true);
      const [modulesList, sList, matList, qList, progressList] = await Promise.all([
        dataProvider.getModules(courseId || ''),
        dataProvider.getSessions(moduleId),
        dataProvider.getLearningMaterials(courseId),
        dataProvider.getQuizzes(courseId),
        dataProvider.getSessionProgress(user.id),
      ]);

      const foundMod = modulesList.find((m) => m.id === moduleId);
      setCurrentModule(foundMod || null);
      setSessions(sList);
      setMaterials(matList);
      setQuizzes(qList);

      // Determine active session
      const targetSessionId = searchParams.get('session');
      let target = sList.find((s) => s.id === targetSessionId) || sList[0];
      if (target) {
        setActiveSession(target);
        const v = await dataProvider.getVideoBySession(target.id);
        setVideo(v);
        const done = progressList.some((p) => p.session_id === target.id && p.is_completed);
        setIsCompleted(done);
      }
      setIsLoading(false);
    };

    loadSessionData();
  }, [moduleId, courseId, user?.id, searchParams]);

  const handleSelectSession = async (s: Session) => {
    setActiveSession(s);
    setSearchParams({ session: s.id });
    const v = await dataProvider.getVideoBySession(s.id);
    setVideo(v);
    if (user?.id) {
      const progress = await dataProvider.getSessionProgress(user.id);
      setIsCompleted(progress.some((p) => p.session_id === s.id && p.is_completed));
    }
  };

  const handleToggleComplete = async () => {
    if (!activeSession || !user?.id) return;
    const newStatus = await dataProvider.toggleSessionCompleted(user.id, activeSession.id);
    setIsCompleted(newStatus);
  };

  const handleQuizAnswer = (questionId: string, optionIndex: number) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleQuizSubmit = async (quizId: string) => {
    if (!user?.id) return;
    setIsSubmittingQuiz(true);
    const answersArray = Object.entries(quizAnswers).map(([question_id, selected_option_index]) => ({
      question_id,
      selected_option_index,
    }));

    const result = await dataProvider.submitQuiz(quizId, user.id, answersArray);
    setQuizResult(result);
    setIsSubmittingQuiz(false);
  };

  if (isLoading || !currentModule) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-semibold uppercase">Loading Session Player...</p>
      </div>
    );
  }

  const activeIndex = sessions.findIndex((s) => s.id === activeSession?.id);
  const prevSession = activeIndex > 0 ? sessions[activeIndex - 1] : null;
  const nextSession = activeIndex < sessions.length - 1 ? sessions[activeIndex + 1] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <Link
            to={`/student/courses/${courseId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Course Overview
          </Link>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{currentModule.title}</span>
          </h1>
        </div>

        {activeSession && (
          <Button
            variant={isCompleted ? 'success' : 'outline'}
            size="sm"
            onClick={handleToggleComplete}
            leftIcon={isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
          >
            {isCompleted ? 'Marked Completed' : 'Mark Session Complete'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Player & Content Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Video Lecture Player */}
          {video ? (
            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-md">
              <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
                <iframe
                  src={video.drive_url}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={video.title}
                />
              </div>

              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{video.title}</h2>
                  <Badge variant="brand">{video.duration_minutes} Mins</Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {video.description || 'Google Drive hosted video lecture. Click fullscreen for optimal view.'}
                </p>
                <div className="pt-2">
                  <a
                    href={video.drive_url.replace('/preview', '/view')}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:underline font-semibold"
                  >
                    <span>Open in Google Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center space-y-3">
              <Video className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-900 dark:text-white">Reading & Lab Session</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Review the downloadable handouts and complete the module self-assessment below.
              </p>
            </Card>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            {prevSession ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectSession(prevSession)}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Previous Session
              </Button>
            ) : (
              <div></div>
            )}

            {nextSession && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSelectSession(nextSession)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Next Session
              </Button>
            )}
          </div>

          {/* Downloadable Notes & Learning Materials */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <FileDown className="w-4 h-4 text-brand-600" />
              <span>Session Learning Materials & PDF Handouts</span>
            </h3>

            {materials.length > 0 ? (
              <div className="space-y-3">
                {materials.map((mat) => (
                  <div
                    key={mat.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{mat.title}</h4>
                      <p className="text-[11px] text-slate-500">{mat.description}</p>
                    </div>

                    <a href={mat.file_url || '#'} target="_blank" rel="noreferrer" download>
                      <Button variant="outline" size="sm" leftIcon={<FileDown className="w-3.5 h-3.5" />}>
                        Download PDF
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No additional attachments for this session.</p>
            )}
          </Card>

          {/* Module-Wise Quiz Assessment */}
          {quizzes.length > 0 && (
            <Card className="p-6 space-y-5 border-brand-200 dark:border-brand-900/60">
              <div className="space-y-1">
                <Badge variant="brand">Self-Assessment Quiz</Badge>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {quizzes[0].title}
                </h3>
                <p className="text-xs text-slate-500">
                  Time limit: {quizzes[0].time_limit_minutes} mins • Passing: {quizzes[0].passing_percentage}%
                </p>
              </div>

              {quizResult ? (
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
                    Quiz Evaluated: {quizResult.score} / {quizResult.total_marks} Marks ({quizResult.percentage}%)
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    {quizResult.is_passed ? 'Congratulations! You met the passing standard.' : 'Review the lectures and retry to improve.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {quizzes[0].questions?.map((q, qIdx) => (
                    <div key={q.id} className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Question {qIdx + 1}: {q.question_text}
                      </p>

                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              quizAnswers[q.id] === optIdx
                                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-semibold'
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`quiz-${q.id}`}
                              checked={quizAnswers[q.id] === optIdx}
                              onChange={() => handleQuizAnswer(q.id, optIdx)}
                              className="text-brand-600 focus:ring-brand-500"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleQuizSubmit(quizzes[0].id)}
                    isLoading={isSubmittingQuiz}
                    className="w-full font-bold"
                  >
                    Submit Quiz for Instant Scoring
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Sidebar: Sessions in This Module */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Sessions in this Module ({sessions.length})
            </h3>

            <div className="space-y-2">
              {sessions.map((s, idx) => {
                const isActive = activeSession?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSession(s)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between text-xs ${
                      isActive
                        ? 'bg-brand-600 text-white font-bold shadow-md'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span className="text-[10px] opacity-75">{idx + 1}.</span>
                      <span className="truncate">{s.title}</span>
                    </div>
                    <span className="text-[10px] opacity-70 shrink-0">{s.duration_minutes}m</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
