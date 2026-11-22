-- ==============================================================================
-- TNV WORKSHOP — FIX COURSE ENROLLMENT & PUBLISHED COURSES RLS
-- Run this in your Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/hbocacibcgxkufvxhqpb/sql
-- ==============================================================================

-- 1. Ensure course_enrollments has all required columns
ALTER TABLE public.course_enrollments 
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. Drop old/restrictive policies on course_enrollments
DROP POLICY IF EXISTS "Students view own course enrollments; Admins view all" ON public.course_enrollments;
DROP POLICY IF EXISTS "Admins manage course enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Course enrollments select policy" ON public.course_enrollments;
DROP POLICY IF EXISTS "Students and admins insert course enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Course enrollments update policy" ON public.course_enrollments;
DROP POLICY IF EXISTS "Course enrollments delete policy" ON public.course_enrollments;

-- 3. Course Enrollments Policies
-- SELECT: Students view their own enrollments; Admins view all
CREATE POLICY "Course enrollments select policy"
    ON public.course_enrollments FOR SELECT
    USING (
        student_id = auth.uid()
        OR public.is_admin()
    );

-- INSERT: Authenticated students can self-enroll into published courses; Admins can enroll any
CREATE POLICY "Students and admins insert course enrollments"
    ON public.course_enrollments FOR INSERT
    WITH CHECK (
        (student_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.courses c
            WHERE c.id = course_enrollments.course_id
              AND c.is_published = TRUE
        ))
        OR public.is_admin()
    );

-- UPDATE: Students update their own progress; Admins update any
CREATE POLICY "Course enrollments update policy"
    ON public.course_enrollments FOR UPDATE
    USING (
        student_id = auth.uid()
        OR public.is_admin()
    )
    WITH CHECK (
        student_id = auth.uid()
        OR public.is_admin()
    );

-- DELETE: Admins only
CREATE POLICY "Course enrollments delete policy"
    ON public.course_enrollments FOR DELETE
    USING (
        public.is_admin()
    );

-- 4. Fix Courses Select Policy so all published courses are visible to students
DROP POLICY IF EXISTS "Courses viewable by approved students or admins" ON public.courses;
DROP POLICY IF EXISTS "Admins have full control over courses" ON public.courses;
DROP POLICY IF EXISTS "Courses select policy" ON public.courses;

CREATE POLICY "Courses select policy"
    ON public.courses FOR SELECT
    USING (
        is_published = TRUE
        OR public.is_admin()
    );

CREATE POLICY "Admins have full control over courses"
    ON public.courses FOR ALL
    USING (public.is_admin());

-- 5. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
