import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Assignment, Course, AssignmentSubmission } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import {
  Plus,
  FileText,
  Trash2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

interface InstructorAssignmentsProps {
  courseId?: string;
}

export const InstructorAssignments: React.FC<InstructorAssignmentsProps> = ({ courseId: propCourseId }) => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    propCourseId || searchParams.get('courseId') || null
  );
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (propCourseId) {
      setSelectedCourseId(propCourseId);
      setCourseId(propCourseId);
    }
  }, [propCourseId]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [courseId, setCourseId] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('50');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Quick grading state
  const [activeSub, setActiveSub] = useState<AssignmentSubmission | null>(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const assignedCourses = await dataProvider.getInstructorCourses(user.id);
      setCourses(assignedCourses);

      const assignedCourseIds = new Set(assignedCourses.map((c) => c.id));

      const [allAssignments, allSubs] = await Promise.all([
        dataProvider.getAssignments(),
        dataProvider.getAssignmentSubmissions(),
      ]);

      const scopedAssignments = allAssignments.filter(
        (a) => a.course_id && assignedCourseIds.has(a.course_id)
      );
      const scopedAssignmentIds = new Set(scopedAssignments.map((a) => a.id));

      const scopedSubs = allSubs.filter(
        (s) =>
          (s.assignment?.course_id && assignedCourseIds.has(s.assignment.course_id)) ||
          scopedAssignmentIds.has(s.assignment_id)
      );

      setAssignments(scopedAssignments);
      setSubmissions(scopedSubs);

      if (propCourseId) {
        setSelectedCourseId(propCourseId);
        setCourseId(propCourseId);
      } else if (assignedCourses.length > 0 && !courseId) {
        setCourseId(selectedCourseId || assignedCourses[0].id);
      }
    } catch (err) {
      console.error('Failed to load instructor assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleSelectCourse = (cId: string | null) => {
    setSelectedCourseId(cId);
    if (cId) {
      setCourseId(cId);
      setSearchParams({ courseId: cId });
    } else {
      setSearchParams({});
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseId) return;

    setIsSubmitting(true);
    try {
      await dataProvider.createAssignment({
        course_id: courseId,
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim(),
        max_marks: parseInt(maxMarks, 10) || 100,
        passing_marks: parseInt(passingMarks, 10) || 50,
        due_date: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      setModalOpen(false);
      setTitle('');
      setDescription('');
      setInstructions('');
      await loadData();
      alert('Assignment successfully created and published for enrolled students!');
    } catch (err: any) {
      alert(`Failed to create assignment: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await dataProvider.deleteAssignment(id);
      await loadData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleOpenGradeModal = (sub: AssignmentSubmission) => {
    setActiveSub(sub);
    setGradeMarks(sub.marks_obtained !== null && sub.marks_obtained !== undefined ? sub.marks_obtained.toString() : '');
    setGradeFeedback(sub.feedback || '');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSub) return;
    setIsGrading(true);
    try {
      await dataProvider.evaluateSubmission(activeSub.id, Number(gradeMarks) || 0, gradeFeedback);
      setActiveSub(null);
      await loadData();
    } catch (err: any) {
      alert(`Grading failed: ${err.message}`);
    } finally {
      setIsGrading(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const courseAssignments = selectedCourseId
    ? assignments.filter((a) => a.course_id === selectedCourseId)
    : [];
  const courseSubmissions = selectedCourseId
    ? submissions.filter((s) => s.assignment?.course_id === selectedCourseId || courseAssignments.some((a) => a.id === s.assignment_id))
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-8 h-8 text-[#1b6b3a]" />
            <span>Assignment Manager</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse assignments across your assigned curricula, configure evaluation criteria, and review code deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/instructor/submissions">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Review All Submissions
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (selectedCourseId) setCourseId(selectedCourseId);
              setModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            disabled={courses.length === 0}
          >
            New Assignment
          </Button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* VIEW 1: COURSE CARDS (Show one card per assigned course)    */}
      {/* ========================================================== */}
      {!selectedCourseId ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Assigned Courses ({courses.length})
            </h2>
            <span className="text-xs text-slate-400">Click a course card to view its assignments and submissions</span>
          </div>

          {isLoading ? (
            <Card className="p-12 text-center text-xs text-slate-500">Loading courses...</Card>
          ) : courses.length === 0 ? (
            <Card className="p-12 text-center text-xs text-slate-500">
              No courses assigned yet. Once courses are assigned by the administrator, they will appear here.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => {
                const cAsgns = assignments.filter((a) => a.course_id === c.id);
                const cSubs = submissions.filter(
                  (s) => s.assignment?.course_id === c.id || cAsgns.some((a) => a.id === s.assignment_id)
                );
                const pendingCount = cSubs.filter((s) => s.status === 'submitted' || s.status === 'under_review').length;

                return (
                  <Card
                    key={c.id}
                    onClick={() => handleSelectCourse(c.id)}
                    className="p-5 border-slate-200 dark:border-slate-800 hover:border-[#1b6b3a] dark:hover:border-[#1b6b3a] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#1b6b3a] dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-100 dark:border-emerald-900/50">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <Badge variant="brand">{c.category || 'Technical Workshop'}</Badge>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-[#1b6b3a] dark:group-hover:text-emerald-400 transition-colors">
                          {c.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                          {c.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Assignments</span>
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {cAsgns.length}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Submissions</span>
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {cSubs.length}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold text-[#1b6b3a] dark:text-emerald-400 pt-1">
                        <span>
                          {pendingCount > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                              ● {pendingCount} Pending Review
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal text-[11px]">All evaluated</span>
                          )}
                        </span>
                        <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          View Assignments <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================== */
        /* VIEW 2: SELECTED COURSE ASSIGNMENTS & SUBMISSIONS          */
        /* ========================================================== */
        <div className="space-y-8">
          {/* Back button & Course summary */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {!propCourseId && (
                <button
                  onClick={() => handleSelectCourse(null)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#1b6b3a] transition-colors w-fit"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to All Assigned Courses
                </button>
              )}

              <div className="flex items-center gap-2">
                <Link to={`/instructor/submissions?courseId=${selectedCourse?.id}`}>
                  <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Submissions & Grading View
                  </Button>
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setCourseId(selectedCourse?.id || '');
                    setModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Add Assignment to Course
                </Button>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="brand">{selectedCourse?.category || 'Workshop'}</Badge>
                  <span className="text-xs text-slate-400">Faculty: {user?.full_name || 'Instructor'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {selectedCourse?.title}
                </h2>
                {selectedCourse?.description && (
                  <p className="text-xs text-slate-500 max-w-3xl">{selectedCourse.description}</p>
                )}
              </div>

              <div className="flex items-center gap-4 shrink-0 text-center">
                <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Course Assignments</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white">{courseAssignments.length}</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Submissions</span>
                  <span className="text-lg font-black text-[#1b6b3a] dark:text-emerald-400">{courseSubmissions.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Course Assignments */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#1b6b3a]" />
                Assignments for this Course ({courseAssignments.length})
              </h3>
            </div>

            {courseAssignments.length === 0 ? (
              <Card className="p-8 text-center text-xs text-slate-500">
                No assignments have been created for this course yet. Click &quot;Add Assignment to Course&quot; above to create one.
              </Card>
            ) : (
              <div className="space-y-3">
                {courseAssignments.map((a) => {
                  const asgnSubs = courseSubmissions.filter((s) => s.assignment_id === a.id);
                  return (
                    <Card key={a.id} className="p-5 border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="brand">Max Marks: {a.max_marks} (Pass: {a.passing_marks})</Badge>
                            <span className="text-xs text-slate-400">• Due: {formatDate(a.due_date)}</span>
                            <span className="text-xs text-slate-500 font-semibold">• {asgnSubs.length} Submissions logged</span>
                          </div>
                          <h4 className="font-bold text-base text-slate-900 dark:text-white">{a.title}</h4>
                          <p className="text-xs text-slate-500 max-w-2xl">{a.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteAssignment(a.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Assignment"
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

          {/* Section 2: Course Submissions Under It */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#1b6b3a]" />
                Submissions under this Course ({courseSubmissions.length})
              </h3>
            </div>

            <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Student</th>
                      <th className="py-3.5 px-4">Assignment</th>
                      <th className="py-3.5 px-4">Submitted Solution</th>
                      <th className="py-3.5 px-4">Submission Date</th>
                      <th className="py-3.5 px-4">Status & Score</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {courseSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-xs text-slate-400">
                          No student submissions received for this course yet.
                        </td>
                      </tr>
                    ) : (
                      courseSubmissions.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {s.student?.full_name || 'Student'}
                            </span>
                            <span className="text-[11px] text-slate-400">{s.student?.email}</span>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                            {s.assignment?.title || 'Assignment'}
                          </td>

                          <td className="py-3.5 px-4 max-w-[220px]">
                            {s.submission_text ? (
                              s.submission_text.startsWith('http') ? (
                                <a
                                  href={s.submission_text}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#1b6b3a] dark:text-emerald-400 underline font-mono text-[11px] truncate block"
                                >
                                  {s.submission_text}
                                </a>
                              ) : (
                                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate block">
                                  {s.submission_text}
                                </span>
                              )
                            ) : s.file_url ? (
                              <a
                                href={s.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#1b6b3a] underline text-[11px]"
                              >
                                View File
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                            {formatDate(s.submitted_at)}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={s.status} />
                              {s.marks_obtained !== null && s.marks_obtained !== undefined && (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {s.marks_obtained}/100
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <Button variant="primary" size="sm" onClick={() => handleOpenGradeModal(s)}>
                              {s.status === 'evaluated' ? 'Re-Evaluate' : 'Grade Submission'}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Grade Submission Modal */}
      <Modal
        isOpen={Boolean(activeSub)}
        onClose={() => setActiveSub(null)}
        title="Grade Assignment Submission"
        description={`Evaluating: ${activeSub?.assignment?.title || 'Assignment'} by ${activeSub?.student?.full_name || 'Student'}`}
        maxWidth="md"
      >
        {activeSub && (
          <form onSubmit={handleSaveGrade} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              <span className="text-slate-400 font-bold block uppercase text-[10px]">Student Submission:</span>
              <p className="font-mono text-[#1b6b3a] dark:text-emerald-400 break-all">
                {activeSub.submission_text || activeSub.file_url || 'No content provided'}
              </p>
            </div>

            <Input
              label="Marks Obtained (out of 100) *"
              type="number"
              min="0"
              max="100"
              value={gradeMarks}
              onChange={(e) => setGradeMarks(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Mentor Feedback & Review Notes
              </label>
              <textarea
                rows={3}
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Write constructive evaluation notes for the student..."
                className="w-full rounded-2xl border-none bg-[#eef3f8] dark:bg-slate-800 p-3.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveSub(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isGrading}>
                Save & Post Grade
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create Assignment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Technical Assignment"
        description="Publish instructions, deadlines and scoring rubrics for your course"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <Select
            label="Associated Course *"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            options={courses.map((c) => ({ value: c.id, label: c.title }))}
          />

          <Input
            label="Assignment Title *"
            placeholder="e.g. Multi-Tenant RLS Policy Implementation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Description & Objectives *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-2xl border-none bg-[#eef3f8] dark:bg-slate-800 p-3.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Max Marks *"
              type="number"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              required
            />
            <Input
              label="Passing Marks *"
              type="number"
              value={passingMarks}
              onChange={(e) => setPassingMarks(e.target.value)}
              required
            />
            <Input
              label="Due Date *"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Publish Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
