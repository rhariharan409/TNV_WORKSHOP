import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Course, Module, Session, SessionProgress, Quiz } from '../../types/database';
import { parseGoogleDriveLink } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { TopLeftWavyAccent, BottomRightWavyAccent } from '../../components/ui/WavyDecorations';
import {
  Layers,
  Video,
  FileText,
  FileDown,
  FileCheck2,
  CheckCircle2,
  Circle,
  PlayCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Award,
  GraduationCap,
  Lock,
  Unlock,
  Bookmark,
  ExternalLink,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckSquare,
  AlertTriangle,
  BookOpen,
  MessageSquare,
  Bell,
  Info,
  Send,
} from 'lucide-react';

// Helper to ensure Quiz / Milestone Assessments are ALWAYS ordered LAST in every module
export const sortModuleSessions = (sessions: Session[]): Session[] => {
  if (!sessions || sessions.length <= 1) return sessions || [];

  const nonQuiz: Session[] = [];
  const quizzes: Session[] = [];

  sessions.forEach((s) => {
    const isQuiz =
      s.session_type === 'quiz' ||
      Boolean(s.description?.includes('"is_quiz":true')) ||
      s.title?.toLowerCase().includes('assessment') ||
      s.title?.toLowerCase().includes('quiz');
    if (isQuiz) {
      quizzes.push(s);
    } else {
      nonQuiz.push(s);
    }
  });

  nonQuiz.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  quizzes.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  return [...nonQuiz, ...quizzes];
};

export const CourseView: React.FC = () => {
  const { id: routeId, moduleId: routeModuleId } = useParams<{ id: string; moduleId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [sessionsMap, setSessionsMap] = useState<Record<string, Session[]>>({});
  const [progressList, setProgressList] = useState<SessionProgress[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active navigation selection
  const [activeModuleId, setActiveModuleId] = useState<string>('');
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Top tabs: curriculum, about, announcements, bookmarks, qa
  const [activeTab, setActiveTab] = useState<'curriculum' | 'about' | 'announcements' | 'bookmarks' | 'qa'>('curriculum');
  const [bookmarkedSessionIds, setBookmarkedSessionIds] = useState<Set<string>>(new Set());

  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);

  // Locking system: stores module IDs & quiz IDs that student passed with criteria
  const [passedQuizzes, setPassedQuizzes] = useState<Set<string>>(new Set());

  // Interactive Quiz Taking state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizModalResult, setQuizModalResult] = useState<{
    isOpen: boolean;
    score: number;
    totalMarks: number;
    percentage: number;
    isPassed: boolean;
    passBenchmark: number;
    nextModuleTitle?: string;
    nextModuleId?: string;
  } | null>(null);

  // Final Examination state
  const [courseExam, setCourseExam] = useState<any | null>(null);
  const [examAttempt, setExamAttempt] = useState<any | null>(null);
  const [isExamPassed, setIsExamPassed] = useState<boolean>(false);

  // Assignment submission state
  const [assignmentText, setAssignmentText] = useState('');
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);

  // Q&A forum state
  const [newQuestion, setNewQuestion] = useState('');
  const [qaThreads, setQaThreads] = useState<Array<{ id: string; user: string; text: string; time: string; replies: number }>>([
    {
      id: '1',
      user: 'Praveen K. (Student)',
      text: 'Could someone clarify the difference between Level 1 and Level 2 instruction encoding in the lecture?',
      time: '2 hours ago',
      replies: 2,
    },
    {
      id: '2',
      user: 'Thamilaran (Instructor)',
      text: 'Remember to check the lecture slides in Section 1.3 before taking the Week 1 Graded Quiz.',
      time: 'Yesterday',
      replies: 5,
    },
  ]);

  // Load course and curriculum
  useEffect(() => {
    // If routeId is missing or literally "undefined", recover automatically
    if (!routeId || routeId === 'undefined') {
      const recoverCourse = async () => {
        try {
          if (user?.id) {
            const enrs = await dataProvider.getStudentCourseEnrollments(user.id);
            if (enrs.length > 0) {
              const targetId = enrs[0].course?.id || enrs[0].course_id;
              if (targetId && targetId !== 'undefined') {
                navigate(`/student/courses/${targetId}`, { replace: true });
                return;
              }
            }
          }
          const allCourses = await dataProvider.getCourses({ publishedOnly: true });
          if (allCourses.length > 0 && allCourses[0].id) {
            navigate(`/student/courses/${allCourses[0].id}`, { replace: true });
            return;
          }
        } catch (err) {
          console.error('Failed to recover course ID:', err);
        }
        navigate('/student/my-courses', { replace: true });
      };
      recoverCourse();
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const coursesList = await dataProvider.getCourses().catch(() => []);
        let currentCourse: Course | null | undefined = coursesList.find((c) => c.id === routeId || c.slug === routeId);

        if (!currentCourse) {
          currentCourse = await dataProvider.getCourseById(routeId).catch(() => null);
        }

        if (!currentCourse) {
          // If the course couldn't be found, try first published course
          if (coursesList.length > 0) {
            currentCourse = coursesList[0];
          } else {
            setIsLoading(false);
            return;
          }
        }

        setCourse(currentCourse);

        // Fetch modules safely using the resolved course's ID
        let modList: Module[] = [];
        try {
          modList = await dataProvider.getModules(currentCourse.id);
        } catch (mErr) {
          console.error('Failed to load modules:', mErr);
          modList = [];
        }
        setModules(modList);

        // Fetch sessions for all modules (Quizzes always ordered LAST)
        const map: Record<string, Session[]> = {};
        for (const m of modList) {
          try {
            const rawList = await dataProvider.getSessions(m.id);
            map[m.id] = sortModuleSessions(rawList);
          } catch {
            map[m.id] = [];
          }
        }
        setSessionsMap(map);

        // Fetch user progress, quizzes, and course final exam status
        if (user?.id) {
          const [userProg, courseQuizzes, finalExam, examStatus] = await Promise.all([
            dataProvider.getSessionProgress(user.id).catch(() => []),
            dataProvider.getQuizzes(currentCourse.id).catch(() => []),
            dataProvider.getCourseFinalExam(currentCourse.id).catch(() => null),
            dataProvider.getStudentCourseExamStatus(user.id, currentCourse.id).catch(() => null),
          ]);
          setProgressList(userProg);
          setQuizzes(courseQuizzes);
          setCourseExam(finalExam);
          setExamAttempt(examStatus?.latestAttempt || null);
          setIsExamPassed(Boolean(examStatus?.isPassed));

          // Load passed quizzes from localStorage
          const savedPassed = localStorage.getItem(`passed_quizzes_${user.id}_${currentCourse.id}`);
          if (savedPassed) {
            try {
              setPassedQuizzes(new Set(JSON.parse(savedPassed)));
            } catch {}
          }
        }

        // Set default active module and session
        const initialModuleId = routeModuleId || (modList[0]?.id ?? '');
        setActiveModuleId(initialModuleId);

        const initialSessions = map[initialModuleId] || [];
        const querySession = searchParams.get('session');
        const initialSessionId = querySession || (initialSessions[0]?.id ?? '');
        setActiveSessionId(initialSessionId);

        // Expand all modules by default
        const expMap: Record<string, boolean> = {};
        modList.forEach((m) => {
          expMap[m.id] = true;
        });
        setExpandedModules(expMap);
      } catch (err) {
        console.error('Failed to load course view:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [routeId, routeModuleId, user?.id]);

  // ----------------------------------------------------
  // LOCKING SYSTEM COMPUTATION
  // ----------------------------------------------------
  // Module 0 is ALWAYS unlocked.
  // Module N (N > 0) is UNLOCKED only if Module N-1 was completely completed:
  // 1. ALL prerequisite sessions (lessons, videos, assignments) in Module N-1 MUST be completed.
  // 2. The milestone quiz in Module N-1 (if any) MUST be passed with >= passing percentage benchmark.
  const isModuleUnlocked = (moduleIndex: number, currentProg: SessionProgress[] = progressList): boolean => {
    if (moduleIndex === 0) return true;
    const prevModule = modules[moduleIndex - 1];
    if (!prevModule) return true;

    const prevSessions = sessionsMap[prevModule.id] || [];
    if (prevSessions.length === 0) return true;

    // Prerequisite sessions (lectures, readings, assignments)
    const nonQuizSessions = prevSessions.filter(
      (s) =>
        s.session_type !== 'quiz' &&
        !s.description?.includes('"is_quiz":true') &&
        !s.title?.toLowerCase().includes('assessment') &&
        !s.title?.toLowerCase().includes('quiz')
    );
    const prevQuiz = prevSessions.find(
      (s) =>
        s.session_type === 'quiz' ||
        Boolean(s.description?.includes('"is_quiz":true')) ||
        s.title?.toLowerCase().includes('assessment') ||
        s.title?.toLowerCase().includes('quiz')
    );

    // 1. ALL lectures, readings, and assignments in the previous module MUST be completed!
    const allNonQuizCompleted =
      nonQuizSessions.length === 0 ||
      nonQuizSessions.every((s) => currentProg.some((p) => p.session_id === s.id && p.is_completed));

    if (!allNonQuizCompleted) {
      return false;
    }

    // 2. If previous module has a milestone quiz, it MUST also be passed!
    if (prevQuiz) {
      const isQuizPassed =
        passedQuizzes.has(prevModule.id) ||
        passedQuizzes.has(prevQuiz.id) ||
        currentProg.some((p) => p.session_id === prevQuiz.id && p.is_completed);
      return isQuizPassed;
    }

    // 3. If no quiz, completing all sessions unlocks the module
    return true;
  };

  // Helper to get active module index
  const activeModuleIndex = modules.findIndex((m) => m.id === activeModuleId);
  const activeModule = modules[activeModuleIndex] || modules[0];
  const activeSessions = activeModule ? sessionsMap[activeModule.id] || [] : [];
  const activeSession = activeSessions.find((s) => s.id === activeSessionId) || activeSessions[0];
  const isCurrentModuleLocked = !isModuleUnlocked(activeModuleIndex);

  // Fallback on-demand video loader for current session
  useEffect(() => {
    if (!activeSessionId || !activeModuleId) return;

    const currSess = (sessionsMap[activeModuleId] || []).find((s) => s.id === activeSessionId);
    if (!currSess?.drive_url && !currSess?.video_lecture?.drive_url && !currSess?.video_lectures?.length) {
      dataProvider.getVideoBySession(activeSessionId).then((vl) => {
        if (vl && vl.drive_url) {
          setSessionsMap((prev) => {
            const modSessions = prev[activeModuleId] || [];
            return {
              ...prev,
              [activeModuleId]: modSessions.map((s) =>
                s.id === activeSessionId
                  ? {
                      ...s,
                      drive_url: vl.drive_url,
                      video_lecture: vl,
                      video_lectures: [vl],
                      content_data: {
                        video_links: [
                          {
                            id: vl.id,
                            title: vl.title || s.title || 'Lecture Video',
                            url: vl.drive_url,
                            duration_minutes: vl.duration_minutes || 45,
                          },
                        ],
                      },
                    }
                  : s
              ),
            };
          });
        }
      });
    }
  }, [activeSessionId, activeModuleId]);

  // Overall course progress
  const allSessions = Object.values(sessionsMap).flat();
  const totalSessionsCount = allSessions.length;
  const completedSessionsCount = progressList.filter(
    (p) => p.is_completed && allSessions.some((s) => s.id === p.session_id)
  ).length;
  const allSessionsDone = totalSessionsCount > 0 && completedSessionsCount >= totalSessionsCount;
  const hasCourseExam = Boolean(courseExam);

  // Requirement:
  // - If NO final exam: 100% when all modules/sessions are completed.
  // - If HAS final exam: 100% ONLY when all sessions are completed AND final exam is passed!
  //   Sessions completed alone gives up to 80% (capped), awaiting final exam.
  const progressPercent = (() => {
    if (totalSessionsCount === 0) return 0;
    if (!hasCourseExam) {
      return Math.round((completedSessionsCount / totalSessionsCount) * 100);
    }
    if (allSessionsDone && isExamPassed) {
      return 100;
    }
    if (allSessionsDone && !isExamPassed) {
      return 80; // Curriculum completed, awaiting passing final exam for 100%
    }
    return Math.round((completedSessionsCount / totalSessionsCount) * 80);
  })();

  const isCourseCompleted = !hasCourseExam
    ? (allSessionsDone && totalSessionsCount > 0)
    : (allSessionsDone && isExamPassed);

  // Auto-sync course enrollment progress to Supabase
  useEffect(() => {
    if (user?.id && course?.id && progressPercent !== undefined) {
      dataProvider.updateCourseEnrollmentProgress(user.id, course.id, progressPercent, isCourseCompleted);
    }
  }, [user?.id, course?.id, progressPercent, isCourseCompleted]);

  // Toggle module accordion
  const toggleModuleAccordion = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  // Handle selecting a session
  const handleSelectSession = (modId: string, sessId: string, isLocked: boolean) => {
    setActiveModuleId(modId);
    setActiveSessionId(sessId);
    setSearchParams({ module: modId, session: sessId });
    setQuizAnswers({});
    setActiveVideoIndex(0);
    try {
      if (user?.id) {
        const cached = localStorage.getItem(`assignment_sub_${user.id}_${sessId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setAssignmentText(parsed.text || '');
          setAssignmentSubmitted(true);
        } else {
          setAssignmentText('');
          setAssignmentSubmitted(false);
        }
      }
    } catch {
      setAssignmentText('');
      setAssignmentSubmitted(false);
    }
  };

  const isSessionDone = (sId: string) => progressList.some((p) => p.session_id === sId && p.is_completed);

  // Mark session as completed (does not toggle off if already completed)
  const handleMarkCompleted = async (sessId: string): Promise<SessionProgress[] | undefined> => {
    if (!user?.id || !sessId) return;
    if (isSessionDone(sessId)) return progressList;

    // Optimistically update progressList immediately so progressPercent and module unlocks update right away
    const optimisticProg: SessionProgress[] = (() => {
      const existingIdx = progressList.findIndex((p) => p.session_id === sessId);
      if (existingIdx >= 0) {
        const next = [...progressList];
        next[existingIdx] = { ...next[existingIdx], is_completed: true, completed_at: new Date().toISOString() };
        return next;
      }
      return [
        ...progressList,
        {
          id: `prog-${Date.now()}`,
          student_id: user.id,
          session_id: sessId,
          is_completed: true,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ];
    })();
    setProgressList(optimisticProg);

    try {
      await dataProvider.updateSessionProgress(user.id, sessId, true);
      const updated = await dataProvider.getSessionProgress(user.id);
      if (updated && updated.length > 0) {
        setProgressList(updated);
        return updated;
      }
      return optimisticProg;
    } catch (err: any) {
      console.error('Failed to mark session as completed:', err);
      return optimisticProg;
    }
  };

  // Toggle mark completed
  const handleToggleCompleted = async (sessId: string) => {
    if (!user?.id) return;
    try {
      const newStatus = await dataProvider.toggleSessionCompleted(user.id, sessId);
      const updated = await dataProvider.getSessionProgress(user.id);
      setProgressList(updated);
    } catch (err: any) {
      console.error('Failed to update progress:', err);
    }
  };

  // Toggle bookmark
  const toggleBookmark = (sessId: string) => {
    setBookmarkedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessId)) next.delete(sessId);
      else next.add(sessId);
      return next;
    });
  };

  // Extract quiz data for active quiz session
  const getSessionQuizData = (sess: Session) => {
    // 1. Check if description has embedded quiz JSON
    if (sess.description && sess.description.includes('"is_quiz":true')) {
      try {
        const parsed = JSON.parse(sess.description);
        const passBenchmark = Number(parsed.passing_percentage) || 50;
        return {
          quiz_title: parsed.quiz_title || sess.title,
          quiz_description: parsed.quiz_description || `Complete this milestone assessment. Minimum ${passBenchmark}% required to unlock the next module.`,
          passing_percentage: passBenchmark,
          time_limit_minutes: parsed.time_limit_minutes || 15,
          questions: parsed.questions || [],
        };
      } catch {}
    }

    // 2. Check if content_data has quiz details
    if (sess.content_data?.is_quiz || sess.content_data?.questions) {
      const passBenchmark = Number(sess.content_data.passing_percentage) || 50;
      return {
        quiz_title: sess.content_data.quiz_title || sess.title,
        quiz_description: sess.content_data.quiz_description || `Complete this milestone assessment. Minimum ${passBenchmark}% required to unlock the next module.`,
        passing_percentage: passBenchmark,
        time_limit_minutes: sess.content_data.time_limit_minutes || 15,
        questions: sess.content_data.questions || [],
      };
    }

    // 3. Check quizzes table
    const matched = quizzes.find((q) => q.session_id === sess.id || q.module_id === sess.module_id);
    if (matched && matched.questions && matched.questions.length > 0) {
      const passBenchmark = Number(matched.passing_percentage) || 50;
      return {
        quiz_title: matched.title,
        quiz_description: matched.description || `Complete this milestone assessment. Minimum ${passBenchmark}% required to unlock the next module.`,
        passing_percentage: passBenchmark,
        time_limit_minutes: matched.time_limit_minutes || 15,
        questions: matched.questions,
      };
    }

    // 4. Fallback standard curriculum quiz questions
    return {
      quiz_title: `${sess.title} Assessment`,
      quiz_description: 'Complete this comprehensive assessment to test your mastery. Minimum 50% required to unlock the next module.',
      passing_percentage: 50,
      time_limit_minutes: 15,
      questions: [
        {
          id: 'q1',
          question_text: `What is the fundamental architectural principle introduced in ${activeModule?.title || 'this module'}?`,
          options: [
            'Systematic modular decomposition and standardized interfaces',
            'Arbitrary global memory mutation without locks',
            'Unsynchronized peer process execution',
            'Monolithic non-extensible control flow',
          ],
          correct_option_index: 0,
          marks: 1,
        },
        {
          id: 'q2',
          question_text: 'Which practice ensures optimal performance and maintainability?',
          options: [
            'Adhering to verified architectural standards and thorough automated testing',
            'Skipping verification protocols in production',
            'Hardcoding dynamic system parameters',
            'Bypassing row-level security checks',
          ],
          correct_option_index: 0,
          marks: 1,
        },
        {
          id: 'q3',
          question_text: 'What is the recommended approach for handling state transitions?',
          options: [
            'Deterministic state machines with validated input boundaries',
            'Uncontrolled side-effects in render loops',
            'Shared mutable global pointers',
            'Discarding error acknowledgments',
          ],
          correct_option_index: 0,
          marks: 1,
        },
      ],
    };
  };

  // Submit quiz and grade
  const handleQuizSubmit = async (sess: Session, quizData: any) => {
    setIsSubmittingQuiz(true);
    let earnedScore = 0;
    let totalMarks = 0;
    const questions = quizData.questions || [];

    questions.forEach((q: any) => {
      const qMarks = Number(q.marks) || 1;
      totalMarks += qMarks;
      const selected = quizAnswers[q.id];
      if (selected !== undefined && Number(selected) === Number(q.correct_option_index)) {
        earnedScore += qMarks;
      }
    });

    const passBenchmark = Number(quizData.passing_percentage) || 50;
    const percentage = totalMarks > 0 ? Math.round((earnedScore / totalMarks) * 100) : 100;
    const isPassed = percentage >= passBenchmark;

    if (user?.id) {
      try {
        localStorage.setItem(
          `quiz_score_${user.id}_${sess.id}`,
          JSON.stringify({
            session_id: sess.id,
            module_id: sess.module_id,
            title: sess.title,
            score: earnedScore,
            total_marks: totalMarks,
            percentage,
            isPassed,
            submitted_at: new Date().toISOString(),
          })
        );
      } catch (e) {
        console.warn('Failed to cache quiz score', e);
      }

      try {
        await dataProvider.submitQuiz(
          sess.id,
          user.id,
          Object.entries(quizAnswers).map(([qid, ans]) => ({
            question_id: qid,
            selected_option_index: ans,
          }))
        );
      } catch (e) {
        console.warn('submitQuiz server sync fallback:', e);
      }

      if (isPassed) {
        // Mark session as complete
        await dataProvider.toggleSessionCompleted(user.id, sess.id);
        const updatedProg = await dataProvider.getSessionProgress(user.id);
        setProgressList(updatedProg);

        // Record passed module
        const newPassed = new Set(passedQuizzes);
        newPassed.add(sess.module_id);
        newPassed.add(sess.id);
        setPassedQuizzes(newPassed);
        localStorage.setItem(`passed_quizzes_${user.id}_${course?.id}`, JSON.stringify([...newPassed]));
      }
    }

    const currentModIdx = modules.findIndex((m) => m.id === sess.module_id);
    const nextMod = currentModIdx >= 0 && currentModIdx < modules.length - 1 ? modules[currentModIdx + 1] : null;

    setQuizModalResult({
      isOpen: true,
      score: earnedScore,
      totalMarks,
      percentage,
      isPassed,
      passBenchmark,
      nextModuleTitle: nextMod ? nextMod.title : undefined,
      nextModuleId: nextMod ? nextMod.id : undefined,
    });
    setIsSubmittingQuiz(false);
  };

  // Next session navigation
  const handleNavigateNext = async () => {
    let currentProg = progressList;
    if (activeSession) {
      const isQuiz =
        activeSession.session_type === 'quiz' ||
        Boolean(activeSession.description?.includes('"is_quiz":true')) ||
        activeSession.title?.toLowerCase().includes('assessment') ||
        activeSession.title?.toLowerCase().includes('quiz') ||
        quizzes.some((q) => q.session_id === activeSession.id);

      const isAssignment =
        activeSession.session_type === 'assignment' ||
        Boolean(activeSession.title && activeSession.title.toLowerCase().includes('assignment')) ||
        Boolean(activeSession.title && activeSession.title.toLowerCase().includes('project')) ||
        Boolean(activeSession.title && activeSession.title.toUpperCase().includes('CREATE AN HTML'));

      // Mark video, lesson, document, link sessions completed before advancing
      if (!isQuiz && !isAssignment) {
        const res = await handleMarkCompleted(activeSession.id);
        if (res) {
          currentProg = res;
        }
      }
    }

    const curIdx = activeSessions.findIndex((s) => s.id === activeSession?.id);
    if (curIdx < activeSessions.length - 1) {
      const nextSess = activeSessions[curIdx + 1];
      handleSelectSession(activeModuleId, nextSess.id, false);
    } else {
      // Jump to next module if unlocked
      const nextModIdx = activeModuleIndex + 1;
      if (nextModIdx < modules.length && isModuleUnlocked(nextModIdx, currentProg)) {
        const nextMod = modules[nextModIdx];
        const nextModSessions = sessionsMap[nextMod.id] || [];
        if (nextModSessions.length > 0) {
          handleSelectSession(nextMod.id, nextModSessions[0].id, false);
        }
      }
    }
  };

  // Previous session navigation
  const handleNavigatePrev = () => {
    const curIdx = activeSessions.findIndex((s) => s.id === activeSession?.id);
    if (curIdx > 0) {
      const prevSess = activeSessions[curIdx - 1];
      handleSelectSession(activeModuleId, prevSess.id, false);
    } else if (activeModuleIndex > 0) {
      const prevMod = modules[activeModuleIndex - 1];
      const prevModSessions = sessionsMap[prevMod.id] || [];
      if (prevModSessions.length > 0) {
        handleSelectSession(prevMod.id, prevModSessions[prevModSessions.length - 1].id, false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-24 text-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mx-auto"></div>
        <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">
          Initializing TNV Learning Environment...
        </p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <BookOpen className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Course Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested course could not be loaded. Please return to your enrolled courses directory.
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate('/student/my-courses')}>
          Return to My Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      {/* ======================================================== */}
      {/* 1. TOP TNV ACADEMY HEADER BAR (100% Full-Screen View) */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Branding & Course Title */}
          <div className="flex items-center gap-4">
            {/* TNV Academy Logo Badge */}
            <div className="flex items-center gap-2.5 border-r border-slate-200 dark:border-slate-800 pr-4">
              <img
                src="/tnv-logo.png"
                alt="TNV Crest"
                className="h-9 w-9 rounded-xl object-contain shadow-sm bg-white p-0.5 border border-slate-100 dark:border-slate-800 shrink-0"
              />
              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs font-black tracking-tight text-brand-600 dark:text-brand-400">
                  TNV ACADEMY
                </span>
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Learning Portal
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Link
                  to="/student/my-courses"
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 font-bold text-xs"
                  title="Return to My Courses"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate max-w-md sm:max-w-xl">
                  {course.title}
                </h1>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                <span>Instructor: {course.instructor_name || 'Thamilaran'}</span>
                <span>•</span>
                <span className="font-semibold text-brand-600 dark:text-brand-400">
                  Course Progress: {progressPercent}% ({completedSessionsCount} of {totalSessionsCount} completed)
                </span>
              </div>
            </div>
          </div>

          {/* Right: Top Navigation Tabs (Image 3 Style) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'curriculum'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lectures</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'about'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>About Course</span>
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'announcements'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Announcements</span>
            </button>

            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'bookmarks'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Bookmarks ({bookmarkedSessionIds.size})</span>
            </button>

            <button
              onClick={() => setActiveTab('qa')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'qa'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Q&A</span>
            </button>

            <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Powered
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar under Top Header */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
          <div
            className="bg-brand-600 h-1 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Final Exam Status Banner (Shown ONLY if admin created exam for this course) */}
        {hasCourseExam && allSessionsDone && !isExamPassed && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
              <GraduationCap className="w-4 h-4 text-amber-600 shrink-0" />
              <span>All curriculum sessions completed ({completedSessionsCount}/{totalSessionsCount})! Complete and pass the Final Exam to reach 100% and earn your verified certificate.</span>
            </div>
            <Link to="/student/examinations">
              <Button size="sm" variant="primary" leftIcon={<GraduationCap className="w-3.5 h-3.5" />} className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-xs">
                Final Exam
              </Button>
            </Link>
          </div>
        )}
        {hasCourseExam && allSessionsDone && isExamPassed && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Course Completed! You passed the Final Exam {examAttempt ? `(${examAttempt.score}/${examAttempt.total_marks} — ${examAttempt.percentage}%)` : ''}.</span>
            </div>
            <Link to="/student/certificates">
              <Button size="sm" variant="primary" leftIcon={<Award className="w-3.5 h-3.5" />} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-xs">
                View Certificate
              </Button>
            </Link>
          </div>
        )}
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN LEARNING ENVIRONMENT LAYOUT (100% Full Width Screen) */}
      {/* ======================================================== */}
      <main className="w-full px-4 sm:px-6 lg:px-8 pt-5">
        {/* Render Secondary Tabs (About, Announcements, Bookmarks, QA) */}
        {activeTab === 'about' && (
          <Card className="p-8 max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              About {course.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {course.description || 'Comprehensive university-grade course curriculum designed in accordance with national academic standards.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Duration</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{course.duration || '6 Weeks (36 Hours)'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Instructor</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{course.instructor_name || 'Thamilaran'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Graduation Benchmark</span>
                <span className="font-extrabold text-brand-600">Standard Module Assessment Criteria</span>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'announcements' && (
          <Card className="p-8 max-w-4xl mx-auto space-y-4">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-brand-600" /> Course Announcements
            </h2>
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-brand-900 dark:text-brand-300">
                  <span>Welcome to {course.title}!</span>
                  <span className="text-[11px] text-slate-400 font-normal">Active Term</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Please review the module lecture videos, notes, and handouts. To unlock the subsequent module, complete all sessions and pass the module assessment according to the criteria.
                </p>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'bookmarks' && (
          <Card className="p-8 max-w-4xl mx-auto space-y-4">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-brand-600" /> Bookmarked Lectures & Notes
            </h2>
            {bookmarkedSessionIds.size === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">
                You have not bookmarked any lectures yet. Click the bookmark icon on any lecture to save it here.
              </p>
            ) : (
              <div className="space-y-2">
                {allSessions
                  .filter((s) => bookmarkedSessionIds.has(s.id))
                  .map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveTab('curriculum');
                        handleSelectSession(s.module_id, s.id, false);
                      }}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                    >
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{s.title}</span>
                      <Button variant="outline" size="sm">Open Lecture →</Button>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        )}

        {activeTab === 'qa' && (
          <Card className="p-8 max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-600" /> Student Discussion & Q&A
            </h2>

            <div className="space-y-2">
              <textarea
                rows={3}
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Ask an academic question about any session..."
                className="w-full text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white"
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!newQuestion.trim()}
                  onClick={() => {
                    setQaThreads((prev) => [
                      {
                        id: String(Date.now()),
                        user: `${user?.full_name || 'Student'} (You)`,
                        text: newQuestion,
                        time: 'Just now',
                        replies: 0,
                      },
                      ...prev,
                    ]);
                    setNewQuestion('');
                  }}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Post Question
                </Button>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              {qaThreads.map((thread) => (
                <div key={thread.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>{thread.user}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{thread.time}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{thread.text}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* PRIMARY SPLIT VIEW: CURRICULUM ACCORDION (LEFT) & CONTENT VIEWER (RIGHT) */}
        {activeTab === 'curriculum' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ======================================================== */}
            {/* LEFT COLUMN: CURRICULUM SYLLABUS DRAWER */}
            {/* ======================================================== */}
            <div className="order-2 lg:order-1 lg:col-span-4 xl:col-span-3 space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden sticky top-20">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand-600" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Course Curriculum
                    </h2>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {modules.length} Weeks / Modules
                  </Badge>
                </div>

                {/* Modules & Sessions Tree */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[calc(100vh-220px)] overflow-y-auto">
                  {modules.map((mod, modIdx) => {
                    const isUnlocked = isModuleUnlocked(modIdx);
                    const sessions = sessionsMap[mod.id] || [];
                    const isExpanded = !!expandedModules[mod.id];

                    // Check if module completed (all lectures/assignments completed + milestone quiz passed)
                    const modQuiz = sessions.find(
                      (s) =>
                        s.session_type === 'quiz' ||
                        Boolean(s.description?.includes('"is_quiz":true')) ||
                        s.title?.toLowerCase().includes('assessment') ||
                        s.title?.toLowerCase().includes('quiz')
                    );
                    const nonQuiz = sessions.filter(
                      (s) =>
                        s.session_type !== 'quiz' &&
                        !s.description?.includes('"is_quiz":true') &&
                        !s.title?.toLowerCase().includes('assessment') &&
                        !s.title?.toLowerCase().includes('quiz')
                    );
                    const allNonQuizDone = nonQuiz.length === 0 || nonQuiz.every((s) => isSessionDone(s.id));

                    let isModCompleted = false;
                    if (modQuiz) {
                      const isPassedQuiz =
                        passedQuizzes.has(mod.id) ||
                        passedQuizzes.has(modQuiz.id) ||
                        isSessionDone(modQuiz.id);
                      isModCompleted = isPassedQuiz && allNonQuizDone;
                    } else {
                      isModCompleted = sessions.length > 0 && sessions.every((s) => isSessionDone(s.id));
                    }

                    return (
                      <div key={mod.id} className="transition-colors">
                        {/* Module Header Bar */}
                        <div
                          onClick={() => toggleModuleAccordion(mod.id)}
                          className={`p-3.5 flex items-center justify-between cursor-pointer select-none transition-colors ${
                            !isUnlocked
                              ? 'bg-slate-100/50 dark:bg-slate-900/40 text-slate-400'
                              : activeModuleId === mod.id
                              ? 'bg-brand-50/60 dark:bg-brand-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 flex-1 pr-2">
                            {/* Lock / Completed / Number Icon */}
                            {!isUnlocked ? (
                              <div className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 shrink-0">
                                <Lock className="w-3.5 h-3.5" />
                              </div>
                            ) : isModCompleted ? (
                              <div className="p-1 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-600 shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-[10px] shrink-0">
                                {modIdx + 1}
                              </span>
                            )}

                            <div>
                              <h3
                                className={`text-xs font-bold leading-snug ${
                                  !isUnlocked
                                    ? 'text-slate-400 dark:text-slate-500'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {mod.title}
                              </h3>
                              <span className="text-[10px] text-slate-400">
                                {!isUnlocked
                                  ? '🔒 Locked (Complete previous module assessment)'
                                  : `${sessions.length} Items`}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 text-slate-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Module Sessions Accordion Content */}
                        {isExpanded && (
                          <div className="bg-slate-50/40 dark:bg-slate-900/60 divide-y divide-slate-100 dark:divide-slate-800/40 pl-3 sm:pl-4">
                            {sessions.length === 0 ? (
                              <div className="p-3 text-[11px] text-slate-400 italic">
                                No sessions in this module.
                              </div>
                            ) : (
                              sessions.map((sess, sIdx) => {
                                const isDone = isSessionDone(sess.id);
                                const isSelected = activeSessionId === sess.id && activeModuleId === mod.id;
                                const isQuiz =
                                  sess.session_type === 'quiz' ||
                                  (sess.description && sess.description.includes('"is_quiz":true'));
                                const isAsn = sess.session_type === 'assignment';
                                const isDoc =
                                  sess.session_type === 'document' ||
                                  (sess.session_type === 'reading' && !isQuiz);
                                const isVid =
                                  sess.session_type === 'video' ||
                                  sess.session_type === 'lecture' ||
                                  (!isQuiz && !isAsn && !isDoc);

                                return (
                                  <div
                                    key={sess.id}
                                    onClick={() => handleSelectSession(mod.id, sess.id, !isUnlocked)}
                                    className={`p-3 pr-4 flex items-center justify-between gap-2.5 cursor-pointer text-xs transition-colors group ${
                                      isSelected
                                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-extrabold border-r-4 border-r-blue-600'
                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                      {/* Completion / Status Checkmark Icon (Image 3 Style) */}
                                      {!isUnlocked ? (
                                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      ) : isDone ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                      ) : isSelected ? (
                                        <PlayCircle className="w-4 h-4 text-blue-600 shrink-0" />
                                      ) : (
                                        <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                                      )}

                                      {/* Type Icon */}
                                      <span className="shrink-0 text-slate-400 group-hover:text-slate-600">
                                        {isQuiz && <HelpCircle className="w-3.5 h-3.5 text-purple-600" />}
                                        {isAsn && <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />}
                                        {isDoc && <FileDown className="w-3.5 h-3.5 text-sky-600" />}
                                        {isVid && <Video className="w-3.5 h-3.5 text-brand-600" />}
                                      </span>

                                      <span className="truncate text-xs font-semibold">
                                        {sess.title}
                                      </span>
                                    </div>

                                    {/* Bookmark indicator */}
                                    {bookmarkedSessionIds.has(sess.id) && (
                                      <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Final Exam Section in Sidebar (shown ONLY if admin created exam for this course) */}
                {hasCourseExam && (
                  <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          Course Final Exam
                        </span>
                      </div>
                      {isExamPassed && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Passed
                        </span>
                      )}
                    </div>

                    {allSessionsDone ? (
                      isExamPassed ? (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                            Completed: {examAttempt?.score}/{examAttempt?.total_marks} ({examAttempt?.percentage}%)
                          </p>
                          <Link to="/student/certificates" className="block">
                            <Button variant="primary" size="sm" className="w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700" leftIcon={<Award className="w-3.5 h-3.5" />}>
                              View Certificate
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-1.5 pt-1">
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Curriculum complete! Complete and pass the Final Exam to reach 100% completion.
                          </p>
                          <Link to="/student/examinations" className="block">
                            <Button variant="primary" size="sm" className="w-full text-xs font-bold" leftIcon={<GraduationCap className="w-3.5 h-3.5" />}>
                              Final Exam
                            </Button>
                          </Link>
                        </div>
                      )
                    ) : (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>Complete all {totalSessionsCount} sessions to unlock Final Exam</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ======================================================== */}
            {/* RIGHT COLUMN: MAIN CONTENT VIEWER (Full Width Theater View) */}
            {/* ======================================================== */}
            <div className="order-1 lg:order-2 lg:col-span-8 xl:col-span-9 space-y-5">
              {/* If Current Module is LOCKED */}
              {isCurrentModuleLocked ? (
                <Card className="p-12 text-center space-y-4 border-2 border-dashed border-amber-300 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20">
                  <div className="h-14 w-14 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Module Content Locked
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                    This module and its learning materials are locked under academic progression rules. To unlock this module, complete the previous module's curriculum and pass its Milestone Assessment Quiz.
                  </p>
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const prevModIdx = Math.max(0, activeModuleIndex - 1);
                        const prevMod = modules[prevModIdx];
                        const prevSessions = sessionsMap[prevMod.id] || [];
                        const prevQuiz = prevSessions.find(
                          (s) => s.session_type === 'quiz' || (s.description && s.description.includes('"is_quiz":true'))
                        );
                        if (prevQuiz) {
                          handleSelectSession(prevMod.id, prevQuiz.id, false);
                        } else if (prevSessions.length > 0) {
                          handleSelectSession(prevMod.id, prevSessions[0].id, false);
                        }
                      }}
                    >
                      Take Previous Module Assessment →
                    </Button>
                  </div>
                </Card>
              ) : activeSession ? (
                (() => {
                  const isQuizSession =
                    activeSession.session_type === 'quiz' ||
                    Boolean(activeSession.description?.includes('"is_quiz":true'));

                  const isAssignmentSession =
                    activeSession.session_type === 'assignment' ||
                    Boolean(activeSession.title && activeSession.title.toLowerCase().includes('assignment')) ||
                    Boolean(activeSession.title && activeSession.title.toLowerCase().includes('project')) ||
                    Boolean(activeSession.title && activeSession.title.toUpperCase().includes('CREATE AN HTML'));

                  const isDocSession =
                    !isQuizSession &&
                    !isAssignmentSession &&
                    (activeSession.session_type === 'document' ||
                     activeSession.session_type === 'reading' ||
                     activeSession.session_type === 'lesson' ||
                     activeSession.session_type === 'link');

                  // STRICT: Only genuine video sessions can render lecture videos
                  const isVideoSession =
                    !isQuizSession &&
                    !isAssignmentSession &&
                    !isDocSession &&
                    (activeSession.session_type === 'video' ||
                     activeSession.session_type === 'lecture' ||
                     Boolean(activeSession.content_data?.video_links && activeSession.content_data.video_links.length > 0));

                  // ========================================================
                  // 1. PRIORITY 1: LECTURE VIDEOS (Strictly for video sessions)
                  // ========================================================
                  const allSessionVideos: Array<{ id: string; title: string; url: string; duration_minutes?: number }> = [];

                  if (isVideoSession) {
                    // From content_data.video_links
                    if (activeSession.content_data?.video_links && Array.isArray(activeSession.content_data.video_links)) {
                      activeSession.content_data.video_links.forEach((v: any, idx: number) => {
                        if (v && v.url && typeof v.url === 'string' && v.url.trim() && !allSessionVideos.some((x) => x.url === v.url.trim())) {
                          allSessionVideos.push({
                            id: v.id || `v-${idx}`,
                            title: v.title || `Part ${idx + 1}: Lecture Video`,
                            url: v.url.trim(),
                            duration_minutes: v.duration_minutes || activeSession.duration_minutes || 45,
                          });
                        }
                      });
                    }

                    // From video_lectures table rows
                    if (activeSession.video_lectures && Array.isArray(activeSession.video_lectures)) {
                      activeSession.video_lectures.forEach((vl: any, idx: number) => {
                        if (vl && vl.drive_url && vl.drive_url.trim() && !allSessionVideos.some((x) => x.url === vl.drive_url.trim())) {
                          allSessionVideos.push({
                            id: vl.id || `vl-${idx}`,
                            title: vl.title || `Part ${idx + 1}: Video Lecture`,
                            url: vl.drive_url.trim(),
                            duration_minutes: vl.duration_minutes || activeSession.duration_minutes || 45,
                          });
                        }
                      });
                    }

                    // From video_lecture primary object
                    if (activeSession.video_lecture?.drive_url && !allSessionVideos.some((x) => x.url === activeSession.video_lecture!.drive_url.trim())) {
                      allSessionVideos.push({
                        id: 'vl-primary',
                        title: activeSession.video_lecture.title || activeSession.title || 'Main Lecture Video',
                        url: activeSession.video_lecture.drive_url.trim(),
                        duration_minutes: activeSession.video_lecture.duration_minutes || activeSession.duration_minutes || 45,
                      });
                    }

                    // From drive_url
                    if (activeSession.drive_url && activeSession.drive_url.trim()) {
                      const u = activeSession.drive_url.trim();
                      if (!u.includes('/folders/') && !allSessionVideos.some((x) => x.url === u)) {
                        allSessionVideos.push({
                          id: 'primary-drive',
                          title: activeSession.title || 'Main Lecture Video',
                          url: u,
                          duration_minutes: activeSession.duration_minutes || 45,
                        });
                      }
                    }

                    // From description if JSON with video_links
                    if (activeSession.description && activeSession.description.startsWith('{')) {
                      try {
                        const parsed = JSON.parse(activeSession.description);
                        if (parsed.video_links && Array.isArray(parsed.video_links)) {
                          parsed.video_links.forEach((v: any, idx: number) => {
                            if (v.url && !allSessionVideos.some((x) => x.url === v.url.trim())) {
                              allSessionVideos.push({
                                id: v.id || `desc-v-${idx}`,
                                title: v.title || `Part ${idx + 1}: Video Lecture`,
                                url: v.url.trim(),
                                duration_minutes: v.duration_minutes || 45,
                              });
                            }
                          });
                        }
                      } catch {}
                    }
                  }

                  const hasVideos = allSessionVideos.length > 0;
                  const currentVideo = allSessionVideos[activeVideoIndex] || allSessionVideos[0];

                  // ========================================================
                  // 2. PRIORITY 2: LESSON NOTES & SYLLABUS CONTENT
                  // ========================================================
                  let sessionNotes = '';
                  if (activeSession.content_data?.notes && typeof activeSession.content_data.notes === 'string' && activeSession.content_data.notes.trim()) {
                    sessionNotes = activeSession.content_data.notes.trim();
                  } else if (activeSession.content_data?.content && typeof activeSession.content_data.content === 'string' && activeSession.content_data.content.trim()) {
                    sessionNotes = activeSession.content_data.content.trim();
                  } else if (
                    activeSession.description &&
                    typeof activeSession.description === 'string' &&
                    !activeSession.description.trim().startsWith('{') &&
                    !activeSession.description.includes('"is_quiz":true') &&
                    activeSession.description.trim()
                  ) {
                    sessionNotes = activeSession.description.trim();
                  }
                  const hasNotes = Boolean(sessionNotes);

                  // ========================================================
                  // 3. PRIORITY 3: DRIVE RESOURCES & HANDOUTS
                  // Strictly shown ONLY if a real resource guide was provided by the admin!
                  // Quizzes & Assignments NEVER show fake reference document cards.
                  // ========================================================
                  const resourceLinks: Array<{ id: string; title: string; url: string; description?: string }> = [];

                  // 1. Google Drive shared folder (only if valid folder link and NOT a quiz)
                  if (!isQuizSession && activeSession.drive_folder_url && activeSession.drive_folder_url.trim()) {
                    const fUrl = activeSession.drive_folder_url.trim();
                    if (fUrl.includes('/folders/') || fUrl.includes('drive.google.com')) {
                      resourceLinks.push({
                        id: 'folder-resource',
                        title: 'Google Drive Course Resource Folder',
                        url: fUrl,
                        description: 'Shared Google Drive folder with source files, handouts, and assets',
                      });
                    }
                  }

                  // 2. Real Document / Handout URL (ONLY if this is genuinely a document/reading session)
                  if (isDocSession && !isQuizSession && !isAssignmentSession && activeSession.drive_url && activeSession.drive_url.trim()) {
                    const u = activeSession.drive_url.trim();
                    const isUsedAsVideo = allSessionVideos.some((v) => v.url === u);
                    if (!isUsedAsVideo && u.length > 10) {
                      resourceLinks.push({
                        id: 'doc-drive-resource',
                        title: `${activeSession.title} (Document / Handout)`,
                        url: u,
                        description: 'Official study document and handout attached to this session',
                      });
                    }
                  }

                  // 3. Supplementary learning materials explicitly added by the admin
                  if (activeSession.learning_materials && Array.isArray(activeSession.learning_materials)) {
                    activeSession.learning_materials.forEach((mat: any, idx: number) => {
                      const u = mat.file_url || mat.external_link;
                      if (u && typeof u === 'string' && u.trim().length > 10 && !resourceLinks.some((r) => r.url === u.trim())) {
                        resourceLinks.push({
                          id: mat.id || `mat-${idx}`,
                          title: mat.title || `Resource Guide ${idx + 1}`,
                          url: u.trim(),
                          description: mat.description || 'Official learning resource guide provided by instructor',
                        });
                      }
                    });
                  }

                  const hasResources = resourceLinks.length > 0;

                  // ========================================================
                  // 4. ASSESSMENT & ASSIGNMENT FLAGS
                  // ========================================================
                  const hasQuiz =
                    isQuizSession ||
                    quizzes.some((q) => q.session_id === activeSession.id);
                  const hasAssignment = isAssignmentSession;

                  const hasAnyContent = hasVideos || hasNotes || hasResources || hasQuiz || hasAssignment;

                  return (
                    <div className="space-y-6">
                      {/* Session Header Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 shrink-0">
                            {hasQuiz ? (
                              <HelpCircle className="w-5 h-5" />
                            ) : hasAssignment ? (
                              <FileCheck2 className="w-5 h-5" />
                            ) : isDocSession ? (
                              <FileDown className="w-5 h-5" />
                            ) : (
                              <Video className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                                Module {activeModuleIndex + 1} • Session {activeSessions.findIndex((s) => s.id === activeSession.id) + 1}
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <span className="text-[11px] text-slate-400 font-semibold">
                                {activeSession.duration_minutes || 45} Mins
                              </span>
                            </div>
                            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                              {activeSession.title}
                            </h2>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <button
                            onClick={() => toggleBookmark(activeSession.id)}
                            className={`p-2 rounded-xl transition-colors ${
                              bookmarkedSessionIds.has(activeSession.id)
                                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100'
                            }`}
                            title={bookmarkedSessionIds.has(activeSession.id) ? 'Remove Bookmark' : 'Bookmark Session'}
                          >
                            <Bookmark
                              className={`w-4 h-4 ${bookmarkedSessionIds.has(activeSession.id) ? 'fill-amber-500' : ''}`}
                            />
                          </button>

                          {/* Read-Only Status Indicator */}
                          {isSessionDone(activeSession.id) ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs">
                              <Circle className="w-3.5 h-3.5 text-slate-400" />
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ======================================================== */}
                      {/* PRIORITY 1: LECTURE VIDEOS (Stream in theater view) */}
                      {/* ======================================================== */}
                      {hasVideos && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                            <div className="flex items-center gap-2">
                              <Video className="w-4 h-4 text-brand-600" />
                              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                Lecture Video {allSessionVideos.length > 1 ? `(${allSessionVideos.length} Videos)` : ''}
                              </h3>
                            </div>
                            <span className="text-[11px] text-slate-400">Stream in TNV Learning Environment</span>
                          </div>

                          {allSessionVideos.length > 1 && (
                            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                <span className="flex items-center gap-1.5">
                                  <PlayCircle className="w-4 h-4 text-brand-600" />
                                  <span>Lecture Video Playlist ({allSessionVideos.length} Videos)</span>
                                </span>
                                <span className="text-[11px] text-slate-400 font-normal">
                                  Select part to stream
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {allSessionVideos.map((v, vIdx) => (
                                  <button
                                    key={v.id || vIdx}
                                    type="button"
                                    onClick={() => setActiveVideoIndex(vIdx)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                      activeVideoIndex === vIdx
                                        ? 'bg-brand-600 text-white shadow-sm'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                                  >
                                    <PlayCircle className="w-3.5 h-3.5" />
                                    <span>{v.title}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {currentVideo && (
                            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 rounded-2xl">
                              <div className="relative aspect-video w-full bg-black flex items-center justify-center min-h-[440px] sm:min-h-[500px] lg:min-h-[580px] xl:min-h-[660px]">
                                <iframe
                                  key={currentVideo.url}
                                  src={
                                    parseGoogleDriveLink(currentVideo.url).embedUrl ||
                                    currentVideo.url
                                  }
                                  className="w-full h-full border-0"
                                  allow="autoplay; encrypted-media; fullscreen"
                                  allowFullScreen
                                  title={currentVideo.title}
                                />
                              </div>
                              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                                    {currentVideo.title}
                                  </h3>
                                  <p className="text-xs text-slate-400">
                                    Streaming directly inside TNV Learning Environment
                                  </p>
                                </div>
                                <a
                                  href={currentVideo.url.replace('/preview', '/view')}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline"
                                >
                                  <span>Open in Google Drive</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </Card>
                          )}
                        </div>
                      )}

                      {/* ======================================================== */}
                      {/* PRIORITY 2: LESSON NOTES & SYLLABUS CONTENT (Markdown) */}
                      {/* ======================================================== */}
                      {hasNotes && (
                        <Card className="p-6 sm:p-8 border-slate-200 dark:border-slate-800 space-y-4 shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-brand-600" />
                              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                Lesson Notes & Syllabus Content
                              </h3>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Academic Reading Material
                            </span>
                          </div>

                          <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-normal">
                            {sessionNotes}
                          </div>
                        </Card>
                      )}

                      {/* ======================================================== */}
                      {/* PRIORITY 3: DRIVE RESOURCES & HANDOUTS */}
                      {/* ======================================================== */}
                      {hasResources && (
                        <Card className="p-6 sm:p-8 border-slate-200 dark:border-slate-800 space-y-4 shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <FileDown className="w-4 h-4 text-brand-600" />
                              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                Drive Resources & Handouts ({resourceLinks.length})
                              </h3>
                            </div>
                          </div>

                          <div className="space-y-3 pt-1">
                            {resourceLinks.map((res) => (
                              <div
                                key={res.id}
                                className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 shrink-0">
                                    <FileText className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                                      {res.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                      {res.description}
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={res.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-sm transition-all shrink-0"
                                >
                                  <span>Open Resource</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}

                      {/* ======================================================== */}
                      {/* PRIORITY 4: GRADED ASSESSMENT (If session is a quiz) */}
                      {/* ======================================================== */}
                      {hasQuiz && (
                        (() => {
                          const quizData = getSessionQuizData(activeSession);
                          const passBenchmark = Number(quizData.passing_percentage) || 50;
                          const isAlreadyPassed =
                            passedQuizzes.has(activeModule.id) || passedQuizzes.has(activeSession.id);

                          return (
                            <div className="space-y-6">
                              {/* Quiz Banner */}
                              <Card className="p-6 sm:p-8 border-l-4 border-l-purple-600 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4 rounded-2xl">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div>
                                    <Badge
                                      variant="brand"
                                      className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 mb-2"
                                    >
                                      Module Milestone Assessment
                                    </Badge>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                      {quizData.quiz_title}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-1">
                                      {quizData.quiz_description}
                                    </p>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <div className="px-3.5 py-2 rounded-xl bg-purple-600 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5">
                                      <Award className="w-4 h-4" />
                                      <span>{passBenchmark}% Required to Pass</span>
                                    </div>
                                    {isAlreadyPassed && (
                                      <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center justify-end gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Assessment Passed & Module Unlocked</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card>

                              {/* Quiz Questions List */}
                              <div className="space-y-4">
                                {quizData.questions.map((q: any, qIdx: number) => (
                                  <Card
                                    key={q.id || qIdx}
                                    className="p-6 border-slate-200 dark:border-slate-800 space-y-4 shadow-sm bg-white dark:bg-slate-900 rounded-2xl"
                                  >
                                    <div className="flex items-start gap-3">
                                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 font-extrabold text-xs shrink-0">
                                        {qIdx + 1}
                                      </span>
                                      <div className="flex-1">
                                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                                          {q.question_text}
                                        </h3>
                                        <span className="text-[11px] text-slate-400 font-semibold">
                                          ({q.marks || 1} Point)
                                        </span>
                                      </div>
                                    </div>

                                    {/* Radio Options */}
                                    <div className="space-y-2.5 pl-9">
                                      {(q.options || []).map((opt: string, optIdx: number) => {
                                        const isChecked = quizAnswers[q.id] === optIdx;
                                        return (
                                          <label
                                            key={optIdx}
                                            onClick={() =>
                                              setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                                            }
                                            className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                              isChecked
                                                ? 'border-purple-600 bg-purple-50/60 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 font-bold shadow-sm'
                                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                                            }`}
                                          >
                                            <div
                                              className={`flex h-4 w-4 rounded-full border-2 items-center justify-center transition-colors ${
                                                isChecked
                                                  ? 'border-purple-600 bg-purple-600'
                                                  : 'border-slate-300 dark:border-slate-600'
                                              }`}
                                            >
                                              {isChecked && (
                                                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                                              )}
                                            </div>
                                            <span>{opt}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </Card>
                                ))}
                              </div>

                              {/* Submit Quiz Action Button */}
                              <div className="flex justify-end pt-2">
                                <Button
                                  variant="primary"
                                  size="lg"
                                  onClick={() => handleQuizSubmit(activeSession, quizData)}
                                  disabled={isSubmittingQuiz}
                                  isLoading={isSubmittingQuiz}
                                  className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold px-8 shadow-md"
                                >
                                  Submit Assessment & Validate Score
                                </Button>
                              </div>
                            </div>
                          );
                        })()
                      )}

                      {/* ======================================================== */}
                      {/* PRIORITY 5: ASSIGNMENT WORKSPACE (If assignment) */}
                      {/* ======================================================== */}
                      {hasAssignment && (
                        <Card className="p-6 sm:p-8 border-slate-200 dark:border-slate-800 space-y-6 shadow-sm bg-white dark:bg-slate-900 rounded-2xl">
                          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-2">
                            <Badge variant="success">Graded Assignment</Badge>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                              {activeSession.title}
                            </h2>
                            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                              {activeSession.description || 'Complete the assignment according to the instructions below.'}
                            </p>
                          </div>

                          {(activeSession.drive_url || activeSession.video_lecture?.drive_url) && (
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                Assignment Template & Starter Code
                              </span>
                              <a
                                href={(activeSession.drive_url || activeSession.video_lecture?.drive_url)?.replace('/preview', '/view')}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline"
                              >
                                <span>Open Drive Template</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}

                          <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Submit Your Solution (GitHub Repository Link / Google Drive Link / Solution Notes)
                            </label>
                            <textarea
                              rows={4}
                              value={assignmentText}
                              onChange={(e) => setAssignmentText(e.target.value)}
                              placeholder="Paste your GitHub repository link or write your practical analysis here..."
                              className="w-full text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white"
                            />
                            <div className="flex justify-between items-center">
                              {assignmentSubmitted && (
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> Assignment submitted for evaluation!
                                </span>
                              )}
                              <Button
                                variant="primary"
                                size="md"
                                disabled={!assignmentText.trim() || assignmentSubmitted}
                                onClick={async () => {
                                  setAssignmentSubmitted(true);
                                  if (user?.id && activeSession?.id) {
                                    try {
                                      localStorage.setItem(
                                        `assignment_sub_${user.id}_${activeSession.id}`,
                                        JSON.stringify({
                                          session_id: activeSession.id,
                                          title: activeSession.title,
                                          text: assignmentText.trim(),
                                          submitted_at: new Date().toISOString(),
                                        })
                                      );
                                    } catch (e) {
                                      console.warn('Failed to cache assignment submission', e);
                                    }
                                    try {
                                      await dataProvider.submitAssignment(
                                        activeSession.id,
                                        user.id,
                                        assignmentText.trim()
                                      );
                                    } catch (e) {
                                      console.warn('Direct Supabase assignment submission note:', e);
                                    }
                                  }
                                  handleToggleCompleted(activeSession.id);
                                }}
                                className="ml-auto"
                              >
                                {assignmentSubmitted ? 'Submitted' : 'Submit Assignment'}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )}

                      {/* Fallback if session has completely no published materials */}
                      {!hasAnyContent && (
                        <Card className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl">
                          This session has no published learning materials yet. Please proceed to the next session.
                        </Card>
                      )}

                      {/* Mark as Completed Action for Video/Lesson/Reading/Document Sessions */}
                      {!hasQuiz && !hasAssignment && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${isSessionDone(activeSession.id) ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' : 'bg-brand-50 dark:bg-brand-950 text-brand-600'}`}>
                              {isSessionDone(activeSession.id) ? <CheckCircle2 className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                {isSessionDone(activeSession.id) ? 'Session Completed' : 'Finished this session?'}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {isSessionDone(activeSession.id)
                                  ? 'Your learning progress has been recorded and saved.'
                                  : 'Mark as completed to track your progress and unlock future modules.'}
                              </p>
                            </div>
                          </div>

                          {isSessionDone(activeSession.id) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-extrabold cursor-default opacity-100 shrink-0"
                              leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                            >
                              Completed
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleMarkCompleted(activeSession.id)}
                              className="font-extrabold shadow-sm shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                              leftIcon={<CheckCircle2 className="w-4 h-4" />}
                            >
                              Mark as Completed
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Navigation Footer (Prev / Next) */}
                      {(() => {
                        const curSessIdx = activeSessions.findIndex((s) => s.id === activeSession.id);
                        const isFirstOverallSession = activeModuleIndex === 0 && curSessIdx === 0;
                        const isLastOverallSession =
                          activeModuleIndex === modules.length - 1 &&
                          curSessIdx === activeSessions.length - 1;

                        return (
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            {!isFirstOverallSession ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNavigatePrev}
                                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                              >
                                Previous Session
                              </Button>
                            ) : (
                              <div />
                            )}

                            {!isLastOverallSession ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={handleNavigateNext}
                                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                              >
                                Next Session →
                              </Button>
                            ) : hasCourseExam && allSessionsDone ? (
                              isExamPassed ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Final Exam Passed ({examAttempt?.percentage}%)
                                  </span>
                                  <Link to="/student/certificates">
                                    <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-700 font-bold" leftIcon={<Award className="w-4 h-4" />}>
                                      View Certificate
                                    </Button>
                                  </Link>
                                </div>
                              ) : (
                                <Link to="/student/examinations">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    className="font-extrabold bg-brand-600 hover:bg-brand-700 shadow-md flex items-center gap-1.5"
                                    leftIcon={<GraduationCap className="w-4 h-4" />}
                                  >
                                    Final Exam →
                                  </Button>
                                </Link>
                              )
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()
              ) : (
                <Card className="p-12 text-center text-xs text-slate-400">
                  Select a session from the curriculum outline on the left to begin learning.
                </Card>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 3. SCORE VALIDATION POPUP MODAL (Dynamic Admin Pass Criteria) */}
      {/* ======================================================== */}
      {quizModalResult?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-[28px] sm:rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95 overflow-hidden">
            <TopLeftWavyAccent className="w-28 h-28 sm:w-36 sm:h-36 opacity-90" />
            <BottomRightWavyAccent className="w-28 h-28 sm:w-36 sm:h-36 opacity-90" />
            <div className="relative z-10 space-y-6">
            {quizModalResult.isPassed ? (
              /* PASSED MODAL (Score >= passBenchmark) */
              <div className="space-y-4">
                <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-xs uppercase tracking-wider">
                    🎉 Benchmark Passed
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    Congratulations!
                  </h3>
                  <p className="text-xs text-slate-500">
                    You have successfully passed the module assessment benchmark!
                  </p>
                </div>

                {/* Score Pill */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-1">
                  <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {quizModalResult.percentage}%
                  </div>
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Earned {quizModalResult.score} of {quizModalResult.totalMarks} Marks (Pass Requirement: {quizModalResult.passBenchmark ?? 50}%)
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {quizModalResult.nextModuleTitle ? (
                    <>
                      <strong>{quizModalResult.nextModuleTitle}</strong> and all of its sessions have been <strong>UNLOCKED</strong>!
                    </>
                  ) : (
                    'All modules in this course are now completed!'
                  )}
                </p>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-lg"
                    onClick={() => {
                      setQuizModalResult(null);
                      if (quizModalResult.nextModuleId) {
                        const nextMod = modules.find((m) => m.id === quizModalResult.nextModuleId);
                        const nextSess = nextMod ? (sessionsMap[nextMod.id] || [])[0] : null;
                        if (nextMod && nextSess) {
                          handleSelectSession(nextMod.id, nextSess.id, false);
                        }
                      }
                    }}
                  >
                    Proceed to Next Module →
                  </Button>
                </div>
              </div>
            ) : (
              /* FAILED MODAL (Score < passBenchmark) */
              <div className="space-y-4">
                <div className="h-20 w-20 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                  <AlertTriangle className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-extrabold text-xs uppercase tracking-wider">
                    Retry Required
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    Retry Failed
                  </h3>
                  <p className="text-xs text-slate-500">
                    You did not meet the {quizModalResult.passBenchmark ?? 50}% passing threshold for this module.
                  </p>
                </div>

                {/* Score Pill */}
                <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-1">
                  <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
                    {quizModalResult.percentage}%
                  </div>
                  <div className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                    Earned {quizModalResult.score} of {quizModalResult.totalMarks} Marks (Minimum {quizModalResult.passBenchmark ?? 50}% Required)
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Subsequent modules remain locked. Please review the module video lectures and handouts, then retry the assessment to unlock the next module.
                </p>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-lg"
                    leftIcon={<RotateCcw className="w-4 h-4" />}
                    onClick={() => {
                      setQuizAnswers({});
                      setQuizModalResult(null);
                    }}
                  >
                    Retry Quiz Now
                  </Button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
