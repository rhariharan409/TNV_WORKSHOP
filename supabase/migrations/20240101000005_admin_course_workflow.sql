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
