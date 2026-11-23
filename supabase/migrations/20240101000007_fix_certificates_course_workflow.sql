-- ==============================================================================
-- TNV WORKSHOP — CERTIFICATES WORKFLOW & COURSE ISSUANCE ENHANCEMENT
-- Migration: 20240101000007_fix_certificates_course_workflow.sql
-- ==============================================================================

-- 1. Ensure workshop_id is nullable for course-specific certificates
ALTER TABLE public.certificates ALTER COLUMN workshop_id DROP NOT NULL;

-- 2. Drop legacy single-workshop constraint and ensure unique constraint per course
ALTER TABLE public.certificates DROP CONSTRAINT IF EXISTS unique_student_workshop_certificate;

CREATE UNIQUE INDEX IF NOT EXISTS unique_student_course_certificate
    ON public.certificates(student_id, course_id)
    WHERE course_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_student_workshop_certificate
    ON public.certificates(student_id, workshop_id)
    WHERE workshop_id IS NOT NULL AND course_id IS NULL;

-- 3. Add overall_score and grade columns if not present
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS overall_score NUMERIC(5, 2) DEFAULT 95.00;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT 'A+';

-- 4. Recreate issue_course_certificate RPC with overall_score support
CREATE OR REPLACE FUNCTION public.issue_course_certificate(
    p_student_id UUID,
    p_course_id UUID,
    p_issued_by UUID DEFAULT auth.uid(),
    p_overall_score NUMERIC DEFAULT 95.00
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_course public.courses%ROWTYPE;
    v_student public.profiles%ROWTYPE;
    v_cert_number TEXT;
    v_cert_id UUID;
    v_existing public.certificates%ROWTYPE;
    v_grade TEXT;
    v_score NUMERIC;
BEGIN
    -- Authorization: must be admin or super_admin
    IF NOT public.is_admin() AND NOT public.is_super_admin() AND NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
    ) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Unauthorized. Admin credentials required.');
    END IF;

    -- Get Course
    SELECT * INTO v_course FROM public.courses WHERE id = p_course_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Course not found.');
    END IF;

    -- Get Student
    SELECT * INTO v_student FROM public.profiles WHERE id = p_student_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Student not found.');
    END IF;

    -- Calculate grade from score
    v_score := COALESCE(p_overall_score, 95.00);
    IF v_score >= 90.00 THEN
        v_grade := 'A+';
    ELSIF v_score >= 80.00 THEN
        v_grade := 'A';
    ELSIF v_score >= 70.00 THEN
        v_grade := 'B+';
    ELSE
        v_grade := 'B';
    END IF;

    -- Check if certificate already exists
    SELECT * INTO v_existing FROM public.certificates
    WHERE student_id = p_student_id AND course_id = p_course_id;

    IF FOUND THEN
        -- Update existing certificate with any revised score/status
        UPDATE public.certificates
        SET status = 'issued',
            overall_score = v_score,
            grade = v_grade
        WHERE id = v_existing.id;

        -- Ensure course enrollment is marked completed
        UPDATE public.course_enrollments
        SET is_completed = TRUE,
            progress_percentage = 100.00,
            completed_at = COALESCE(completed_at, timezone('utc'::text, now()))
        WHERE student_id = p_student_id AND course_id = p_course_id;

        RETURN jsonb_build_object(
            'success', TRUE,
            'certificate_id', v_existing.id,
            'certificate_number', v_existing.certificate_number,
            'issue_date', v_existing.issue_date,
            'overall_score', v_score,
            'grade', v_grade,
            'message', 'Certificate was already active and verified.'
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
        issued_by,
        overall_score,
        grade
    ) VALUES (
        v_cert_number,
        p_student_id,
        v_course.workshop_id,
        p_course_id,
        CURRENT_DATE,
        CURRENT_DATE,
        'issued',
        COALESCE(p_issued_by, auth.uid()),
        v_score,
        v_grade
    ) RETURNING id INTO v_cert_id;

    -- Update course enrollment is_completed = true & 100%
    UPDATE public.course_enrollments
    SET is_completed = TRUE,
        progress_percentage = 100.00,
        completed_at = timezone('utc'::text, now())
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
        'Congratulations! Your verified Certificate of Completion (' || v_cert_number || ') has been approved and issued with an overall score of ' || v_score::TEXT || '%.',
        'success',
        '/student/certificates'
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'certificate_id', v_cert_id,
        'certificate_number', v_cert_number,
        'issue_date', CURRENT_DATE,
        'overall_score', v_score,
        'grade', v_grade
    );
END;
$$;

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.issue_course_certificate(UUID, UUID, UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.issue_course_certificate(UUID, UUID, UUID, NUMERIC) TO anon;
GRANT EXECUTE ON FUNCTION public.issue_course_certificate(UUID, UUID, UUID, NUMERIC) TO service_role;

-- 6. Ensure RLS on certificates allows full select and admin insert/update
DROP POLICY IF EXISTS "Certificates select policy" ON public.certificates;
DROP POLICY IF EXISTS "Certificates viewable by everyone for verification" ON public.certificates;

CREATE POLICY "Certificates select policy"
    ON public.certificates FOR SELECT
    USING (TRUE);

DROP POLICY IF EXISTS "Admins manage certificates" ON public.certificates;
CREATE POLICY "Admins manage certificates"
    ON public.certificates FOR ALL
    TO authenticated
    USING (
        public.is_admin()
        OR public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
        )
    )
    WITH CHECK (
        public.is_admin()
        OR public.is_super_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
        )
    );
