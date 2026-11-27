-- Ensure authenticated users (admins, instructors) can insert notifications for students
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Notifications insert policy" ON public.notifications;
DROP POLICY IF EXISTS "Admins and instructors insert notifications" ON public.notifications;

CREATE POLICY "Admins and instructors insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

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
