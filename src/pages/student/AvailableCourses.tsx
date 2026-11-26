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
  CreditCard,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const AvailableCourses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollmentsMap, setEnrollmentsMap] = useState<Map<string, CourseEnrollment>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Enrollment Modal State
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState<Course | null>(null);
  const [studentPhone, setStudentPhone] = useState(user?.phone || '');
  const [transactionRef, setTransactionRef] = useState('');
  const [transactionError, setTransactionError] = useState('');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollSuccessCourse, setEnrollSuccessCourse] = useState<Course | null>(null);
  const [isPaidEnrollmentSuccess, setIsPaidEnrollmentSuccess] = useState(false);

  // Verification Status Modal State
  const [pendingVerificationCourse, setPendingVerificationCourse] = useState<Course | null>(null);

  // Syllabus Modal State
  const [syllabusCourse, setSyllabusCourse] = useState<Course | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [publishedCourses, userEnrollments] = await Promise.all([
      dataProvider.getCourses({ publishedOnly: true }),
      user?.id ? dataProvider.getCourseEnrollments(undefined, user.id) : Promise.resolve([]),
    ]);

    setCourses(publishedCourses);
    const eMap = new Map<string, CourseEnrollment>();
    userEnrollments.forEach((e) => eMap.set(e.course_id, e));
    setEnrollmentsMap(eMap);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleStartEnrollment = (course: Course) => {
    setSelectedCourseForEnroll(course);
    setStudentPhone(user?.phone || '');
    setTransactionRef('');
    setTransactionError('');
  };

  const handleConfirmEnrollment = async () => {
    if (!selectedCourseForEnroll || !user?.id) return;

    if (selectedCourseForEnroll.is_paid && !transactionRef.trim()) {
      setTransactionError('Please enter your payment Transaction ID / UTR number.');
      return;
    }

    setIsEnrolling(true);
    setTransactionError('');
    try {
      await dataProvider.enrollInCourse(selectedCourseForEnroll.id, user.id, {
        transactionReference: transactionRef.trim(),
        amount: Number(selectedCourseForEnroll.price) || 0,
      });

      setIsPaidEnrollmentSuccess(Boolean(selectedCourseForEnroll.is_paid));
      setEnrollSuccessCourse(selectedCourseForEnroll);
      setSelectedCourseForEnroll(null);
      await loadData();
    } catch (err: any) {
      setTransactionError(`Enrollment failed: ${err.message}`);
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
            const enr = enrollmentsMap.get(course.id);
            const isPendingVerification = enr?.status === 'payment_verification_pending';
            const isActiveEnrolled = Boolean(enr) && !isPendingVerification;

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
                      <Badge
                        variant={course.is_paid ? 'warning' : 'outline'}
                        className="font-bold shadow-xs bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs"
                      >
                        {course.is_paid ? `PAID • ₹${course.price || 0}` : 'FREE'}
                      </Badge>
                      <Badge variant="brand">{course.category || 'Engineering'}</Badge>
                    </div>

                    {isActiveEnrolled && (
                      <div className="absolute bottom-3 left-3 bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                      </div>
                    )}

                    {isPendingVerification && (
                      <div className="absolute bottom-3 left-3 bg-amber-500 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                        <Clock className="w-3.5 h-3.5" /> Payment Pending
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
                      <span>Pricing:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {course.is_paid ? `₹${course.price || 0} INR` : 'Free of Cost'}
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

                    {isActiveEnrolled ? (
                      <Link to={`/student/courses/${course.id}`} className="flex-1">
                        <Button variant="primary" size="sm" className="w-full bg-[#1b6b3a] hover:bg-[#15542d] text-white" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                          Continue
                        </Button>
                      </Link>
                    ) : isPendingVerification ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-semibold"
                        onClick={() => setPendingVerificationCourse(course)}
                        leftIcon={<Clock className="w-3.5 h-3.5 text-amber-500" />}
                      >
                        Verification Pending
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 bg-[#1b6b3a] hover:bg-[#15542d] text-white"
                        onClick={() => handleStartEnrollment(course)}
                        rightIcon={<GraduationCap className="w-3.5 h-3.5" />}
                      >
                        {course.is_paid ? `Enroll (₹${course.price || 0})` : 'Enroll Free'}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation & Payment Verification Modal */}
      <Modal
        isOpen={Boolean(selectedCourseForEnroll)}
        onClose={() => setSelectedCourseForEnroll(null)}
        title={selectedCourseForEnroll?.is_paid ? 'Paid Course Enrollment & Verification' : 'Confirm Free Course Enrollment'}
        description={
          selectedCourseForEnroll?.is_paid
            ? 'Complete payment transfer and provide transaction reference to activate your enrollment'
            : 'Verify your enrollment details to register for this learning track'
        }
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedCourseForEnroll?.title}
                </h4>
                <p className="text-slate-500 mt-0.5">{selectedCourseForEnroll?.description}</p>
              </div>
              <Badge variant={selectedCourseForEnroll?.is_paid ? 'warning' : 'success'} className="shrink-0 font-bold">
                {selectedCourseForEnroll?.is_paid ? `₹${selectedCourseForEnroll.price} INR` : 'FREE'}
              </Badge>
            </div>
            <div className="flex gap-4 text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>Duration: <strong>{selectedCourseForEnroll?.duration}</strong></span>
              <span>Category: <strong>{selectedCourseForEnroll?.category}</strong></span>
            </div>
          </div>

          {/* Payment Verification Section for Paid Courses */}
          {selectedCourseForEnroll?.is_paid && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-bold text-xs">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Payment Transfer Details</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-200 dark:border-amber-900 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Course Fee:</span>
                  <span className="font-extrabold text-amber-700 dark:text-amber-400 text-sm">
                    ₹{selectedCourseForEnroll.price} INR
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">UPI ID:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    tnvworkshop@okhdfcbank
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Name:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    TNV Technical Learning Solutions
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Transaction Reference ID / UTR Number *
                </label>
                <Input
                  placeholder="e.g. 331298457621 or UPI Ref ID"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  required
                />
                <p className="text-[11px] text-slate-500">
                  Administrative team verifies this UTR number before unlocking full course sessions.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-1">
            <div>
              <span className="text-slate-400 block mb-0.5">Student Name:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{user?.full_name}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Registered Email:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{user?.email}</span>
            </div>

            <Input
              label="Contact Phone Number"
              placeholder="+91 98765 43210"
              value={studentPhone}
              onChange={(e) => setStudentPhone(e.target.value)}
            />
          </div>

          {transactionError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold p-2 bg-rose-50 dark:bg-rose-950/40 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{transactionError}</span>
            </div>
          )}

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
              className="bg-[#1b6b3a] hover:bg-[#15542d] text-white font-bold"
            >
              {isEnrolling
                ? 'Submitting...'
                : selectedCourseForEnroll?.is_paid
                ? 'Submit Payment for Verification'
                : 'Confirm Free Enrollment'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Verification Status Modal */}
      <Modal
        isOpen={Boolean(pendingVerificationCourse)}
        onClose={() => setPendingVerificationCourse(null)}
        title="Payment Verification in Progress"
        description="Your enrollment is awaiting administrative verification"
        maxWidth="sm"
      >
        <div className="space-y-4 py-3 text-xs text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {pendingVerificationCourse?.title}
            </h4>
            <p className="text-slate-500 mt-1">
              Your payment verification has been submitted and is currently under review by our administration. Once verified, full curriculum, lectures, and exams will activate automatically.
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPendingVerificationCourse(null)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={Boolean(enrollSuccessCourse)}
        onClose={() => setEnrollSuccessCourse(null)}
        title={isPaidEnrollmentSuccess ? 'Payment Verification Submitted!' : 'Enrollment Successful!'}
        description={
          isPaidEnrollmentSuccess
            ? 'Your payment reference has been recorded and submitted for approval'
            : 'Your enrollment record has been confirmed in Supabase'
        }
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
              {isPaidEnrollmentSuccess
                ? 'Thank you! Our instructional team will verify your payment details shortly and activate your course materials.'
                : 'You are now actively enrolled. Access all recorded Google Drive lectures, session notes, and assignments.'}
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setEnrollSuccessCourse(null)}>
              Explore More Courses
            </Button>
            {!isPaidEnrollmentSuccess && (
              <Link to={`/student/courses/${enrollSuccessCourse?.id}`}>
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />} className="bg-[#1b6b3a] text-white">
                  Start Learning Now
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Modal>

      {/* Syllabus Modal */}
      <Modal
        isOpen={Boolean(syllabusCourse)}
        onClose={() => setSyllabusCourse(null)}
        title={syllabusCourse?.title || 'Course Syllabus'}
        description="Review comprehensive curriculum breakdown, modules, and sessions"
        maxWidth="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 text-xs">
          {(!syllabusCourse?.modules || syllabusCourse.modules.length === 0) ? (
            <div className="text-center py-8 text-slate-400">
              Detailed syllabus structure will be published shortly by the instructor.
            </div>
          ) : (
            syllabusCourse.modules.map((mod, idx) => (
              <div
                key={mod.id || idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Module {idx + 1}: {mod.title}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {mod.sessions?.length || 0} Sessions
                  </span>
                </div>
                {mod.description && (
                  <p className="text-slate-500 text-[11px]">{mod.description}</p>
                )}

                <div className="space-y-1.5 pl-2 border-l-2 border-brand-500/40">
                  {(mod.sessions || []).map((s, sIdx) => (
                    <div key={s.id || sIdx} className="flex justify-between items-center text-[11px] py-1 text-slate-600 dark:text-slate-300">
                      <span>• {s.title}</span>
                      <span className="text-slate-400 text-[10px]">{s.duration_minutes || 45} mins</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};
