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
