import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { exportToCSV } from '../../lib/csvExport';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  FileSpreadsheet,
  Users,
  CheckCircle2,
  FileCheck2,
  FolderGit2,
  GraduationCap,
  Award,
  Video,
  Download,
} from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      dataProvider.getEnrollments(),
      dataProvider.getAssignmentSubmissions(),
      dataProvider.getProjectSubmissions(),
      dataProvider.getExamAttempts(),
      dataProvider.getAttendance(),
      dataProvider.getCertificates(),
    ]).then(([enrs, subs, projs, exms, atts, certs]) => {
      setEnrollments(enrs);
      setSubmissions(subs);
      setProjects(projs);
      setExams(exms);
      setAttendance(atts);
      setCertificates(certs);
    });
  }, []);

  const handleExportEnrollments = () => {
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
    exportToCSV('TNV_Student_Enrollments_Report', rows);
  };

  const handleExportSubmissions = () => {
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
    exportToCSV('TNV_Assignment_Submissions_Report', rows);
  };

  const handleExportProjects = () => {
    const rows = projects.map((p) => ({
      Project_ID: p.id,
      Student: p.student?.full_name,
      Email: p.student?.email,
      Project_Title: p.project_title,
      GitHub_URL: p.github_url,
      Live_Demo_URL: p.live_demo_url || 'N/A',
      Status: p.status,
      Marks: p.marks_obtained,
      Submitted_At: p.submitted_at,
    }));
    exportToCSV('TNV_Capstone_Projects_Report', rows);
  };

  const handleExportExams = () => {
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
    exportToCSV('TNV_Examination_Performance_Report', rows);
  };

  const handleExportAttendance = () => {
    const rows = attendance.map((a) => ({
      Attendance_ID: a.id,
      Student: a.student?.full_name,
      Email: a.student?.email,
      Session: a.live_session?.title,
      Date: a.live_session?.scheduled_date,
      Status: a.status,
      Marked_At: a.marked_at,
    }));
    exportToCSV('TNV_Live_Attendance_Report', rows);
  };

  const handleExportCertificates = () => {
    const rows = certificates.map((c) => ({
      Certificate_ID: c.certificate_number,
      Student: c.student?.full_name,
      College: c.student?.college_name,
      Workshop: c.workshop?.title,
      Issue_Date: c.issue_date,
      Status: c.status,
    }));
    exportToCSV('TNV_Certificates_Distribution_Report', rows);
  };

  const reportItems = [
    {
      title: 'Student Enrollments & Payment Verification Report',
      description: 'Comprehensive registry of student profiles, colleges, departments, payment statuses, and verification logs.',
      count: enrollments.length,
      icon: Users,
      action: handleExportEnrollments,
    },
    {
      title: 'Assignment Submissions & Evaluation Report',
      description: 'Student submission timestamps, solution links, evaluator marks, and written mentor feedback.',
      count: submissions.length,
      icon: FileCheck2,
      action: handleExportSubmissions,
    },
    {
      title: 'Capstone Project Submissions & Codebase Report',
      description: 'GitHub repository links, live Vercel deployments, grading scores, and architect approvals.',
      count: projects.length,
      icon: FolderGit2,
      action: handleExportProjects,
    },
    {
      title: 'Examination Performance & Score Report',
      description: 'Individual student scores, percentages, passing statuses, and question attempt telemetry.',
      count: exams.length,
      icon: GraduationCap,
      action: handleExportExams,
    },
    {
      title: 'Live Masterclass Attendance Logs Report',
      description: 'Attendance records for live Google Meet sessions with Present/Absent/Excused timestamps.',
      count: attendance.length,
      icon: Video,
      action: handleExportAttendance,
    },
    {
      title: 'Official Certificates Distribution Report',
      description: 'All issued certificate IDs, student recipients, workshop associations, and verification registry codes.',
      count: certificates.length,
      icon: Award,
      action: handleExportCertificates,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Administrative Reports & Monitoring Export
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Export institutional audits, compliance logs, and grade transcripts directly to spreadsheet CSV format.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportItems.map((rep) => {
          const Icon = rep.icon;
          return (
            <Card key={rep.title} className="p-6 flex flex-col justify-between space-y-4 border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="brand">{rep.count} Records</Badge>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{rep.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{rep.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={rep.action}
                  className="w-full font-bold"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Export CSV Spreadsheet
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
