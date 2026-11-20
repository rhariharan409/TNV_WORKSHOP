-- ==============================================================================
-- TNV WORKSHOP LEARNING MANAGEMENT SYSTEM (LMS)
-- PROVISION_ADMIN.SQL - Safe Administrator Provisioning Script
-- ==============================================================================
-- SECURITY BEST PRACTICE:
-- Public registration through the web interface strictly assigns the 'student' role.
-- To designate an administrative account, follow one of the two methods below.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- METHOD 1: PROMOTE AN EXISTING REGISTERED USER TO ADMINISTRATOR (RECOMMENDED)
-- ------------------------------------------------------------------------------
-- Step 1: Register an account normally via the website signup at /register
-- Step 2: In Supabase SQL Editor, replace 'admin@example.com' below with that email
-- Step 3: Run the script to grant super_admin or admin privileges.

DO $$
DECLARE
    target_email TEXT := 'admin@tnvworkshop.edu.in'; -- <-- REPLACE WITH YOUR ADMIN EMAIL
    target_role user_role := 'super_admin'::user_role; -- 'admin' or 'super_admin'
    target_user_id UUID;
BEGIN
    -- Locate profile by email
    SELECT id INTO target_user_id
    FROM public.profiles
    WHERE email = target_email;

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'No profile found with email: %. Please create/register the user first in Supabase Auth.', target_email;
    ELSE
        -- Update the profile role safely
        UPDATE public.profiles
        SET 
            role = target_role,
            is_suspended = FALSE,
            updated_at = NOW()
        WHERE id = target_user_id;

        RAISE NOTICE 'Successfully granted % privileges to % (User ID: %)', target_role, target_email, target_user_id;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- VERIFICATION QUERY: List all system administrators
-- ------------------------------------------------------------------------------
SELECT 
    id,
    email,
    full_name,
    role,
    college_name,
    is_suspended,
    created_at
FROM public.profiles
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at ASC;
