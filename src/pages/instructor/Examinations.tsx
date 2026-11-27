import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Examination, Course, ExamAttempt } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ExamFormModal } from '../../components/admin/examinations/ExamFormModal';
import { ManageQuestionsModal } from '../../components/admin/examinations/ManageQuestionsModal';
import { ExamResultsModal } from '../../components/admin/examinations/ExamResultsModal';
import {
  GraduationCap,
  Plus,
  Clock,
  Trash2,
  FileEdit,
  HelpCircle,
  BarChart2,
  AlertTriangle,
  Globe,
  EyeOff,
  Calendar,
  BookOpen,
} from 'lucide-react';

export const InstructorExaminations: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Examination[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedExamForForm, setSelectedExamForForm] = useState<Examination | null>(null);

  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);
  const [selectedExamForQuestions, setSelectedExamForQuestions] = useState<Examination | null>(null);

  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [selectedExamForResults, setSelectedExamForResults] = useState<Examination | null>(null);

  const [publishActionLoading, setPublishActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const assignedCourses = await dataProvider.getInstructorCourses(user.id);
      const assignedCourseIds = new Set(assignedCourses.map((c) => c.id));
      setCourses(assignedCourses);

      const [allExams, allAttempts] = await Promise.all([
        dataProvider.getExaminations(undefined, undefined, true),
        dataProvider.getExamAttempts(),
      ]);

      // Strictly filter to instructor's assigned courses only
      const scopedExams = allExams.filter(
        (e) => e.course_id && assignedCourseIds.has(e.course_id)
      );
      const scopedExamIds = new Set(scopedExams.map((e) => e.id));
      const scopedAttempts = allAttempts.filter((a) => scopedExamIds.has(a.exam_id));

      setExams(scopedExams);
      setAttempts(scopedAttempts);
    } catch (err) {
      console.error('Failed to load examinations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Publish / Unpublish Toggle
  const handleTogglePublish = async (exam: Examination) => {
    const questionsCount = exam.questions?.length ?? 0;
    if (!exam.is_published && questionsCount === 0) {
      alert('Add questions first');
      return;
    }

    setPublishActionLoading(exam.id);
    try {
      const newStatus = !exam.is_published;
      await dataProvider.publishExamination(exam.id, newStatus);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update publication status.');
    } finally {
      setPublishActionLoading(null);
    }
  };

  const handleExamFormSuccess = async (createdExam?: Examination) => {
    await loadData();
    if (createdExam) {
      setSelectedExamForQuestions(createdExam);
      setIsQuestionsModalOpen(true);
    }
  };

  // Delete Exam with confirmation and attempts check
  const handleDeleteExam = async (exam: Examination) => {
    const examAttempts = attempts.filter((a) => a.exam_id === exam.id);
    if (examAttempts.length > 0) {
      alert(
        `Cannot delete "${exam.title}" because ${examAttempts.length} student attempt(s) have already been submitted. You can unpublish or duplicate it instead.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete "${exam.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await dataProvider.deleteExamination(exam.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete examination.');
    }
  };

  // Duplicate Exam
  const handleDuplicateExam = async (examId: string) => {
    try {
      const newExam = await dataProvider.duplicateExamination(examId);
      alert(`Successfully duplicated examination as Draft: "${newExam.title}"!`);
      setIsQuestionsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(`Duplicate failed: ${err.message}`);
    }
  };

  // Group exams by course
  const coursesWithExams = courses.map((course) => {
    const courseExams = exams.filter((e) => e.course_id === course.id);
    const hasPublished = courseExams.some((e) => e.is_published);
    return {
      course,
      exams: courseExams,
      hasPublished,
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-[#1b6b3a] dark:text-emerald-400" />
            Examination Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build proctored multiple-choice exams, configure minimum 10-question banks, inspect student attempts, and enforce certification criteria for assigned courses.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setSelectedExamForForm(null);
            setIsFormModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Examination
        </Button>
      </div>

      {/* Courses Warning Banner: Courses with no published exam */}
      {courses.some((c) => !exams.some((e) => e.course_id === c.id && e.is_published)) && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold block">
                Rule Notice: A course certificate is issued only when all sessions are complete AND the exam is passed.
              </span>
              <span className="text-[11px] text-amber-800 dark:text-amber-300">
                Courses without a published exam show: &quot;No exam: students cannot earn a certificate.&quot;
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Exam Cards Grouped by Course */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500 space-y-2">
          <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
            No courses assigned to your instructor profile.
          </p>
          <p className="text-slate-400">
            Contact administrator to assign courses before configuring examinations.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {coursesWithExams.map(({ course, exams: courseExams, hasPublished }) => (
            <div key={course.id} className="space-y-3">
              {/* Course Group Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#1b6b3a] dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      {course.title}
                      <span className="text-xs text-slate-400 font-normal">
                        ({courseExams.length} Exam{courseExams.length !== 1 ? 's' : ''})
                      </span>
                    </h2>
                    <span className="text-[10px] text-slate-500 block">
                      Category: {course.category || 'Technical Workshop'}
                    </span>
                  </div>
                </div>

                <div>
                  {!hasPublished ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      No exam: students cannot earn a certificate.
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <Globe className="w-3.5 h-3.5 text-emerald-600" /> Published Exam Active
                    </span>
                  )}
                </div>
              </div>

              {/* Course's Exams Cards List */}
              {courseExams.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 space-y-2">
                  <p>No examinations configured for &quot;{course.title}&quot; yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedExamForForm(null);
                      setIsFormModalOpen(true);
                    }}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Create Exam for this Course
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseExams.map((exam) => {
                    const examAttempts = attempts.filter((a) => a.exam_id === exam.id);
                    const passedCount = examAttempts.filter((a) => a.is_passed).length;
                    const questionsCount = exam.questions?.length ?? 0;
                    const has10Questions = questionsCount >= 10;
                    const isDraft = !exam.is_published;

                    return (
                      <Card
                        key={exam.id}
                        className="p-5 sm:p-6 border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-emerald-500/40 transition-colors"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-2">
                            {/* Status Chip & Badges */}
                            <div className="flex flex-wrap items-center gap-2">
                              {isDraft ? (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                  Draft
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
                                  Published
                                </span>
                              )}

                              {/* Question Counter */}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                                  questionsCount > 0
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}
                              >
                                <HelpCircle className="w-3 h-3" />
                                {questionsCount} Question{questionsCount !== 1 ? 's' : ''}
                              </span>

                              <Badge variant="outline">
                                <Clock className="w-3 h-3 mr-1" />
                                {exam.duration_minutes} Mins
                              </Badge>

                              <Badge variant="outline">
                                Pass: {exam.passing_percentage ?? 50}% ({exam.passing_marks} / {exam.total_marks} Marks)
                              </Badge>

                              <Badge variant="outline">
                                Max Attempts: {exam.max_attempts ?? 2}
                              </Badge>
                            </div>

                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                              {exam.title}
                            </h3>

                            {exam.description && (
                              <p className="text-xs text-slate-500 max-w-2xl">{exam.description}</p>
                            )}

                            {/* Window Dates & Attempt stats */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                              {(exam.start_time || exam.end_time) && (
                                <span className="flex items-center gap-1.5 font-medium">
                                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                  Window:{' '}
                                  {exam.start_time ? formatDate(exam.start_time) : 'Immediate'} →{' '}
                                  {exam.end_time ? formatDate(exam.end_time) : 'No deadline'}
                                </span>
                              )}

                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                Total Attempts Taken: {examAttempts.length} ({passedCount} Passed)
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                            {/* Manage Questions Button */}
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setSelectedExamForQuestions(exam);
                                setIsQuestionsModalOpen(true);
                              }}
                              leftIcon={<HelpCircle className="w-3.5 h-3.5" />}
                            >
                              Manage Questions
                            </Button>

                            {/* Results Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedExamForResults(exam);
                                setIsResultsModalOpen(true);
                              }}
                              leftIcon={<BarChart2 className="w-3.5 h-3.5" />}
                            >
                              Results ({examAttempts.length})
                            </Button>

                            {/* Publish / Unpublish Button */}
                            <span
                              title={
                                !exam.is_published && questionsCount === 0
                                  ? 'Add questions first'
                                  : undefined
                              }
                            >
                              <Button
                                variant={exam.is_published ? 'outline' : 'secondary'}
                                size="sm"
                                disabled={!exam.is_published && questionsCount === 0}
                                isLoading={publishActionLoading === exam.id}
                                onClick={() => handleTogglePublish(exam)}
                                leftIcon={
                                  exam.is_published ? (
                                    <EyeOff className="w-3.5 h-3.5" />
                                  ) : (
                                    <Globe className="w-3.5 h-3.5" />
                                  )
                                }
                              >
                                {exam.is_published ? 'Unpublish' : 'Publish'}
                              </Button>
                            </span>

                            {/* Edit Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedExamForForm(exam);
                                setIsFormModalOpen(true);
                              }}
                              leftIcon={<FileEdit className="w-3.5 h-3.5" />}
                            >
                              Edit
                            </Button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteExam(exam)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                              title="Delete examination"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* REUSED ADMIN MODALS */}
      {isFormModalOpen && (
        <ExamFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setSelectedExamForForm(null);
          }}
          exam={selectedExamForForm}
          courses={courses}
          onSuccess={handleExamFormSuccess}
        />
      )}

      {isQuestionsModalOpen && selectedExamForQuestions && (
        <ManageQuestionsModal
          isOpen={isQuestionsModalOpen}
          onClose={() => {
            setIsQuestionsModalOpen(false);
            setSelectedExamForQuestions(null);
          }}
          exam={selectedExamForQuestions}
          attemptsCount={attempts.filter((a) => a.exam_id === selectedExamForQuestions.id).length}
          onQuestionsUpdated={loadData}
          onDuplicate={handleDuplicateExam}
        />
      )}

      {isResultsModalOpen && selectedExamForResults && (
        <ExamResultsModal
          isOpen={isResultsModalOpen}
          onClose={() => {
            setIsResultsModalOpen(false);
            setSelectedExamForResults(null);
          }}
          exam={selectedExamForResults}
        />
      )}
    </div>
  );
};
