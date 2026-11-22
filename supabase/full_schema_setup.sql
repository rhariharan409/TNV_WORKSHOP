-- ==============================================================================
-- TNV WORKSHOP LEARNING MANAGEMENT SYSTEM (LMS)
-- 00_INITIAL_SCHEMA.SQL - Complete 32-Table Relational Schema
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ROLE ENUMS AND BASE TYPES
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE enrollment_status AS ENUM (
        'registered',
        'payment_pending',
        'payment_verification_pending',
        'approved',
        'rejected',
        'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM (
        'not_started',
        'in_progress',
        'submitted',
        'under_review',
        'evaluated',
        'late'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM (
        'not_submitted',
        'submitted',
        'under_review',
        'approved',
        'rejected',
        'resubmission_required'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE exam_status AS ENUM ('not_started', 'in_progress', 'submitted', 'evaluated', 'timed_out');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'excused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE feedback_category AS ENUM ('complaint', 'technical_issue', 'improvement', 'general');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'alert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 1. PROFILES TABLE (Linked with auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    college_name TEXT,
    department TEXT,
    year_of_study TEXT,
    role user_role NOT NULL DEFAULT 'student',
    avatar_url TEXT,
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. WORKSHOPS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workshops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    short_description TEXT,
    description TEXT NOT NULL,
    thumbnail_url TEXT,
    duration TEXT NOT NULL,
    instructor_name TEXT NOT NULL,
    instructor_title TEXT,
    instructor_bio TEXT,
    instructor_avatar_url TEXT,
    total_seats INT NOT NULL DEFAULT 100,
    available_seats INT NOT NULL DEFAULT 100,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. WORKSHOP ENROLLMENTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.workshop_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status enrollment_status NOT NULL DEFAULT 'registered',
    registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_student_workshop UNIQUE (student_id, workshop_id)
);

-- ==============================================================================
-- 4. PAYMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES public.workshop_enrollments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_method TEXT NOT NULL DEFAULT 'UPI_MANUAL',
    transaction_reference TEXT,
    payment_proof_url TEXT,
    status payment_status NOT NULL DEFAULT 'pending',
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. COURSES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    instructor_name TEXT,
    duration TEXT,
    order_index INT NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_course_slug_per_workshop UNIQUE (workshop_id, slug)
);

-- ==============================================================================
-- 6. COURSE ENROLLMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    progress_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ,
    CONSTRAINT unique_student_course UNIQUE (student_id, course_id)
);

-- ==============================================================================
-- 7. MODULES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    order_index INT NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 8. SESSIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    session_type TEXT NOT NULL DEFAULT 'lecture', -- 'lecture', 'reading', 'assignment', 'quiz'
    order_index INT NOT NULL DEFAULT 1,
    duration_minutes INT DEFAULT 45,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 9. VIDEO LECTURES TABLE (Google Drive Integration)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.video_lectures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    drive_url TEXT NOT NULL,
    drive_file_id TEXT,
    duration_minutes INT DEFAULT 45,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 10. LEARNING MATERIALS TABLE (PDFs, Notes, Links)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.learning_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    file_type TEXT DEFAULT 'pdf',
    file_size_bytes BIGINT,
    external_link TEXT,
    is_downloadable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 11. SESSION PROGRESS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.session_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    notes TEXT,
    CONSTRAINT unique_student_session_progress UNIQUE (student_id, session_id)
);

-- ==============================================================================
-- 12. ASSIGNMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT,
    assignment_type TEXT NOT NULL DEFAULT 'text_or_file',
    max_marks INT NOT NULL DEFAULT 100,
    passing_marks INT NOT NULL DEFAULT 50,
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 13. ASSIGNMENT QUESTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.assignment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    question_number INT NOT NULL DEFAULT 1,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL DEFAULT 'text',
    max_marks INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 14. ASSIGNMENT SUBMISSIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_url TEXT,
    status assignment_status NOT NULL DEFAULT 'submitted',
    marks_obtained NUMERIC(5, 2),
    feedback TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    evaluated_at TIMESTAMPTZ,
    evaluated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT unique_student_assignment UNIQUE (student_id, assignment_id)
);

-- ==============================================================================
-- 15. QUIZZES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    time_limit_minutes INT NOT NULL DEFAULT 15,
    passing_percentage INT NOT NULL DEFAULT 60,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 16. QUIZ QUESTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings e.g. ["Option A", "Option B", "Option C", "Option D"]
    correct_option_index INT NOT NULL, -- 0-based index
    explanation TEXT,
    marks INT NOT NULL DEFAULT 1,
    order_index INT NOT NULL DEFAULT 1
);

-- ==============================================================================
-- 17. QUIZ ATTEMPTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INT NOT NULL DEFAULT 0,
    total_marks INT NOT NULL DEFAULT 0,
    percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    is_passed BOOLEAN NOT NULL DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    submitted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'completed'
);

-- ==============================================================================
-- 18. QUIZ ANSWERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    selected_option_index INT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    marks_awarded INT NOT NULL DEFAULT 0
);

-- ==============================================================================
-- 19. PROJECTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    submission_deadline TIMESTAMPTZ NOT NULL,
    max_marks INT NOT NULL DEFAULT 100,
    passing_marks INT NOT NULL DEFAULT 60,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 20. PROJECT SUBMISSIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.project_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_title TEXT NOT NULL,
    project_description TEXT NOT NULL,
    github_url TEXT NOT NULL,
    live_demo_url TEXT,
    document_url TEXT,
    status project_status NOT NULL DEFAULT 'submitted',
    marks_obtained NUMERIC(5, 2),
    feedback TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT unique_student_project_submission UNIQUE (student_id, project_id)
);

-- ==============================================================================
-- 21. EXAMINATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.examinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    duration_minutes INT NOT NULL DEFAULT 60,
    total_marks INT NOT NULL DEFAULT 50,
    passing_marks INT NOT NULL DEFAULT 25,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 22. EXAM QUESTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings
    correct_option_index INT NOT NULL, -- Protected from direct student read
    marks INT NOT NULL DEFAULT 2,
    order_index INT NOT NULL DEFAULT 1
);

-- ==============================================================================
-- 23. EXAM ATTEMPTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score INT DEFAULT 0,
    total_marks INT NOT NULL DEFAULT 0,
    percentage NUMERIC(5, 2) DEFAULT 0.00,
    is_passed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    submitted_at TIMESTAMPTZ,
    status exam_status NOT NULL DEFAULT 'in_progress',
    CONSTRAINT unique_student_exam_attempt UNIQUE (student_id, exam_id)
);

-- ==============================================================================
-- 24. EXAM ANSWERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.exam_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
    selected_option_index INT,
    is_correct BOOLEAN DEFAULT FALSE,
    marks_awarded INT DEFAULT 0
);

-- ==============================================================================
-- 25. LIVE SESSIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.live_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    module_id UUID REFERENCES public.modules(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    meeting_link TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'Google Meet',
    instructor_name TEXT,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 26. ATTENDANCE TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    live_session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status attendance_status NOT NULL DEFAULT 'absent',
    marked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    remarks TEXT,
    CONSTRAINT unique_student_live_attendance UNIQUE (live_session_id, student_id)
);

-- ==============================================================================
-- 27. CERTIFICATES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number TEXT UNIQUE NOT NULL, -- e.g. TNV-2024-89312
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completion_date DATE NOT NULL DEFAULT CURRENT_DATE,
    pdf_url TEXT,
    status TEXT NOT NULL DEFAULT 'issued', -- 'issued', 'revoked'
    revoked_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_student_workshop_certificate UNIQUE (student_id, workshop_id)
);

-- ==============================================================================
-- 28. FEEDBACK & ISSUE MANAGEMENT TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category feedback_category NOT NULL DEFAULT 'general',
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status feedback_status NOT NULL DEFAULT 'open',
    admin_response TEXT,
    responded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 29. NOTIFICATIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'info',
    link_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 30. ACTIVITY LOGS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 31. ADMIN SETTINGS TABLE (Configurable WhatsApp link, support, etc.)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 32. CERTIFICATE TEMPLATES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.certificate_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    signatory_name TEXT NOT NULL DEFAULT 'Thamilaran',
    signatory_title TEXT NOT NULL DEFAULT 'Program Director & Chief Architect',
    signature_image_url TEXT,
    badge_title TEXT NOT NULL DEFAULT 'Certificate of Completion',
    min_course_progress_percentage NUMERIC(5, 2) NOT NULL DEFAULT 80.00,
    require_all_assignments BOOLEAN NOT NULL DEFAULT TRUE,
    require_project_approval BOOLEAN NOT NULL DEFAULT TRUE,
    min_exam_percentage NUMERIC(5, 2) NOT NULL DEFAULT 50.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.workshop_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_workshop ON public.workshop_enrollments(workshop_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.workshop_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_payments_student ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_modules_course ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_module ON public.sessions(module_id);
CREATE INDEX IF NOT EXISTS idx_session_progress_student ON public.session_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_project ON public.project_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_attendance_live_session ON public.attendance(live_session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
-- ==============================================================================
-- TNV WORKSHOP LEARNING MANAGEMENT SYSTEM (LMS)
-- 01_SECURITY_POLICIES.SQL - Comprehensive Row Level Security (RLS)
-- ==============================================================================

-- 1. SECURITY HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
DECLARE
    v_role user_role;
BEGIN
    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();
    
    RETURN COALESCE(v_role, 'student'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_approved_workshop_access(p_workshop_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Admins always have access
    IF public.is_admin() THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.workshop_enrollments
        WHERE student_id = auth.uid()
          AND workshop_id = p_workshop_id
          AND status = 'approved'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_approved_course_access(p_course_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_workshop_id UUID;
BEGIN
    IF public.is_admin() THEN
        RETURN TRUE;
    END IF;

    SELECT workshop_id INTO v_workshop_id
    FROM public.courses
    WHERE id = p_course_id;

    IF v_workshop_id IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN public.has_approved_workshop_access(v_workshop_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 2. ENABLE RLS ON ALL TABLES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. POLICIES DEFINITION
-- ==============================================================================

-- PROFILES
-- Anyone authenticated can view their own profile; admins can view all profiles
CREATE POLICY "Profiles are viewable by owner or admin"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile (except role and suspension)"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (
        public.is_admin() OR (
            auth.uid() = id AND
            role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
            is_suspended = (SELECT is_suspended FROM public.profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Profiles can be created by authenticated user or admin"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id OR public.is_admin());

-- WORKSHOPS (Public can read active; Admins can CRUD)
CREATE POLICY "Active workshops are readable by everyone"
    ON public.workshops FOR SELECT
    USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admins have full control over workshops"
    ON public.workshops FOR ALL
    USING (public.is_admin());

-- WORKSHOP ENROLLMENTS
CREATE POLICY "Students can view their own enrollments; Admins can view all"
    ON public.workshop_enrollments FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students can create initial enrollment"
    ON public.workshop_enrollments FOR INSERT
    WITH CHECK (student_id = auth.uid() AND status IN ('registered', 'payment_pending'));

CREATE POLICY "Only admins can update enrollment status"
    ON public.workshop_enrollments FOR UPDATE
    USING (public.is_admin());

-- PAYMENTS
CREATE POLICY "Students can view own payments; Admins can view all"
    ON public.payments FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students can submit payments"
    ON public.payments FOR INSERT
    WITH CHECK (student_id = auth.uid() AND status = 'pending');

CREATE POLICY "Only admins can verify or update payments"
    ON public.payments FOR UPDATE
    USING (public.is_admin());

-- COURSES
CREATE POLICY "Courses viewable by approved students or admins"
    ON public.courses FOR SELECT
    USING (
        public.is_admin() OR (
            is_published = TRUE AND
            public.has_approved_workshop_access(workshop_id)
        )
    );

CREATE POLICY "Admins have full control over courses"
    ON public.courses FOR ALL
    USING (public.is_admin());

-- MODULES & SESSIONS
CREATE POLICY "Modules viewable by approved students or admins"
    ON public.modules FOR SELECT
    USING (
        public.is_admin() OR (
            is_published = TRUE AND
            public.has_approved_course_access(course_id)
        )
    );

CREATE POLICY "Admins have full control over modules"
    ON public.modules FOR ALL
    USING (public.is_admin());

CREATE POLICY "Sessions viewable by approved students or admins"
    ON public.sessions FOR SELECT
    USING (
        public.is_admin() OR (
            is_published = TRUE AND
            EXISTS (
                SELECT 1 FROM public.modules m
                WHERE m.id = sessions.module_id
                  AND public.has_approved_course_access(m.course_id)
            )
        )
    );

CREATE POLICY "Admins have full control over sessions"
    ON public.sessions FOR ALL
    USING (public.is_admin());

-- VIDEO LECTURES & LEARNING MATERIALS
CREATE POLICY "Video lectures viewable by approved students"
    ON public.video_lectures FOR SELECT
    USING (
        public.is_admin() OR (
            is_available = TRUE AND
            EXISTS (
                SELECT 1 FROM public.sessions s
                JOIN public.modules m ON m.id = s.module_id
                WHERE s.id = video_lectures.session_id
                  AND public.has_approved_course_access(m.course_id)
            )
        )
    );

CREATE POLICY "Admins have full control over video lectures"
    ON public.video_lectures FOR ALL
    USING (public.is_admin());

CREATE POLICY "Learning materials viewable by approved students"
    ON public.learning_materials FOR SELECT
    USING (
        public.is_admin() OR public.has_approved_course_access(course_id)
    );

CREATE POLICY "Admins have full control over learning materials"
    ON public.learning_materials FOR ALL
    USING (public.is_admin());

-- SESSION PROGRESS
CREATE POLICY "Students manage their own progress"
    ON public.session_progress FOR ALL
    USING (student_id = auth.uid() OR public.is_admin());

-- ASSIGNMENTS & SUBMISSIONS
CREATE POLICY "Assignments viewable by approved students"
    ON public.assignments FOR SELECT
    USING (
        public.is_admin() OR (
            is_published = TRUE AND public.has_approved_course_access(course_id)
        )
    );

CREATE POLICY "Admins manage assignments"
    ON public.assignments FOR ALL
    USING (public.is_admin());

CREATE POLICY "Assignment submissions visible by owner or admin"
    ON public.assignment_submissions FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students can submit assignments"
    ON public.assignment_submissions FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update draft; Admins evaluate"
    ON public.assignment_submissions FOR UPDATE
    USING (student_id = auth.uid() OR public.is_admin());

-- PROJECTS & SUBMISSIONS
CREATE POLICY "Projects viewable by approved students"
    ON public.projects FOR SELECT
    USING (
        public.is_admin() OR (
            is_published = TRUE AND public.has_approved_course_access(course_id)
        )
    );

CREATE POLICY "Admins manage projects"
    ON public.projects FOR ALL
    USING (public.is_admin());

CREATE POLICY "Project submissions viewable by owner or admin"
    ON public.project_submissions FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students submit projects"
    ON public.project_submissions FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins review project submissions"
    ON public.project_submissions FOR UPDATE
    USING (student_id = auth.uid() OR public.is_admin());

-- EXAMINATIONS & ATTEMPTS
CREATE POLICY "Examinations viewable by approved students"
    ON public.examinations FOR SELECT
    USING (
        public.is_admin() OR (
            is_published = TRUE AND public.has_approved_course_access(course_id)
        )
    );

CREATE POLICY "Admins manage examinations"
    ON public.examinations FOR ALL
    USING (public.is_admin());

CREATE POLICY "Exam attempts viewable by owner or admin"
    ON public.exam_attempts FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students can start exam attempt"
    ON public.exam_attempts FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update active attempt"
    ON public.exam_attempts FOR UPDATE
    USING (student_id = auth.uid() OR public.is_admin());

-- LIVE SESSIONS & ATTENDANCE
CREATE POLICY "Live sessions viewable by approved students"
    ON public.live_sessions FOR SELECT
    USING (
        public.is_admin() OR (
            is_published = TRUE AND public.has_approved_course_access(course_id)
        )
    );

CREATE POLICY "Admins manage live sessions"
    ON public.live_sessions FOR ALL
    USING (public.is_admin());

CREATE POLICY "Attendance viewable by student or admin"
    ON public.attendance FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Only admins record attendance"
    ON public.attendance FOR ALL
    USING (public.is_admin());

-- CERTIFICATES
-- CERTIFICATES
-- Public can verify by certificate number; students and admins can view
CREATE POLICY "Certificates viewable by everyone for verification"
    ON public.certificates FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins manage certificates"
    ON public.certificates FOR ALL
    USING (public.is_admin());

-- FEEDBACK
CREATE POLICY "Feedback viewable by creator or admin"
    ON public.feedback FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students create feedback"
    ON public.feedback FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins manage and respond to feedback"
    ON public.feedback FOR UPDATE
    USING (public.is_admin());

-- NOTIFICATIONS
CREATE POLICY "Users view and update their own notifications"
    ON public.notifications FOR ALL
    USING (user_id = auth.uid() OR public.is_admin());

-- ADMIN SETTINGS
CREATE POLICY "Admin settings readable by authenticated; writable by admin"
    ON public.admin_settings FOR SELECT
    USING (TRUE);

CREATE POLICY "Only admins modify admin settings"
    ON public.admin_settings FOR ALL
    USING (public.is_admin());

-- COURSE ENROLLMENTS
CREATE POLICY "Students view own course enrollments; Admins view all"
    ON public.course_enrollments FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins manage course enrollments"
    ON public.course_enrollments FOR ALL
    USING (public.is_admin());

-- ASSIGNMENT QUESTIONS
CREATE POLICY "Assignment questions viewable by approved students"
    ON public.assignment_questions FOR SELECT
    USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = assignment_questions.assignment_id
              AND a.is_published = TRUE
              AND public.has_approved_course_access(a.course_id)
        )
    );

CREATE POLICY "Admins manage assignment questions"
    ON public.assignment_questions FOR ALL
    USING (public.is_admin());

-- QUIZZES & QUESTIONS
CREATE POLICY "Quizzes viewable by approved students"
    ON public.quizzes FOR SELECT
    USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.modules m
            WHERE m.id = quizzes.module_id
              AND m.is_published = TRUE
              AND public.has_approved_course_access(m.course_id)
        )
    );

CREATE POLICY "Admins manage quizzes"
    ON public.quizzes FOR ALL
    USING (public.is_admin());

CREATE POLICY "Quiz questions viewable by approved students"
    ON public.quiz_questions FOR SELECT
    USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.quizzes q
            JOIN public.modules m ON m.id = q.module_id
            WHERE q.id = quiz_questions.quiz_id
              AND m.is_published = TRUE
              AND public.has_approved_course_access(m.course_id)
        )
    );

CREATE POLICY "Admins manage quiz questions"
    ON public.quiz_questions FOR ALL
    USING (public.is_admin());

-- QUIZ ATTEMPTS & ANSWERS
CREATE POLICY "Quiz attempts viewable by owner or admin"
    ON public.quiz_attempts FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students can start and update quiz attempts"
    ON public.quiz_attempts FOR ALL
    USING (student_id = auth.uid() OR public.is_admin());

CREATE POLICY "Quiz answers viewable by owner or admin"
    ON public.quiz_answers FOR SELECT
    USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.quiz_attempts qa
            WHERE qa.id = quiz_answers.attempt_id
              AND qa.student_id = auth.uid()
        )
    );

CREATE POLICY "Students can record quiz answers"
    ON public.quiz_answers FOR INSERT
    WITH CHECK (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.quiz_attempts qa
            WHERE qa.id = quiz_answers.attempt_id
              AND qa.student_id = auth.uid()
        )
    );

-- EXAM QUESTIONS & ANSWERS
CREATE POLICY "Exam questions viewable by approved students"
    ON public.exam_questions FOR SELECT
    USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.examinations e
            WHERE e.id = exam_questions.exam_id
              AND e.is_published = TRUE
              AND public.has_approved_course_access(e.course_id)
        )
    );

CREATE POLICY "Admins manage exam questions"
    ON public.exam_questions FOR ALL
    USING (public.is_admin());

CREATE POLICY "Exam answers viewable by owner or admin"
    ON public.exam_answers FOR SELECT
    USING (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.exam_attempts ea
            WHERE ea.id = exam_answers.attempt_id
              AND ea.student_id = auth.uid()
        )
    );

CREATE POLICY "Students can submit exam answers"
    ON public.exam_answers FOR INSERT
    WITH CHECK (
        public.is_admin() OR EXISTS (
            SELECT 1 FROM public.exam_attempts ea
            WHERE ea.id = exam_answers.attempt_id
              AND ea.student_id = auth.uid()
        )
    );

-- ACTIVITY LOGS
CREATE POLICY "Activity logs viewable by owner or admin"
    ON public.activity_logs FOR SELECT
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Activity logs can be inserted by authenticated user or admin"
    ON public.activity_logs FOR INSERT
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- CERTIFICATE TEMPLATES
CREATE POLICY "Certificate templates viewable by authenticated users"
    ON public.certificate_templates FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins manage certificate templates"
    ON public.certificate_templates FOR ALL
    USING (public.is_admin());
-- ==============================================================================
-- TNV WORKSHOP LEARNING MANAGEMENT SYSTEM (LMS)
-- 02_FUNCTIONS_AND_TRIGGERS.SQL - Stored Procedures, Server Calculations, Triggers
-- ==============================================================================

-- 1. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_phone TEXT;
    v_college TEXT;
    v_dept TEXT;
    v_year TEXT;
    v_role user_role := 'student'::user_role;
    v_workshop_id TEXT;
BEGIN
    -- Extract metadata supplied during signup
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    v_phone := new.raw_user_meta_data->>'phone';
    v_college := new.raw_user_meta_data->>'college_name';
    v_dept := new.raw_user_meta_data->>'department';
    v_year := new.raw_user_meta_data->>'year_of_study';
    v_workshop_id := new.raw_user_meta_data->>'workshop_id';

    -- SECURITY ENFORCEMENT:
    -- All self-registering users through auth signup are strictly assigned the 'student' role.
    -- Administrator roles ('admin', 'super_admin') must be explicitly provisioned via SQL
    -- or promoted by an existing administrator to prevent privilege escalation attacks.
    v_role := 'student'::user_role;

    -- Insert into profiles
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone,
        college_name,
        department,
        year_of_study,
        role
    ) VALUES (
        new.id,
        new.email,
        v_full_name,
        v_phone,
        v_college,
        v_dept,
        v_year,
        v_role
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        college_name = COALESCE(EXCLUDED.college_name, public.profiles.college_name),
        department = COALESCE(EXCLUDED.department, public.profiles.department),
        year_of_study = COALESCE(EXCLUDED.year_of_study, public.profiles.year_of_study);

    -- If a workshop was selected during student registration, create initial enrollment
    IF v_workshop_id IS NOT NULL AND v_workshop_id <> '' AND v_role = 'student' THEN
        INSERT INTO public.workshop_enrollments (
            workshop_id,
            student_id,
            status
        ) VALUES (
            v_workshop_id::UUID,
            new.id,
            'payment_pending'
        )
        ON CONFLICT (student_id, workshop_id) DO NOTHING;
    END IF;

    -- Create welcome notification
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type
    ) VALUES (
        new.id,
        'Welcome to TNV Workshop!',
        'Your account has been created successfully. Complete your payment verification to get full access to your workshop resources.',
        'info'
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 2. SECURE SERVER-SIDE QUIZ EVALUATION (RPC)
-- ==============================================================================
-- Students cannot see correct answers beforehand; answers are sent to this function
-- which checks database correct_option_index, calculates score, and stores attempt.
CREATE OR REPLACE FUNCTION public.submit_quiz(
    p_quiz_id UUID,
    p_answers JSONB -- Array of { question_id: UUID, selected_option_index: INT }
)
RETURNS JSONB AS $$
DECLARE
    v_student_id UUID := auth.uid();
    v_quiz public.quizzes%ROWTYPE;
    v_attempt_id UUID;
    v_total_marks INT := 0;
    v_score INT := 0;
    v_passed BOOLEAN := FALSE;
    v_percentage NUMERIC(5, 2) := 0.00;
    v_item JSONB;
    v_q_id UUID;
    v_sel_idx INT;
    v_correct_idx INT;
    v_marks INT;
    v_is_correct BOOLEAN;
BEGIN
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT * INTO v_quiz FROM public.quizzes WHERE id = p_quiz_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Quiz not found';
    END IF;

    -- Calculate total marks
    SELECT COALESCE(SUM(marks), 0) INTO v_total_marks
    FROM public.quiz_questions
    WHERE quiz_id = p_quiz_id;

    -- Create attempt record
    INSERT INTO public.quiz_attempts (
        quiz_id,
        student_id,
        total_marks,
        submitted_at,
        status
    ) VALUES (
        p_quiz_id,
        v_student_id,
        v_total_marks,
        now(),
        'completed'
    ) RETURNING id INTO v_attempt_id;

    -- Evaluate each answer
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        v_q_id := (v_item->>'question_id')::UUID;
        v_sel_idx := (v_item->>'selected_option_index')::INT;

        SELECT correct_option_index, marks INTO v_correct_idx, v_marks
        FROM public.quiz_questions
        WHERE id = v_q_id AND quiz_id = p_quiz_id;

        IF FOUND THEN
            v_is_correct := (v_sel_idx = v_correct_idx);
            IF v_is_correct THEN
                v_score := v_score + v_marks;
            END IF;

            INSERT INTO public.quiz_answers (
                attempt_id,
                question_id,
                selected_option_index,
                is_correct,
                marks_awarded
            ) VALUES (
                v_attempt_id,
                v_q_id,
                v_sel_idx,
                v_is_correct,
                CASE WHEN v_is_correct THEN v_marks ELSE 0 END
            );
        END IF;
    END LOOP;

    IF v_total_marks > 0 THEN
        v_percentage := ROUND((v_score::NUMERIC / v_total_marks::NUMERIC) * 100.0, 2);
    END IF;

    v_passed := (v_percentage >= v_quiz.passing_percentage);

    -- Update attempt with final score
    UPDATE public.quiz_attempts
    SET score = v_score,
        percentage = v_percentage,
        is_passed = v_passed
    WHERE id = v_attempt_id;

    RETURN jsonb_build_object(
        'attempt_id', v_attempt_id,
        'score', v_score,
        'total_marks', v_total_marks,
        'percentage', v_percentage,
        'is_passed', v_passed
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 3. SECURE SERVER-SIDE EXAMINATION EVALUATION (RPC)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.submit_examination(
    p_exam_id UUID,
    p_answers JSONB -- Array of { question_id: UUID, selected_option_index: INT }
)
RETURNS JSONB AS $$
DECLARE
    v_student_id UUID := auth.uid();
    v_exam public.examinations%ROWTYPE;
    v_attempt_id UUID;
    v_total_marks INT := 0;
    v_score INT := 0;
    v_passed BOOLEAN := FALSE;
    v_percentage NUMERIC(5, 2) := 0.00;
    v_item JSONB;
    v_q_id UUID;
    v_sel_idx INT;
    v_correct_idx INT;
    v_marks INT;
    v_is_correct BOOLEAN;
BEGIN
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT * INTO v_exam FROM public.examinations WHERE id = p_exam_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Examination not found';
    END IF;

    -- Verify course access
    IF NOT public.has_approved_course_access(v_exam.course_id) THEN
        RAISE EXCEPTION 'Access denied: workshop enrollment not approved';
    END IF;

    -- Check if attempt already exists
    SELECT id INTO v_attempt_id
    FROM public.exam_attempts
    WHERE exam_id = p_exam_id AND student_id = v_student_id;

    -- Calculate total marks from exam questions
    SELECT COALESCE(SUM(marks), 0) INTO v_total_marks
    FROM public.exam_questions
    WHERE exam_id = p_exam_id;

    IF v_attempt_id IS NULL THEN
        INSERT INTO public.exam_attempts (
            exam_id,
            student_id,
            total_marks,
            started_at,
            submitted_at,
            status
        ) VALUES (
            p_exam_id,
            v_student_id,
            v_total_marks,
            now(),
            now(),
            'evaluated'
        ) RETURNING id INTO v_attempt_id;
    ELSE
        UPDATE public.exam_attempts
        SET submitted_at = now(),
            status = 'evaluated',
            total_marks = v_total_marks
        WHERE id = v_attempt_id;

        -- Clear previous answers if re-evaluating
        DELETE FROM public.exam_answers WHERE attempt_id = v_attempt_id;
    END IF;

    -- Grade answers
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_answers)
    LOOP
        v_q_id := (v_item->>'question_id')::UUID;
        v_sel_idx := (v_item->>'selected_option_index')::INT;

        SELECT correct_option_index, marks INTO v_correct_idx, v_marks
        FROM public.exam_questions
        WHERE id = v_q_id AND exam_id = p_exam_id;

        IF FOUND THEN
            v_is_correct := (v_sel_idx = v_correct_idx);
            IF v_is_correct THEN
                v_score := v_score + v_marks;
            END IF;

            INSERT INTO public.exam_answers (
                attempt_id,
                question_id,
                selected_option_index,
                is_correct,
                marks_awarded
            ) VALUES (
                v_attempt_id,
                v_q_id,
                v_sel_idx,
                v_is_correct,
                CASE WHEN v_is_correct THEN v_marks ELSE 0 END
            );
        END IF;
    END LOOP;

    IF v_total_marks > 0 THEN
        v_percentage := ROUND((v_score::NUMERIC / v_total_marks::NUMERIC) * 100.0, 2);
    END IF;

    v_passed := (v_score >= v_exam.passing_marks);

    UPDATE public.exam_attempts
    SET score = v_score,
        percentage = v_percentage,
        is_passed = v_passed
    WHERE id = v_attempt_id;

    -- Notification
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type
    ) VALUES (
        v_student_id,
        'Exam Evaluated: ' || v_exam.title,
        'You scored ' || v_score || '/' || v_total_marks || ' (' || v_percentage || '%). Status: ' || (CASE WHEN v_passed THEN 'Passed' ELSE 'Failed' END),
        CASE WHEN v_passed THEN 'success'::notification_type ELSE 'warning'::notification_type END
    );

    RETURN jsonb_build_object(
        'attempt_id', v_attempt_id,
        'score', v_score,
        'total_marks', v_total_marks,
        'percentage', v_percentage,
        'is_passed', v_passed
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 4. CERTIFICATE ELIGIBILITY CHECKING (RPC)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.check_certificate_eligibility(
    p_student_id UUID,
    p_workshop_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_enrollment public.workshop_enrollments%ROWTYPE;
    v_template public.certificate_templates%ROWTYPE;
    v_total_sessions INT := 0;
    v_completed_sessions INT := 0;
    v_progress_pct NUMERIC(5, 2) := 0.00;
    v_total_assignments INT := 0;
    v_submitted_assignments INT := 0;
    v_assignments_ok BOOLEAN := TRUE;
    v_total_projects INT := 0;
    v_approved_projects INT := 0;
    v_projects_ok BOOLEAN := TRUE;
    v_exam_passed BOOLEAN := TRUE;
    v_is_eligible BOOLEAN := FALSE;
    v_existing_cert public.certificates%ROWTYPE;
BEGIN
    -- Check enrollment
    SELECT * INTO v_enrollment
    FROM public.workshop_enrollments
    WHERE student_id = p_student_id AND workshop_id = p_workshop_id;

    IF NOT FOUND OR v_enrollment.status <> 'approved' THEN
        RETURN jsonb_build_object(
            'is_eligible', FALSE,
            'reason', 'Enrollment is not approved or payment is pending.'
        );
    END IF;

    -- Check if certificate already exists
    SELECT * INTO v_existing_cert
    FROM public.certificates
    WHERE student_id = p_student_id AND workshop_id = p_workshop_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'is_eligible', TRUE,
            'already_issued', TRUE,
            'certificate_number', v_existing_cert.certificate_number,
            'issue_date', v_existing_cert.issue_date
        );
    END IF;

    -- Get template criteria (or default thresholds)
    SELECT * INTO v_template
    FROM public.certificate_templates
    WHERE workshop_id = p_workshop_id AND is_active = TRUE
    LIMIT 1;

    -- Calculate session progress across courses in this workshop
    SELECT COUNT(s.id) INTO v_total_sessions
    FROM public.sessions s
    JOIN public.modules m ON m.id = s.module_id
    JOIN public.courses c ON c.id = m.course_id
    WHERE c.workshop_id = p_workshop_id AND s.is_published = TRUE;

    IF v_total_sessions > 0 THEN
        SELECT COUNT(sp.id) INTO v_completed_sessions
        FROM public.session_progress sp
        JOIN public.sessions s ON s.id = sp.session_id
        JOIN public.modules m ON m.id = s.module_id
        JOIN public.courses c ON c.id = m.course_id
        WHERE c.workshop_id = p_workshop_id
          AND sp.student_id = p_student_id
          AND sp.is_completed = TRUE;

        v_progress_pct := ROUND((v_completed_sessions::NUMERIC / v_total_sessions::NUMERIC) * 100.0, 2);
    ELSE
        v_progress_pct := 100.00;
    END IF;

    -- Check assignments
    SELECT COUNT(a.id) INTO v_total_assignments
    FROM public.assignments a
    JOIN public.courses c ON c.id = a.course_id
    WHERE c.workshop_id = p_workshop_id AND a.is_published = TRUE;

    IF v_total_assignments > 0 THEN
        SELECT COUNT(asub.id) INTO v_submitted_assignments
        FROM public.assignment_submissions asub
        JOIN public.assignments a ON a.id = asub.assignment_id
        JOIN public.courses c ON c.id = a.course_id
        WHERE c.workshop_id = p_workshop_id
          AND asub.student_id = p_student_id
          AND asub.status IN ('submitted', 'evaluated', 'under_review');

        IF v_submitted_assignments < v_total_assignments THEN
            v_assignments_ok := FALSE;
        END IF;
    END IF;

    -- Check projects
    SELECT COUNT(p.id) INTO v_total_projects
    FROM public.projects p
    JOIN public.courses c ON c.id = p.course_id
    WHERE c.workshop_id = p_workshop_id AND p.is_published = TRUE;

    IF v_total_projects > 0 THEN
        SELECT COUNT(psub.id) INTO v_approved_projects
        FROM public.project_submissions psub
        JOIN public.projects p ON p.id = psub.project_id
        JOIN public.courses c ON c.id = p.course_id
        WHERE c.workshop_id = p_workshop_id
          AND psub.student_id = p_student_id
          AND psub.status = 'approved';

        IF v_approved_projects < v_total_projects THEN
            v_projects_ok := FALSE;
        END IF;
    END IF;

    -- Determine overall eligibility (requires >= 75% progress, assignments, projects)
    v_is_eligible := (v_progress_pct >= 75.00) AND v_assignments_ok AND v_projects_ok;

    RETURN jsonb_build_object(
        'is_eligible', v_is_eligible,
        'already_issued', FALSE,
        'progress_percentage', v_progress_pct,
        'total_sessions', v_total_sessions,
        'completed_sessions', v_completed_sessions,
        'total_assignments', v_total_assignments,
        'submitted_assignments', v_submitted_assignments,
        'assignments_satisfied', v_assignments_ok,
        'total_projects', v_total_projects,
        'approved_projects', v_approved_projects,
        'projects_satisfied', v_projects_ok
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 5. CERTIFICATE ISSUANCE PROCEDURE
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.issue_certificate(
    p_student_id UUID,
    p_workshop_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_cert_num TEXT;
    v_cert_id UUID;
    v_student public.profiles%ROWTYPE;
    v_workshop public.workshops%ROWTYPE;
    v_eligibility JSONB;
BEGIN
    -- Check permissions: caller must be admin or system
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can issue certificates';
    END IF;

    -- Check eligibility
    v_eligibility := public.check_certificate_eligibility(p_student_id, p_workshop_id);
    IF (v_eligibility->>'already_issued')::BOOLEAN = TRUE THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'message', 'Certificate already issued',
            'certificate_number', v_eligibility->>'certificate_number'
        );
    END IF;

    SELECT * INTO v_student FROM public.profiles WHERE id = p_student_id;
    SELECT * INTO v_workshop FROM public.workshops WHERE id = p_workshop_id;

    -- Generate unique alphanumeric certificate number
    -- e.g. TNV-2024-XXXXXX
    v_cert_num := 'TNV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || UPPER(SUBSTRING(MD5(p_student_id::TEXT || p_workshop_id::TEXT || now()::TEXT) FROM 1 FOR 8));

    INSERT INTO public.certificates (
        certificate_number,
        student_id,
        workshop_id,
        issue_date,
        completion_date,
        status
    ) VALUES (
        v_cert_num,
        p_student_id,
        p_workshop_id,
        CURRENT_DATE,
        CURRENT_DATE,
        'issued'
    ) RETURNING id INTO v_cert_id;

    -- Notify student
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        link_url
    ) VALUES (
        p_student_id,
        'Congratulations! Certificate Issued',
        'Your official certificate for ' || v_workshop.title || ' is now available for download. ID: ' || v_cert_num,
        'success',
        '/student/certificates'
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'certificate_id', v_cert_id,
        'certificate_number', v_cert_num
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- ==============================================================================
-- TNV WORKSHOP LEARNING MANAGEMENT SYSTEM (LMS)
-- 03_SEED_DATA.SQL - Industry-Ready Workspaces, Courses, Modules, Sessions, Exams
-- ==============================================================================

-- 1. ADMIN SETTINGS
INSERT INTO public.admin_settings (key, value, description)
VALUES 
    ('whatsapp_group_url', '"https://chat.whatsapp.com/TNVWorkshop2024DevCommunity"', 'Official TNV Workshop community WhatsApp channel for doubts and updates'),
    ('support_email', '"support@tnvworkshop.edu.in"', 'Official student support email address'),
    ('support_phone', '"+91 98765 43210"', 'Direct academic helpline number'),
    ('payment_upi_id', '"tnvworkshop@okhdfcbank"', 'Primary UPI ID for manual payment transactions'),
    ('payment_qr_code_url', '"https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=500&auto=format&fit=crop&q=60"', 'QR code image for student manual payment upload')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. SEED WORKSHOPS
INSERT INTO public.workshops (
    id,
    title,
    slug,
    short_description,
    description,
    thumbnail_url,
    duration,
    instructor_name,
    instructor_title,
    instructor_bio,
    total_seats,
    available_seats,
    price,
    is_active,
    start_date,
    end_date
) VALUES 
(
    'a0000000-0000-0000-0000-000000000001',
    'Full-Stack Cloud & AI Engineering',
    'full-stack-cloud-ai-engineering',
    'Master modern React, TypeScript, Supabase, PostgreSQL, and Gemini AI integration to build enterprise-grade cloud applications.',
    'This intensive 6-week hands-on workshop takes students through the complete modern full-stack development cycle. You will learn frontend mastery with React, Vite, and Tailwind, secure relational database modeling with PostgreSQL and Supabase, robust Role-Based Access Control, edge computing, AI orchestration, and production deployment on Vercel.',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
    '6 Weeks (36 Hours)',
    'Thamilaran',
    'Chief Architect & Senior Software Engineer',
    'Over 18 years of experience leading engineering teams at top-tier software organizations. Specialized in scalable distributed systems and cloud-native architectures.',
    120,
    38,
    4999.00,
    TRUE,
    CURRENT_DATE + INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '47 days'
),
(
    'a0000000-0000-0000-0000-000000000002',
    'Embedded Systems & Edge AI Bootcamp',
    'embedded-systems-edge-ai',
    'Design hardware-software integrated IoT systems with ESP32, FreeRTOS, TinyML, and MQTT cloud pipelines.',
    'Bridging firmware and cloud. Explore microcontroller architecture, real-time operating systems, sensor fusion, wireless communication protocols, and deploy lightweight neural networks on edge silicon.',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    '4 Weeks (24 Hours)',
    'Prof. Rajesh K. Sharma',
    'Principal IoT Systems Researcher',
    'Former Senior Firmware Architect with multiple patents in low-power industrial telemetry and sensor networks.',
    80,
    15,
    3999.00,
    TRUE,
    CURRENT_DATE + INTERVAL '12 days',
    CURRENT_DATE + INTERVAL '40 days'
),
(
    'a0000000-0000-0000-0000-000000000003',
    'Cybersecurity & DevSecOps Mastery',
    'cybersecurity-devsecops-mastery',
    'From vulnerability research and OWASP Top 10 mitigation to zero-trust architecture and automated CI/CD security scanning.',
    'Understand red and blue team methodologies. Perform web penetration testing, network traffic analysis, container hardening, secrets management, and automated SAST/DAST pipelines.',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
    '5 Weeks (30 Hours)',
    'Arunachalam V.',
    'Lead Security Architect & Ethical Hacker',
    'Certified Information Systems Security Professional (CISSP) and active security researcher with bug bounties from global Fortune 500 tech companies.',
    100,
    44,
    4499.00,
    TRUE,
    CURRENT_DATE + INTERVAL '20 days',
    CURRENT_DATE + INTERVAL '55 days'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    price = EXCLUDED.price;

-- 3. SEED COURSES
INSERT INTO public.courses (
    id,
    workshop_id,
    title,
    slug,
    description,
    instructor_name,
    duration,
    order_index,
    is_published
) VALUES 
(
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Full-Stack Architecture & Cloud Database Engineering',
    'fullstack-architecture-cloud-database',
    'Core architecture, database normalization, Row Level Security, and high-performance React frontends.',
    'Thamilaran',
    '36 Hours',
    1,
    TRUE
),
(
    'b0000000-0000-0000-0000-000000000002',
    'Microcontroller Firmware & Embedded RTOS',
    'microcontroller-firmware-rtos',
    'Hardware abstraction, FreeRTOS scheduling, interrupts, and peripherals.',
    'Prof. Rajesh K. Sharma',
    '24 Hours',
    1,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 4. SEED MODULES
INSERT INTO public.modules (
    id,
    course_id,
    title,
    description,
    order_index,
    is_published
) VALUES 
(
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Module 1: Modern Software Architecture & React 18 Foundations',
    'Component design patterns, state management with React Query, and TypeScript type safety.',
    1,
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000002',
    'Module 2: Relational Schema Design & Supabase PostgreSQL Deep Dive',
    'Database normalization, indexes, triggers, stored procedures, and Row Level Security (RLS) enforcement.',
    2,
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000003',
    'Module 3: Authentication, RBAC & Cloud Storage Workflows',
    'JWT token lifecycles, session persistence, role-based routing, and secure bucket storage for media.',
    3,
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000004',
    'Module 4: Enterprise Capstone Project & Production Deployment',
    'Building, testing, edge caching, CI/CD pipeline automation, and multi-tenant security.',
    4,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED SESSIONS
INSERT INTO public.sessions (
    id,
    module_id,
    title,
    description,
    session_type,
    order_index,
    duration_minutes,
    is_published
) VALUES 
(
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Session 1.1: System Architecture & Modern Tooling Setup',
    'Architectural overview of modern single-page applications, Vite bundler internals, and TypeScript configs.',
    'lecture',
    1,
    45,
    TRUE
),
(
    'd0000000-0000-0000-0000-000000000002',
    'Session 1.2: Advanced React Patterns & Hook Composition',
    'Custom hooks, optimistic UI updates, and server-cache synchronization with React Query.',
    'lecture',
    2,
    50,
    TRUE
),
(
    'd0000000-0000-0000-0000-000000000003',
    'Session 2.1: PostgreSQL Relational Modeling & Schema Normalization',
    'Designing 3NF entities, foreign keys, cascades, composite keys, and indexing strategies.',
    'lecture',
    1,
    60,
    TRUE
),
(
    'd0000000-0000-0000-0000-000000000004',
    'Session 2.2: Row Level Security (RLS) & Stored Functions',
    'Crafting robust RLS policies, tenant isolation, and writing secure PL/pgSQL procedures.',
    'lecture',
    2,
    55,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 6. SEED VIDEO LECTURES (Google Drive links)
INSERT INTO public.video_lectures (
    id,
    session_id,
    title,
    description,
    drive_url,
    drive_file_id,
    duration_minutes,
    is_available
) VALUES 
(
    'e0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'System Architecture & Modern Tooling Masterclass',
    'Watch the full recorded session explaining modern decoupled architectures, bundlers, and developer workflows.',
    'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview',
    '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    45,
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000002',
    'React Query & Server-State Synchronization In-Depth',
    'Hands-on coding session demonstrating optimistic updates, caching strategies, and pagination.',
    'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview',
    '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    50,
    TRUE
),
(
    'e0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000003',
    'PostgreSQL Schema Engineering & Performance Tuning',
    'Practical walkthrough of indexing, query plans (EXPLAIN ANALYZE), and database constraints.',
    'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview',
    '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs',
    60,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 7. SEED LEARNING MATERIALS
INSERT INTO public.learning_materials (
    id,
    session_id,
    module_id,
    course_id,
    title,
    description,
    file_url,
    file_type,
    file_size_bytes,
    external_link,
    is_downloadable
) VALUES 
(
    'f0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Session 1.1 Complete Architecture Handout & Blueprint',
    'Detailed PDF lecture notes covering microservices, monorepos, and bundle optimization.',
    'https://raw.githubusercontent.com/shadcn-ui/ui/main/README.md',
    'pdf',
    2450000,
    'https://react.dev',
    TRUE
),
(
    'f0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'PostgreSQL & Supabase Security Cheatsheet',
    'Essential SQL syntax for RLS policies, role delegation, and index types.',
    'https://supabase.com/docs',
    'pdf',
    1820000,
    'https://supabase.com/docs/guides/database/postgres/row-level-security',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 8. SEED ASSIGNMENTS
INSERT INTO public.assignments (
    id,
    course_id,
    module_id,
    session_id,
    title,
    description,
    instructions,
    assignment_type,
    max_marks,
    passing_marks,
    due_date,
    is_published
) VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    'Assignment 1: Build a Reusable Data Table Component with TypeScript',
    'Construct a generic data table supporting sorting, filtering, and pagination without third-party heavy dependencies.',
    'Submit either your GitHub link or paste your core React hook implementation and unit tests.',
    'text_or_file',
    100,
    50,
    now() + INTERVAL '14 days',
    TRUE
),
(
    '10000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000004',
    'Assignment 2: Multi-Tenant RLS Policy Implementation',
    'Design and write SQL policies ensuring organization isolation for a multi-tenant SaaS workspace.',
    'Write the SQL migration containing tables: organizations, memberships, and projects, along with SELECT, INSERT, UPDATE RLS policies.',
    'text_or_file',
    100,
    60,
    now() + INTERVAL '21 days',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 9. SEED QUIZZES & QUESTIONS
INSERT INTO public.quizzes (
    id,
    course_id,
    module_id,
    title,
    description,
    time_limit_minutes,
    passing_percentage,
    is_published
) VALUES 
(
    '20000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Module 1 Assessment: React Internals & Modern Web Architecture',
    'Test your understanding of reconciliation, useEffect dependencies, and TypeScript generics.',
    20,
    60,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quiz_questions (
    quiz_id,
    question_text,
    options,
    correct_option_index,
    explanation,
    marks,
    order_index
) VALUES 
(
    '20000000-0000-0000-0000-000000000001',
    'What is the primary benefit of React Query / TanStack Query over basic useEffect data fetching?',
    '["It automatically generates CSS styles", "It provides automated caching, deduplication, background re-validation, and optimistic updates", "It compiles JavaScript to WebAssembly", "It disables all asynchronous requests"]'::jsonb,
    1,
    'TanStack Query acts as an asynchronous state manager that handles caching, cache invalidation, and server-state synchronization seamlessly.',
    10,
    1
),
(
    '20000000-0000-0000-0000-000000000001',
    'In PostgreSQL, which command enables Row Level Security on a target table?',
    '["ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;", "CREATE RLS ON table_name;", "SET SECURITY POLICY TRUE;", "SECURE TABLE table_name;"]'::jsonb,
    0,
    'PostgreSQL requires explicit ALTER TABLE tbl ENABLE ROW LEVEL SECURITY before policies take effect for unprivileged roles.',
    10,
    2
)
ON CONFLICT DO NOTHING;

-- 10. SEED PROJECTS
INSERT INTO public.projects (
    id,
    course_id,
    title,
    description,
    requirements,
    submission_deadline,
    max_marks,
    passing_marks,
    is_published
) VALUES 
(
    '30000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'Capstone: Production Full-Stack Cloud Application',
    'Build and deploy a scalable, multi-role web platform featuring authentication, real-time messaging, file uploads, and admin dashboards.',
    '1. Validated authentication and profile onboarding. 2. Role-based dashboards (Student & Admin). 3. Secure file uploads to storage bucket. 4. Deployed live on Vercel with public URL. 5. Clean GitHub repository with README and architecture diagram.',
    now() + INTERVAL '30 days',
    100,
    60,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 11. SEED EXAMINATIONS & QUESTIONS
INSERT INTO public.examinations (
    id,
    course_id,
    title,
    description,
    instructions,
    duration_minutes,
    total_marks,
    passing_marks,
    is_published
) VALUES 
(
    '40000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'TNV Certified Full-Stack Cloud Architect - Comprehensive Examination',
    'Official proctored qualification exam assessing database design, security architecture, and system scalability.',
    'Timer starts as soon as you click Start. Answers are auto-saved. Multiple tabs or switching windows will be flagged. Passing score is 50%.',
    45,
    50,
    25,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.exam_questions (
    exam_id,
    question_text,
    options,
    correct_option_index,
    marks,
    order_index
) VALUES 
(
    '40000000-0000-0000-0000-000000000001',
    'Which HTTP header is essential for mitigating Cross-Site Scripting (XSS) attacks in modern web applications?',
    '["Access-Control-Allow-Origin", "Content-Security-Policy (CSP)", "X-Forwarded-For", "Cache-Control"]'::jsonb,
    1,
    10,
    1
),
(
    '40000000-0000-0000-0000-000000000001',
    'What does the PostgreSQL EXPLAIN ANALYZE command do?',
    '["Formats the SQL query into standard lowercase", "Executes the query and outputs the actual execution time, plan, and buffer usage", "Rolls back all uncommitted transactions", "Deletes index records"]'::jsonb,
    1,
    10,
    2
),
(
    '40000000-0000-0000-0000-000000000001',
    'Why is it a security vulnerability to expose the Supabase service_role key in frontend source code?',
    '["It slows down page rendering", "It completely bypasses all Row Level Security (RLS) policies giving full superuser database access", "It invalidates TLS certificates", "It limits the maximum number of connections"]'::jsonb,
    1,
    10,
    3
),
(
    '40000000-0000-0000-0000-000000000001',
    'In a relational database, what does a foreign key with ON DELETE CASCADE signify?',
    '["Child rows are preserved when the referenced parent row is deleted", "Referenced child rows are automatically deleted when the parent row is deleted", "The table is dropped on error", "The database prevents deleting any row forever"]'::jsonb,
    1,
    10,
    4
),
(
    '40000000-0000-0000-0000-000000000001',
    'Which React hook is specifically designed to memoize expensive computations between renders?',
    '["useCallback", "useMemo", "useRef", "useLayoutEffect"]'::jsonb,
    1,
    10,
    5
)
ON CONFLICT DO NOTHING;

-- 12. SEED LIVE SESSIONS
INSERT INTO public.live_sessions (
    id,
    course_id,
    module_id,
    title,
    description,
    scheduled_date,
    start_time,
    end_time,
    meeting_link,
    platform,
    instructor_name,
    is_published
) VALUES 
(
    '50000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Live Orientation & Architectural Framework Blueprinting',
    'Interactive session introducing the curriculum, development environment, and project deliverables.',
    CURRENT_DATE + INTERVAL '2 days',
    '18:00:00',
    '19:30:00',
    'https://meet.google.com/tnv-work-live',
    'Google Meet',
    'Thamilaran',
    TRUE
),
(
    '50000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'Live Q&A and PostgreSQL Performance Workshop',
    'Live query optimization, database tuning, and doubt resolution for Module 2.',
    CURRENT_DATE + INTERVAL '9 days',
    '19:00:00',
    '20:30:00',
    'https://meet.google.com/tnv-work-live',
    'Google Meet',
    'Thamilaran',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 13. SEED CERTIFICATE TEMPLATES
INSERT INTO public.certificate_templates (
    id,
    workshop_id,
    template_name,
    signatory_name,
    signatory_title,
    badge_title,
    min_course_progress_percentage,
    require_all_assignments,
    require_project_approval,
    min_exam_percentage,
    is_active
) VALUES 
(
    '60000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'TNV Workshop Professional Certification Template',
    'Thamilaran',
    'Program Director & Chief Architect, TNV Workshop',
    'Certificate of Industry Excellence',
    75.00,
    TRUE,
    TRUE,
    50.00,
    TRUE
)
ON CONFLICT (id) DO NOTHING;


-- ======================================================================
-- ==============================================================================
-- 20240101000004_phase2b_security_tightening.sql
-- TNV Workshop LMS - Phase 2B Security & Privacy Hardening Migration
-- ==============================================================================

-- 1. ASSIGNMENT SUBMISSIONS: PREVENT STUDENTS FROM ALTERING EVALUATION FIELDS
DROP POLICY IF EXISTS "Students can update draft; Admins evaluate" ON public.assignment_submissions;

CREATE POLICY "Students can update draft assignment submissions"
    ON public.assignment_submissions FOR UPDATE
    USING (student_id = auth.uid())
    WITH CHECK (
        student_id = auth.uid()
        AND marks_obtained IS NULL
        AND evaluated_at IS NULL
        AND evaluated_by IS NULL
        AND status IN ('submitted', 'resubmission_requested')
    );

CREATE POLICY "Admins can evaluate assignment submissions"
    ON public.assignment_submissions FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. PROJECT SUBMISSIONS: PREVENT STUDENTS FROM ALTERING SCORES AND APPROVAL STATUS
DROP POLICY IF EXISTS "Admins review project submissions" ON public.project_submissions;

CREATE POLICY "Students can update draft project submissions"
    ON public.project_submissions FOR UPDATE
    USING (student_id = auth.uid())
    WITH CHECK (
        student_id = auth.uid()
        AND score IS NULL
        AND evaluated_at IS NULL
        AND evaluated_by IS NULL
        AND status IN ('submitted', 'changes_requested')
    );

CREATE POLICY "Admins can evaluate project submissions"
    ON public.project_submissions FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. EXAM ATTEMPTS: PREVENT DIRECT STUDENT MANIPULATION OF EXAM SCORES
DROP POLICY IF EXISTS "Students can update active attempt" ON public.exam_attempts;

CREATE POLICY "Students cannot alter submitted exam attempts"
    ON public.exam_attempts FOR UPDATE
    USING (student_id = auth.uid())
    WITH CHECK (
        student_id = auth.uid()
        AND score IS NULL
        AND is_passed IS NULL
        AND status = 'in_progress'
    );

CREATE POLICY "Admins can manage exam attempts"
    ON public.exam_attempts FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. QUIZ ATTEMPTS: PREVENT DIRECT STUDENT MANIPULATION OF QUIZ SCORES
DROP POLICY IF EXISTS "Students can start and update quiz attempts" ON public.quiz_attempts;

CREATE POLICY "Students can start quiz attempts"
    ON public.quiz_attempts FOR INSERT
    WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update active quiz attempt"
    ON public.quiz_attempts FOR UPDATE
    USING (student_id = auth.uid())
    WITH CHECK (
        student_id = auth.uid()
        AND score = 0
        AND percentage = 0.00
        AND is_passed = FALSE
    );

CREATE POLICY "Admins manage quiz attempts"
    ON public.quiz_attempts FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. PUBLIC CERTIFICATE VERIFICATION: SECURE NON-PII LOOKUP FUNCTION
CREATE OR REPLACE FUNCTION public.verify_certificate_public(
    p_certificate_number TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'certificate_number', c.certificate_number,
        'student_name', p.full_name,
        'workshop_title', w.title,
        'course_title', co.title,
        'issue_date', c.issue_date,
        'completion_date', c.completion_date,
        'status', c.status,
        'is_valid', (c.status = 'issued'),
        'revoked_reason', CASE WHEN c.status = 'revoked' THEN c.revoked_reason ELSE NULL END
    ) INTO v_result
    FROM public.certificates c
    JOIN public.profiles p ON p.id = c.student_id
    JOIN public.workshops w ON w.id = c.workshop_id
    LEFT JOIN public.courses co ON co.id = c.course_id
    WHERE c.certificate_number = p_certificate_number;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.verify_certificate_public(TEXT) TO anon, authenticated;

-- 6. SECURE STUDENT QUESTION RETRIEVAL (STRIPS CORRECT ANSWERS)
CREATE OR REPLACE FUNCTION public.get_student_quiz_questions(
    p_quiz_id UUID
)
RETURNS TABLE (
    id UUID,
    quiz_id UUID,
    question_text TEXT,
    options JSONB,
    marks INT,
    order_index INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.quiz_id,
        q.question_text,
        q.options,
        q.marks,
        q.order_index
    FROM public.quiz_questions q
    WHERE q.quiz_id = p_quiz_id
    ORDER BY q.order_index ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_student_quiz_questions(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_student_exam_questions(
    p_exam_id UUID
)
RETURNS TABLE (
    id UUID,
    exam_id UUID,
    question_text TEXT,
    options JSONB,
    marks INT,
    order_index INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.exam_id,
        e.question_text,
        e.options,
        e.marks,
        e.order_index
    FROM public.exam_questions e
    WHERE e.exam_id = p_exam_id
    ORDER BY e.order_index ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_student_exam_questions(UUID) TO authenticated;


-- ==============================================================================
-- TNV WORKSHOP — PHASE 3: ADMIN OWNERSHIP, COURSE CREATION & ENROLLMENT WORKFLOW
-- Migration: 20240101000005_admin_course_workflow.sql
-- ==============================================================================

-- 1. COURSES TABLE ENHANCEMENTS (Ownership, Status, Metadata)
ALTER TABLE public.courses
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'all_levels',
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Allow courses to exist independently or linked to workshops
ALTER TABLE public.courses ALTER COLUMN workshop_id DROP NOT NULL;
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS unique_course_slug_per_workshop;
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);

-- 2. WORKSHOPS TABLE ENHANCEMENTS
ALTER TABLE public.workshops
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';

-- 3. COURSE ENROLLMENTS TABLE ENHANCEMENTS
ALTER TABLE public.course_enrollments
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 4. CERTIFICATES TABLE ENHANCEMENTS
ALTER TABLE public.certificates
    ADD COLUMN IF NOT EXISTS issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.certificates ALTER COLUMN workshop_id DROP NOT NULL;
ALTER TABLE public.certificates DROP CONSTRAINT IF EXISTS unique_student_workshop_certificate;
CREATE UNIQUE INDEX IF NOT EXISTS unique_student_course_certificate
    ON public.certificates(student_id, course_id) WHERE course_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS unique_student_workshop_certificate
    ON public.certificates(student_id, workshop_id) WHERE workshop_id IS NOT NULL;

-- 5. SESSIONS & LEARNING MATERIALS GOOGLE DRIVE INTEGRATION
ALTER TABLE public.sessions
    ADD COLUMN IF NOT EXISTS drive_folder_url TEXT,
    ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;

ALTER TABLE public.learning_materials
    ADD COLUMN IF NOT EXISTS drive_file_id TEXT,
    ADD COLUMN IF NOT EXISTS drive_url TEXT;

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON public.courses(created_by);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status, is_published);
CREATE INDEX IF NOT EXISTS idx_workshops_created_by ON public.workshops(created_by);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON public.course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student_course ON public.certificates(student_id, course_id);

-- 7. REVISE has_approved_course_access TO RECOGNIZE DIRECT COURSE ENROLLMENTS
CREATE OR REPLACE FUNCTION public.has_approved_course_access(p_course_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_workshop_id UUID;
BEGIN
    -- Super admins and admins have global access
    IF public.is_admin() THEN
        RETURN TRUE;
    END IF;

    -- Check direct course enrollment
    IF EXISTS (
        SELECT 1 FROM public.course_enrollments
        WHERE course_id = p_course_id
          AND student_id = auth.uid()
          AND (status = 'active' OR status = 'completed')
    ) THEN
        RETURN TRUE;
    END IF;

    -- Check workshop-based enrollment if course is linked to a workshop
    SELECT workshop_id INTO v_workshop_id
    FROM public.courses
    WHERE id = p_course_id;

    IF v_workshop_id IS NOT NULL THEN
        RETURN public.has_approved_workshop_access(v_workshop_id);
    END IF;

    RETURN FALSE;
END;
$$;

-- 8. COURSE-SPECIFIC CERTIFICATE ELIGIBILITY FUNCTION
CREATE OR REPLACE FUNCTION public.check_course_certificate_eligibility(
    p_student_id UUID,
    p_course_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_enrollment public.course_enrollments%ROWTYPE;
    v_total_sessions INT := 0;
    v_completed_sessions INT := 0;
    v_progress_pct NUMERIC(5, 2) := 0.00;
    v_total_assignments INT := 0;
    v_submitted_assignments INT := 0;
    v_assignments_ok BOOLEAN := TRUE;
    v_total_exams INT := 0;
    v_passed_exams INT := 0;
    v_exams_ok BOOLEAN := TRUE;
    v_is_eligible BOOLEAN := FALSE;
    v_existing_cert public.certificates%ROWTYPE;
BEGIN
    -- Check course enrollment
    SELECT * INTO v_enrollment
    FROM public.course_enrollments
    WHERE student_id = p_student_id AND course_id = p_course_id;

    IF NOT FOUND OR v_enrollment.status NOT IN ('active', 'completed') THEN
        RETURN jsonb_build_object(
            'is_eligible', FALSE,
            'reason', 'Student is not actively enrolled in this course.'
        );
    END IF;

    -- Check if certificate already exists for this course
    SELECT * INTO v_existing_cert
    FROM public.certificates
    WHERE student_id = p_student_id AND course_id = p_course_id;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'is_eligible', TRUE,
            'already_issued', TRUE,
            'certificate_number', v_existing_cert.certificate_number,
            'issue_date', v_existing_cert.issue_date,
            'status', v_existing_cert.status
        );
    END IF;

    -- Count total published sessions in this course
    SELECT COUNT(s.id) INTO v_total_sessions
    FROM public.sessions s
    JOIN public.modules m ON m.id = s.module_id
    WHERE m.course_id = p_course_id AND s.is_published = TRUE;

    IF v_total_sessions > 0 THEN
        SELECT COUNT(sp.id) INTO v_completed_sessions
        FROM public.session_progress sp
        JOIN public.sessions s ON s.id = sp.session_id
        JOIN public.modules m ON m.id = s.module_id
        WHERE m.course_id = p_course_id
          AND sp.student_id = p_student_id
          AND sp.is_completed = TRUE;

        v_progress_pct := ROUND((v_completed_sessions::NUMERIC / v_total_sessions::NUMERIC) * 100.0, 2);
    ELSE
        v_progress_pct := 100.00;
    END IF;

    -- Check assignments for this course
    SELECT COUNT(a.id) INTO v_total_assignments
    FROM public.assignments a
    WHERE a.course_id = p_course_id AND a.is_published = TRUE;

    IF v_total_assignments > 0 THEN
        SELECT COUNT(asub.id) INTO v_submitted_assignments
        FROM public.assignment_submissions asub
        JOIN public.assignments a ON a.id = asub.assignment_id
        WHERE a.course_id = p_course_id
          AND asub.student_id = p_student_id
          AND asub.status IN ('submitted', 'evaluated', 'under_review');

        IF v_submitted_assignments < v_total_assignments THEN
            v_assignments_ok := FALSE;
        END IF;
    END IF;

    -- Check examinations for this course
    SELECT COUNT(e.id) INTO v_total_exams
    FROM public.examinations e
    WHERE e.course_id = p_course_id AND e.is_published = TRUE;

    IF v_total_exams > 0 THEN
        SELECT COUNT(ea.id) INTO v_passed_exams
        FROM public.exam_attempts ea
        JOIN public.examinations e ON e.id = ea.exam_id
        WHERE e.course_id = p_course_id
          AND ea.student_id = p_student_id
          AND ea.is_passed = TRUE;

        IF v_passed_exams < v_total_exams THEN
            v_exams_ok := FALSE;
        END IF;
    END IF;

    -- Criteria: >= 75% sessions completed, all assignments submitted, all exams passed
    v_is_eligible := (v_progress_pct >= 75.00) AND v_assignments_ok AND v_exams_ok;

    RETURN jsonb_build_object(
        'is_eligible', v_is_eligible,
        'already_issued', FALSE,
        'progress_percentage', v_progress_pct,
        'total_sessions', v_total_sessions,
        'completed_sessions', v_completed_sessions,
        'total_assignments', v_total_assignments,
        'submitted_assignments', v_submitted_assignments,
        'assignments_satisfied', v_assignments_ok,
        'total_exams', v_total_exams,
        'passed_exams', v_passed_exams,
        'exams_satisfied', v_exams_ok
    );
END;
$$;

-- 9. ISSUE COURSE CERTIFICATE STORED PROCEDURE
CREATE OR REPLACE FUNCTION public.issue_course_certificate(
    p_student_id UUID,
    p_course_id UUID,
    p_issued_by UUID DEFAULT auth.uid()
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_course public.courses%ROWTYPE;
    v_student public.profiles%ROWTYPE;
    v_eligibility JSONB;
    v_cert_number TEXT;
    v_cert_id UUID;
    v_existing public.certificates%ROWTYPE;
BEGIN
    -- Authorization: must be admin
    IF NOT public.is_admin() THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Unauthorized. Admin credentials required.');
    END IF;

    -- Get Course
    SELECT * INTO v_course FROM public.courses WHERE id = p_course_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Course not found.');
    END IF;

    -- Admin ownership check: must own course or be super admin
    IF NOT public.is_super_admin() AND v_course.created_by IS NOT NULL AND v_course.created_by <> auth.uid() THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Forbidden. You do not own this course.');
    END IF;

    -- Get Student
    SELECT * INTO v_student FROM public.profiles WHERE id = p_student_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Student not found.');
    END IF;

    -- Check if already issued
    SELECT * INTO v_existing FROM public.certificates
    WHERE student_id = p_student_id AND course_id = p_course_id;
    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'certificate_number', v_existing.certificate_number,
            'message', 'Certificate was already issued.'
        );
    END IF;

    -- Generate unique certificate number
    v_cert_number := 'TNV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-C' || UPPER(SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 6));

    -- Insert into certificates
    INSERT INTO public.certificates (
        certificate_number,
        student_id,
        workshop_id,
        course_id,
        issue_date,
        completion_date,
        status,
        issued_by
    ) VALUES (
        v_cert_number,
        p_student_id,
        v_course.workshop_id,
        p_course_id,
        CURRENT_DATE,
        CURRENT_DATE,
        'issued',
        p_issued_by
    ) RETURNING id INTO v_cert_id;

    -- Update course enrollment is_completed = true
    UPDATE public.course_enrollments
    SET is_completed = TRUE, completed_at = timezone('utc'::text, now())
    WHERE student_id = p_student_id AND course_id = p_course_id;

    -- Trigger notification to student
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        link_url
    ) VALUES (
        p_student_id,
        'Certificate Issued: ' || v_course.title,
        'Congratulations! Your verified Certificate of Completion (' || v_cert_number || ') has been approved and issued.',
        'success',
        '/student/certificates'
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'certificate_id', v_cert_id,
        'certificate_number', v_cert_number
    );
END;
$$;

-- 10. REVISE RLS POLICIES FOR ADMIN ISOLATION AND MULTI-COURSE ENROLLMENT

-- COURSES POLICIES
DROP POLICY IF EXISTS "Courses viewable by approved students or admins" ON public.courses;
DROP POLICY IF EXISTS "Admins have full control over courses" ON public.courses;
DROP POLICY IF EXISTS "Courses select policy" ON public.courses;
DROP POLICY IF EXISTS "Admins insert own courses" ON public.courses;
DROP POLICY IF EXISTS "Admins update own courses" ON public.courses;
DROP POLICY IF EXISTS "Admins delete own courses" ON public.courses;

CREATE POLICY "Courses select policy"
    ON public.courses FOR SELECT
    USING (
        public.is_super_admin()
        OR (public.is_admin() AND (created_by = auth.uid() OR created_by IS NULL))
        OR (is_published = TRUE AND (status = 'published' OR status IS NULL))
    );

CREATE POLICY "Admins insert own courses"
    ON public.courses FOR INSERT
    WITH CHECK (
        public.is_admin() AND (created_by = auth.uid() OR created_by IS NULL)
    );

CREATE POLICY "Admins update own courses"
    ON public.courses FOR UPDATE
    USING (
        public.is_super_admin()
        OR (public.is_admin() AND (created_by = auth.uid() OR created_by IS NULL))
    )
    WITH CHECK (
        public.is_super_admin()
        OR (public.is_admin() AND (created_by = auth.uid() OR created_by IS NULL))
    );

CREATE POLICY "Admins delete own courses"
    ON public.courses FOR DELETE
    USING (
        public.is_super_admin()
        OR (public.is_admin() AND (created_by = auth.uid() OR created_by IS NULL))
    );

-- COURSE ENROLLMENTS POLICIES
DROP POLICY IF EXISTS "Students view own course enrollments; Admins view all" ON public.course_enrollments;
DROP POLICY IF EXISTS "Admins manage course enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Course enrollments select policy" ON public.course_enrollments;
DROP POLICY IF EXISTS "Students and admins insert course enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Course enrollments update policy" ON public.course_enrollments;

CREATE POLICY "Course enrollments select policy"
    ON public.course_enrollments FOR SELECT
    USING (
        student_id = auth.uid()
        OR public.is_super_admin()
        OR (public.is_admin() AND EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_enrollments.course_id
              AND (c.created_by = auth.uid() OR c.created_by IS NULL)
        ))
    );

CREATE POLICY "Students and admins insert course enrollments"
    ON public.course_enrollments FOR INSERT
    WITH CHECK (
        -- Students can self-enroll into published courses
        (student_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_enrollments.course_id
              AND c.is_published = TRUE
              AND (c.status = 'published' OR c.status IS NULL)
        ))
        -- Or owning admin / super admin
        OR public.is_super_admin()
        OR (public.is_admin() AND EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_enrollments.course_id
              AND (c.created_by = auth.uid() OR c.created_by IS NULL)
        ))
    );

CREATE POLICY "Course enrollments update policy"
    ON public.course_enrollments FOR UPDATE
    USING (
        student_id = auth.uid()
        OR public.is_super_admin()
        OR (public.is_admin() AND EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_enrollments.course_id
              AND (c.created_by = auth.uid() OR c.created_by IS NULL)
        ))
    )
    WITH CHECK (
        student_id = auth.uid()
        OR public.is_super_admin()
        OR (public.is_admin() AND EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_enrollments.course_id
              AND (c.created_by = auth.uid() OR c.created_by IS NULL)
        ))
    );

-- WORKSHOPS POLICIES (Admin Isolation)
DROP POLICY IF EXISTS "Active workshops are readable by everyone" ON public.workshops;
DROP POLICY IF EXISTS "Admins have full control over workshops" ON public.workshops;
DROP POLICY IF EXISTS "Workshops select policy" ON public.workshops;
DROP POLICY IF EXISTS "Admins insert own workshops" ON public.workshops;
DROP POLICY IF EXISTS "Admins update own workshops" ON public.workshops;
DROP POLICY IF EXISTS "Admins delete own workshops" ON public.workshops;

CREATE POLICY "Workshops select policy"
    ON public.workshops FOR SELECT
    USING (
        public.is_super_admin()
        OR (public.is_admin() AND (created_by = auth.uid() OR created_by IS NULL))
        OR is_active = TRUE
    );

CREATE POLICY "Admins insert own workshops"
    ON public.workshops FOR INSERT
    WITH CHECK (
        public.is_admin() AND (created_by = auth.uid() OR created_by IS NULL)
    );

CREATE POLICY "Admins update own workshops"
    ON public.workshops FOR UPDATE
    USING (
        public.is_super_admin()
        OR (public.is_admin() AND (created_by = auth.uid() OR created_by IS NULL))
    );

CREATE POLICY "Admins delete own workshops"
    ON public.workshops FOR DELETE
    USING (
        public.is_super_admin()
        OR (public.is_admin() AND (created_by = auth.uid() OR created_by IS NULL))
    );

-- 11. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
