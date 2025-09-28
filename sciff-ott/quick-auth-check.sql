-- 🔍 QUICK AUTH CHECK - Run this in Supabase SQL Editor
-- This will show you exactly what's in your database

-- Check 1: See all auth users
SELECT 
    'ALL_AUTH_USERS' as check_type,
    email,
    id,
    created_at,
    email_confirmed_at,
    CASE 
        WHEN encrypted_password IS NOT NULL THEN 'Password Set' 
        ELSE 'No Password' 
    END as password_status
FROM auth.users
ORDER BY created_at DESC;

-- Check 2: Specifically look for admin user
SELECT 
    'ADMIN_USER_SEARCH' as check_type,
    email,
    id,
    created_at,
    email_confirmed_at,
    CASE 
        WHEN encrypted_password IS NOT NULL THEN 'Password Set' 
        ELSE 'No Password' 
    END as password_status
FROM auth.users 
WHERE email ILIKE '%praveend%' OR email ILIKE '%lxl%';

-- Check 3: Count all users
SELECT 
    'USER_COUNT' as check_type,
    COUNT(*) as total_auth_users
FROM auth.users;

-- Check 4: Check if admin school exists
SELECT 
    'ADMIN_SCHOOL' as check_type,
    *
FROM schools 
WHERE code = 'ADMIN001' OR name ILIKE '%admin%';

-- Status message
DO $$
BEGIN
    RAISE NOTICE '=== AUTH CHECK COMPLETE ===';
    RAISE NOTICE 'Look at the results above to see:';
    RAISE NOTICE '1. ALL_AUTH_USERS - Shows all users in your database';
    RAISE NOTICE '2. ADMIN_USER_SEARCH - Shows if admin user exists';
    RAISE NOTICE '3. If no admin user found, you need to run setup scripts';
END $$;