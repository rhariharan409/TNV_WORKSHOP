import React, { useState, useEffect } from 'react';
import { Examination, Course } from '../../../types/database';
import { dataProvider } from '../../../lib/dataProvider';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';
import { AlertCircle } from 'lucide-react';

interface ExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Examination | null;
  courses: Course[];
  onSuccess: (newExam?: Examination) => void;
}

export const ExamFormModal: React.FC<ExamFormModalProps> = ({
  isOpen,
  onClose,
  exam,
  courses,
  onSuccess,
}) => {
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [duration, setDuration] = useState('45');
  const [passingPercentage, setPassingPercentage] = useState('50');
  const [maxAttempts, setMaxAttempts] = useState('2');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showAnswerReview, setShowAnswerReview] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questionsCount = exam?.questions?.length ?? 0;

  useEffect(() => {
    if (exam) {
      setCourseId(exam.course_id || '');
      setTitle(exam.title || '');
      setDescription(exam.description || '');
      setInstructions(exam.instructions || '');
      setDuration(Math.max(5, exam.duration_minutes || 45).toString());
      setPassingPercentage((exam.passing_percentage ?? 50).toString());
      setMaxAttempts((exam.max_attempts ?? 2).toString());
      setStartTime(exam.start_time ? exam.start_time.slice(0, 16) : '');
      setEndTime(exam.end_time ? exam.end_time.slice(0, 16) : '');
      setShuffleQuestions(exam.shuffle_questions !== undefined ? exam.shuffle_questions : true);
      setShowAnswerReview(exam.show_answer_review !== undefined ? exam.show_answer_review : false);
      setIsPublished(Boolean(exam.is_published));
    } else {
      setCourseId(courses.length > 0 ? courses[0].id : '');
      setTitle('');
      setDescription('');
      setInstructions('');
      setDuration('45');
      setPassingPercentage('50');
      setMaxAttempts('2');
      setStartTime('');
      setEndTime('');
      setShuffleQuestions(true);
      setShowAnswerReview(false);
      setIsPublished(false);
    }
    setErrorMsg(null);
  }, [exam, courses, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const dur = parseInt(duration, 10);
    if (isNaN(dur) || dur < 5) {
      setErrorMsg('Duration minutes must be at least 5 minutes.');
      return;
    }

    const passPct = parseInt(passingPercentage, 10);
    if (isNaN(passPct) || passPct < 1 || passPct > 100) {
      setErrorMsg('Passing percentage must be between 1% and 100%.');
      return;
    }

    const maxAtt = parseInt(maxAttempts, 10);
    if (isNaN(maxAtt) || maxAtt < 1) {
      setErrorMsg('Max attempts must be at least 1.');
      return;
    }

    if (startTime && endTime) {
      const s = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      if (end <= s) {
        setErrorMsg('End date-time must be strictly after the start date-time.');
        return;
      }
    }

    if (isPublished && questionsCount === 0) {
      setErrorMsg('Add questions first before publishing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Examination> = {
        course_id: courseId,
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        duration_minutes: dur,
        passing_percentage: passPct,
        max_attempts: maxAtt,
        start_time: startTime ? new Date(startTime).toISOString() : null,
        end_time: endTime ? new Date(endTime).toISOString() : null,
        shuffle_questions: shuffleQuestions,
        show_answer_review: showAnswerReview,
        is_published: questionsCount > 0 ? isPublished : false,
      };

      let createdExam: Examination | null = null;
      if (exam) {
        await dataProvider.updateExamination(exam.id, payload);
      } else {
        // New exams are always created as Draft
        createdExam = await dataProvider.createExamination({
          ...payload,
          is_published: false,
        });
      }

      onSuccess(createdExam || undefined);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save examination.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={exam ? 'Edit Examination Settings' : 'Create New Examination (Draft)'}
      description="Configure duration, passing thresholds, window dates, and proctoring settings"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Target Course *"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            options={courses.map((c) => ({ value: c.id, label: c.title }))}
          />

          <Input
            label="Examination Title *"
            placeholder="e.g. Masterclass Final Technical Qualification"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Description
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short overview of what the exam assesses..."
            className="w-full rounded-2xl border-none bg-[#eef3f8] dark:bg-slate-800 p-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
          ></textarea>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Candidate Instructions & Rules
          </label>
          <textarea
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Enter rules displayed to students before starting..."
            className="w-full rounded-2xl border-none bg-[#eef3f8] dark:bg-slate-800 p-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
          ></textarea>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Duration (Min 5) *"
            type="number"
            min="5"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
          <Input
            label="Passing Percentage % *"
            type="number"
            min="1"
            max="100"
            value={passingPercentage}
            onChange={(e) => setPassingPercentage(e.target.value)}
            required
          />
          <Input
            label="Max Attempts *"
            type="number"
            min="1"
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Input
            label="Start Date & Time (Optional)"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <Input
            label="End Date & Time (Optional)"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Proctoring & Review Configuration
          </span>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={shuffleQuestions}
              onChange={(e) => setShuffleQuestions(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <span>Shuffle questions order per student attempt (Default: ON)</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={showAnswerReview}
              onChange={(e) => setShowAnswerReview(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <span>Show question-by-question answer review after submission (Default: OFF)</span>
          </label>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Publish Status
          </span>

          <span
            title={questionsCount === 0 ? "Add questions first" : undefined}
            className="inline-block"
          >
            <label
              className={`flex items-center gap-2.5 text-xs font-semibold ${
                questionsCount === 0
                  ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                  : 'text-slate-700 dark:text-slate-300 cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                checked={isPublished}
                disabled={questionsCount === 0}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 disabled:opacity-50"
              />
              <span>Publish Examination (make visible to enrolled students)</span>
            </label>
          </span>
          {questionsCount === 0 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              * Add questions first before publishing this exam.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {exam ? 'Save Changes' : 'Create Draft Exam'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
