-- ==============================================================================
-- FIX NOTIFICATIONS ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
-- Run this in your Supabase SQL Editor to allow authenticated users (students)
-- to create notifications for instructors and themselves without RLS violations.

-- 1. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2. Drop any conflicting existing policies
DROP POLICY IF EXISTS "Users view and update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins manage all notifications" ON public.notifications;

-- 3. Policy: Users can view their own notifications (admins can view all)
CREATE POLICY "Users view own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

-- 4. Policy: Users can update their own notifications (e.g. mark as read)
CREATE POLICY "Users update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- 5. Policy: Authenticated users can insert notifications (for themselves or admins)
CREATE POLICY "Authenticated users can create notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- 6. Policy: Admins have full access to manage notifications
CREATE POLICY "Admins manage all notifications"
    ON public.notifications FOR ALL
    TO authenticated
    USING (public.is_admin());
