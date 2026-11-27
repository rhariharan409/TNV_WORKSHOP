-- Migration: Add course_assignment_requests table with RLS
CREATE TABLE IF NOT EXISTS public.course_assignment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.course_assignment_requests ENABLE ROW LEVEL SECURITY;

-- 1. Instructor inserts own request
DROP POLICY IF EXISTS "Instructors can insert own course assignment requests" ON public.course_assignment_requests;
CREATE POLICY "Instructors can insert own course assignment requests"
    ON public.course_assignment_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = instructor_id OR public.is_admin() OR public.is_super_admin());

-- 2. Instructor reads own requests, Admins read all
DROP POLICY IF EXISTS "Users can read own course assignment requests or admins read all" ON public.course_assignment_requests;
CREATE POLICY "Users can read own course assignment requests or admins read all"
    ON public.course_assignment_requests FOR SELECT
    TO authenticated
    USING (auth.uid() = instructor_id OR public.is_admin() OR public.is_super_admin());

-- 3. Admins can update requests (Approve / Reject)
DROP POLICY IF EXISTS "Admins can update course assignment requests" ON public.course_assignment_requests;
CREATE POLICY "Admins can update course assignment requests"
    ON public.course_assignment_requests FOR UPDATE
    TO authenticated
    USING (public.is_admin() OR public.is_super_admin())
    WITH CHECK (public.is_admin() OR public.is_super_admin());

-- 4. Admins can delete requests
DROP POLICY IF EXISTS "Admins can delete course assignment requests" ON public.course_assignment_requests;
CREATE POLICY "Admins can delete course assignment requests"
    ON public.course_assignment_requests FOR DELETE
    TO authenticated
    USING (public.is_admin() OR public.is_super_admin());
