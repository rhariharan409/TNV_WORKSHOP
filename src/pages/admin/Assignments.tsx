import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Assignment, Course } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, FileText, Trash2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminAssignments: React.FC = () => {
  const { user } = useAuth();
  const adminId = user?.role === 'super_admin' ? undefined : user?.id;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [aList, cList] = await Promise.all([
        dataProvider.getAssignments(undefined, adminId),
        dataProvider.getCourses({ adminId }),
      ]);
      setAssignments(aList);
      setCourses(cList);
      if (cList.length > 0 && !courseId) setCourseId(cList[0].id);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Assignment Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create practical coding assignments, set grading rubrics, and configure submission deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/submissions">
            <Button variant="outline" size="sm">
              Review Submissions
            </Button>
          </Link>
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            New Assignment
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {assignments.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-500">
            No assignments created yet. Click &quot;New Assignment&quot; to set up an assignment for your courses.
          </Card>
        ) : (
          assignments.map((a) => (
            <Card key={a.id} className="p-6 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="brand">Max Marks: {a.max_marks} (Pass: {a.passing_marks})</Badge>
                    <span className="text-xs text-slate-500 font-semibold">Course: {a.course?.title || 'Course'}</span>
                    <span className="text-xs text-slate-400">• Due: {formatDate(a.due_date)}</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{a.title}</h3>
                  <p className="text-xs text-slate-500 max-w-2xl">{a.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Link to="/admin/submissions">
                    <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      Submissions
                    </Button>
                  </Link>
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
          ))
        )}
      </div>

      {/* Create Assignment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Technical Assignment"
        description="Publish instructions, deadlines and scoring rubrics"
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
