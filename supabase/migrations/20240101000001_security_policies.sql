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
-- Public can verify by certificate number or student can view own
CREATE POLICY "Certificates viewable by owner or admin"
    ON public.certificates FOR SELECT
    USING (student_id = auth.uid() OR public.is_admin());

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
