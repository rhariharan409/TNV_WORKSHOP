import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Profile, Course, CourseInstructor } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Users,
  UserCheck,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  Shield,
  UserX,
  Award,
} from 'lucide-react';

export const AdminInstructors: React.FC = () => {
  const { user } = useAuth();
  const [instructors, setInstructors] = useState<Profile[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<CourseInstructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [promoteCourseIds, setPromoteCourseIds] = useState<string[]>([]);
  const [promoteSearch, setPromoteSearch] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);

  // Assign courses modal state
  const [selectedInstructorForCourses, setSelectedInstructorForCourses] = useState<Profile | null>(null);
  const [editCourseIds, setEditCourseIds] = useState<string[]>([]);
  const [isSavingCourses, setIsSavingCourses] = useState(false);

  // Revoke modal state
  const [instructorToRevoke, setInstructorToRevoke] = useState<Profile | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [instrList, profList, courseList, assignList] = await Promise.all([
        dataProvider.getInstructors(),
        dataProvider.getProfiles(),
        dataProvider.getCourses(),
        dataProvider.getCourseInstructors(),
      ]);

      setInstructors(instrList);
      setAllProfiles(profList);
      setCourses(courseList);
      setAssignments(assignList);
    } catch (err: any) {
      console.error('Error loading instructors data:', err);
      showToast('Failed to load instructor records.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle promote user to instructor
  const handlePromote = async () => {
    if (!selectedStudentId) {
      showToast('Please select a student to promote.', 'error');
      return;
    }
    setIsPromoting(true);
    try {
      await dataProvider.promoteToInstructor(selectedStudentId);

      // Assign selected courses
      for (const cId of promoteCourseIds) {
        await dataProvider.assignCourseToInstructor(cId, selectedStudentId);
      }

      showToast('User successfully promoted to Instructor and courses assigned!');
      setIsPromoteModalOpen(false);
      setSelectedStudentId('');
      setPromoteCourseIds([]);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to promote user.', 'error');
    } finally {
      setIsPromoting(false);
    }
  };

  // Open assign courses modal
  const openAssignCoursesModal = (instructor: Profile) => {
    setSelectedInstructorForCourses(instructor);
    const assigned = assignments
      .filter((a) => a.instructor_id === instructor.id)
      .map((a) => a.course_id);
    setEditCourseIds(assigned);
  };

  // Save courses assignment
  const handleSaveCourses = async () => {
    if (!selectedInstructorForCourses) return;
    setIsSavingCourses(true);
    try {
      const currentAssigned = assignments
        .filter((a) => a.instructor_id === selectedInstructorForCourses.id)
        .map((a) => a.course_id);

      const toAdd = editCourseIds.filter((id) => !currentAssigned.includes(id));
      const toRemove = currentAssigned.filter((id) => !editCourseIds.includes(id));

      for (const cId of toAdd) {
        await dataProvider.assignCourseToInstructor(cId, selectedInstructorForCourses.id);
      }
      for (const cId of toRemove) {
        await dataProvider.removeCourseFromInstructor(cId, selectedInstructorForCourses.id);
      }

      showToast('Course assignments updated successfully!');
      setSelectedInstructorForCourses(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update assignments.', 'error');
    } finally {
      setIsSavingCourses(false);
    }
  };

  // Remove single course directly
  const handleQuickRemoveCourse = async (courseId: string, instructorId: string, courseTitle: string) => {
    if (!confirm(`Remove "${courseTitle}" from this instructor's curriculum?`)) return;
    try {
      await dataProvider.removeCourseFromInstructor(courseId, instructorId);
      showToast(`Removed course from instructor.`);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove course.', 'error');
    }
  };

  // Revoke Instructor role
  const handleRevokeRole = async () => {
    if (!instructorToRevoke) return;
    setIsRevoking(true);
    try {
      await dataProvider.revokeInstructorRole(instructorToRevoke.id);
      showToast(`Revoked instructor privileges for ${instructorToRevoke.full_name}. Reverted to Student.`);
      setInstructorToRevoke(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke instructor role.', 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  // Filtered instructors
  const filteredInstructors = instructors.filter((inst) => {
    const q = searchTerm.toLowerCase();
    return (
      inst.full_name?.toLowerCase().includes(q) ||
      inst.email?.toLowerCase().includes(q) ||
      inst.college_name?.toLowerCase().includes(q) ||
      inst.department?.toLowerCase().includes(q)
    );
  });

  // Students eligible for promotion
  const eligibleStudents = allProfiles.filter(
    (p) =>
      p.role !== 'admin' &&
      p.role !== 'super_admin' &&
      p.role !== 'instructor' &&
      !instructors.some((i) => i.id === p.id)
  );

  const filteredEligibleStudents = eligibleStudents.filter((s) => {
    const q = promoteSearch.toLowerCase();
    return s.full_name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
  });

  // Unique assigned courses count
  const assignedCourseIdsSet = new Set(assignments.map((a) => a.course_id));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 border text-xs font-bold transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-[#1b6b3a]" />
            <span>Instructor & Faculty Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Promote academy members to instructors, configure course curriculum assignments, and manage access privileges.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            setSelectedStudentId('');
            setPromoteCourseIds([]);
            setPromoteSearch('');
            setIsPromoteModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Promote User to Instructor
        </Button>
      </div>


      {/* KPI Stats - Matching Card Style of Image 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Instructors</span>
            <GraduationCap className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {instructors.length}
          </div>
          <p className="text-xs text-slate-500">Authorized Faculty Members</p>
        </Card>

        <Card className="p-5 flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Courses</span>
            <BookOpen className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {assignedCourseIdsSet.size} <span className="text-sm font-semibold text-slate-400">/ {courses.length}</span>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">Curricula with assigned faculty</p>
        </Card>

        <Card className="p-5 flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Eligible Students</span>
            <Users className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {eligibleStudents.length}
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400">Available to promote as instructor</p>
        </Card>
      </div>

      {/* Search Input */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search instructors by name, email, department..."
            className="pl-10 text-xs"
          />
        </div>
      </div>

      {/* Instructors Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredInstructors.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500 space-y-3">
          <UserCheck className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
            {searchTerm ? 'No instructors match your search.' : 'No instructors appointed yet.'}
          </p>
          <p className="text-slate-500 max-w-sm mx-auto">
            Click &quot;Promote User to Instructor&quot; above to select an enrolled member and assign them course responsibility.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInstructors.map((inst) => {
            const instAssignments = assignments.filter((a) => a.instructor_id === inst.id);
            const assignedCourses = courses.filter((c) =>
              instAssignments.some((a) => a.course_id === c.id)
            );

            return (
              <Card key={inst.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Profile Information */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#1b6b3a] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                    {inst.full_name?.charAt(0).toUpperCase() || 'I'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {inst.full_name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 uppercase tracking-wide">
                        Instructor
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-mono mt-0.5">{inst.email}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {inst.college_name || 'Academic Institution'}{' '}
                      {inst.department && `• ${inst.department}`}
                    </p>
                  </div>
                </div>

                {/* Assigned Courses Badges */}
                <div className="flex-1 max-w-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Assigned Courses ({assignedCourses.length})
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    {assignedCourses.length === 0 ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                        No courses assigned yet. Click &quot;Assign Courses&quot; to give access.
                      </span>
                    ) : (
                      assignedCourses.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 text-xs font-semibold group"
                        >
                          <BookOpen className="w-3 h-3 text-[#1b6b3a]" />
                          <span className="truncate max-w-[150px]">{c.title}</span>
                          <button
                            onClick={() => handleQuickRemoveCourse(c.id, inst.id, c.title)}
                            title="Remove assignment"
                            className="text-slate-400 hover:text-rose-500 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAssignCoursesModal(inst)}
                    leftIcon={<BookOpen className="w-3.5 h-3.5 text-[#1b6b3a]" />}
                  >
                    Assign Courses
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setInstructorToRevoke(inst)}
                    leftIcon={<UserX className="w-3.5 h-3.5" />}
                  >
                    Revoke Role
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL 1: PROMOTE USER TO INSTRUCTOR */}
      <Modal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
        title="Promote Member to Instructor Role"
      >
        <div className="space-y-5">
          <p className="text-xs text-slate-500">
            Select an existing registered student or member to promote to an Instructor. Once appointed, they gain
            access to the dedicated Instructor Portal for their assigned courses.
          </p>

          {/* Student selection filter */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              1. Select Student Member
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                value={promoteSearch}
                onChange={(e) => setPromoteSearch(e.target.value)}
                placeholder="Search eligible students by name or email..."
                className="pl-9 text-xs"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEligibleStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No eligible students found.
                </div>
              ) : (
                filteredEligibleStudents.map((s) => (
                  <label
                    key={s.id}
                    className={`flex items-center justify-between p-3 cursor-pointer text-xs transition-colors ${
                      selectedStudentId === s.id
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{s.full_name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{s.email}</p>
                    </div>
                    <input
                      type="radio"
                      name="selectedStudent"
                      checked={selectedStudentId === s.id}
                      onChange={() => setSelectedStudentId(s.id)}
                      className="text-[#1b6b3a] focus:ring-[#1b6b3a]"
                    />
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Initial course assignment checkboxes */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              2. Assign Courses (Optional, can also configure later)
            </label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1">
              {courses.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">No courses available.</div>
              ) : (
                courses.map((course) => {
                  const isChecked = promoteCourseIds.includes(course.id);
                  return (
                    <label
                      key={course.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPromoteCourseIds([...promoteCourseIds, course.id]);
                          } else {
                            setPromoteCourseIds(promoteCourseIds.filter((id) => id !== course.id));
                          }
                        }}
                        className="rounded text-[#1b6b3a] focus:ring-[#1b6b3a]"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {course.title}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsPromoteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!selectedStudentId || isPromoting}
              onClick={handlePromote}
            >
              {isPromoting ? 'Promoting...' : 'Promote to Instructor'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: ASSIGN / REMOVE COURSES */}
      <Modal
        isOpen={Boolean(selectedInstructorForCourses)}
        onClose={() => setSelectedInstructorForCourses(null)}
        title={`Assign Courses: ${selectedInstructorForCourses?.full_name || ''}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Select which courses this instructor has authority to teach, upload materials for, and evaluate submissions & exams.
          </p>

          <div className="max-h-64 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1">
            {courses.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No courses created yet.</div>
            ) : (
              courses.map((course) => {
                const isChecked = editCourseIds.includes(course.id);
                return (
                  <label
                    key={course.id}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditCourseIds([...editCourseIds, course.id]);
                          } else {
                            setEditCourseIds(editCourseIds.filter((id) => id !== course.id));
                          }
                        }}
                        className="rounded text-[#1b6b3a] focus:ring-[#1b6b3a]"
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {course.title}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0">
                      {course.category || 'Workshop'}
                    </span>
                  </label>
                );
              })
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedInstructorForCourses(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isSavingCourses}
              onClick={handleSaveCourses}
            >
              {isSavingCourses ? 'Saving...' : 'Save Assignments'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL 3: REVOKE INSTRUCTOR ROLE CONFIRMATION */}
      <Modal
        isOpen={Boolean(instructorToRevoke)}
        onClose={() => setInstructorToRevoke(null)}
        title="Revoke Instructor Privileges"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <p className="font-bold">Are you sure you want to revoke instructor status?</p>
              <p className="text-rose-700 dark:text-rose-300">
                <strong>{instructorToRevoke?.full_name}</strong> will be reverted to a <strong>Student</strong> role.
                All their course curriculum assignments in <code className="font-mono">course_instructors</code> will be permanently removed.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setInstructorToRevoke(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isRevoking}
              onClick={handleRevokeRole}
            >
              {isRevoking ? 'Revoking...' : 'Confirm Revoke Role'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
