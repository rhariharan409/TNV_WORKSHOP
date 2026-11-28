-- Migration: Tighten notifications INSERT policy
-- Allows only:
-- 1. Admins and Super Admins (is_admin() OR is_super_admin())
-- 2. Instructors inserting notifications for students enrolled in courses they are assigned to (course_instructors + course_enrollments)
-- Users can still view and update their own notifications.

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Notifications insert policy" ON public.notifications;
DROP POLICY IF EXISTS "Admins and instructors insert notifications" ON public.notifications;

CREATE POLICY "Admins and instructors insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_admin()
        OR public.is_super_admin()
        OR EXISTS (
            SELECT 1
            FROM public.course_instructors ci
            JOIN public.course_enrollments ce ON ce.course_id = ci.course_id
            WHERE ci.instructor_id = auth.uid()
              AND ce.student_id = notifications.user_id
        )
    );

-- Keep select/update policies ensuring users view and update their own notifications
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin() OR public.is_super_admin());

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin() OR public.is_super_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin() OR public.is_super_admin());
