import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Course, Module, Session, CertificateTemplate, Examination } from '../../types/database';
import { parseGoogleDriveLink, isValidGoogleDriveUrl } from '../../lib/utils';
import {
  parseQuestionsCSV,
  downloadQuestionCSVTemplate,
  ParsedQuestionRow,
} from '../../lib/csvQuestionParser';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
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
  GraduationCap,
  Upload,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

export const AdminCourseCreate: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editCourseId = searchParams.get('id');

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
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
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('0');

  // Step 3: Examination Configuration
  const [examTitle, setExamTitle] = useState('Final Certification Examination');
  const [examDuration, setExamDuration] = useState('45');
  const [examTotalMarks, setExamTotalMarks] = useState('50');
  const [examPassingPercentage, setExamPassingPercentage] = useState('50');
  const [examPassingMarks, setExamPassingMarks] = useState('25');
  const [examQuestions, setExamQuestions] = useState<
    Array<{
      id: string;
      question_text: string;
      options: string[];
      correct_option_index: number;
      marks: number;
    }>
  >([]);

  // Question Form State (ManageQuestionsModal logic)
  const [editingQIndex, setEditingQIndex] = useState<number | null>(null);
  const [qText, setQText] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState<number>(0);
  const [qMarks, setQMarks] = useState('2');
  const [qError, setQError] = useState<string | null>(null);

  // Step 3: CSV Batch Question Import State
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<ParsedQuestionRow[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [isCsvImporting, setIsCsvImporting] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 4: Certificate Template Selection
  const [certificateTemplates, setCertificateTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedCertificateTemplateId, setSelectedCertificateTemplateId] = useState<string>('');

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

  // Load existing course if editing, plus certificate templates & exam
  useEffect(() => {
    dataProvider.getCertificateTemplates().then((templates) => {
      setCertificateTemplates(templates);
      if (editCourseId && typeof window !== 'undefined') {
        const saved = localStorage.getItem(`tnv_course_cert_template_${editCourseId}`);
        if (saved) {
          setSelectedCertificateTemplateId(saved);
          return;
        }
      }
      if (templates.length > 0) {
        setSelectedCertificateTemplateId(templates[0].id);
      }
    });

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
          setIsPaid(Boolean(c.is_paid));
          setPrice(String(c.price || 0));

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

      // Load existing examination for this course if one exists
      dataProvider.getExaminations(editCourseId).then((eList) => {
        const ex = eList.find((e) => e.course_id === editCourseId);
        if (ex) {
          setExamTitle(ex.title);
          setExamDuration(String(ex.duration_minutes || 45));
          setExamTotalMarks(String(ex.total_marks || 50));
          setExamPassingPercentage(String(ex.passing_percentage || 50));
          setExamPassingMarks(String(ex.passing_marks || 25));
          if (ex.questions && ex.questions.length > 0) {
            setExamQuestions(
              ex.questions.map((q) => ({
                id: q.id,
                question_text: q.question_text,
                options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
                correct_option_index: q.correct_option_index ?? 0,
                marks: q.marks || 2,
              }))
            );
          }
        }
      });
    }
  }, [editCourseId, user]);

  const showSuccessBanner = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // ----------------------------------------------------
  // STEP 3 EXAMINATION BUILDER HANDLERS
  // ----------------------------------------------------
  const handleResetQForm = () => {
    setEditingQIndex(null);
    setQText('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQCorrect(0);
    setQMarks('2');
    setQError(null);
  };

  const handleEditQuestion = (index: number) => {
    const q = examQuestions[index];
    if (!q) return;
    setEditingQIndex(index);
    setQText(q.question_text);
    setQOptA(q.options[0] || '');
    setQOptB(q.options[1] || '');
    setQOptC(q.options[2] || '');
    setQOptD(q.options[3] || '');
    setQCorrect(q.correct_option_index ?? 0);
    setQMarks(String(q.marks || 2));
    setQError(null);
  };

  const handleDeleteExamQuestion = (index: number) => {
    const updated = examQuestions.filter((_, i) => i !== index);
    setExamQuestions(updated);
    if (editingQIndex === index) {
      handleResetQForm();
    }
    const sumMarks = updated.reduce((sum, q) => sum + (q.marks || 2), 0);
    if (sumMarks > 0) {
      setExamTotalMarks(String(sumMarks));
      const pct = parseInt(examPassingPercentage, 10) || 50;
      setExamPassingMarks(String(Math.ceil((sumMarks * pct) / 100)));
    }
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setQError(null);

    const txt = qText.trim();
    const optA = String(qOptA ?? '').trim();
    const optB = String(qOptB ?? '').trim();
    const optC = String(qOptC ?? '').trim();
    const optD = String(qOptD ?? '').trim();
    const marksNum = parseInt(qMarks, 10) || 2;

    if (!txt || !optA || !optB || !optC || !optD) {
      setQError('Question prompt and all 4 options (A, B, C, D) are required.');
      return;
    }

    const options = [optA, optB, optC, optD];
    const setOfOpts = new Set(options.map((o) => o.toLowerCase()));
    if (setOfOpts.size !== 4) {
      setQError('Each of the 4 options must be distinct and non-empty.');
      return;
    }

    if (qCorrect < 0 || qCorrect > 3) {
      setQError('Please select the single correct option index (A, B, C, or D).');
      return;
    }

    let updatedQuestions: typeof examQuestions;
    if (editingQIndex !== null) {
      updatedQuestions = examQuestions.map((q, idx) =>
        idx === editingQIndex
          ? {
              ...q,
              question_text: txt,
              options,
              correct_option_index: qCorrect,
              marks: marksNum,
            }
          : q
      );
      showSuccessBanner('Exam question updated.');
    } else {
      const newQ = {
        id: `temp_${Date.now()}`,
        question_text: txt,
        options,
        correct_option_index: qCorrect,
        marks: marksNum,
      };
      updatedQuestions = [...examQuestions, newQ];
      showSuccessBanner('Exam question added to question bank.');
    }

    setExamQuestions(updatedQuestions);
    const sumMarks = updatedQuestions.reduce((sum, q) => sum + (q.marks || 2), 0);
    if (sumMarks > 0) {
      setExamTotalMarks(String(sumMarks));
      const pct = parseInt(examPassingPercentage, 10) || 50;
      setExamPassingMarks(String(Math.ceil((sumMarks * pct) / 100)));
    }
    handleResetQForm();
  };

  const handleAddSampleExamQuestion = () => {
    const num = examQuestions.length + 1;
    const sample = {
      id: `temp_${Date.now()}`,
      question_text: `What is the primary technical objective of Module ${num} in ${title || 'this course'}?`,
      options: [
        'Production grade implementation and high availability architecture',
        'Deprecated legacy protocol integration without fallback',
        'Unverified mock test harness',
        'Optional temporary cache file creation',
      ],
      correct_option_index: 0,
      marks: 2,
    };
    const updated = [...examQuestions, sample];
    setExamQuestions(updated);
    const sumMarks = updated.reduce((sum, q) => sum + (q.marks || 2), 0);
    if (sumMarks > 0) {
      setExamTotalMarks(String(sumMarks));
      const pct = parseInt(examPassingPercentage, 10) || 50;
      setExamPassingMarks(String(Math.ceil((sumMarks * pct) / 100)));
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseQuestionsCSV(text);
      if (rows.length === 0) {
        alert('The CSV file appears to be empty or contains only the header row.');
      }
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleImportValidCSVToExam = () => {
    const validRows = csvPreview.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('No valid question rows found to import.');
      return;
    }

    setIsCsvImporting(true);
    try {
      const newQuestions = validRows.map((r, i) => ({
        id: `temp_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        question_text: r.question,
        options: [r.option_a, r.option_b, r.option_c, r.option_d],
        correct_option_index: r.correct_option_index,
        marks: r.marks || 2,
      }));

      const updated = [...examQuestions, ...newQuestions];
      setExamQuestions(updated);

      const sumMarks = updated.reduce((sum, q) => sum + (q.marks || 2), 0);
      if (sumMarks > 0) {
        setExamTotalMarks(String(sumMarks));
        const pct = parseInt(examPassingPercentage, 10) || 50;
        setExamPassingMarks(String(Math.ceil((sumMarks * pct) / 100)));
      }

      showSuccessBanner(`Successfully imported ${validRows.length} questions from CSV to examination!`);
      setIsCsvModalOpen(false);
      setCsvPreview([]);
      setCsvFileName('');
    } finally {
      setIsCsvImporting(false);
    }
  };

  const handleSaveExamForCourse = async (targetCourseId: string) => {
    if (!examTitle.trim() && examQuestions.length === 0) return;

    const totalMarksNum =
      parseInt(examTotalMarks, 10) ||
      examQuestions.reduce((sum, q) => sum + (q.marks || 2), 0) ||
      50;
    const passPct = parseInt(examPassingPercentage, 10) || 50;
    const passMarksNum =
      parseInt(examPassingMarks, 10) || Math.ceil((totalMarksNum * passPct) / 100);

    // 1. Check if an examination already exists for this course
    let existingExams = await dataProvider.getExaminations(targetCourseId);
    let examRecord = existingExams.find((e) => e.course_id === targetCourseId);

    const examPayload: Partial<Examination> = {
      course_id: targetCourseId,
      title: examTitle.trim() || `${title} Final Examination`,
      duration_minutes: parseInt(examDuration, 10) || 45,
      total_marks: totalMarksNum,
      passing_marks: passMarksNum,
      passing_percentage: passPct,
      max_attempts: 2,
      shuffle_questions: true,
      show_answer_review: false,
      is_published: false,
    };

    let savedExamId: string;
    if (examRecord) {
      const updated = await dataProvider.updateExamination(examRecord.id, examPayload);
      savedExamId = updated.id;
    } else {
      const created = await dataProvider.createExamination(examPayload);
      savedExamId = created.id;
    }

    // 2. Save questions
    if (examQuestions.length > 0) {
      const dbQuestions = await dataProvider.getExamQuestionsAdmin(savedExamId);
      const dbQuestionMap = new Map(
        dbQuestions.map((q) => [q.question_text.trim().toLowerCase(), q.id])
      );

      for (let idx = 0; idx < examQuestions.length; idx++) {
        const q = examQuestions[idx];
        const existingDbId =
          q.id && !q.id.startsWith('temp_')
            ? q.id
            : dbQuestionMap.get(q.question_text.trim().toLowerCase());
        if (existingDbId) {
          await dataProvider.updateExamQuestion(existingDbId, {
            question_text: q.question_text,
            options: q.options,
            correct_option_index: q.correct_option_index,
            marks: q.marks,
            order_index: idx + 1,
          });
        } else {
          await dataProvider.createExamQuestion({
            exam_id: savedExamId,
            question_text: q.question_text,
            options: q.options,
            correct_option_index: q.correct_option_index,
            marks: q.marks,
            order_index: idx + 1,
          });
        }
      }

      // Publish examination now that questions exist
      try {
        await dataProvider.publishExamination(savedExamId, true);
      } catch (e) {
        console.warn('Auto-publish examination notice:', e);
      }
    }

    // 3. Save certificate template mapping
    if (selectedCertificateTemplateId && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`tnv_course_cert_template_${targetCourseId}`, selectedCertificateTemplateId);
      } catch {}
    }
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
        is_paid: isPaid,
        price: isPaid ? (parseFloat(price) || 0) : 0,
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

    const isPaidCourse = isPaid || (parseFloat(price) || 0) > 0;
    if (isPaidCourse && examQuestions.length === 0) {
      alert(
        'A paid course must have an examination with at least 1 question before it can be published. Please configure the exam in Step 3.'
      );
      setStep(3);
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
        is_paid: isPaid,
        price: isPaid ? (parseFloat(price) || 0) : 0,
      };

      let currentId = courseId;
      if (currentId) {
        await dataProvider.updateCourse(currentId, payload);
        await handleSaveExamForCourse(currentId);
        await dataProvider.publishCourse(currentId, user?.id);
      } else {
        const created = await dataProvider.createCourse(payload);
        currentId = created.id;
        await handleSaveExamForCourse(currentId);
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

    // Drive Link Validation: accept only URLs matching https://drive.google.com/file/d/<id>/..., https://drive.google.com/open?id=<id>, or https://docs.google.com/...
    if (activeContentType === 'document') {
      if (!newSessionDriveUrl.trim() || !isValidGoogleDriveUrl(newSessionDriveUrl)) {
        alert('Please enter a valid Google Drive link.');
        return;
      }
    } else if (newSessionDriveUrl.trim() && !isValidGoogleDriveUrl(newSessionDriveUrl)) {
      alert('Please enter a valid Google Drive link.');
      return;
    }

    if (activeContentType === 'video') {
      for (const v of videoLinks) {
        if (v && v.url && v.url.trim()) {
          const urlTrimmed = v.url.trim();
          if ((urlTrimmed.includes('drive.google.com') || urlTrimmed.includes('docs.google.com')) && !isValidGoogleDriveUrl(urlTrimmed)) {
            alert('Please enter a valid Google Drive link.');
            return;
          }
        }
      }
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

    const isPaidCourse = isPaid || (parseFloat(price) || 0) > 0;
    const hasValidExam = examQuestions.length >= 1 && examTitle.trim().length > 0;
    if (isPaidCourse && !hasValidExam) {
      alert(
        'A paid course must have an examination with at least 1 question before it can be published. Please add questions in Step 3.'
      );
      setStep(3);
      return;
    }

    setIsSaving(true);
    try {
      await dataProvider.updateCourse(courseId, {
        title,
        description,
        category,
        level,
        duration,
        instructor_name: instructorName,
        thumbnail_url: thumbnailUrl.trim() || '/tnv-logo.png',
        is_paid: isPaid,
        price: isPaid ? (parseFloat(price) || 0) : 0,
      });

      await handleSaveExamForCourse(courseId);

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
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
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
            2. Content & Sessions
          </button>
          <button
            onClick={() => (courseId ? setStep(3) : alert('Save basic details first.'))}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              step === 3
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            3. Examination
          </button>
          <button
            onClick={() => (courseId ? setStep(4) : alert('Save basic details first.'))}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              step === 4
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            4. Certificate
          </button>
          <button
            onClick={() => (courseId ? setStep(5) : alert('Save basic details first.'))}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              step === 5
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            5. Review & Publish
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

            {/* Course Access & Pricing Selector */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Course Access & Fee Structure *
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="pricing_type"
                    checked={!isPaid}
                    onChange={() => setIsPaid(false)}
                    className="text-[#1b6b3a] focus:ring-[#1b6b3a] h-4 w-4"
                  />
                  <span>Free Course (Open Enrollment)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="radio"
                    name="pricing_type"
                    checked={isPaid}
                    onChange={() => setIsPaid(true)}
                    className="text-[#1b6b3a] focus:ring-[#1b6b3a] h-4 w-4"
                  />
                  <span>Paid Course (Fee Required)</span>
                </label>
              </div>

              {isPaid && (
                <div className="pt-2 max-w-xs animate-in fade-in duration-200">
                  <Input
                    label="Course Price (INR ₹) *"
                    type="number"
                    min="1"
                    placeholder="e.g. 1999"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enrolling students will be required to submit payment verification before course content unlocks.
                  </p>
                </div>
              )}
            </div>
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
                  Next: Examination
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
                          {isValidGoogleDriveUrl(newSessionDriveUrl) ? (
                            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Valid Google Drive link.
                            </span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Please enter a valid Google Drive link.
                            </span>
                          )}
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

            {/* Bottom Step 2 Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="md"
                onClick={() => setStep(1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back: Basic Details
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setStep(3)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Next: Examination
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: EXAMINATION CONFIGURATION */}
      {/* ======================================================== */}
      {step === 3 && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6 border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-brand-600" />
                  Step 3: Course Examination Configuration
                </h2>
                <p className="text-xs text-slate-500">
                  Configure the qualification examination and multiple-choice questions for course completion.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(2)}
                  leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                >
                  Back: Content
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    if (courseId) {
                      await handleSaveExamForCourse(courseId);
                    }
                    setStep(4);
                  }}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Next: Certificate
                </Button>
              </div>
            </div>

            {/* Exam Details Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Examination Title *"
                placeholder="e.g. Masterclass Final Qualification Exam"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                required
              />
              <Input
                label="Duration (Minutes) *"
                type="number"
                min="5"
                value={examDuration}
                onChange={(e) => setExamDuration(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Total Marks *"
                type="number"
                min="1"
                value={examTotalMarks}
                onChange={(e) => {
                  setExamTotalMarks(e.target.value);
                  const tot = parseInt(e.target.value, 10) || 50;
                  const pct = parseInt(examPassingPercentage, 10) || 50;
                  setExamPassingMarks(String(Math.ceil((tot * pct) / 100)));
                }}
                required
              />
              <Input
                label="Passing Percentage % *"
                type="number"
                min="1"
                max="100"
                value={examPassingPercentage}
                onChange={(e) => {
                  setExamPassingPercentage(e.target.value);
                  const pct = parseInt(e.target.value, 10) || 50;
                  const tot = parseInt(examTotalMarks, 10) || 50;
                  setExamPassingMarks(String(Math.ceil((tot * pct) / 100)));
                }}
                required
              />
              <Input
                label="Passing Marks"
                type="number"
                value={examPassingMarks}
                onChange={(e) => setExamPassingMarks(e.target.value)}
                required
              />
            </div>

            {/* Inline Question List & Form (reusing ManageQuestionsModal logic) */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-brand-600" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Question Bank ({examQuestions.length} Questions Added)
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Total: {examQuestions.reduce((sum, q) => sum + (q.marks || 2), 0)} Marks
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCsvPreview([]);
                      setCsvFileName('');
                      setIsCsvModalOpen(true);
                    }}
                    leftIcon={<Upload className="w-3.5 h-3.5 text-[#1b6b3a]" />}
                    className="font-bold border-[#1b6b3a]/30 text-[#1b6b3a] hover:bg-[#1b6b3a]/5"
                  >
                    Upload CSV Questions
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSampleExamQuestion}
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
                  >
                    Add Sample Question
                  </Button>
                </div>
              </div>

              {/* Question Input Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center justify-between">
                  <span>
                    {editingQIndex !== null ? `Editing Question #${editingQIndex + 1}` : 'Add Multiple-Choice Question'}
                  </span>
                  {editingQIndex !== null && (
                    <button
                      type="button"
                      onClick={handleResetQForm}
                      className="text-xs text-slate-500 hover:text-slate-700 underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                </h4>

                {qError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{qError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Question Prompt *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter multiple-choice question prompt..."
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                    className="w-full rounded-2xl border-none bg-white dark:bg-slate-900 p-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                  />
                </div>

                {/* 4 Options with Radio selection for correct option */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Options & Correct Answer (Click radio button of the correct option) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: 'Option A', val: qOptA, setVal: setQOptA, idx: 0 },
                      { label: 'Option B', val: qOptB, setVal: setQOptB, idx: 1 },
                      { label: 'Option C', val: qOptC, setVal: setQOptC, idx: 2 },
                      { label: 'Option D', val: qOptD, setVal: setQOptD, idx: 3 },
                    ].map((opt) => (
                      <div
                        key={opt.idx}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                          qCorrect === opt.idx
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="correctOptionRadio"
                          checked={qCorrect === opt.idx}
                          onChange={() => setQCorrect(opt.idx)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          title="Mark as correct answer"
                        />
                        <div className="w-full">
                          <input
                            type="text"
                            placeholder={`${opt.label} text...`}
                            value={opt.val}
                            onChange={(e) => opt.setVal(e.target.value)}
                            className="w-full text-xs font-semibold bg-transparent border-none p-0 focus:outline-none text-slate-800 dark:text-white"
                          />
                        </div>
                        {qCorrect === opt.idx && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase shrink-0">
                            Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="w-36">
                    <Input
                      label="Marks *"
                      type="number"
                      min="1"
                      value={qMarks}
                      onChange={(e) => setQMarks(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {editingQIndex !== null && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetQForm}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleSaveQuestion}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      {editingQIndex !== null ? 'Update Question' : 'Add Question'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Added Questions List */}
              {examQuestions.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-xs font-semibold text-slate-500">
                    No examination questions added yet. Use the builder above or click &quot;Add Sample Question&quot;.
                  </p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    * Paid courses require an examination with at least 1 question to publish.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {examQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-xs"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            {q.question_text}
                          </h5>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {q.marks} Marks
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`text-xs p-2 rounded-lg flex items-center gap-2 ${
                                q.correct_option_index === oIdx
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-700'
                                  : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-medium'
                              }`}
                            >
                              <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold bg-white dark:bg-slate-800 shrink-0">
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span className="truncate">{opt}</span>
                              {q.correct_option_index === oIdx && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 ml-auto shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditQuestion(idx)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40 rounded-lg transition-colors"
                          title="Edit question"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExamQuestion(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 3 Navigation Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="md"
                onClick={() => setStep(2)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back: Content
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={async () => {
                  if (courseId) {
                    await handleSaveExamForCourse(courseId);
                  }
                  setStep(4);
                }}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Next: Certificate
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 4: CERTIFICATE TEMPLATE SELECTION */}
      {/* ======================================================== */}
      {step === 4 && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6 border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Step 4: Certificate Template Selection
                </h2>
                <p className="text-xs text-slate-500">
                  Select the certificate design and accreditation template issued upon successful completion and exam pass.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(3)}
                  leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                >
                  Back: Examination
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setStep(5)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Next: Review & Publish
                </Button>
              </div>
            </div>

            {/* Certificate Template Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificateTemplates.length === 0 ? (
                <div className="p-6 col-span-2 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <Award className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-500 font-semibold">
                    Using system standard Academy Certificate template.
                  </p>
                </div>
              ) : (
                certificateTemplates.map((template) => {
                  const isSelected = selectedCertificateTemplateId === template.id;
                  return (
                    <div
                      key={template.id}
                      onClick={() => setSelectedCertificateTemplateId(template.id)}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/30 dark:bg-brand-950/20 ring-2 ring-brand-500 shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-brand-600" />
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              {template.template_name}
                            </h4>
                          </div>
                          <p className="text-xs font-semibold text-slate-500">
                            {template.badge_title || 'Certificate of Technical Achievement'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-slate-500">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-medium capitalize">
                              Layout: {template.layout || 'classic'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-medium">
                              Signatory: {template.signatory_name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
                              Min Progress: {template.min_course_progress_percentage || 80}%
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 pt-0.5">
                          <input
                            type="radio"
                            name="certTemplateRadio"
                            checked={isSelected}
                            onChange={() => setSelectedCertificateTemplateId(template.id)}
                            className="w-4 h-4 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Step 4 Navigation Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="md"
                onClick={() => setStep(3)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back: Examination
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setStep(5)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Next: Review & Publish
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 5: REVIEW AND PUBLISH */}
      {/* ======================================================== */}
      {step === 5 && (
        <Card className="p-6 sm:p-8 space-y-6 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 5: Review and Publish Course
            </h2>
            <p className="text-xs text-slate-500">
              Review your course details, curriculum structure, examination, and accreditation template before making it live to students.
            </p>
          </div>

          {/* Paid Course Requirement Warning */}
          {(() => {
            const isPaidCourse = isPaid || (parseFloat(price) || 0) > 0;
            const hasValidExam = examQuestions.length >= 1 && examTitle.trim().length > 0;
            if (isPaidCourse && !hasValidExam) {
              return (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-sm">
                        Publishing Blocked: Paid Course Requires an Examination
                      </span>
                      <span className="text-[11px] text-rose-700 dark:text-rose-300">
                        This course is configured as Paid (₹{price}). Paid courses must have an examination with at least 1 question before they can be published.
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 bg-white dark:bg-slate-900 border-rose-300"
                    onClick={() => setStep(3)}
                  >
                    Configure Exam
                  </Button>
                </div>
              );
            }
            return null;
          })()}

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
                {isPaid || (parseFloat(price) || 0) > 0 ? (
                  <Badge variant="brand">₹{price} (PAID)</Badge>
                ) : (
                  <Badge variant="outline">FREE COURSE</Badge>
                )}
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

          {/* Examination & Certificate Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-brand-600" />
                <span>Qualification Examination</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {examTitle}
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500 pt-1">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold">
                  {examQuestions.length} Question{examQuestions.length !== 1 ? 's' : ''}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold">
                  {examDuration} Mins
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold">
                  Pass: {examPassingMarks} / {examTotalMarks} ({examPassingPercentage}%)
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Certificate Accreditation</span>
              </div>
              {(() => {
                const tmpl = certificateTemplates.find((t) => t.id === selectedCertificateTemplateId) || certificateTemplates[0];
                return (
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {tmpl ? tmpl.template_name : 'Default Academy Certificate'}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 pt-1">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold capitalize">
                        Layout: {tmpl?.layout || 'classic'}
                      </span>
                      {tmpl?.signatory_name && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold">
                          Signatory: {tmpl.signatory_name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
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
              onClick={() => setStep(4)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Back to Certificate
            </Button>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={isSaving}
                onClick={async () => {
                  if (courseId) {
                    await handleSaveExamForCourse(courseId);
                  }
                  showSuccessBanner('Draft saved in Supabase.');
                  navigate('/admin/courses');
                }}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Keep as Draft & Exit
              </Button>

              {(() => {
                const isPaidCourse = isPaid || (parseFloat(price) || 0) > 0;
                const hasValidExam = examQuestions.length >= 1 && examTitle.trim().length > 0;
                const isPublishBlocked = isPaidCourse && !hasValidExam;

                return (
                  <span
                    title={
                      isPublishBlocked
                        ? 'Cannot publish a paid course without an examination with at least 1 question'
                        : undefined
                    }
                  >
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      disabled={isSaving || isPublishBlocked}
                      onClick={handlePublishCourse}
                      leftIcon={<Globe className="w-4 h-4" />}
                    >
                      Publish Course for Students
                    </Button>
                  </span>
                );
              })()}
            </div>
          </div>
        </Card>
      )}

      {/* CSV Batch Question Import Modal */}
      <Modal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        title="Upload Examination Questions via CSV"
        description="Upload a CSV file containing questions, options (including numeric options like 2, 3, 44), correct answers, and marks."
        maxWidth="3xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#1b6b3a]" />
                  CSV File Format Guidelines
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Required columns:{' '}
                  <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[10px]">
                    question, option_a, option_b, option_c, option_d, correct, marks
                  </code>
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                  ✓ Supports text and numeric options (e.g. 2, 3, 44, 200).
                  ✓ Correct answer can be option letter (A, B, C, D) or the exact option value (e.g. 44).
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadQuestionCSVTemplate('TNV_Course_Questions_Template.csv')}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="font-bold shrink-0 text-xs"
              >
                Download Sample Template
              </Button>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <input
                ref={csvFileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCsvFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => csvFileInputRef.current?.click()}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Select CSV File
              </Button>
              {csvFileName && (
                <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {csvFileName} ({csvPreview.length} rows parsed)
                </span>
              )}
            </div>
          </div>

          {/* CSV Preview Table */}
          {csvPreview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Parsed Questions ({csvPreview.filter((r) => r.isValid).length} valid of {csvPreview.length} rows)
                </span>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleImportValidCSVToExam}
                  isLoading={isCsvImporting}
                  disabled={csvPreview.filter((r) => r.isValid).length === 0}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                >
                  Import {csvPreview.filter((r) => r.isValid).length} Questions to Exam
                </Button>
              </div>

              <div className="max-h-64 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto text-xs">
                <table className="w-full text-left text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700 sticky top-0">
                    <tr>
                      <th className="p-2">Row</th>
                      <th className="p-2">Question</th>
                      <th className="p-2">Options (A, B, C, D)</th>
                      <th className="p-2 text-center">Correct Answer</th>
                      <th className="p-2 text-center">Marks</th>
                      <th className="p-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {csvPreview.map((row) => (
                      <tr key={row.rowNum} className={row.isValid ? '' : 'bg-rose-50/50 dark:bg-rose-950/20'}>
                        <td className="p-2 font-mono font-bold text-slate-400">#{row.rowNum}</td>
                        <td className="p-2 font-semibold max-w-[200px] truncate" title={row.question}>
                          {row.question}
                        </td>
                        <td className="p-2 text-[11px] max-w-[220px] truncate text-slate-500">
                          A: {row.option_a} | B: {row.option_b} | C: {row.option_c} | D: {row.option_d}
                        </td>
                        <td className="p-2 font-bold text-center">
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">{row.correct_raw}</span>{' '}
                          <span className="text-[10px] text-slate-400 font-normal">
                            (Option {String.fromCharCode(65 + row.correct_option_index)})
                          </span>
                        </td>
                        <td className="p-2 text-center font-semibold">{row.marks}</td>
                        <td className="p-2 text-right">
                          {row.isValid ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              Valid
                            </span>
                          ) : (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 cursor-help"
                              title={row.error}
                            >
                              {row.error || 'Invalid'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCsvModalOpen(false)}
            >
              Cancel
            </Button>
            {csvPreview.length > 0 && csvPreview.filter((r) => r.isValid).length > 0 && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleImportValidCSVToExam}
                isLoading={isCsvImporting}
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Import {csvPreview.filter((r) => r.isValid).length} Questions to Exam
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
