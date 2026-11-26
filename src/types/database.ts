// ==============================================================================
// TNV WORKSHOP LEARNING MANAGEMENT SYSTEM (LMS)
// Comprehensive TypeScript Definitions for all 32 Database Entities
// ==============================================================================

export type UserRole = 'student' | 'instructor' | 'admin' | 'super_admin';

export type EnrollmentStatus =
  | 'registered'
  | 'payment_pending'
  | 'payment_verification_pending'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export type AssignmentStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'evaluated'
  | 'late';

export type ProjectStatus =
  | 'not_submitted'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'resubmission_required';

export type ExamStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'evaluated'
  | 'timed_out';

export type AttendanceStatus = 'present' | 'absent' | 'excused';

export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'replied';

export type FeedbackCategory =
  | 'complaint'
  | 'technical_issue'
  | 'improvement'
  | 'general';

export type NotificationType = 'info' | 'success' | 'warning' | 'alert';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  college_name?: string | null;
  department?: string | null;
  year_of_study?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  is_suspended?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Workshop {
  id: string;
  title: string;
  slug: string;
  short_description?: string | null;
  description: string;
  thumbnail_url?: string | null;
  duration: string;
  instructor_name: string;
  instructor_title?: string | null;
  instructor_bio?: string | null;
  instructor_avatar_url?: string | null;
  total_seats: number;
  available_seats: number;
  price: number;
  is_active: boolean;
  status?: 'draft' | 'published' | 'completed';
  created_by?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at?: string;
  enrolled_count?: number;
}

export interface WorkshopEnrollment {
  id: string;
  workshop_id: string;
  student_id: string;
  status: EnrollmentStatus;
  registered_at: string;
  approved_at?: string | null;
  approved_by?: string | null;
  rejection_reason?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  workshop?: Workshop;
  student?: Profile;
}

export interface Payment {
  id: string;
  enrollment_id: string;
  student_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_reference?: string | null;
  payment_proof_url?: string | null;
  status: PaymentStatus;
  verified_by?: string | null;
  verified_at?: string | null;
  admin_notes?: string | null;
  created_at: string;
  student?: Profile;
}

export interface Course {
  id: string;
  workshop_id?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  instructor_name?: string | null;
  duration?: string | null;
  category?: string | null;
  level?: string | null;
  thumbnail_url?: string | null;
  status?: 'draft' | 'published' | 'archived';
  order_index: number;
  is_published: boolean;
  is_paid?: boolean;
  price?: number;
  created_by?: string | null;
  published_at?: string | null;
  published_by?: string | null;
  created_at: string;
  updated_at?: string;
  workshop?: Workshop;
  modules?: Module[];
  enrolled_count?: number;
  modules_count?: number;
  sessions_count?: number;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  student_id: string;
  progress_percentage: number;
  is_completed: boolean;
  status?: 'active' | 'completed' | 'pending_approval' | 'rejected' | 'payment_pending' | 'payment_verification_pending' | 'suspended';
  enrolled_at: string;
  completed_at?: string | null;
  completed_sessions?: number;
  total_sessions?: number;
  created_at?: string;
  updated_at?: string;
  course?: Course;
  student?: Profile;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  sessions?: Session[];
}

export interface Session {
  id: string;
  module_id: string;
  title: string;
  description?: string | null;
  session_type: 'lecture' | 'reading' | 'assignment' | 'quiz' | 'document' | 'video' | 'link' | 'lesson';
  order_index: number;
  duration_minutes: number;
  is_published: boolean;
  drive_folder_url?: string | null;
  drive_folder_id?: string | null;
  drive_url?: string | null;
  created_at: string;
  video_lecture?: VideoLecture | null;
  video_lectures?: VideoLecture[];
  learning_materials?: LearningMaterial[];
  quiz?: Quiz | null;
  content_data?: any;
  video_links?: Array<{ id: string; title: string; url: string; duration_minutes?: number }>;
  is_completed?: boolean;
}

export interface VideoLecture {
  id: string;
  session_id: string;
  title: string;
  description?: string | null;
  drive_url: string;
  drive_file_id?: string | null;
  duration_minutes: number;
  is_available: boolean;
  created_at: string;
}

export interface LearningMaterial {
  id: string;
  session_id?: string | null;
  module_id?: string | null;
  course_id: string;
  title: string;
  description?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  file_size_bytes?: number | null;
  external_link?: string | null;
  drive_url?: string | null;
  drive_file_id?: string | null;
  is_downloadable: boolean;
  created_at: string;
}

export interface SessionProgress {
  id: string;
  student_id: string;
  session_id: string;
  is_completed: boolean;
  completed_at?: string | null;
  last_accessed_at?: string | null;
  notes?: string | null;
}

export interface Assignment {
  id: string;
  course_id: string;
  module_id?: string | null;
  session_id?: string | null;
  title: string;
  description: string;
  instructions?: string | null;
  assignment_type: string;
  max_marks: number;
  passing_marks: number;
  start_date?: string | null;
  due_date: string;
  is_published: boolean;
  created_at: string;
  course?: Course;
  questions?: AssignmentQuestion[];
  submission?: AssignmentSubmission | null;
}

export interface AssignmentQuestion {
  id: string;
  assignment_id: string;
  question_number: number;
  question_text: string;
  question_type: string;
  max_marks: number;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text?: string | null;
  file_url?: string | null;
  status: AssignmentStatus;
  marks_obtained?: number | null;
  feedback?: string | null;
  submitted_at: string;
  evaluated_at?: string | null;
  evaluated_by?: string | null;
  student?: Profile;
  assignment?: Assignment;
}

export interface Quiz {
  id: string;
  course_id: string;
  module_id?: string | null;
  session_id?: string | null;
  title: string;
  description?: string | null;
  time_limit_minutes: number;
  passing_percentage: number;
  is_published: boolean;
  created_at: string;
  questions?: QuizQuestion[];
  latest_attempt?: QuizAttempt | null;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_option_index?: number; // Only for admin
  explanation?: string | null;
  marks: number;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total_marks: number;
  percentage: number;
  is_passed: boolean;
  started_at: string;
  submitted_at?: string | null;
  status: string;
}

export interface Project {
  id: string;
  course_id: string;
  title: string;
  description: string;
  requirements: string;
  submission_deadline: string;
  max_marks: number;
  passing_marks: number;
  is_published: boolean;
  created_at: string;
  course?: Course;
  submission?: ProjectSubmission | null;
}

export interface ProjectSubmission {
  id: string;
  project_id: string;
  student_id: string;
  project_title: string;
  project_description: string;
  github_url: string;
  live_demo_url?: string | null;
  document_url?: string | null;
  status: ProjectStatus;
  marks_obtained?: number | null;
  feedback?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  student?: Profile;
  project?: Project;
}

export interface Examination {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  passing_percentage?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  show_answer_review?: boolean;
  start_time?: string | null;
  end_time?: string | null;
  is_published: boolean;
  created_at: string;
  course?: Course;
  questions?: ExamQuestion[];
  latest_attempt?: ExamAttempt | null;
  attempts_count?: number;
}

export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  options: string[];
  correct_option_index?: number; // Admin only or post evaluation
  marks: number;
  order_index: number;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  attempt_number?: number;
  score: number;
  total_marks: number;
  percentage: number;
  is_passed: boolean;
  started_at: string;
  submitted_at?: string | null;
  deadline_at?: string | null;
  status: ExamStatus;
  tab_switches?: number;
  draft_answers?: Record<string, number>;
  time_taken_seconds?: number;
  student?: Profile;
  examination?: Examination;
}

export type StudentExamLockStatus =
  | 'locked'
  | 'not_open'
  | 'available'
  | 'in_progress'
  | 'passed'
  | 'failed_retake'
  | 'no_attempts_left'
  | 'closed';

export interface StudentExamCardData {
  exam: Examination;
  status: StudentExamLockStatus;
  progressPercent: number;
  completedSessions: number;
  totalSessions: number;
  attemptsLeft: number;
  attemptsTaken: number;
  latestAttempt?: ExamAttempt | null;
  activeAttempt?: {
    attemptId: string;
    deadlineAt: string;
    remainingSeconds: number;
  } | null;
}

export interface LiveSession {
  id: string;
  course_id: string;
  module_id?: string | null;
  title: string;
  description?: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  meeting_link: string;
  platform: string;
  instructor_name?: string | null;
  is_published: boolean;
  created_at: string;
  course?: Course;
  attendance_status?: AttendanceStatus;
}

export interface Attendance {
  id: string;
  live_session_id: string;
  student_id: string;
  status: AttendanceStatus;
  marked_at: string;
  marked_by?: string | null;
  remarks?: string | null;
  student?: Profile;
  live_session?: LiveSession;
}

export interface Certificate {
  id: string;
  certificate_number: string;
  student_id: string;
  workshop_id?: string | null;
  course_id?: string | null;
  issue_date: string;
  completion_date: string;
  pdf_url?: string | null;
  status: 'issued' | 'revoked';
  revoked_reason?: string | null;
  issued_by?: string | null;
  overall_score?: number | null;
  grade?: string | null;
  is_force_issued?: boolean;
  created_at: string;
  student?: Profile;
  workshop?: Workshop;
  course?: Course;
  issuer?: Profile;
}

export interface CertificateTemplate {
  id: string;
  workshop_id?: string | null;
  template_name: string;
  signatory_name: string;
  signatory_title: string;
  signature_image_url?: string | null;
  badge_title: string;
  min_course_progress_percentage: number;
  require_all_assignments: boolean;
  require_project_approval: boolean;
  min_exam_percentage: number;
  is_active: boolean;
  layout?: 'classic' | 'modern' | 'executive' | 'minimalist';
  created_at?: string;
  updated_at?: string;
}

export interface CourseInstructor {
  id: string;
  course_id: string;
  instructor_id: string;
  created_at?: string;
  course?: Course;
  instructor?: Profile;
}

export interface Feedback {
  id: string;
  student_id: string;
  category: FeedbackCategory;
  subject: string;
  description: string;
  status: FeedbackStatus;
  admin_response?: string | null;
  responded_by?: string | null;
  resolved_at?: string | null;
  attachments?: string[] | null;
  created_at: string;
  student?: Profile;
}

export interface NotesRequest {
  id: string;
  student_id: string;
  live_session_id?: string;
  course_id?: string;
  session_title?: string;
  course_title?: string;
  message: string;
  status: 'pending' | 'fulfilled' | 'rejected';
  admin_reply?: string | null;
  created_at: string;
  student?: Profile;
  live_session?: LiveSession;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link_url?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AdminSettings {
  whatsapp_group_url: string;
  support_email: string;
  support_phone: string;
  payment_upi_id: string;
  payment_qr_code_url: string;
  certificate_signatory?: string;
  certificate_title?: string;
  min_attendance_percentage?: number;
  min_exam_percentage?: number;
}
