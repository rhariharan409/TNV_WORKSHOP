import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Certificate, Course, CourseEnrollment, Profile, Workshop } from '../../types/database';
import { downloadCertificate } from '../../lib/certificateGenerator';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Award, Download, ShieldCheck, XCircle, CheckCircle2, Search, Filter, BookOpen, Sliders, AlertTriangle, Sparkles, Eye, Clock, GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminCertificates: React.FC = () => {
  const { user } = useAuth();
  const isAdminUser = user?.role === 'admin' || user?.role === 'super_admin';
  const adminId = user?.role === 'super_admin' ? undefined : user?.id;

  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [courseEnrollments, setCourseEnrollments] = useState<CourseEnrollment[]>([]);
  const [examinations, setExaminations] = useState<any[]>([]);
  const [examAttempts, setExamAttempts] = useState<any[]>([]);
  const [revokeModalCert, setRevokeModalCert] = useState<Certificate | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [forceIssueModalData, setForceIssueModalData] = useState<{
    studentId: string;
    studentName: string;
    courseId: string;
    courseTitle: string;
    realScore: number;
    threshold: number;
  } | null>(null);
  const [reviewModalData, setReviewModalData] = useState<{
    enr: CourseEnrollment;
    courseExam: any | null;
    passedAttempt: any | null;
    latestAttempt: any | null;
    progress: number;
    isEligible: boolean;
  } | null>(null);
  const [courseMinThreshold, setCourseMinThreshold] = useState<number>(50);
  const [thresholdSavedNotice, setThresholdSavedNotice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cList, courseList, wList, allCourseEnrs, allExams, allAttempts] = await Promise.all([
        dataProvider.getCertificates(adminId),
        dataProvider.getCourses({ adminId }),
        dataProvider.getWorkshops(adminId),
        dataProvider.getCourseEnrollments(undefined, undefined, adminId),
        dataProvider.getExaminations(undefined, adminId).catch(() => []),
        dataProvider.getExamAttempts(undefined, adminId).catch(() => []),
      ]);
      setCertificates(cList);
      setCourses(courseList);
      setWorkshops(wList);
      setCourseEnrollments(allCourseEnrs);
      setExaminations(allExams || []);
      setExamAttempts(allAttempts || []);
    } catch (err) {
      console.error('Failed to load certificates data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  useEffect(() => {
    if (selectedCourseId && selectedCourseId !== 'all' && selectedCourseId !== 'workshops') {
      const saved = dataProvider.getCourseMinThreshold(selectedCourseId);
      setCourseMinThreshold(saved);
    } else {
      setCourseMinThreshold(50);
    }
  }, [selectedCourseId]);

  const handleSaveCourseThreshold = () => {
    if (selectedCourseId && selectedCourseId !== 'all' && selectedCourseId !== 'workshops') {
      dataProvider.setCourseMinThreshold(selectedCourseId, courseMinThreshold);
      setThresholdSavedNotice(true);
      setTimeout(() => setThresholdSavedNotice(false), 3000);
    }
  };

  const handleIssueCourseCert = async (studentId: string, courseId: string, score?: number, isForceIssued: boolean = false) => {
    setIsProcessing(true);
    try {
      const realScore = score !== undefined ? score : await dataProvider.getStudentCourseRealScore(studentId, courseId);
      const res = await dataProvider.issueCourseCertificate(studentId, courseId, user?.id, realScore, isForceIssued);
      if (res && res.success === false) {
        throw new Error(res.error || 'Certificate issuance rejected');
      }
      await loadData();
      alert(
        isForceIssued
          ? `Force Issued Certificate successfully authorized for student with real score of ${realScore}%!`
          : `Course Certificate successfully approved and issued with verified score of ${realScore}%!`
      );
    } catch (err: any) {
      alert(`Certificate issuance failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPDF = (cert: Certificate) => {
    const title = cert.course?.title || cert.workshop?.title || 'Technical Workshop Program';
    downloadCertificate({
      studentName: cert.student?.full_name || 'Enrolled Student',
      collegeName: cert.student?.college_name || 'TNV Workshop Academy',
      department: cert.student?.department || 'Information Technology',
      workshopTitle: title,
      certificateNumber: cert.certificate_number,
      completionDate: cert.completion_date,
      issueDate: cert.issue_date,
      overallScore: cert.overall_score ?? 0,
      grade: cert.grade || 'A+',
      signatoryName: 'Thamilaran',
      signatoryTitle: 'Program Director & Chief Architect',
    });
  };

  const handleRevoke = async () => {
    if (!revokeModalCert) return;
    try {
      await dataProvider.revokeCertificate(revokeModalCert.id, revokeReason.trim() || 'Administrative revocation');
      setRevokeModalCert(null);
      setRevokeReason('');
      await loadData();
    } catch (err: any) {
      alert(`Revocation failed: ${err.message}`);
    }
  };

  const filteredCerts = certificates.filter((c) => {
    if (selectedCourseId === 'all') return true;
    if (selectedCourseId === 'workshops') return Boolean(c.workshop_id);
    return c.course_id === selectedCourseId;
  });

  // Filter candidate students enrolled in courses for issuance review
  const activeCourseEnrs = courseEnrollments.filter((enr) => {
    if (selectedCourseId !== 'all' && selectedCourseId !== 'workshops') {
      return enr.course_id === selectedCourseId;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Certificate Issuance & Distribution
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authorize verifiable certificates of completion, manage force-issuance policies, dispatch PDF credentials, and review records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Scoped Credentials</option>
            <option value="workshops">Workshop Credentials</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                Course: {c.title}
              </option>
            ))}
          </select>

          <Badge variant="brand" className="text-xs px-3 py-1 font-bold">
            Issued: {certificates.filter((c) => c.status === 'issued').length}
          </Badge>
        </div>
      </div>

      {/* Force Issue Rules & Thresholds Configuration */}
      {selectedCourseId !== 'all' && selectedCourseId !== 'workshops' && (
        <Card className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0 mt-0.5">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                  Force Issue Eligibility Rule for Selected Course
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  Set the minimum required completion or passing mark % to enable Force Issue for students who have not reached 100% completion. (Default: 50%)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 px-3 py-1.5 rounded-xl shadow-xs">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Min %:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={courseMinThreshold}
                  onChange={(e) => setCourseMinThreshold(Math.max(1, Math.min(100, Number(e.target.value) || 50)))}
                  className="w-14 text-center text-xs font-black text-amber-950 dark:text-amber-200 bg-transparent focus:outline-none"
                />
                <span className="text-xs font-black text-slate-400">%</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveCourseThreshold}
                className="bg-white dark:bg-slate-900 border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-950 dark:text-amber-200 font-bold"
              >
                Save Rule
              </Button>
              {thresholdSavedNotice && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Issued Certificates Table */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Active Issued Credentials
          </h3>
          <span className="text-xs text-slate-400">Total: {filteredCerts.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Certificate ID</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Program / Course</th>
                <th className="py-3.5 px-4">Overall Score</th>
                <th className="py-3.5 px-4">Issue Date</th>
                <th className="py-3.5 px-4">Status & Type</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    No certificates issued for this selection.
                  </td>
                </tr>
              ) : (
                filteredCerts.map((cert) => {
                  const programTitle = cert.course?.title || cert.workshop?.title || 'Certification';
                  const realScore = cert.overall_score ?? 0;
                  return (
                    <tr key={cert.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 dark:text-white block">
                          {cert.certificate_number}
                        </span>
                        <Link
                          to={`/verify-certificate/${cert.certificate_number}`}
                          className="text-[10px] text-brand-600 hover:underline"
                        >
                          Public Verify URL
                        </Link>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {cert.student?.full_name}
                        </span>
                        <span className="text-[11px] text-slate-400">{cert.student?.email}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 dark:text-white truncate block max-w-[200px]">
                          {programTitle}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          {cert.course_id ? 'Course' : 'Workshop'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {realScore}%
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1 font-bold">
                          ({cert.grade || 'A+'})
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {formatDate(cert.issue_date)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                        <div>
                          <Badge variant={cert.status === 'issued' ? 'success' : 'destructive'}>
                            {cert.status === 'issued' ? 'Active & Issued' : 'Revoked'}
                          </Badge>
                        </div>
                        {cert.is_force_issued && (
                          <div>
                            <Badge variant="warning" className="text-[10px] py-0 px-2 font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300">
                              Force Issued
                            </Badge>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPDF(cert)}
                          leftIcon={<Download className="w-3.5 h-3.5" />}
                        >
                          Download PDF
                        </Button>

                        {/* Revoke button is visible for every issued certificate */}
                        {cert.status === 'issued' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              setRevokeModalCert(cert);
                              setRevokeReason('Administrative revocation');
                            }}
                            leftIcon={<XCircle className="w-3.5 h-3.5" />}
                          >
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Course Completion & Pending Issuance Section */}
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Enrolled Students Course Progress & Certificate Issuance
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate student curriculum completion, assignment submissions, and issue official course credentials or force-issue if minimum thresholds are satisfied.
          </p>
        </div>

        <div className="space-y-3">
          {activeCourseEnrs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No students enrolled in the selected courses.
            </p>
          ) : (
            activeCourseEnrs.map((enr) => {
              const alreadyHas = certificates.some(
                (c) => c.student_id === enr.student_id && c.course_id === enr.course_id && c.status === 'issued'
              );
              const progress = enr.progress_percentage || 0;
              const threshold = dataProvider.getCourseMinThreshold(enr.course_id);
              const canForceIssue = progress >= threshold;

              const courseExam = examinations.find(
                (e) => e.course_id === enr.course_id && e.is_published
              );
              const isExamCourse = Boolean(courseExam);

              const studentAttempts = examAttempts.filter(
                (a) =>
                  a.student_id === enr.student_id &&
                  (a.exam_id === courseExam?.id || a.examination_id === courseExam?.id)
              );
              const passedAttempt = studentAttempts.find(
                (a) =>
                  a.is_passed ||
                  (a.status === 'evaluated' &&
                    (a.percentage || 0) >= (courseExam?.passing_percentage || 50))
              );
              const latestAttempt = studentAttempts[0] || null;

              // Rule:
              // - If course has exam: 100% completion requires passing final exam AND curriculum sessions done
              // - If course has no exam: follow current method (100% when sessions done)
              const isEligible = isExamCourse
                ? Boolean(passedAttempt) && (progress >= 100 || enr.is_completed)
                : progress >= 100 || enr.is_completed;

              const certScore = passedAttempt ? passedAttempt.percentage : progress;

              return (
                <div
                  key={enr.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {enr.student?.full_name || 'Enrolled Student'}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {enr.student?.email}
                      </span>
                      {isEligible && !alreadyHas && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white flex items-center gap-1 shadow-xs animate-pulse">
                          <Sparkles className="w-3 h-3" /> Recommended for Certification
                        </span>
                      )}
                    </div>

                    <p className="text-slate-500">
                      Course: <strong>{enr.course?.title}</strong> • Progress: <strong>{progress}%</strong> ({enr.completed_sessions || 0}/{enr.total_sessions || 0} sessions)
                    </p>

                    {/* Final Exam Performance Indicator */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {isExamCourse ? (
                        passedAttempt ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            Final Exam: Passed {passedAttempt.score}/{passedAttempt.total_marks} ({passedAttempt.percentage}%)
                          </span>
                        ) : latestAttempt ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            Final Exam: Failed ({latestAttempt.score}/{latestAttempt.total_marks} — {latestAttempt.percentage}%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Final Exam: Pending Attempt
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          No Final Exam (Standard Curriculum Track)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setReviewModalData({
                          enr,
                          courseExam,
                          passedAttempt,
                          latestAttempt,
                          progress,
                          isEligible,
                        })
                      }
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      Review
                    </Button>

                    {alreadyHas ? (
                      <Badge variant="success">Certificate Active</Badge>
                    ) : isEligible ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleIssueCourseCert(enr.student_id, enr.course_id, certScore, false)}
                        leftIcon={<Award className="w-3.5 h-3.5" />}
                        disabled={isProcessing}
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-sm font-bold"
                      >
                        Approve & Issue Certificate
                      </Button>
                    ) : (
                      <div className="space-y-1 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (canForceIssue) {
                              setForceIssueModalData({
                                studentId: enr.student_id,
                                studentName: enr.student?.full_name || 'Student',
                                courseId: enr.course_id,
                                courseTitle: enr.course?.title || 'Course',
                                realScore: progress,
                                threshold,
                              });
                            } else {
                              alert(`Cannot Force Issue: Student completion (${progress}%) is below the course minimum threshold (${threshold}%).`);
                            }
                          }}
                          leftIcon={<Award className="w-3.5 h-3.5" />}
                          disabled={isProcessing || !canForceIssue}
                          className={canForceIssue ? 'border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 font-bold dark:bg-amber-950/40 dark:text-amber-200' : 'opacity-50 cursor-not-allowed'}
                        >
                          Force Issue Certificate
                        </Button>
                        {!canForceIssue && (
                          <span className="text-[10px] text-rose-500 block">
                            Needs {threshold}% min (currently {progress}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Academic & Certification Review Modal */}
      <Modal
        isOpen={Boolean(reviewModalData)}
        onClose={() => setReviewModalData(null)}
        title="Student Academic Record & Certification Review"
        description="Comprehensive review of course curriculum completion and proctored examination telemetry"
        maxWidth="lg"
      >
        {reviewModalData && (
          <div className="space-y-5 text-xs">
            {/* Student Profile Info */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {reviewModalData.enr.student?.full_name}
                </h4>
                <p className="text-slate-500 text-[11px]">
                  {reviewModalData.enr.student?.email} • {reviewModalData.enr.student?.college_name || 'Engineering College'} ({reviewModalData.enr.student?.department || 'Information Technology'})
                </p>
              </div>
              <Badge variant={reviewModalData.isEligible ? 'success' : 'warning'}>
                {reviewModalData.isEligible ? 'Recommended for Certification' : 'Requirements Pending'}
              </Badge>
            </div>

            {/* Curriculum Progress Breakdown */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  Course Curriculum Modules & Sessions
                </span>
                <span className="font-extrabold text-brand-600 dark:text-brand-400">
                  {reviewModalData.progress}% Progress
                </span>
              </div>
              <p className="text-slate-500">
                Course: <strong>{reviewModalData.enr.course?.title}</strong>
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1 text-slate-600 dark:text-slate-300">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed Sessions</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {reviewModalData.enr.completed_sessions || 0} / {reviewModalData.enr.total_sessions || 0}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Curriculum Status</span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {(reviewModalData.enr.completed_sessions || 0) >= (reviewModalData.enr.total_sessions || 1)
                      ? 'All Sessions Completed'
                      : 'In Progress'}
                  </span>
                </div>
              </div>
            </div>

            {/* Proctored Final Exam Performance Breakdown */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-purple-600" />
                  Proctored Technical Examination Performance
                </span>
                {reviewModalData.courseExam ? (
                  <Badge variant={reviewModalData.passedAttempt ? 'success' : 'destructive'}>
                    {reviewModalData.passedAttempt ? 'Exam Passed' : reviewModalData.latestAttempt ? 'Exam Failed' : 'Not Attempted'}
                  </Badge>
                ) : (
                  <Badge variant="outline">No Exam Required</Badge>
                )}
              </div>

              {reviewModalData.courseExam ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Exam Title</span>
                      <span className="font-extrabold text-slate-900 dark:text-white truncate block">
                        {reviewModalData.courseExam.title}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Passing Benchmark</span>
                      <span className="font-extrabold text-slate-900 dark:text-white block">
                        {reviewModalData.courseExam.passing_percentage ?? 50}% ({reviewModalData.courseExam.passing_marks} Marks)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Marks Scored</span>
                      <span className="font-extrabold text-slate-900 dark:text-white block">
                        {reviewModalData.latestAttempt
                          ? `${reviewModalData.latestAttempt.score} / ${reviewModalData.latestAttempt.total_marks}`
                          : 'N/A'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Score %</span>
                      <span className={`font-black text-sm block ${reviewModalData.passedAttempt ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {reviewModalData.latestAttempt ? `${reviewModalData.latestAttempt.percentage}%` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {reviewModalData.latestAttempt && (
                    <p className="text-[11px] text-slate-400">
                      Submitted on: {formatDate(reviewModalData.latestAttempt.submitted_at || reviewModalData.latestAttempt.started_at)} • Tab switches recorded: {reviewModalData.latestAttempt.tab_switches ?? 0}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-xs">
                  This course operates under the Standard Curriculum Track with no final examination requirement. Certificate eligibility is verified once all course lectures and modules reach 100% completion.
                </p>
              )}
            </div>

            {/* Recommendation Decision Box */}
            <div className={`p-4 rounded-2xl border ${reviewModalData.isEligible ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}>
              <h5 className="font-bold text-xs flex items-center gap-1.5 mb-1">
                {reviewModalData.isEligible ? (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    Recommended for Official Certification
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    Certification Requirements Pending
                  </>
                )}
              </h5>
              <p className="text-[11px]">
                {reviewModalData.isEligible
                  ? `Student has satisfied 100% of academic criteria${reviewModalData.courseExam ? ` and achieved a passing score of ${reviewModalData.passedAttempt?.percentage}% on the proctored examination` : ''}. You may approve and issue the verifiable certificate.`
                  : reviewModalData.courseExam
                  ? 'Student must complete all curriculum lectures and score above the passing benchmark on the final examination to earn 100% completion.'
                  : 'Student must complete all curriculum lectures to reach 100% completion.'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setReviewModalData(null)}>
                Close
              </Button>
              {reviewModalData.isEligible && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const studentId = reviewModalData.enr.student_id;
                    const courseId = reviewModalData.enr.course_id;
                    const certScore = reviewModalData.passedAttempt ? reviewModalData.passedAttempt.percentage : reviewModalData.progress;
                    setReviewModalData(null);
                    handleIssueCourseCert(studentId, courseId, certScore, false);
                  }}
                  leftIcon={<Award className="w-3.5 h-3.5" />}
                  className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                >
                  Approve & Issue Certificate
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Force Issue Confirmation Modal */}
      <Modal
        isOpen={Boolean(forceIssueModalData)}
        onClose={() => setForceIssueModalData(null)}
        title="Authorize Force-Issued Certificate"
        description="Administrative override to issue a verifiable course credential"
        maxWidth="md"
      >
        {forceIssueModalData && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1.5">
              <h4 className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Administrative Force Issue Notice
              </h4>
              <p>
                You are about to issue an official credential to <strong>{forceIssueModalData.studentName}</strong> for <strong>{forceIssueModalData.courseTitle}</strong>.
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] pt-1">
                <li>Real Completion Score to record: <strong>{forceIssueModalData.realScore}%</strong></li>
                <li>Course Minimum Policy Threshold: <strong>{forceIssueModalData.threshold}%</strong></li>
                <li>The certificate will be flagged with <code>is_force_issued = true</code>.</li>
                <li>Force-issued certificates can be individually revoked if needed.</li>
              </ul>
            </div>

            <p className="text-slate-600 dark:text-slate-300">
              Do you confirm issuing this certificate with real score <strong>{forceIssueModalData.realScore}%</strong>?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setForceIssueModalData(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                onClick={() => {
                  const data = forceIssueModalData;
                  setForceIssueModalData(null);
                  handleIssueCourseCert(data.studentId, data.courseId, data.realScore, true);
                }}
              >
                Confirm Force Issue
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Revocation Modal */}
      <Modal
        isOpen={Boolean(revokeModalCert)}
        onClose={() => setRevokeModalCert(null)}
        title="Revoke Certificate"
        description="Permanently revoke public validity of this issued credential"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200">
            <p>
              Are you sure you want to revoke certificate <strong>{revokeModalCert?.certificate_number}</strong> belonging to <strong>{revokeModalCert?.student?.full_name}</strong>?
            </p>
          </div>

          <Input
            label="Revocation Audit Reason *"
            placeholder="Administrative revocation"
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setRevokeModalCert(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleRevoke}>
              Confirm Revocation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
