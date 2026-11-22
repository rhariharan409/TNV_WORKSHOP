import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Course, CourseEnrollment, Profile } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { ProgressBar } from '../../components/ui/ProgressBar';
import {
  Users,
  Search,
  CheckCircle2,
  BookOpen,
  Eye,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  FileCheck2,
} from 'lucide-react';

interface StudentRow {
  student: Profile;
  enrollments: Array<{
    id: string;
    course: Course;
    status: string;
    progress_percentage: number;
    is_completed: boolean;
    enrolled_at: string;
  }>;
}

export const AdminStudents: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentRows, setStudentRows] = useState<StudentRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<StudentRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    const adminId = user.role === 'super_admin' ? undefined : user.id;

    // 1. Fetch courses owned by this admin
    const adminCourses = await dataProvider.getCourses({ adminId });
    setCourses(adminCourses);
    const courseIdSet = new Set(adminCourses.map((c) => c.id));

    // 2. Fetch course enrollments for these courses
    const allEnrs = await dataProvider.getCourseEnrollments(undefined, undefined, adminId);
    const scopedEnrs = allEnrs.filter((e) => courseIdSet.has(e.course_id));

    // 3. Group by unique student
    const studentMap = new Map<string, StudentRow>();
    scopedEnrs.forEach((e) => {
      if (!e.student) return;
      if (!studentMap.has(e.student_id)) {
        studentMap.set(e.student_id, {
          student: e.student,
          enrollments: [],
        });
      }
      studentMap.get(e.student_id)!.enrollments.push({
        id: e.id,
        course: e.course || (adminCourses.find((c) => c.id === e.course_id) as Course),
        status: e.status || 'active',
        progress_percentage: e.progress_percentage || 0,
        is_completed: e.is_completed || false,
        enrolled_at: e.enrolled_at,
      });
    });

    setStudentRows(Array.from(studentMap.values()));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Filtering
  const filteredRows = studentRows.filter((row) => {
    const s = row.student;
    const nameMatch =
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.college_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const courseMatch =
      courseFilter === 'all' || row.enrollments.some((e) => e.course?.id === courseFilter);

    const statusMatch =
      statusFilter === 'all' ||
      row.enrollments.some((e) => {
        if (statusFilter === 'completed') return e.is_completed;
        if (statusFilter === 'active') return e.status === 'active' && !e.is_completed;
        if (statusFilter === 'pending') return e.status === 'pending_approval';
        return true;
      });

    return nameMatch && courseMatch && statusMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Student Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Displaying students enrolled in your courses ({user?.full_name || 'Admin'}). Multi-course enrollments are grouped per student.
          </p>
        </div>

        <Badge variant="brand" className="text-xs px-3 py-1 font-bold">
          Enrolled Students: {studentRows.length}
        </Badge>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, email, college..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <Select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All My Courses' },
              ...courses.map((c) => ({ value: c.id, label: c.title })),
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Enrollment Statuses' },
              { value: 'active', label: 'Actively Learning' },
              { value: 'completed', label: 'Curriculum Completed' },
              { value: 'pending', label: 'Pending Approval' },
            ]}
          />
        </div>
      </Card>

      {/* Unique Students Table */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">College & Contact</th>
                <th className="py-3.5 px-4">Enrolled Course(s)</th>
                <th className="py-3.5 px-4">Tracks</th>
                <th className="py-3.5 px-4">Enrolled Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading student directory...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No students found matching your filters for your courses.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.student.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {row.student.full_name}
                      </span>
                      <span className="text-[11px] text-slate-400">{row.student.email}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[200px]">
                        {row.student.college_name || '—'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {row.student.phone || 'No phone recorded'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                        {row.enrollments.map((enr) => (
                          <Badge
                            key={enr.id}
                            variant={enr.is_completed ? 'success' : 'outline'}
                            className="text-[10px] py-0.5"
                          >
                            {enr.course?.title || 'Course'}
                          </Badge>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-brand-600 dark:text-brand-400">
                        {row.enrollments.length} {row.enrollments.length === 1 ? 'Course' : 'Courses'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                      {formatDate(row.enrollments[0]?.enrolled_at)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedStudentForDetails(row)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect Progress
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Student Course Breakdown Modal */}
      <Modal
        isOpen={Boolean(selectedStudentForDetails)}
        onClose={() => setSelectedStudentForDetails(null)}
        title={`Student Profile: ${selectedStudentForDetails?.student.full_name}`}
        description="Comprehensive course progress, assignments, and curriculum status"
        maxWidth="lg"
      >
        <div className="space-y-6 text-xs max-h-[70vh] overflow-y-auto pr-2">
          {/* Student Info Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-400 block mb-0.5">Email:</span>
              <span className="font-bold text-slate-900 dark:text-white truncate block">
                {selectedStudentForDetails?.student.email}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Phone:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedStudentForDetails?.student.phone || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">College:</span>
              <span className="font-bold text-slate-900 dark:text-white truncate block">
                {selectedStudentForDetails?.student.college_name || '—'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Enrolled Tracks:</span>
              <span className="font-bold text-brand-600 dark:text-brand-400">
                {selectedStudentForDetails?.enrollments.length} Courses
              </span>
            </div>
          </div>

          {/* Enrolled Courses Breakdown */}
          <div className="space-y-4">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              Enrolled Courses & Academic Progression
            </h4>

            {selectedStudentForDetails?.enrollments.map((enr) => (
              <div
                key={enr.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                      {enr.course?.title}
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Enrolled on: {formatDate(enr.enrolled_at)}
                    </p>
                  </div>

                  <Badge variant={enr.is_completed ? 'success' : 'brand'}>
                    {enr.is_completed ? 'COMPLETED' : 'IN PROGRESS'}
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Course Session Progress:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {enr.progress_percentage}%
                    </span>
                  </div>
                  <ProgressBar value={enr.progress_percentage} size="sm" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setSelectedStudentForDetails(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
