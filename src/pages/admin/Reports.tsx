import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { exportToCSV } from '../../lib/csvExport';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Course } from '../../types/database';
import {
  FileSpreadsheet,
  Users,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  Award,
  Video,
  Download,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Percent,
} from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      dataProvider.getCourses(),
      dataProvider.getEnrollments(),
      dataProvider.getAssignmentSubmissions(),
      dataProvider.getExamAttempts(),
      dataProvider.getAttendance(),
      dataProvider.getCertificates(),
    ])
      .then(([cList, enrs, subs, exms, atts, certs]) => {
        setCourses(cList);
        setEnrollments(enrs);
        setSubmissions(subs);
        setExams(exms);
        setAttendance(atts);
        setCertificates(certs);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  // Filtered dataset for selected course
  const courseEnrollments = selectedCourseId
    ? enrollments.filter((e) => e.workshop_id === selectedCourseId || e.course_id === selectedCourseId)
    : [];
  const courseSubmissions = selectedCourseId
    ? submissions.filter((s) => s.assignment?.course_id === selectedCourseId)
    : [];
  const courseExams = selectedCourseId
    ? exams.filter((ex) => ex.examination?.course_id === selectedCourseId)
    : [];
  const courseCertificates = selectedCourseId
    ? certificates.filter((c) => c.workshop_id === selectedCourseId || c.course_id === selectedCourseId)
    : [];

  // Export Comprehensive Course Report CSV
  const handleExportCourseComprehensive = () => {
    if (!selectedCourse) return;

    if (courseEnrollments.length === 0 && courseSubmissions.length === 0) {
      alert('No student records found for this course.');
      return;
    }

    const rows = courseEnrollments.map((e) => {
      const studentSubs = courseSubmissions.filter((s) => s.student_id === e.student_id);
      const studentExams = courseExams.filter((ex) => ex.student_id === e.student_id);
      const studentCert = courseCertificates.find((c) => c.student_id === e.student_id);

      const totalMarksObtained = studentSubs.reduce((acc, curr) => acc + (Number(curr.marks_obtained) || 0), 0);
      const avgMarks = studentSubs.length > 0 ? Math.round(totalMarksObtained / studentSubs.length) : 'N/A';
      const bestExam = studentExams[0];

      return {
        Student_Name: e.student?.full_name || 'Student',
        Email: e.student?.email || 'N/A',
        Phone: e.student?.phone || 'N/A',
        College: e.student?.college_name || 'N/A',
        Department: e.student?.department || 'N/A',
        Year: e.student?.year_of_study || 'N/A',
        Course_Title: selectedCourse.title,
        Enrollment_Status: e.status,
        Registered_Date: formatDate(e.registered_at),
        Assignments_Submitted: studentSubs.length,
        Average_Assignment_Score: avgMarks,
        Exam_Attempted: bestExam ? 'YES' : 'NO',
        Exam_Score: bestExam ? `${bestExam.score} / ${bestExam.total_marks}` : 'N/A',
        Exam_Percentage: bestExam ? `${bestExam.percentage}%` : 'N/A',
        Exam_Passed: bestExam ? (bestExam.is_passed ? 'PASSED' : 'FAILED') : 'N/A',
        Certificate_Issued: studentCert ? 'YES' : 'NO',
        Certificate_Number: studentCert?.certificate_number || 'N/A',
        Issue_Date: studentCert?.issue_date ? formatDate(studentCert.issue_date) : 'N/A',
      };
    });

    const safeTitle = selectedCourse.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    exportToCSV(`TNV_${safeTitle}_Comprehensive_Report`, rows);
  };

  // Specific course CSV exports
  const handleExportCourseEnrollments = () => {
    if (!selectedCourse) return;
    const rows = courseEnrollments.map((e) => ({
      Enrollment_ID: e.id,
      Student_Name: e.student?.full_name,
      Student_Email: e.student?.email,
      Phone: e.student?.phone || 'N/A',
      College: e.student?.college_name,
      Department: e.student?.department,
      Course: selectedCourse.title,
      Status: e.status,
      Registered_At: e.registered_at,
    }));
    exportToCSV(`TNV_${selectedCourse.title.replace(/\s+/g, '_')}_Enrollments`, rows);
  };

  const handleExportCourseSubmissions = () => {
    if (!selectedCourse) return;
    const rows = courseSubmissions.map((s) => ({
      Submission_ID: s.id,
      Student: s.student?.full_name,
      Email: s.student?.email,
      Assignment: s.assignment?.title,
      Submitted_Text_Link: s.submission_text || s.file_url || 'N/A',
      Marks_Obtained: s.marks_obtained,
      Status: s.status,
      Submitted_At: s.submitted_at,
      Feedback: s.feedback || 'None',
    }));
    exportToCSV(`TNV_${selectedCourse.title.replace(/\s+/g, '_')}_Submissions`, rows);
  };

  const handleExportCourseExams = () => {
    if (!selectedCourse) return;
    const rows = courseExams.map((ex) => ({
      Attempt_ID: ex.id,
      Student: ex.student?.full_name,
      Email: ex.student?.email,
      Score: ex.score,
      Total_Marks: ex.total_marks,
      Percentage: ex.percentage,
      Passed: ex.is_passed ? 'YES' : 'NO',
      Submitted_At: ex.submitted_at,
    }));
    exportToCSV(`TNV_${selectedCourse.title.replace(/\s+/g, '_')}_Examinations`, rows);
  };

  const handleExportCourseCertificates = () => {
    if (!selectedCourse) return;
    const rows = courseCertificates.map((c) => ({
      Certificate_ID: c.certificate_number,
      Student: c.student?.full_name,
      College: c.student?.college_name,
      Course: selectedCourse.title,
      Issue_Date: c.issue_date,
      Status: c.status,
    }));
    exportToCSV(`TNV_${selectedCourse.title.replace(/\s+/g, '_')}_Certificates`, rows);
  };

  // Global Exports
  const handleExportGlobalEnrollments = () => {
    const rows = enrollments.map((e) => ({
      Enrollment_ID: e.id,
      Student_Name: e.student?.full_name,
      Student_Email: e.student?.email,
      College: e.student?.college_name,
      Department: e.student?.department,
      Workshop: e.workshop?.title,
      Status: e.status,
      Registered_At: e.registered_at,
      Approved_At: e.approved_at || 'N/A',
    }));
    exportToCSV('TNV_All_Student_Enrollments_Report', rows);
  };

  const handleExportGlobalSubmissions = () => {
    const rows = submissions.map((s) => ({
      Submission_ID: s.id,
      Student: s.student?.full_name,
      Email: s.student?.email,
      Assignment: s.assignment?.title,
      Marks_Obtained: s.marks_obtained,
      Status: s.status,
      Submitted_At: s.submitted_at,
      Feedback: s.feedback || 'None',
    }));
    exportToCSV('TNV_All_Assignment_Submissions_Report', rows);
  };

  const handleExportGlobalExams = () => {
    const rows = exams.map((ex) => ({
      Attempt_ID: ex.id,
      Student: ex.student?.full_name,
      Email: ex.student?.email,
      Score: ex.score,
      Total_Marks: ex.total_marks,
      Percentage: ex.percentage,
      Passed: ex.is_passed ? 'YES' : 'NO',
      Submitted_At: ex.submitted_at,
    }));
    exportToCSV('TNV_All_Examination_Performance_Report', rows);
  };

  const handleExportGlobalAttendance = () => {
    const rows = attendance.map((a) => ({
      Attendance_ID: a.id,
      Student: a.student?.full_name,
      Email: a.student?.email,
      Session: a.live_session?.title,
      Date: a.live_session?.scheduled_date,
      Status: a.status,
      Marked_At: a.marked_at,
    }));
    exportToCSV('TNV_All_Live_Attendance_Report', rows);
  };

  const handleExportGlobalCertificates = () => {
    const rows = certificates.map((c) => ({
      Certificate_ID: c.certificate_number,
      Student: c.student?.full_name,
      College: c.student?.college_name,
      Workshop: c.workshop?.title,
      Issue_Date: c.issue_date,
      Status: c.status,
    }));
    exportToCSV('TNV_All_Certificates_Distribution_Report', rows);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-8 h-8 text-[#1b6b3a] dark:text-brand-400" />
            <span>Reports & Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Select any course to view detailed student cohort performance, telemetry audits, and download course CSV spreadsheets.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleExportGlobalEnrollments}
          leftIcon={<Download className="w-4 h-4" />}
          className="shadow-md"
        >
          Download Report
        </Button>
      </div>

      {/* ========================================================== */}
      {/* VIEW 1: ONE CARD PER COURSE                                */}
      {/* ========================================================== */}
      {!selectedCourseId ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Course Reports ({courses.length})
            </h2>
            <span className="text-xs text-slate-400">Select a course to inspect its reports and analytics</span>
          </div>

          {isLoading ? (
            <Card className="p-12 text-center text-xs text-slate-500">Loading courses and metrics...</Card>
          ) : courses.length === 0 ? (
            <Card className="p-12 text-center text-xs text-slate-500">No courses available.</Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => {
                const cEnrs = enrollments.filter((e) => e.workshop_id === c.id || e.course_id === c.id);
                const cSubs = submissions.filter((s) => s.assignment?.course_id === c.id);
                const cExms = exams.filter((ex) => ex.examination?.course_id === c.id);
                const cCerts = certificates.filter((cert) => cert.workshop_id === c.id || cert.course_id === c.id);

                return (
                  <Card
                    key={c.id}
                    onClick={() => setSelectedCourseId(c.id)}
                    className="p-6 border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-400 flex items-center justify-center font-bold text-sm shrink-0 border border-brand-100 dark:border-brand-900/50">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <Badge variant="brand">{c.category || 'Workshop'}</Badge>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                          {c.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                          {c.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Students</span>
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {cEnrs.length} Enrolled
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Submissions</span>
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {cSubs.length} Delivered
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Exam Attempts</span>
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {cExms.length} Recorded
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Certificates</span>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {cCerts.length} Issued
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-bold text-brand-600 dark:text-brand-400 pt-1">
                        <span>Course Analytics</span>
                        <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Open Reports <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Institutional Global Exports */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              All-Course Institutional Data Exports
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportGlobalEnrollments}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="justify-start text-xs font-semibold"
              >
                All Enrollments ({enrollments.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportGlobalSubmissions}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="justify-start text-xs font-semibold"
              >
                All Submissions ({submissions.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportGlobalExams}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="justify-start text-xs font-semibold"
              >
                All Exams ({exams.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportGlobalAttendance}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="justify-start text-xs font-semibold"
              >
                All Attendance ({attendance.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportGlobalCertificates}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="justify-start text-xs font-semibold"
              >
                All Certificates ({certificates.length})
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================== */
        /* VIEW 2: SELECTED COURSE REPORTS & ANALYTICS                */
        /* ========================================================== */
        <div className="space-y-6">
          {/* Top Bar with Back and Download Course CSV */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <button
                onClick={() => setSelectedCourseId(null)}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to All Courses
              </button>

              <Button
                variant="primary"
                size="md"
                onClick={handleExportCourseComprehensive}
                leftIcon={<Download className="w-4 h-4" />}
                className="font-bold shadow-md shadow-brand-600/20"
              >
                Download Report (CSV)
              </Button>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="brand">{selectedCourse?.category || 'Workshop'}</Badge>
                  <span className="text-xs text-slate-400">Instructor: {selectedCourse?.instructor_name || 'Admin'}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {selectedCourse?.title}
                </h2>
                {selectedCourse?.description && (
                  <p className="text-xs text-slate-500 max-w-3xl">{selectedCourse.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Course Analytics Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Enrolled Students</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                {courseEnrollments.length}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {courseEnrollments.filter((e) => e.status === 'approved').length} verified & approved
              </span>
            </Card>

            <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Submissions</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <FileCheck2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                {courseSubmissions.length}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {courseSubmissions.filter((s) => s.status === 'evaluated').length} graded by mentors
              </span>
            </Card>

            <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Exam Pass Rate</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
                {courseExams.length > 0
                  ? `${Math.round((courseExams.filter((ex) => ex.is_passed).length / courseExams.length) * 100)}%`
                  : 'N/A'}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {courseExams.filter((ex) => ex.is_passed).length} / {courseExams.length} attempts passed
              </span>
            </Card>

            <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Certificates Issued</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                {courseCertificates.length}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">Official credentials registered</span>
            </Card>
          </div>

          {/* Course-Specific Detailed Export Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Export Individual Course Datasets (CSV)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5 border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Course Student Enrollments
                    </h4>
                    <Badge variant="brand">{courseEnrollments.length} Records</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Student roster, college name, department, year of study, contact phone, and approval statuses.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCourseEnrollments}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  className="font-bold"
                >
                  Download Enrollments CSV
                </Button>
              </Card>

              <Card className="p-5 border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Course Assignment Submissions
                    </h4>
                    <Badge variant="brand">{courseSubmissions.length} Records</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Student solutions, repository links, submission timestamps, mentor scores, and evaluation notes.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCourseSubmissions}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  className="font-bold"
                >
                  Download Submissions CSV
                </Button>
              </Card>

              <Card className="p-5 border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Course Examination Performance
                    </h4>
                    <Badge variant="brand">{courseExams.length} Records</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Student MCQ exam attempts, scores out of total, percentage, pass/fail status, and timestamp.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCourseExams}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  className="font-bold"
                >
                  Download Exams CSV
                </Button>
              </Card>

              <Card className="p-5 border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Course Certificates Distribution
                    </h4>
                    <Badge variant="brand">{courseCertificates.length} Records</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Official issued certificates, certificate numbers, recipients, issue dates, and validation status.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCourseCertificates}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  className="font-bold"
                >
                  Download Certificates CSV
                </Button>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
