-- ==============================================================================
-- TNV WORKSHOP — FIX ADMIN DRAFT COURSES SELECT RLS & MODULE/SESSION COUNTS
-- Migration: 20240101000006_fix_admin_draft_courses_rls.sql
-- ==============================================================================

-- 1. COURSES SELECT POLICY: Allow admins and super_admins to view all courses
-- (both draft and published, regardless of created_by), and students/public view published courses.
DROP POLICY IF EXISTS "Admins read all courses including drafts" ON public.courses;
DROP POLICY IF EXISTS "Courses select policy" ON public.courses;
DROP POLICY IF EXISTS "Courses viewable by approved students or admins" ON public.courses;

CREATE POLICY "Courses select policy"
    ON public.courses FOR SELECT
    USING (
        -- Admins and Super Admins can see all courses (including drafts)
        public.is_super_admin()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
        )
        -- Published courses are readable by students and public
        OR (
            is_published = TRUE
            AND (status = 'published' OR status = 'active' OR status IS NULL)
        )
    );

-- 2. COURSES WRITE POLICY: Ensure admins have full control over course records
DROP POLICY IF EXISTS "Admins manage all courses" ON public.courses;
CREATE POLICY "Admins manage all courses"
    ON public.courses FOR ALL
    TO authenticated
    USING (
        public.is_super_admin()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
        )
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
        )
    );

-- 3. MODULES SELECT POLICY: Allow admins to view all modules and count them
DROP POLICY IF EXISTS "Modules select policy" ON public.modules;
DROP POLICY IF EXISTS "Modules viewable by approved students or admins" ON public.modules;

CREATE POLICY "Modules select policy"
    ON public.modules FOR SELECT
    USING (
        public.is_super_admin()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
        )
        OR is_published = TRUE
        OR EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = modules.course_id
              AND (c.is_published = TRUE OR c.status = 'published')
        )
    );

-- 4. SESSIONS SELECT POLICY: Allow admins to view all sessions and count them
DROP POLICY IF EXISTS "Sessions select policy" ON public.sessions;
DROP POLICY IF EXISTS "Sessions viewable by approved students or admins" ON public.sessions;

CREATE POLICY "Sessions select policy"
    ON public.sessions FOR SELECT
    USING (
        public.is_super_admin()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
        )
        OR is_published = TRUE
        OR EXISTS (
            SELECT 1 FROM public.modules m
            JOIN public.courses c ON c.id = m.course_id
            WHERE m.id = sessions.module_id
              AND (c.is_published = TRUE OR c.status = 'published')
        )
    );

-- 5. Master Admin Profile Sync
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    college_name,
    department,
    year_of_study,
    phone
)
VALUES (
    'd0a9d721-5698-4b5d-b744-64448476057b',
    'MaterAdmin@gmail.com',
    'Thamilaran (Admin)',
    'super_admin',
    'TNV Workshop Academy',
    'Administration',
    'Faculty',
    '+91 98765 43210'
)
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    full_name = 'Thamilaran (Admin)',
    email = 'MaterAdmin@gmail.com';

UPDATE public.profiles
SET role = 'super_admin', full_name = 'Thamilaran (Admin)'
WHERE LOWER(email) IN ('materadmin@gmail.com', 'masteradmin@gmail.com');

-- 6. LIVE SESSIONS POLICIES: Allow admins to manage, and all users to view published
DROP POLICY IF EXISTS "Live sessions select policy" ON public.live_sessions;
DROP POLICY IF EXISTS "Live sessions viewable by approved students" ON public.live_sessions;
CREATE POLICY "Live sessions select policy"
    ON public.live_sessions FOR SELECT
    USING (
        public.is_super_admin()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
        )
        OR is_published = TRUE
    );

DROP POLICY IF EXISTS "Admins manage live sessions" ON public.live_sessions;
CREATE POLICY "Admins manage live sessions"
    ON public.live_sessions FOR ALL
    TO authenticated
    USING (
        public.is_super_admin()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
        )
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
        )
    );

-- 7. COURSE ENROLLMENTS POLICIES: Allow students to enroll and view own, admins view and manage all
DROP POLICY IF EXISTS "Course enrollments select policy" ON public.course_enrollments;
CREATE POLICY "Course enrollments select policy"
    ON public.course_enrollments FOR SELECT
    USING (
        public.is_super_admin()
        OR public.is_admin()
        OR student_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
        )
    );

DROP POLICY IF EXISTS "Students and admins insert course enrollments" ON public.course_enrollments;
CREATE POLICY "Students and admins insert course enrollments"
    ON public.course_enrollments FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_super_admin()
        OR public.is_admin()
        OR student_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
        )
    );

-- 8. PAYMENTS POLICIES: Allow students to submit and view own, admins view and manage all
DROP POLICY IF EXISTS "Payments select policy" ON public.payments;
CREATE POLICY "Payments select policy"
    ON public.payments FOR SELECT
    USING (
        public.is_super_admin()
        OR public.is_admin()
        OR student_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
        )
    );

DROP POLICY IF EXISTS "Students submit payments" ON public.payments;
CREATE POLICY "Students submit payments"
    ON public.payments FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_super_admin()
        OR public.is_admin()
        OR student_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
        )
    );

DROP POLICY IF EXISTS "Admins manage payments" ON public.payments;
CREATE POLICY "Admins manage payments"
    ON public.payments FOR UPDATE
    TO authenticated
    USING (
        public.is_super_admin()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'super_admin' OR role = 'admin')
        )
    );

-- 9. NOTIFICATIONS POLICIES: Allow users to view and insert notifications
DROP POLICY IF EXISTS "Notifications select policy" ON public.notifications;
CREATE POLICY "Notifications select policy"
    ON public.notifications FOR SELECT
    USING (
        user_id = auth.uid()
        OR public.is_admin()
        OR public.is_super_admin()
    );

DROP POLICY IF EXISTS "Notifications insert policy" ON public.notifications;
CREATE POLICY "Notifications insert policy"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);
