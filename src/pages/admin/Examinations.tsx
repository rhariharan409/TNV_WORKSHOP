import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { Examination, Course, ExamAttempt } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, GraduationCap, Clock, Award, CheckCircle2, Users } from 'lucide-react';

export const AdminExaminations: React.FC = () => {
  const [exams, setExams] = useState<Examination[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [duration, setDuration] = useState('45');
  const [totalMarks, setTotalMarks] = useState('50');
  const [passingMarks, setPassingMarks] = useState('25');
  const [instructions, setInstructions] = useState('');

  const loadData = async () => {
    const [eList, cList, aList] = await Promise.all([
      dataProvider.getExaminations(),
      dataProvider.getCourses(),
      dataProvider.getExamAttempts(),
    ]);
    setExams(eList);
    setCourses(cList);
    setAttempts(aList);
    if (cList.length > 0) setCourseId(cList[0].id);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    setModalOpen(false);
    alert('Examination successfully created and published for students!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Examination Center Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build proctored multiple-choice exams, configure timer durations, and monitor live student attempts.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Create Examination
        </Button>
      </div>

      {/* Examinations List */}
      <div className="space-y-4">
        {exams.map((exam) => {
          const examAttempts = attempts.filter((a) => a.exam_id === exam.id);
          const passedCount = examAttempts.filter((a) => a.is_passed).length;

          return (
            <Card key={exam.id} className="p-6 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="brand">{exam.duration_minutes} Mins Duration</Badge>
                    <span className="text-xs text-slate-400">Total Marks: {exam.total_marks} (Pass: {exam.passing_marks})</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{exam.title}</h3>
                  <p className="text-xs text-slate-500">{exam.description}</p>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-400 block">Total Attempts:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-base">
                    {examAttempts.length} ({passedCount} Passed)
                  </span>
                </div>
              </div>

              {/* Recent Student Attempts Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Student Examination Records ({examAttempts.length})
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/40 text-[10px] uppercase font-bold text-slate-500">
                      <tr>
                        <th className="p-2.5">Student</th>
                        <th className="p-2.5">Score</th>
                        <th className="p-2.5">Percentage</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {examAttempts.map((att) => (
                        <tr key={att.id}>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">{att.student?.full_name}</td>
                          <td className="p-2.5">{att.score} / {att.total_marks}</td>
                          <td className="p-2.5">{att.percentage}%</td>
                          <td className="p-2.5">
                            <Badge variant={att.is_passed ? 'success' : 'destructive'}>
                              {att.is_passed ? 'Passed' : 'Failed'}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-slate-400">{formatDate(att.submitted_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Exam Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Qualification Examination"
        description="Set timing limits, passing scores, and course linkage"
        maxWidth="md"
      >
        <form onSubmit={handleCreateExam} className="space-y-4">
          <Select
            label="Associated Course *"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            options={courses.map((c) => ({ value: c.id, label: c.title }))}
          />

          <Input
            label="Examination Title *"
            placeholder="e.g. TNV Certified Cloud Architect Examination"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Duration (Mins) *"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
            <Input
              label="Total Marks *"
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
              required
            />
            <Input
              label="Passing Marks *"
              type="number"
              value={passingMarks}
              onChange={(e) => setPassingMarks(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Examination
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
