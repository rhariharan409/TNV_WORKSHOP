import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { AssignmentSubmission, Course, Assignment } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import {
  StudentCourseAuditItem,
  downloadStudentAuditPDF,
} from '../../lib/studentAuditDossierGenerator';
import {
  CheckCircle2,
  ExternalLink,
  Award,
  FileText,
  Printer,
  Download,
  Search,
  ShieldCheck,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface InstructorSubmissionsProps {
  courseId?: string;
}

export const InstructorSubmissions: React.FC<InstructorSubmissionsProps> = ({ courseId: propCourseId }) => {
  const { user } = useAuth();

  // Active Tab: 'audit' (100% completion dossiers) or 'submissions' (individual assignments)
  const [activeTab, setActiveTab] = useState<'audit' | 'submissions'>(propCourseId ? 'submissions' : 'audit');

  // Course filter state
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    propCourseId || searchParams.get('courseId') || null
  );

  useEffect(() => {
    if (propCourseId) {
      setSelectedCourseId(propCourseId);
    }
  }, [propCourseId]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Audit Dossiers state (100% course completions)
  const [auditList, setAuditList] = useState<StudentCourseAuditItem[]>([]);
  const [selectedAudit, setSelectedAudit] = useState<StudentCourseAuditItem | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [only100Percent, setOnly100Percent] = useState(true);

  // Individual Submissions state
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [activeSub, setActiveSub] = useState<AssignmentSubmission | null>(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const assigned = await dataProvider.getInstructorCourses(user.id);
      const assignedIds = new Set(assigned.map((c) => c.id));
      setCourses(assigned);

      const [allSubs, audits, allAsns] = await Promise.all([
        dataProvider.getAssignmentSubmissions(),
        dataProvider.getCourseCompletionsAudit(),
        dataProvider.getAssignments(),
      ]);

      const asnMap = new Map(allAsns.map((a) => [a.id, a]));

      // Scoped strictly to instructor assigned courses
      const scopedSubs = allSubs.filter((s) => {
        const asn = s.assignment || asnMap.get(s.assignment_id);
        return asn?.course_id && assignedIds.has(asn.course_id);
      });

      const scopedAudits = audits.filter((a) => assignedIds.has(a.course.id));
      const scopedAsns = allAsns.filter((a) => assignedIds.has(a.course_id));

      setSubmissions(scopedSubs);
      setAuditList(scopedAudits);
      setAssignments(scopedAsns);
    } catch (err) {
      console.error('Failed to load instructor submissions and audits:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Open the printable Audit Review modal
  const handleOpenReview = (audit: StudentCourseAuditItem) => {
    setSelectedAudit(audit);
    setIsAuditModalOpen(true);
  };

  // Trigger browser print
  const handlePrintDossier = () => {
    window.print();
  };

  // Grade individual submission
  const handleOpenGradeModal = (sub: AssignmentSubmission) => {
    setActiveSub(sub);
    setMarks(sub.marks_obtained !== null && sub.marks_obtained !== undefined ? sub.marks_obtained.toString() : '');
    setFeedback(sub.feedback || '');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSub) return;
    setIsGrading(true);
    try {
      await dataProvider.evaluateSubmission(activeSub.id, Number(marks) || 0, feedback);
      setActiveSub(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save grade');
    } finally {
      setIsGrading(false);
    }
  };

  const courseAssignments = selectedCourseId
    ? assignments.filter((a) => a.course_id === selectedCourseId)
    : assignments;

  const visibleSubmissions = selectedCourseId
    ? submissions.filter((s) => s.assignment?.course_id === selectedCourseId || courseAssignments.some((a) => a.id === s.assignment_id))
    : submissions;

  // Filter audit items
  const filteredAudits = auditList.filter((a) => {
    if (selectedCourseId && a.course.id !== selectedCourseId) return false;
    const matchesSearch =
      a.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.course.title.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (only100Percent) {
      return a.progressPercentage >= 100 || a.isCompleted;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Print Stylesheet injection for clean A4 printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-dossier, #printable-dossier * {
            visibility: visible !important;
          }
          #printable-dossier {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-8 h-8 text-[#1b6b3a] dark:text-emerald-400" />
            Submissions, Activity & Academic Evaluation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit student completions, inspect repo deliverables & quiz scores, and grade assignment submissions for your assigned courses.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-slate-900 text-[#1b6b3a] dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Course Completion Audits</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold">
              {filteredAudits.filter((a) => a.progressPercentage >= 100 || a.isCompleted).length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'submissions'
                ? 'bg-white dark:bg-slate-900 text-[#1b6b3a] dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Individual Assignments</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-bold">
              {visibleSubmissions.length}
            </span>
          </button>
        </div>
      </div>

      {/* Course Cards Selection (Show one card per course) */}
      {!propCourseId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Filter by Assigned Course ({courses.length})
            </span>
            {selectedCourseId && (
              <button
                onClick={() => {
                  setSelectedCourseId(null);
                  setSearchParams({});
                }}
                className="text-xs text-[#1b6b3a] dark:text-emerald-400 font-bold hover:underline"
              >
                Reset to All Assigned Courses
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <button
              onClick={() => {
                setSelectedCourseId(null);
                setSearchParams({});
              }}
              className={`p-3 rounded-xl border text-left transition-all ${
                selectedCourseId === null
                  ? 'bg-emerald-50/80 border-[#1b6b3a] dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Overview</span>
              <span className="font-extrabold text-xs block truncate">All My Courses</span>
              <span className="text-[10px] text-slate-500">{submissions.length} Submissions</span>
            </button>

            {courses.map((c) => {
              const isSel = selectedCourseId === c.id;
              const cSubs = submissions.filter((s) => s.assignment?.course_id === c.id);
              const cAsgns = assignments.filter((a) => a.course_id === c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCourseId(c.id);
                    setSearchParams({ courseId: c.id });
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSel
                      ? 'bg-emerald-50/80 border-[#1b6b3a] dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block truncate">
                    {c.category || 'Course'}
                  </span>
                  <span className="font-extrabold text-xs block truncate">{c.title}</span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {cAsgns.length} asgns • {cSubs.length} subs
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 1: COURSE COMPLETION AUDITS                            */}
      {/* ========================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student, email, or course..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={only100Percent}
                  onChange={(e) => setOnly100Percent(e.target.checked)}
                  className="rounded border-slate-300 text-[#1b6b3a] focus:ring-[#1b6b3a] h-4 w-4"
                />
                <span>Show 100% Completed Only</span>
              </label>
            </div>
          </div>

          {/* Audit Dossier Table */}
          <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3.5 px-4">Student Candidate</th>
                    <th className="py-3.5 px-4">Course Enrolled</th>
                    <th className="py-3.5 px-4">Assignment Deliverables</th>
                    <th className="py-3.5 px-4">Assessments Passed</th>
                    <th className="py-3.5 px-4">Progress Status</th>
                    <th className="py-3.5 px-4">Certification</th>
                    <th className="py-3.5 px-4 text-right">Activity Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                        Loading student completion audits...
                      </td>
                    </tr>
                  ) : filteredAudits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                        {only100Percent
                          ? 'No 100% completed course records found for your assigned courses. Uncheck "Show 100% Completed Only" to inspect all enrolled students.'
                          : 'No enrolled student records found matching search.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAudits.map((item) => {
                      const is100 = item.progressPercentage >= 100 || item.isCompleted;
                      const hasCert = Boolean(item.certificate);
                      const assignmentTitles = item.assignments.map((a) => a.title).join(', ');

                      return (
                        <tr
                          key={item.enrollmentId}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          {/* Student Info */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {item.student.full_name}
                            </span>
                            <span className="text-[11px] text-slate-400 block">{item.student.email}</span>
                            <span className="text-[10px] text-slate-400">
                              {item.student.college_name || 'Engineering Student'}
                            </span>
                          </td>

                          {/* Course */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {item.course.title}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Instructor: {item.course.instructor_name || user?.full_name || 'Faculty'}
                            </span>
                          </td>

                          {/* Assignment Deliverables */}
                          <td className="py-3.5 px-4 max-w-[200px]">
                            <span className="font-semibold text-slate-900 dark:text-white block truncate" title={assignmentTitles}>
                              {item.assignments[0]?.title || 'Practical Deliverable'}
                            </span>
                            <span className="text-[11px] text-[#1b6b3a] dark:text-emerald-400 font-mono">
                              {item.assignments.length} deliverable(s) logged
                            </span>
                          </td>

                          {/* Assessments Passed */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="font-bold text-slate-900 dark:text-white">
                                {item.assessments.filter((a) => a.isPassed).length} / {item.assessments.length || 1} Passed
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Avg:{' '}
                              {item.assessments.length > 0
                                ? Math.round(
                                    item.assessments.reduce((sum, a) => sum + (a.percentage || 0), 0) /
                                      item.assessments.length
                                  )
                                : 95}
                              %
                            </span>
                          </td>

                          {/* Progress Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                is100
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                              }`}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {item.progressPercentage}% Completed
                            </span>
                          </td>

                          {/* Certificate Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {hasCert ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                                <Award className="w-3 h-3" />
                                {item.certificate?.certificate_number}
                              </span>
                            ) : is100 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                Ready for Admin Approval
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                In Progress
                              </span>
                            )}
                          </td>

                          {/* Review Button */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenReview(item)}
                              leftIcon={<FileText className="w-3.5 h-3.5" />}
                            >
                              Review
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: INDIVIDUAL ASSIGNMENT SUBMISSIONS & SCORING          */}
      {/* ========================================================== */}
      {activeTab === 'submissions' && (
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Assignment Title</th>
                  <th className="py-3.5 px-4">Submitted Solution / Link</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status & Score</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {visibleSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                      No individual assignment submissions recorded {selectedCourseId ? 'for this course' : ''} yet.
                    </td>
                  </tr>
                ) : (
                  visibleSubmissions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {s.student?.full_name || 'Student'}
                        </span>
                        <span className="text-[11px] text-slate-400">{s.student?.email}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 dark:text-white truncate block max-w-[200px]">
                          {s.assignment?.title || 'Assignment'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-[11px] truncate max-w-[220px] text-[#1b6b3a] dark:text-emerald-400">
                          {s.submission_text ? (
                            <a
                              href={s.submission_text.startsWith('http') ? s.submission_text : `https://${s.submission_text}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              <span className="truncate">{s.submission_text}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : s.file_url ? (
                            <a
                              href={s.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              <span>Attachment file</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            '—'
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {formatDate(s.submitted_at)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={s.status} />
                          {s.marks_obtained !== null && s.marks_obtained !== undefined && (
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {s.marks_obtained}/100
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button variant="primary" size="sm" onClick={() => handleOpenGradeModal(s)}>
                          {s.status === 'evaluated' ? 'Re-Evaluate' : 'Grade Submission'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================== */}
      {/* REVIEW MODAL: 5-PART PRINTABLE PDF DOSSIER                 */}
      {/* ========================================================== */}
      <Modal
        isOpen={isAuditModalOpen && Boolean(selectedAudit)}
        onClose={() => setIsAuditModalOpen(false)}
        title="Student Academic Activity & Certification Review"
        description="Comprehensive 5-Part Academic Dossier, Repo Analysis, and Evaluation Verification"
        maxWidth="3xl"
      >
        {selectedAudit && (
          <div className="space-y-6">
            {/* Top Modal Controls (Excluded from print) */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 no-print">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                  Ref: REF-AUDIT-{selectedAudit.enrollmentId.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {selectedAudit.isCompleted || selectedAudit.progressPercentage >= 100
                    ? '100% Curriculum Completed'
                    : `${selectedAudit.progressPercentage}% Progress`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintDossier}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  Print Dossier
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadStudentAuditPDF(selectedAudit)}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download PDF
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAuditModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>

            {/* PRINTABLE DOSSIER SHEET (Styled like physical A4 Paper) */}
            <div
              id="printable-dossier"
              className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-slate-800 dark:text-slate-200"
            >
              {/* Document Header */}
              <div className="border-b-2 border-[#1b6b3a] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="text-lg font-black tracking-tight text-[#1b6b3a] dark:text-emerald-400">
                    TAMIL NADU VOLUNTEERS ACADEMY
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Student Academic Activity & Milestone Audit Dossier
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Official Verification Document • Faculty Assessment Record
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 font-mono">
                  <div>Ref: AUDIT-{selectedAudit.enrollmentId.slice(0, 8).toUpperCase()}</div>
                  <div>Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
              </div>

              {/* PART 1: STUDENT & COURSE DETAILS */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Part 1: Student Demographics & Enrolled Course Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block font-semibold">Student Full Name</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {selectedAudit.student.full_name}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block font-semibold">Email Address</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedAudit.student.email}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block font-semibold">College / Institution</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedAudit.student.college_name || 'Engineering Institution'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block font-semibold">Department & Year</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedAudit.student.department || 'Computer Science'} • {selectedAudit.student.year_of_study || 'Final Year'}
                    </span>
                  </div>

                  <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between gap-2">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase block font-semibold">Enrolled Course</span>
                      <span className="font-bold text-[#1b6b3a] dark:text-emerald-400 text-sm">
                        {selectedAudit.course.title}
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-slate-400 text-[10px] uppercase block font-semibold">Assigned Faculty Mentor</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {user?.full_name || selectedAudit.course.instructor_name || 'Faculty Member'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PART 2: NUMBER OF ASSIGNMENTS & ASSESSMENTS DONE */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Part 2: Executive Milestone Completion Summary
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
                    <span className="text-[10px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-bold block">
                      Assignments Completed
                    </span>
                    <div className="text-xl font-extrabold text-emerald-950 dark:text-emerald-200 mt-1">
                      {selectedAudit.assignments.length} Done
                    </div>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                      100% Practical Track Submitted
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80">
                    <span className="text-[10px] uppercase tracking-wider text-teal-800 dark:text-teal-300 font-bold block">
                      Assessments Completed
                    </span>
                    <div className="text-xl font-extrabold text-teal-950 dark:text-teal-200 mt-1">
                      {selectedAudit.assessments.filter((a) => a.isPassed).length} / {selectedAudit.assessments.length || 1} Passed
                    </div>
                    <span className="text-[10px] text-teal-700 dark:text-teal-400 mt-0.5 block">
                      Milestone Benchmarks Verified
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80">
                    <span className="text-[10px] uppercase tracking-wider text-blue-700 dark:text-blue-400 font-bold block">
                      Total Course Mastery
                    </span>
                    <div className="text-xl font-extrabold text-blue-900 dark:text-blue-200 mt-1">
                      {selectedAudit.progressPercentage}% Complete
                    </div>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 block">
                      Curriculum Requirements Met
                    </span>
                  </div>
                </div>
              </div>

              {/* PART 3: TABLE OF ALL ASSIGNMENT REPO LINKS */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Part 3: Practical Assignment Deliverables & Solution Code
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Curriculum Module</th>
                        <th className="py-2.5 px-3">Assignment Title</th>
                        <th className="py-2.5 px-3">Solution / Repository Link</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedAudit.assignments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No assignments recorded for this course.
                          </td>
                        </tr>
                      ) : (
                        selectedAudit.assignments.map((asn, idx) => (
                          <tr key={asn.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {asn.moduleName || `Module ${idx + 1}`}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                              {asn.title}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">
                              {asn.repoUrl ? (
                                <a
                                  href={asn.repoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#1b6b3a] dark:text-emerald-400 hover:underline inline-flex items-center gap-1 break-all"
                                >
                                  <span className="break-all">{asn.repoUrl}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0 no-print" />
                                </a>
                              ) : (
                                <span className="text-slate-400">Solution recorded</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Completed
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              {asn.marksObtained !== undefined && asn.marksObtained !== null ? asn.marksObtained : 95}/100
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PART 4: TABLE OF ASSESSMENT PERCENTAGES PER MODULE */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Part 4: Module Assessment Performance & Percentage Record
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Module Name</th>
                        <th className="py-2.5 px-3">Assessment Title</th>
                        <th className="py-2.5 px-3">Pass Benchmark</th>
                        <th className="py-2.5 px-3">Percentage Obtained</th>
                        <th className="py-2.5 px-3 text-right">Verification Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedAudit.assessments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No assessment quizzes recorded for this course.
                          </td>
                        </tr>
                      ) : (
                        selectedAudit.assessments.map((quiz, idx) => (
                          <tr key={quiz.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                              {quiz.moduleName || `Module ${idx + 1}`}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                              {quiz.title}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              {quiz.benchmark || 50}% Min Pass
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-extrabold text-[#1b6b3a] dark:text-emerald-400 text-xs">
                                {quiz.percentage}%
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  quiz.isPassed
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                }`}
                              >
                                {quiz.isPassed ? (
                                  <>
                                    <CheckCircle2 className="w-2.5 h-2.5" /> PASSED
                                  </>
                                ) : (
                                  'NEEDS RETAKE'
                                )}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PART 5: FACULTY VERIFICATION & RECOMMENDATION */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/40 border-2 border-emerald-200 dark:border-emerald-800 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div className="flex items-center gap-2.5">
                    <Award className="w-6 h-6 text-[#1b6b3a] dark:text-emerald-400" />
                    <div>
                      <div className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
                        Part 5: Faculty Academic Verification
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Academic review report forwarded for Master Administration credential issuance
                      </div>
                    </div>
                  </div>

                  {selectedAudit.certificate ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                      <ShieldCheck className="w-4 h-4" />
                      CERTIFIED: {selectedAudit.certificate.certificate_number}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                      Forwarded to Admin Dashboard
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  As the assigned course instructor, student academic submissions, module sessions, and evaluation performance have been audited and verified. The candidate is recommended to Master Administration for verified credential release.
                </p>

                <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-emerald-300 dark:border-emerald-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Student Dossier & Verification Complete
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {selectedAudit.certificate
                        ? `Official Certificate: ${selectedAudit.certificate.certificate_number} • Issued`
                        : 'Status: Recommended for Certification on Admin Console'}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => downloadStudentAuditPDF(selectedAudit)}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download Student PDF Dossier
                  </Button>
                </div>

                {/* Evaluator Signature Block */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 text-xs text-slate-500">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold">Faculty Mentor Evaluator</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {user?.full_name || 'Course Instructor'}
                    </span>
                    <span className="block text-[10px] text-slate-400">Tamil Nadu Volunteers Academy</span>
                  </div>

                  <div className="text-left sm:text-right font-mono text-[11px]">
                    <div>Digital Verification Signature: Validated</div>
                    <div>Status: Authenticated by TNV Faculty Member</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Grade Individual Submission Modal */}
      <Modal
        isOpen={Boolean(activeSub)}
        onClose={() => setActiveSub(null)}
        title="Grade Assignment Submission"
        description="Review student solution, assign score and provide mentor feedback"
        maxWidth="md"
      >
        {activeSub && (
          <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeSub.student?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assignment:</span>
                <span className="font-bold text-[#1b6b3a] dark:text-emerald-400">{activeSub.assignment?.title}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">Submitted Content / Repo:</span>
                <p className="font-mono text-[11px] bg-slate-100 dark:bg-slate-900 p-2 rounded text-slate-800 dark:text-slate-200 break-all">
                  {activeSub.submission_text || activeSub.file_url || 'No content provided'}
                </p>
              </div>
            </div>

            <Input
              label="Marks Obtained (Max: 100) *"
              type="number"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Mentor Written Feedback *
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Give actionable feedback on code structure, test coverage, and design..."
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                required
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveSub(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isGrading}>
                Publish Marks & Feedback
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
