import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Course, Module, Session } from '../../types/database';
import { parseGoogleDriveLink } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FolderGit2,
  Layers,
  Plus,
  Trash2,
  Video,
  FileText,
  Save,
  Globe,
  ExternalLink,
  AlertTriangle,
  MoveUp,
  MoveDown,
  HelpCircle,
  FileCheck2,
  FileDown,
  Copy,
  Clock,
  Sparkles,
  BookOpen,
  ChevronDown,
  Award,
  CheckSquare,
  Settings2,
  Edit2,
  Pencil,
} from 'lucide-react';

export const AdminCourseCreate: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editCourseId = searchParams.get('id');

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [courseId, setCourseId] = useState<string | null>(editCourseId);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);

  // Step 1: Basic Course Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cloud Computing');
  const [level, setLevel] = useState('intermediate');
  const [duration, setDuration] = useState('6 Weeks (36 Hours)');
  const [instructorName, setInstructorName] = useState(user?.full_name || 'Thamilaran');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [workshopId, setWorkshopId] = useState<string>('');

  // Step 2: Content Structure (Modules & Sessions)
  const [modules, setModules] = useState<
    Array<{
      id: string;
      title: string;
      description?: string;
      order_index: number;
      sessions: Array<{
        id: string;
        title: string;
        description?: string;
        duration_minutes: number;
        session_type: 'lecture' | 'reading' | 'assignment' | 'quiz' | 'document' | 'video' | 'link' | 'lesson';
        order_index: number;
        drive_url?: string;
        drive_file_id?: string;
        materials?: Array<{ id: string; title: string; file_url: string; file_type: string }>;
        content_data?: any;
      }>;
    }>
  >([]);

  // Modals / Input states for adding/editing module/session
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [activeModuleForSession, setActiveModuleForSession] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [openMenuModuleId, setOpenMenuModuleId] = useState<string | null>(null);
  const [activeContentType, setActiveContentType] = useState<'video' | 'lesson' | 'quiz' | 'assignment' | 'document' | 'link'>('video');

  // Generic Session Fields
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDriveUrl, setNewSessionDriveUrl] = useState('');
  const [newSessionDuration, setNewSessionDuration] = useState('45');
  const [sessionNotes, setSessionNotes] = useState('');

  // Multiple Video Links Support
  const [videoLinks, setVideoLinks] = useState<
    Array<{ id: string; title: string; url: string; duration_minutes: number }>
  >([
    { id: 'v1', title: 'Part 1: Main Lecture', url: '', duration_minutes: 45 },
  ]);

  // Quiz Builder State (Google Forms style from Image 4)
  const [quizTitle, setQuizTitle] = useState('Module Assessment Quiz');
  const [quizDescription, setQuizDescription] = useState('Answer all questions to test your understanding.');
  const [quizPassingPercentage, setQuizPassingPercentage] = useState(50);
  const [quizTimeLimit, setQuizTimeLimit] = useState(15);
  const [quizQuestions, setQuizQuestions] = useState<
    Array<{
      id: string;
      question_text: string;
      question_type: 'multiple_choice' | 'checkboxes' | 'short_answer';
      options: string[];
      correct_option_index: number;
      marks: number;
      required: boolean;
    }>
  >([
    {
      id: 'q1',
      question_text: 'What is the primary role of this module concept?',
      question_type: 'multiple_choice',
      options: ['Fundamental Core Architecture', 'Secondary Utility Function', 'Temporary Cache Storage', 'Optional Extension'],
      correct_option_index: 0,
      marks: 1,
      required: true,
    },
    {
      id: 'q2',
      question_text: 'Which of the following best describes the key standard?',
      question_type: 'multiple_choice',
      options: ['Industry Best Practice', 'Deprecated Standard', 'Experimental Feature', 'External Dependency'],
      correct_option_index: 0,
      marks: 1,
      required: true,
    },
  ]);

  // Assignment Builder State
  const [assignmentInstructions, setAssignmentInstructions] = useState('');
  const [assignmentMaxMarks, setAssignmentMaxMarks] = useState(100);
  const [assignmentPassingMarks, setAssignmentPassingMarks] = useState(50);

  // Load existing course if editing
  useEffect(() => {
    if (editCourseId) {
      setIsLoadingCourse(true);
      dataProvider.getCourseById(editCourseId).then((c) => {
        if (c) {
          setCourseId(c.id);
          setTitle(c.title);
          setDescription(c.description || '');
          setCategory(c.category || 'Cloud Computing');
          setLevel(c.level || 'intermediate');
          setDuration(c.duration || '6 Weeks (36 Hours)');
          setInstructorName(c.instructor_name || user?.full_name || 'Dr. T. N. Venkatesh');
          setThumbnailUrl(c.thumbnail_url || '');
          setWorkshopId(c.workshop_id || '');

          if (c.modules) {
            setModules(
              c.modules.map((m) => ({
                id: m.id,
                title: m.title,
                description: m.description || '',
                order_index: m.order_index,
                sessions: (m.sessions || []).map((s) => ({
                  id: s.id,
                  title: s.title,
                  description: s.description || '',
                  duration_minutes: s.duration_minutes || 45,
                  session_type: s.session_type || 'lecture',
                  order_index: s.order_index,
                  drive_url: s.video_lecture?.drive_url || s.drive_folder_url || '',
                  drive_file_id: s.video_lecture?.drive_file_id || s.drive_folder_id || '',
                  materials: (s.learning_materials || []).map((mat) => ({
                    id: mat.id,
                    title: mat.title,
                    file_url: mat.file_url || mat.external_link || '',
                    file_type: mat.file_type || 'pdf',
                  })),
                })),
              }))
            );
          }
        }
        setIsLoadingCourse(false);
      });
    }
  }, [editCourseId, user]);

  const showSuccessBanner = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // ----------------------------------------------------
  // STEP 1 ACTIONS: Save Basic Details Draft & Proceed
  // ----------------------------------------------------
  const handleSaveStep1 = async (proceedToNext: boolean = false) => {
    if (!title.trim()) {
      alert('Course Name is required.');
      return;
    }
    if (!description.trim()) {
      alert('Course Description is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Course> = {
        title,
        description,
        category,
        level,
        duration,
        instructor_name: instructorName,
        thumbnail_url: thumbnailUrl.trim() || '/tnv-logo.png',
        workshop_id: workshopId || null,
        created_by: user?.id,
        is_published: false,
        status: 'draft',
      };

      let currentId = courseId;
      if (currentId) {
        await dataProvider.updateCourse(currentId, payload);
        showSuccessBanner('Course details updated in Supabase.');
      } else {
        const created = await dataProvider.createCourse(payload);
        currentId = created.id;
        setCourseId(created.id);
        showSuccessBanner('Draft course saved in Supabase.');
      }

      if (proceedToNext) {
        setStep(2);
      }
    } catch (err: any) {
      alert(`Error saving course: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndPublishStep1 = async () => {
    if (!title.trim()) {
      alert('Course Name is required.');
      return;
    }
    if (!description.trim()) {
      alert('Course Description is required.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Course> = {
        title,
        description,
        category,
        level,
        duration,
        instructor_name: instructorName,
        thumbnail_url: thumbnailUrl.trim() || '/tnv-logo.png',
        workshop_id: workshopId || null,
        created_by: user?.id,
        is_published: true,
        status: 'published',
      };

      let currentId = courseId;
      if (currentId) {
        await dataProvider.updateCourse(currentId, payload);
        await dataProvider.publishCourse(currentId, user?.id);
      } else {
        const created = await dataProvider.createCourse(payload);
        currentId = created.id;
        await dataProvider.publishCourse(currentId, user?.id);
      }
      showSuccessBanner('Course published successfully! Placed into Published Courses.');
      setTimeout(() => {
        navigate('/admin/courses?tab=published');
      }, 1200);
    } catch (err: any) {
      alert(`Error publishing course: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ----------------------------------------------------
  // STEP 2 ACTIONS: Manage Modules, Sessions, Drive Links
  // ----------------------------------------------------
  const handleAddModule = async () => {
    if (!newModuleTitle.trim() || !courseId) return;
    setIsSaving(true);
    try {
      const newOrder = modules.length + 1;
      const created = await dataProvider.createModule(courseId, newModuleTitle, '', newOrder);
      setModules((prev) => [
        ...prev,
        {
          id: created.id,
          title: created.title,
          description: '',
          order_index: newOrder,
          sessions: [],
        },
      ]);
      setNewModuleTitle('');
      showSuccessBanner(`Module "${created.title}" added to curriculum.`);
    } catch (err: any) {
      alert(`Error adding module: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module and its sessions?')) return;
    setIsSaving(true);
    try {
      await dataProvider.deleteModule(moduleId);
      setModules((prev) => prev.filter((m) => m.id !== moduleId));
      showSuccessBanner('Module removed.');
    } catch (err: any) {
      alert(`Error deleting module: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ----------------------------------------------------
  // QUIZ BUILDER HANDLERS (Google Forms style)
  // ----------------------------------------------------
  const handleAddQuizQuestion = () => {
    setQuizQuestions((prev) => [
      ...prev,
      {
        id: `q_${Date.now()}`,
        question_text: `Untitled Question ${prev.length + 1}`,
        question_type: 'multiple_choice',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        correct_option_index: 0,
        marks: 1,
        required: true,
      },
    ]);
  };

  const handleDuplicateQuestion = (idx: number) => {
    setQuizQuestions((prev) => {
      const q = prev[idx];
      const copy = { ...q, id: `q_${Date.now()}`, question_text: `${q.question_text} (Copy)` };
      const updated = [...prev];
      updated.splice(idx + 1, 0, copy);
      return updated;
    });
  };

  const handleDeleteQuestion = (idx: number) => {
    if (quizQuestions.length <= 1) {
      alert('Quiz must contain at least 1 question.');
      return;
    }
    setQuizQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestion = (idx: number, field: string, value: any) => {
    setQuizQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const handleAddOption = (qIdx: number) => {
    setQuizQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: [...q.options, `Option ${q.options.length + 1}`] } : q
      )
    );
  };

  const handleRemoveOption = (qIdx: number, optIdx: number) => {
    setQuizQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        if (q.options.length <= 2) {
          alert('A question must have at least 2 options.');
          return q;
        }
        const newOpts = q.options.filter((_, oi) => oi !== optIdx);
        const newCorrect = q.correct_option_index >= newOpts.length ? 0 : q.correct_option_index;
        return { ...q, options: newOpts, correct_option_index: newCorrect };
      })
    );
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    setQuizQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        return { ...q, options: newOpts };
      })
    );
  };

  // ----------------------------------------------------
  // MULTIPLE VIDEO LINKS HANDLERS
  // ----------------------------------------------------
  const handleAddVideoLink = () => {
    setVideoLinks((prev) => [
      ...prev,
      {
        id: `v_${Date.now()}`,
        title: `Part ${prev.length + 1}: Video Lecture`,
        url: '',
        duration_minutes: 45,
      },
    ]);
  };

  const handleRemoveVideoLink = (idx: number) => {
    if (videoLinks.length <= 1) return;
    setVideoLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateVideoLink = (idx: number, field: string, value: any) => {
    setVideoLinks((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v))
    );
  };

  // ----------------------------------------------------
  // START EDITING SESSION HANDLER
  // ----------------------------------------------------
  const handleStartEditSession = (moduleId: string, sess: any) => {
    setActiveModuleForSession(moduleId);
    setEditingSessionId(sess.id);
    setOpenMenuModuleId(null);

    // Determine content type
    let cType: 'video' | 'lesson' | 'quiz' | 'assignment' | 'document' | 'link' = 'video';
    if (sess.session_type === 'quiz' || sess.content_data?.is_quiz || sess.description?.includes('"is_quiz":true')) {
      cType = 'quiz';
    } else if (sess.session_type === 'assignment') {
      cType = 'assignment';
    } else if (sess.session_type === 'document') {
      cType = 'document';
    } else if (sess.session_type === 'lesson') {
      cType = 'lesson';
    } else if (sess.session_type === 'link') {
      cType = 'link';
    } else {
      cType = 'video';
    }
    setActiveContentType(cType);

    setNewSessionTitle(sess.title || '');
    setNewSessionDriveUrl(sess.drive_url || sess.video_lecture?.drive_url || '');
    setNewSessionDuration(String(sess.duration_minutes || 45));
    setSessionNotes(sess.description || '');

    // Load multiple video links if present
    if (sess.content_data?.video_links && sess.content_data.video_links.length > 0) {
      setVideoLinks(sess.content_data.video_links);
    } else if (sess.video_lectures && sess.video_lectures.length > 0) {
      setVideoLinks(
        sess.video_lectures.map((vl: any, idx: number) => ({
          id: vl.id || `v-${idx}`,
          title: vl.title || `Part ${idx + 1}: Video Lecture`,
          url: vl.drive_url,
          duration_minutes: vl.duration_minutes || 45,
        }))
      );
    } else if (sess.video_lecture?.drive_url || sess.drive_url) {
      const u = sess.video_lecture?.drive_url || sess.drive_url;
      setVideoLinks([
        {
          id: 'v1',
          title: sess.video_lecture?.title || sess.title || 'Part 1: Video Lecture',
          url: u,
          duration_minutes: sess.video_lecture?.duration_minutes || sess.duration_minutes || 45,
        },
      ]);
    } else {
      setVideoLinks([
        {
          id: 'v1',
          title: sess.title || 'Part 1: Video Lecture',
          url: '',
          duration_minutes: 45,
        },
      ]);
    }

    // Load quiz data if quiz
    if (cType === 'quiz') {
      let qData = sess.content_data;
      if (!qData && sess.description && sess.description.includes('"is_quiz":true')) {
        try {
          qData = JSON.parse(sess.description);
        } catch {}
      }
      if (qData) {
        setQuizTitle(qData.quiz_title || sess.title);
        setQuizDescription(qData.quiz_description || '');
        setQuizPassingPercentage(qData.passing_percentage ?? 50);
        setQuizTimeLimit(qData.time_limit_minutes || 15);
        if (qData.questions && qData.questions.length > 0) {
          setQuizQuestions(qData.questions);
        }
      }
    }
  };

  // ----------------------------------------------------
  // ADD / UPDATE SESSION WITH DIVERSE CONTENT TYPES
  // ----------------------------------------------------
  const handleAddSession = async (moduleId: string) => {
    const sessionTitleToUse =
      newSessionTitle.trim() ||
      (activeContentType === 'quiz' ? quizTitle : 'Untitled Session');

    if (!sessionTitleToUse.trim()) {
      alert('Please enter a session or assessment title.');
      return;
    }

    setIsSaving(true);
    try {
      const mod = modules.find((m) => m.id === moduleId);
      const newOrder = (mod?.sessions.length || 0) + 1;

      // Map content type to database session_type
      let dbSessionType: 'lecture' | 'reading' | 'assignment' | 'quiz' = 'lecture';
      if (activeContentType === 'video') dbSessionType = 'lecture';
      else if (activeContentType === 'lesson' || activeContentType === 'document' || activeContentType === 'link') dbSessionType = 'reading';
      else if (activeContentType === 'assignment') dbSessionType = 'assignment';
      else if (activeContentType === 'quiz') dbSessionType = 'quiz';

      // Extract valid video links and primary URL
      const validVideoLinks = videoLinks.filter((v) => v && v.url && v.url.trim().length > 0);
      const primaryUrl =
        validVideoLinks.length > 0
          ? validVideoLinks[0].url.trim()
          : newSessionDriveUrl.trim();

      const driveParsed = parseGoogleDriveLink(primaryUrl);

      // Package Quiz Metadata for 100% resilient storage
      let sessionDescription = sessionNotes;
      let quizData: any = null;
      if (activeContentType === 'quiz') {
        quizData = {
          is_quiz: true,
          quiz_title: quizTitle || sessionTitleToUse,
          quiz_description: quizDescription,
          passing_percentage: quizPassingPercentage || 50,
          time_limit_minutes: Number(quizTimeLimit) || 15,
          questions: quizQuestions,
        };
        sessionDescription = JSON.stringify(quizData);
      }

      // ----------------------------------------------------
      // CASE 1: EDIT / UPDATE EXISTING SESSION
      // ----------------------------------------------------
      if (editingSessionId) {
        await dataProvider.updateSession(editingSessionId, {
          title: sessionTitleToUse,
          description: sessionDescription,
          session_type: dbSessionType,
          duration_minutes: Number(newSessionDuration) || 45,
          drive_folder_url: driveParsed.type === 'folder' ? primaryUrl : null,
        });

        // Only save video lectures if this is a video session
        if (validVideoLinks.length > 0) {
          await dataProvider.saveVideoLectures(editingSessionId, validVideoLinks);
        } else if (primaryUrl && activeContentType === 'video') {
          await dataProvider.saveVideoLecture(
            editingSessionId,
            sessionTitleToUse,
            primaryUrl,
            driveParsed.id || undefined,
            Number(newSessionDuration) || 45
          );
        }

        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId
              ? {
                  ...m,
                  sessions: m.sessions.map((s) =>
                    s.id === editingSessionId
                      ? {
                          ...s,
                          title: sessionTitleToUse,
                          description: sessionDescription,
                          duration_minutes: Number(newSessionDuration) || 45,
                          session_type: activeContentType,
                          drive_url: primaryUrl,
                          drive_file_id: driveParsed.id || undefined,
                          content_data: {
                            ...s.content_data,
                            video_links: validVideoLinks.length > 0 ? validVideoLinks : s.content_data?.video_links,
                            ...(quizData || {}),
                          },
                        }
                      : s
                  ),
                }
              : m
          )
        );

        setActiveModuleForSession(null);
        setEditingSessionId(null);
        setOpenMenuModuleId(null);
        setNewSessionTitle('');
        setNewSessionDriveUrl('');
        setSessionNotes('');
        setAssignmentInstructions('');
        setNewSessionDuration('45');
        showSuccessBanner(`Session "${sessionTitleToUse}" updated successfully!`);
        return;
      }

      // ----------------------------------------------------
      // CASE 2: CREATE NEW SESSION
      // ----------------------------------------------------
      const created = await dataProvider.createSession(moduleId, {
        title: sessionTitleToUse,
        description: sessionDescription,
        session_type: dbSessionType,
        duration_minutes: Number(newSessionDuration) || (activeContentType === 'quiz' ? Number(quizTimeLimit) || 15 : 45),
        order_index: newOrder,
        drive_folder_url: driveParsed.type === 'folder' ? primaryUrl : null,
      });

      // 1. If Video lecture links provided, save all to video_lectures table
      if (validVideoLinks.length > 0) {
        await dataProvider.saveVideoLectures(created.id, validVideoLinks);
      } else if (primaryUrl && activeContentType === 'video') {
        await dataProvider.saveVideoLecture(
          created.id,
          sessionTitleToUse,
          primaryUrl,
          driveParsed.id || undefined,
          Number(newSessionDuration) || 45
        );
      }

      // 2. If Quiz, create in quizzes table too
      if (activeContentType === 'quiz' && courseId) {
        try {
          await dataProvider.createQuiz({
            course_id: courseId,
            module_id: moduleId,
            session_id: created.id,
            title: quizTitle || sessionTitleToUse,
            description: quizDescription,
            time_limit_minutes: Number(quizTimeLimit) || 15,
            passing_percentage: quizPassingPercentage || 50,
            questions: quizQuestions,
          });
        } catch (quizErr) {
          console.warn('Quiz created with session fallback:', quizErr);
        }
      }

      // 3. If Assignment, create in assignments table
      if (activeContentType === 'assignment' && courseId) {
        try {
          await dataProvider.createAssignment({
            course_id: courseId,
            module_id: moduleId,
            session_id: created.id,
            title: sessionTitleToUse,
            description: sessionNotes || 'Module Practical Assignment',
            instructions: assignmentInstructions,
            max_marks: assignmentMaxMarks || 100,
            passing_marks: assignmentPassingMarks || 50,
          });
        } catch (asnErr) {
          console.warn('Assignment created with session fallback:', asnErr);
        }
      }

      // 4. If Document or Lesson with file link
      if (
        (activeContentType === 'document' || activeContentType === 'lesson' || activeContentType === 'link') &&
        primaryUrl &&
        courseId
      ) {
        try {
          await dataProvider.saveLearningMaterial({
            course_id: courseId,
            module_id: moduleId,
            session_id: created.id,
            title: sessionTitleToUse,
            description: sessionNotes,
            drive_url: activeContentType !== 'link' ? primaryUrl : undefined,
            external_link: activeContentType === 'link' ? primaryUrl : undefined,
          });
        } catch (matErr) {
          console.warn('Material created with session fallback:', matErr);
        }
      }

      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                sessions: [
                  ...m.sessions,
                  {
                    id: created.id,
                    title: created.title,
                    description: sessionDescription,
                    duration_minutes: Number(newSessionDuration) || 45,
                    session_type: activeContentType,
                    order_index: newOrder,
                    drive_url: primaryUrl,
                    drive_file_id: driveParsed.id || undefined,
                    content_data: {
                      video_links: videoLinks,
                      ...(quizData || {}),
                    },
                  },
                ],
              }
            : m
        )
      );

      setActiveModuleForSession(null);
      setEditingSessionId(null);
      setOpenMenuModuleId(null);
      setNewSessionTitle('');
      setNewSessionDriveUrl('');
      setSessionNotes('');
      setAssignmentInstructions('');
      setNewSessionDuration('45');
      showSuccessBanner(`Added ${activeContentType.toUpperCase()}: "${created.title}"`);
    } catch (err: any) {
      alert(`Error saving session: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSession = async (moduleId: string, sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    setIsSaving(true);
    try {
      await dataProvider.deleteSession(sessionId);
      setModules((prev) =>
        prev.map((m) =>
          m.id === moduleId
            ? { ...m, sessions: m.sessions.filter((s) => s.id !== sessionId) }
            : m
        )
      );
      showSuccessBanner('Session deleted.');
    } catch (err: any) {
      alert(`Error deleting session: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ----------------------------------------------------
  // STEP 3 ACTIONS: Publish Course
  // ----------------------------------------------------
  const handlePublishCourse = async () => {
    if (!courseId || !user) return;

    setIsSaving(true);
    try {
      await dataProvider.publishCourse(courseId, user.id);
      showSuccessBanner('Course has been published and is now live in Published Courses!');
      setTimeout(() => {
        navigate('/admin/courses?tab=published');
      }, 1200);
    } catch (err: any) {
      alert(`Error publishing course: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingCourse) {
    return (
      <div className="py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-semibold uppercase">Loading Course Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header and Step Indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <Link
            to="/admin/courses"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Courses
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {editCourseId ? 'Edit Course & Curriculum' : 'Create Course Wizard'}
          </h1>
        </div>

        {/* Step Indicator Pills */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setStep(1)}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              step === 1
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            1. Basic Details
          </button>
          <button
            onClick={() => (courseId ? setStep(2) : alert('Save basic details first.'))}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              step === 2
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            2. Content & Drive Links
          </button>
          <button
            onClick={() => (courseId ? setStep(3) : alert('Save basic details first.'))}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              step === 3
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            3. Review & Publish
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 1: BASIC COURSE DETAILS */}
      {/* ======================================================== */}
      {step === 1 && (
        <Card className="p-6 sm:p-8 space-y-6 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 1: Basic Course Information
            </h2>
            <p className="text-xs text-slate-500">
              Set the course title, syllabus overview, category, and student target level.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="Course Name *"
              placeholder="e.g. Distributed Cloud Architecture & Microservices"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Course Description *
              </label>
              <textarea
                rows={4}
                placeholder="Comprehensive technical description of curriculum, target concepts, and hands-on outcomes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                >
                  <option value="Cloud Computing">Cloud Computing</option>
                  <option value="AI & Machine Learning">AI & Machine Learning</option>
                  <option value="DevOps & Security">DevOps & Security</option>
                  <option value="Full-Stack Engineering">Full-Stack Engineering</option>
                  <option value="Embedded Systems">Embedded Systems</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Target Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="all_levels">All Levels</option>
                </select>
              </div>

              <Input
                label="Course Duration"
                placeholder="e.g. 6 Weeks (36 Hours)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Instructor Name"
                placeholder="Instructor / Lead Architect"
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
              />
            </div>

            <Input
              label="Course Thumbnail URL"
              placeholder="https://..."
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={isSaving}
                onClick={() => handleSaveStep1(false)}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={isSaving}
                onClick={handleSaveAndPublishStep1}
                leftIcon={<Globe className="w-4 h-4" />}
                className="bg-brand-green hover:bg-brand-green-dark text-white font-bold"
              >
                Save & Publish
              </Button>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={isSaving}
              onClick={() => handleSaveStep1(true)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Next: Course Content
            </Button>
          </div>
        </Card>
      )}

      {/* ======================================================== */}
      {/* STEP 2: COURSE CONTENT AND GOOGLE DRIVE LINKS */}
      {/* ======================================================== */}
      {step === 2 && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-5 border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Step 2: Course Content & Drive Resources
                </h2>
                <p className="text-xs text-slate-500">
                  Organize your course into Modules and Sessions. Attach Google Drive videos and learning files.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                >
                  Back: Basic Details
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setStep(3)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Next: Review & Publish
                </Button>
              </div>
            </div>

            {/* Add Module Input */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center">
              <Input
                placeholder="Enter new module title (e.g. Module 1: Cloud Foundation & IAM)..."
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                className="w-full"
              />
              <Button
                variant="primary"
                size="md"
                onClick={handleAddModule}
                disabled={!newModuleTitle.trim() || isSaving}
                className="shrink-0"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Module
              </Button>
            </div>
          </Card>

          {/* Module & Session Tree */}
          <div className="space-y-4">
            {modules.length === 0 ? (
              <Card className="p-10 text-center text-xs text-slate-500 border-dashed border-2">
                No modules created yet. Add your first module using the form above.
              </Card>
            ) : (
              modules.map((mod, modIdx) => (
                <Card key={mod.id} className="p-6 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 font-bold text-xs flex items-center justify-center">
                        {modIdx + 1}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{mod.title}</h3>
                      <Badge variant="outline">{mod.sessions.length} Sessions</Badge>
                    </div>

                    <div className="flex items-center gap-2 relative">
                      <div className="relative">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setOpenMenuModuleId(openMenuModuleId === mod.id ? null : mod.id)}
                          leftIcon={<Plus className="w-3.5 h-3.5" />}
                          rightIcon={<ChevronDown className="w-3.5 h-3.5" />}
                          className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
                        >
                          Add Content
                        </Button>

                        {/* Dropdown Menu (Image 2 style) */}
                        {openMenuModuleId === mod.id && (
                          <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 py-2.5 animate-in fade-in zoom-in-95">
                            <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                              Create New Content
                            </div>
                            {[
                              { type: 'lesson', label: 'Lesson', icon: FileText, desc: 'Rich lecture notes & Drive PDF' },
                              { type: 'quiz', label: 'Quiz', icon: HelpCircle, desc: 'Google Form interactive assessment' },
                              { type: 'assignment', label: 'Assignment', icon: FileCheck2, desc: 'Graded student problem set' },
                              { type: 'document', label: 'Document', icon: FileDown, desc: 'Drive study material / PDF' },
                              { type: 'video', label: 'Video', icon: Video, desc: 'Google Drive / YouTube lecture' },
                              { type: 'link', label: 'External Link', icon: ExternalLink, desc: 'Reference URL / Web link' },
                            ].map((item) => (
                              <button
                                key={item.type}
                                type="button"
                                onClick={() => {
                                  setActiveModuleForSession(mod.id);
                                  setActiveContentType(item.type as any);
                                  setOpenMenuModuleId(null);
                                  setNewSessionTitle('');
                                  setNewSessionDriveUrl('');
                                  setSessionNotes('');
                                  if (item.type === 'quiz') {
                                    setQuizTitle(`${mod.title} Assessment`);
                                  }
                                }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-brand-50/70 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors group"
                              >
                                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                                  <item.icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                                    {item.label}
                                  </div>
                                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteModule(mod.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Delete module"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Add Content Form / Modal for this Module */}
                  {activeModuleForSession === mod.id && (
                    <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-brand-500/80 shadow-lg space-y-5 animate-in fade-in">
                      {/* Sub-header & Type Switcher Pills */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600">
                            {activeContentType === 'video' && <Video className="w-4 h-4" />}
                            {activeContentType === 'lesson' && <FileText className="w-4 h-4" />}
                            {activeContentType === 'quiz' && <HelpCircle className="w-4 h-4" />}
                            {activeContentType === 'assignment' && <FileCheck2 className="w-4 h-4" />}
                            {activeContentType === 'document' && <FileDown className="w-4 h-4" />}
                            {activeContentType === 'link' && <ExternalLink className="w-4 h-4" />}
                          </span>
                          <div>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                              New {activeContentType} in {mod.title}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Configure session contents and interactive student materials.
                            </p>
                          </div>
                        </div>

                        {/* Quick Type Switcher */}
                        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                          {(['video', 'lesson', 'quiz', 'assignment', 'document', 'link'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setActiveContentType(t)}
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all capitalize ${
                                activeContentType === t
                                  ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 1. QUIZ BUILDER (Google Forms style from Image 4!) */}
                      {activeContentType === 'quiz' && (
                        <div className="space-y-5">
                          {/* Quiz Form Header Card */}
                          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50/40 dark:from-purple-950/20 dark:to-indigo-950/20 border-l-4 border-l-purple-600 border border-purple-200/80 dark:border-purple-900/60 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex-1 space-y-1">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                                  Assessment Title *
                                </label>
                                <input
                                  type="text"
                                  value={quizTitle}
                                  onChange={(e) => setQuizTitle(e.target.value)}
                                  placeholder="e.g. Module 1: Comprehensive Assessment"
                                  className="w-full text-base sm:text-lg font-black bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                />
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                                    Pass Benchmark (%)
                                  </label>
                                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl px-2.5 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 shadow-sm">
                                    <Award className="w-3.5 h-3.5 text-purple-600" />
                                    <input
                                      type="number"
                                      min={1}
                                      max={100}
                                      value={quizPassingPercentage}
                                      onChange={(e) => setQuizPassingPercentage(Math.max(1, Math.min(100, Number(e.target.value) || 50)))}
                                      className="w-12 text-center bg-transparent focus:outline-none font-black text-purple-700 dark:text-purple-300"
                                    />
                                    <span>% Required</span>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    Time Limit
                                  </label>
                                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1.5 text-xs font-bold">
                                    <input
                                      type="number"
                                      value={quizTimeLimit}
                                      onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                                      className="w-12 text-center bg-transparent focus:outline-none"
                                    />
                                    <span className="text-slate-400">min</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Assessment Instructions / Description
                              </label>
                              <textarea
                                rows={2}
                                value={quizDescription}
                                onChange={(e) => setQuizDescription(e.target.value)}
                                placeholder="Instructions for students (e.g. Minimum 70% score unlocks the next module)..."
                                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-purple-500"
                              />
                            </div>
                          </div>

                          {/* Question Cards (Google Forms Style) */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <CheckSquare className="w-4 h-4 text-purple-600" />
                                <span>Questions ({quizQuestions.length})</span>
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddQuizQuestion}
                                leftIcon={<Plus className="w-3.5 h-3.5" />}
                                className="text-purple-600 border-purple-300 dark:border-purple-800 hover:bg-purple-50"
                              >
                                Add Question
                              </Button>
                            </div>

                            {quizQuestions.map((q, qIdx) => (
                              <div
                                key={q.id}
                                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 hover:border-purple-400 dark:hover:border-purple-600 transition-colors"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 font-extrabold text-xs">
                                      {qIdx + 1}
                                    </span>
                                    <input
                                      type="text"
                                      value={q.question_text}
                                      onChange={(e) => handleUpdateQuestion(qIdx, 'question_text', e.target.value)}
                                      placeholder="Untitled Question..."
                                      className="flex-1 font-bold text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-white"
                                    />
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <select
                                      value={q.question_type}
                                      onChange={(e) => handleUpdateQuestion(qIdx, 'question_type', e.target.value)}
                                      className="text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-200"
                                    >
                                      <option value="multiple_choice">Multiple choice</option>
                                      <option value="checkboxes">Checkboxes</option>
                                      <option value="short_answer">Short answer</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Options List */}
                                <div className="space-y-2.5 pl-2 sm:pl-8">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                    Options & Answer Key (Select radio button for correct answer)
                                  </div>

                                  {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-3">
                                      {/* Correct Answer Selector */}
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateQuestion(qIdx, 'correct_option_index', optIdx)}
                                        className={`flex h-5 w-5 rounded-full border-2 items-center justify-center transition-all ${
                                          q.correct_option_index === optIdx
                                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                                            : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                                        }`}
                                        title={q.correct_option_index === optIdx ? 'Correct Answer' : 'Click to set as correct answer'}
                                      >
                                        {q.correct_option_index === optIdx && (
                                          <div className="h-2 w-2 rounded-full bg-white"></div>
                                        )}
                                      </button>

                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                        placeholder={`Option ${optIdx + 1}`}
                                        className={`flex-1 text-xs bg-white dark:bg-slate-900 border rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 ${
                                          q.correct_option_index === optIdx
                                            ? 'border-emerald-500 ring-1 ring-emerald-500 font-semibold'
                                            : 'border-slate-300 dark:border-slate-700'
                                        }`}
                                      />

                                      {q.correct_option_index === optIdx && (
                                        <Badge variant="success" className="text-[10px] shrink-0">
                                          ✓ Correct Key
                                        </Badge>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleRemoveOption(qIdx, optIdx)}
                                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                        title="Remove option"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}

                                  <button
                                    type="button"
                                    onClick={() => handleAddOption(qIdx)}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline pt-1"
                                  >
                                    <Plus className="w-3 h-3" /> Add Option
                                  </button>
                                </div>

                                {/* Question Card Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700/60 text-xs text-slate-500">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-[11px]">Marks:</span>
                                    <input
                                      type="number"
                                      value={q.marks}
                                      onChange={(e) => handleUpdateQuestion(qIdx, 'marks', Number(e.target.value))}
                                      className="w-12 text-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-0.5 font-bold"
                                      min={1}
                                    />
                                    <span className="text-[11px]">Pt</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicateQuestion(qIdx)}
                                      className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                      title="Duplicate Question"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteQuestion(qIdx)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                      title="Delete Question"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. LESSON BUILDER */}
                      {activeContentType === 'lesson' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input
                              label="Lesson Title *"
                              placeholder="e.g. Session 1.1: Core Concepts & Principles"
                              value={newSessionTitle}
                              onChange={(e) => setNewSessionTitle(e.target.value)}
                            />
                            <Input
                              label="Estimated Duration (Minutes)"
                              type="number"
                              value={newSessionDuration}
                              onChange={(e) => setNewSessionDuration(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Lesson Notes & Syllabus Content (Markdown / Text)
                            </label>
                            <textarea
                              rows={5}
                              value={sessionNotes}
                              onChange={(e) => setSessionNotes(e.target.value)}
                              placeholder="Enter comprehensive lesson notes, syllabus explanations, key formulas, or code snippets..."
                              className="w-full text-xs font-mono bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            />
                          </div>

                          <Input
                            label="Google Drive URL (Handout / PDF / Reference Folder)"
                            placeholder="https://drive.google.com/file/d/..."
                            value={newSessionDriveUrl}
                            onChange={(e) => setNewSessionDriveUrl(e.target.value)}
                          />
                        </div>
                      )}

                      {/* 3. ASSIGNMENT BUILDER */}
                      {activeContentType === 'assignment' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Input
                              label="Assignment Title *"
                              placeholder="e.g. Practical Lab 1: Cloud Architecture Deployment"
                              value={newSessionTitle}
                              onChange={(e) => setNewSessionTitle(e.target.value)}
                              className="sm:col-span-2"
                            />
                            <Input
                              label="Estimated Duration (Minutes)"
                              type="number"
                              value={newSessionDuration}
                              onChange={(e) => setNewSessionDuration(e.target.value)}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Problem Statement & Detailed Instructions
                            </label>
                            <textarea
                              rows={4}
                              value={assignmentInstructions}
                              onChange={(e) => setAssignmentInstructions(e.target.value)}
                              placeholder="Describe the task, deliverables, submission format, and grading rubric..."
                              className="w-full text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Input
                              label="Starter Template / Drive Resource URL"
                              placeholder="https://drive.google.com/file/d/..."
                              value={newSessionDriveUrl}
                              onChange={(e) => setNewSessionDriveUrl(e.target.value)}
                            />
                            <Input
                              label="Max Marks"
                              type="number"
                              value={assignmentMaxMarks}
                              onChange={(e) => setAssignmentMaxMarks(Number(e.target.value))}
                            />
                            <Input
                              label="Passing Marks"
                              type="number"
                              value={assignmentPassingMarks}
                              onChange={(e) => setAssignmentPassingMarks(Number(e.target.value))}
                            />
                          </div>
                        </div>
                      )}

                      {/* 4. DOCUMENT BUILDER */}
                      {activeContentType === 'document' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input
                              label="Document Title *"
                              placeholder="e.g. Week 1 Lecture Slides & Reading Pack"
                              value={newSessionTitle}
                              onChange={(e) => setNewSessionTitle(e.target.value)}
                            />
                            <Input
                              label="Reading Time (Minutes)"
                              type="number"
                              value={newSessionDuration}
                              onChange={(e) => setNewSessionDuration(e.target.value)}
                            />
                          </div>

                          <Input
                            label="Google Drive Document / PDF URL *"
                            placeholder="https://drive.google.com/file/d/..."
                            value={newSessionDriveUrl}
                            onChange={(e) => setNewSessionDriveUrl(e.target.value)}
                          />

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Document Summary / Reading Notes
                            </label>
                            <textarea
                              rows={3}
                              value={sessionNotes}
                              onChange={(e) => setSessionNotes(e.target.value)}
                              placeholder="Brief summary of what this document covers..."
                              className="w-full text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* 5. VIDEO BUILDER (Supports Multiple Videos with + Add button) */}
                      {activeContentType === 'video' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input
                              label="Session / Primary Video Title *"
                              placeholder="e.g. Lec 1: Introduction and Overview"
                              value={newSessionTitle}
                              onChange={(e) => setNewSessionTitle(e.target.value)}
                            />
                            <Input
                              label="Total Duration (Minutes)"
                              type="number"
                              value={newSessionDuration}
                              onChange={(e) => setNewSessionDuration(e.target.value)}
                            />
                          </div>

                          {/* Multiple Video Links List */}
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Video className="w-4 h-4 text-brand-600" />
                                <span>Lecture Video Links ({videoLinks.length})</span>
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddVideoLink}
                                leftIcon={<Plus className="w-3.5 h-3.5" />}
                                className="text-xs font-bold text-brand-600 border-brand-300 hover:bg-brand-50"
                              >
                                + Add Video Link
                              </Button>
                            </div>

                            <div className="space-y-2.5">
                              {videoLinks.map((v, vIdx) => (
                                <div
                                  key={v.id}
                                  className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
                                      Video #{vIdx + 1}
                                    </span>
                                    {videoLinks.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveVideoLink(vIdx)}
                                        className="text-slate-400 hover:text-rose-500 p-1"
                                        title="Remove video link"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    <Input
                                      placeholder="Video Part Title (e.g. Part 1: Theory)"
                                      value={v.title}
                                      onChange={(e) => handleUpdateVideoLink(vIdx, 'title', e.target.value)}
                                    />
                                    <Input
                                      placeholder="Google Drive Video URL / YouTube URL *"
                                      value={v.url}
                                      onChange={(e) => handleUpdateVideoLink(vIdx, 'url', e.target.value)}
                                      className="sm:col-span-2"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Lecture Summary & Key Concepts
                            </label>
                            <textarea
                              rows={3}
                              value={sessionNotes}
                              onChange={(e) => setSessionNotes(e.target.value)}
                              placeholder="Core takeaways and topics covered in this lecture..."
                              className="w-full text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* 6. EXTERNAL LINK BUILDER */}
                      {activeContentType === 'link' && (
                        <div className="space-y-4">
                          <Input
                            label="Resource Title *"
                            placeholder="e.g. Official Documentation & Specifications"
                            value={newSessionTitle}
                            onChange={(e) => setNewSessionTitle(e.target.value)}
                          />
                          <Input
                            label="External URL *"
                            placeholder="https://..."
                            value={newSessionDriveUrl}
                            onChange={(e) => setNewSessionDriveUrl(e.target.value)}
                          />
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Resource Description
                            </label>
                            <textarea
                              rows={2}
                              value={sessionNotes}
                              onChange={(e) => setSessionNotes(e.target.value)}
                              placeholder="Explain what students will find at this resource link..."
                              className="w-full text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* Drive Link Validation Feedback */}
                      {newSessionDriveUrl && (
                        <div className="text-[11px] flex items-center gap-2 font-medium">
                          {(() => {
                            const parsed = parseGoogleDriveLink(newSessionDriveUrl);
                            if (parsed.isValid) {
                              return (
                                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Detected valid Google Drive {parsed.type} ID: {parsed.id}
                                </span>
                              );
                            }
                            return (
                              <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Valid URL stored. Ensure access permissions allow students to view.
                              </span>
                            );
                          })()}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveModuleForSession(null);
                            setEditingSessionId(null);
                            setNewSessionTitle('');
                            setNewSessionDriveUrl('');
                            setSessionNotes('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddSession(mod.id)}
                          disabled={
                            (activeContentType !== 'quiz' && !newSessionTitle.trim()) ||
                            (activeContentType === 'quiz' && !quizTitle.trim()) ||
                            isSaving
                          }
                          className="bg-brand-600 hover:bg-brand-700 font-bold"
                        >
                          {editingSessionId ? 'Update Session' : `Save ${activeContentType.toUpperCase()} Session`}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Sessions List (Quizzes always positioned at the very end of module) */}
                  <div className="space-y-2.5 pt-1">
                    {(() => {
                      const nonQuiz: typeof mod.sessions = [];
                      const quizzes: typeof mod.sessions = [];
                      mod.sessions.forEach((s) => {
                        const isQuiz =
                          s.session_type === 'quiz' ||
                          s.content_data?.is_quiz ||
                          Boolean(s.description?.includes('"is_quiz":true')) ||
                          s.title?.toLowerCase().includes('assessment') ||
                          s.title?.toLowerCase().includes('quiz');
                        if (isQuiz) quizzes.push(s);
                        else nonQuiz.push(s);
                      });
                      const sortedSessions = [...nonQuiz, ...quizzes];

                      return sortedSessions.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                          No sessions in this module yet. Click "Add Content" above to attach lessons, quizzes, or videos.
                        </div>
                      ) : (
                        sortedSessions.map((sess, sIdx) => {
                        const isQuiz = sess.session_type === 'quiz' || sess.content_data?.is_quiz;
                        const isAsn = sess.session_type === 'assignment';
                        const isDoc = sess.session_type === 'document' || (sess.session_type === 'reading' && !sess.description?.includes('is_quiz'));
                        const isVid = sess.session_type === 'video' || sess.session_type === 'lecture';
                        const isLnk = sess.session_type === 'link';

                        return (
                          <div
                            key={sess.id}
                            className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs hover:shadow-sm transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400 font-bold text-xs">{modIdx + 1}.{sIdx + 1}</span>

                              {/* Content Type Icon */}
                              <div className={`p-2 rounded-xl shrink-0 ${
                                isQuiz ? 'bg-purple-100 dark:bg-purple-950 text-purple-600' :
                                isAsn ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' :
                                isDoc ? 'bg-sky-100 dark:bg-sky-950 text-sky-600' :
                                isVid ? 'bg-brand-100 dark:bg-brand-950 text-brand-600' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-600'
                              }`}>
                                {isQuiz && <HelpCircle className="w-4 h-4" />}
                                {isAsn && <FileCheck2 className="w-4 h-4" />}
                                {isDoc && <FileDown className="w-4 h-4" />}
                                {isVid && <Video className="w-4 h-4" />}
                                {isLnk && <ExternalLink className="w-4 h-4" />}
                              </div>

                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <p className="font-extrabold text-slate-900 dark:text-white">{sess.title}</p>
                                  {isQuiz && (
                                    <Badge variant="brand" className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px]">
                                      Quiz • {sess.content_data?.passing_percentage ?? 50}% Pass Benchmark
                                    </Badge>
                                  )}
                                  {isAsn && (
                                    <Badge variant="success" className="text-[10px]">Assignment</Badge>
                                  )}
                                  {isVid && (
                                    <Badge variant="brand" className="text-[10px]">
                                      Video Lecture{sess.content_data?.video_links && sess.content_data.video_links.length > 1 ? ` (${sess.content_data.video_links.length} Videos)` : ''}
                                    </Badge>
                                  )}
                                  {isDoc && (
                                    <Badge variant="outline" className="text-[10px]">Document / Handout</Badge>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                                  <span>{sess.duration_minutes || 45} Mins</span>
                                  {sess.drive_url && (
                                    <>
                                      <span>•</span>
                                      <a
                                        href={sess.drive_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-brand-600 hover:underline flex items-center gap-1 font-medium"
                                      >
                                        <ExternalLink className="w-3 h-3" /> Drive Resource
                                      </a>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleStartEditSession(mod.id, sess)}
                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/30 rounded-lg transition-colors"
                                title="Edit session"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSession(mod.id, sess.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                title="Delete session"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    );
                  })()}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: REVIEW AND PUBLISH */}
      {/* ======================================================== */}
      {step === 3 && (
        <Card className="p-6 sm:p-8 space-y-6 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 3: Review and Publish Course
            </h2>
            <p className="text-xs text-slate-500">
              Review your course details and curriculum structure before making it visible to students in Course Discovery.
            </p>
          </div>

          {/* Course Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-5 items-start">
            <img
              src={thumbnailUrl || '/tnv-logo.png'}
              alt={title}
              className="w-full sm:w-48 h-32 rounded-xl object-contain shrink-0 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="brand">{category}</Badge>
                <Badge variant="outline">{level.toUpperCase()}</Badge>
                <Badge variant="warning">STATUS: DRAFT</Badge>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
              <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-1">
                <span>Duration: <strong>{duration}</strong></span>
                <span>Instructor: <strong>{instructorName}</strong></span>
                <span>Total Modules: <strong>{modules.length}</strong></span>
                <span>
                  Total Sessions:{' '}
                  <strong>{modules.reduce((sum, m) => sum + m.sessions.length, 0)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Curriculum Tree Review */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Curriculum Specification Review
            </h4>

            <div className="space-y-3 border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900">
              {modules.map((m, mIdx) => (
                <div key={m.id} className="space-y-2">
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-brand-50 text-brand-600 flex items-center justify-center text-[10px]">
                      {mIdx + 1}
                    </span>
                    <span>{m.title}</span>
                    <span className="text-slate-400 font-normal">({m.sessions.length} Sessions)</span>
                  </div>

                  <div className="pl-7 space-y-1">
                    {m.sessions.map((s, sIdx) => (
                      <div key={s.id} className="text-xs text-slate-500 flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                        <span>{mIdx + 1}.{sIdx + 1} {s.title} ({s.duration_minutes} Mins)</span>
                        {s.drive_url && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Drive Resource Attached
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Publication Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setStep(2)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Content
            </Button>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={isSaving}
                onClick={() => {
                  showSuccessBanner('Draft saved in Supabase.');
                  navigate('/admin/courses');
                }}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Keep as Draft & Exit
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={isSaving}
                onClick={handlePublishCourse}
                leftIcon={<Globe className="w-4 h-4" />}
              >
                Publish Course for Students
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
