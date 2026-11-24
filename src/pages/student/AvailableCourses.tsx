import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Course, CourseEnrollment } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  Compass,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Eye,
  GraduationCap,
} from 'lucide-react';

export const AvailableCourses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Enrollment Modal State
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState<Course | null>(null);
  const [studentPhone, setStudentPhone] = useState(user?.phone || '');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollSuccessCourse, setEnrollSuccessCourse] = useState<Course | null>(null);

  // Syllabus Modal State
  const [syllabusCourse, setSyllabusCourse] = useState<Course | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [publishedCourses, userEnrollments] = await Promise.all([
      dataProvider.getCourses({ publishedOnly: true }),
      user?.id ? dataProvider.getCourseEnrollments(undefined, user.id) : Promise.resolve([]),
    ]);

    setCourses(publishedCourses);
    setEnrolledCourseIds(new Set(userEnrollments.map((e) => e.course_id)));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleStartEnrollment = (course: Course) => {
    setSelectedCourseForEnroll(course);
    setStudentPhone(user?.phone || '');
  };

  const handleConfirmEnrollment = async () => {
    if (!selectedCourseForEnroll || !user?.id) return;
    setIsEnrolling(true);
    try {
      await dataProvider.enrollInCourse(selectedCourseForEnroll.id, user.id);
      setEnrolledCourseIds((prev) => new Set([...prev, selectedCourseForEnroll.id]));
      setEnrollSuccessCourse(selectedCourseForEnroll);
      setSelectedCourseForEnroll(null);
    } catch (err: any) {
      alert(`Enrollment failed: ${err.message}`);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleViewSyllabus = async (course: Course) => {
    // Fetch full details with modules/sessions
    const full = await dataProvider.getCourseById(course.id);
    setSyllabusCourse(full || course);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Available Courses Directory
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Explore officially published technical courses. Enroll in multiple tracks to expand your engineering portfolio.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center space-y-4 border-slate-200 dark:border-slate-800">
          <Compass className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="font-bold text-base text-slate-900 dark:text-white">No Published Courses Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Our instructional team is finalizing upcoming cloud and systems courses. Check back soon!
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id);

            return (
              <Card
                key={course.id}
                className="overflow-hidden flex flex-col justify-between border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="relative h-48 w-full bg-slate-50 dark:bg-slate-900 overflow-hidden flex items-center justify-center p-3 border-b border-slate-100 dark:border-slate-800">
                    <img
                      src={
                        course.thumbnail_url ||
                        '/tnv-logo.png'
                      }
                      alt={course.title}
                      className="w-full h-full object-contain max-h-40 transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <Badge variant="brand">{course.category || 'Engineering'}</Badge>
                    </div>
                    {isEnrolled && (
                      <div className="absolute bottom-3 left-3 bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{course.description}</p>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-3">
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Duration:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {course.duration || '6 Weeks (36 Hours)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Structure:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {course.modules_count || 0} Modules • {course.sessions_count || 0} Sessions
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Instructor:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {course.instructor_name || 'Thamilaran'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewSyllabus(course)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Syllabus
                    </Button>

                    {isEnrolled ? (
                      <Link to={`/student/courses/${course.id}`} className="flex-1">
                        <Button variant="primary" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                          Continue
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleStartEnrollment(course)}
                        rightIcon={<GraduationCap className="w-3.5 h-3.5" />}
                      >
                        Enroll Now
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={Boolean(selectedCourseForEnroll)}
        onClose={() => setSelectedCourseForEnroll(null)}
        title="Confirm Course Enrollment"
        description="Verify your enrollment details to register for this learning track"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {selectedCourseForEnroll?.title}
            </h4>
            <p className="text-slate-500">{selectedCourseForEnroll?.description}</p>
            <div className="flex gap-4 text-slate-400 pt-1">
              <span>Duration: <strong>{selectedCourseForEnroll?.duration}</strong></span>
              <span>Category: <strong>{selectedCourseForEnroll?.category}</strong></span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <span className="text-slate-400 block mb-0.5">Student Name:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{user?.full_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Registered Email:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{user?.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">College / Institution:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{user?.college_name || 'N/A'}</span>
            </div>

            <Input
              label="Contact Phone Number"
              placeholder="+91 98765 43210"
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setSelectedCourseForEnroll(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isEnrolling}
              onClick={handleConfirmEnrollment}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              {isEnrolling ? 'Enrolling...' : 'Confirm Enrollment'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={Boolean(enrollSuccessCourse)}
        onClose={() => setEnrollSuccessCourse(null)}
        title="Enrollment Successful!"
        description="Your enrollment record has been confirmed in Supabase"
        maxWidth="sm"
      >
        <div className="text-center space-y-4 py-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {enrollSuccessCourse?.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              You are now actively enrolled. Access all recorded Google Drive lectures, session notes, and assignments.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEnrollSuccessCourse(null)}>
              Explore More Courses
            </Button>
            <Link to={`/student/courses/${enrollSuccessCourse?.id}`}>
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Start Learning Now
              </Button>
            </Link>
          </div>
        </div>
      </Modal>

      {/* Syllabus Modal */}
      <Modal
        isOpen={Boolean(syllabusCourse)}
        onClose={() => setSyllabusCourse(null)}
        title={syllabusCourse?.title || 'Course Syllabus'}
        description="Review the full modular breakdown and learning objectives"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-2">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {syllabusCourse?.description}
          </p>

          <div className="space-y-3 pt-2">
            <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              Curriculum Specification ({syllabusCourse?.modules?.length || 0} Modules)
            </h4>

            {syllabusCourse?.modules && syllabusCourse.modules.length > 0 ? (
              syllabusCourse.modules.map((m, idx) => (
                <div key={m.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Module {idx + 1}: {m.title}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {m.sessions?.length || 0} Sessions
                    </span>
                  </div>

                  <div className="pl-3 space-y-1 text-slate-500">
                    {(m.sessions || []).map((s, sIdx) => (
                      <div key={s.id} className="flex justify-between text-[11px]">
                        <span>Session {idx + 1}.{sIdx + 1}: {s.title}</span>
                        <span>{s.duration_minutes} Mins</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 italic">Modules are being published by instructor.</p>
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            {syllabusCourse && enrolledCourseIds.has(syllabusCourse.id) ? (
              <Button
                variant="primary"
                size="sm"
                className="bg-[#155e32] hover:bg-[#114b28] text-white font-bold"
                onClick={() => {
                  const id = syllabusCourse.id;
                  setSyllabusCourse(null);
                  navigate(`/student/courses/${id}`);
                }}
              >
                Go to Course
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="bg-[#155e32] hover:bg-[#114b28] text-white font-bold"
                onClick={() => {
                  const target = syllabusCourse;
                  setSyllabusCourse(null);
                  if (target) handleStartEnrollment(target);
                }}
              >
                Register Now
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
