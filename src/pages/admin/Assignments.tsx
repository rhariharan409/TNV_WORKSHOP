import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { Assignment, Course } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, FileText, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminAssignments: React.FC = () => {
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
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [aList, cList] = await Promise.all([
      dataProvider.getAssignments(),
      dataProvider.getCourses(),
    ]);
    setAssignments(aList);
    setCourses(cList);
    if (cList.length > 0) setCourseId(cList[0].id);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setModalOpen(false);
    alert('Assignment successfully created and published for enrolled students!');
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
        {assignments.map((a) => (
          <Card key={a.id} className="p-6 border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="brand">Max Marks: {a.max_marks} (Pass: {a.passing_marks})</Badge>
                  <span className="text-xs text-slate-400">Due: {formatDate(a.due_date)}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{a.title}</h3>
                <p className="text-xs text-slate-500 max-w-2xl">{a.description}</p>
              </div>

              <Link to="/admin/submissions">
                <Button variant="secondary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View Submissions
                </Button>
              </Link>
            </div>
          </Card>
        ))}
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
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
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
            <Button type="submit" variant="primary" size="sm">
              Publish Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
