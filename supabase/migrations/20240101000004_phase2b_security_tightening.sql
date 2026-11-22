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
