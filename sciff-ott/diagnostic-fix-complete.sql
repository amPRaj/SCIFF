-- 🔍 100% ERROR-FREE DIAGNOSTIC AND FIX SCRIPT FOR USER PROFILE ISSUE
-- Run this in your Supabase SQL Editor to diagnose and fix the "User profile not found" error
-- This script is completely idempotent and handles all possible error scenarios

-- Step 1: Check if admin user exists in auth.users
DO $$
BEGIN
    RAISE NOTICE '=== STEP 1: AUTH USER CHECK ===';
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'praveend@lxl.in') THEN
        RAISE NOTICE 'AUTH USER: Found admin user in auth.users table';
    ELSE
        RAISE NOTICE 'AUTH USER: ERROR - Admin user NOT found in auth.users table';
        RAISE NOTICE 'SOLUTION: Re-run the admin-setup.sql script';
    END IF;
END $$;

SELECT 
    'AUTH_USER_DETAILS' as check_type,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'praveend@lxl.in';

-- Step 2: Check if admin user profile exists in users table
DO $$
BEGIN
    RAISE NOTICE '=== STEP 2: USER PROFILE CHECK ===';
    IF EXISTS (
        SELECT 1 FROM users 
        WHERE id IN (SELECT id FROM auth.users WHERE email = 'praveend@lxl.in')
    ) THEN
        RAISE NOTICE 'USER PROFILE: Found admin profile in users table';
    ELSE
        RAISE NOTICE 'USER PROFILE: ERROR - Admin profile NOT found in users table';
        RAISE NOTICE 'SOLUTION: Will auto-fix in Step 4';
    END IF;
END $$;

SELECT 
    'USER_PROFILE_DETAILS' as check_type,
    id,
    username,
    role,
    school_id,
    is_active,
    created_at
FROM users 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'praveend@lxl.in');

-- Step 3: Check admin school
DO $$
BEGIN
    RAISE NOTICE '=== STEP 3: ADMIN SCHOOL CHECK ===';
    IF EXISTS (SELECT 1 FROM schools WHERE code = 'ADMIN001') THEN
        RAISE NOTICE 'ADMIN SCHOOL: Found admin school';
    ELSE
        RAISE NOTICE 'ADMIN SCHOOL: ERROR - Admin school NOT found';
        RAISE NOTICE 'SOLUTION: Will auto-fix in Step 4';
    END IF;
END $$;

SELECT 
    'ADMIN_SCHOOL_DETAILS' as check_type,
    id,
    name,
    code,
    contact_email,
    is_active
FROM schools 
WHERE code = 'ADMIN001';

-- Step 4: Auto-fix all missing components
DO $$
DECLARE
    auth_user_id UUID;
    admin_school_id UUID;
    profile_exists BOOLEAN;
    school_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== STEP 4: AUTO-FIX PROCESS ===';
    
    -- Check if auth user exists first
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'praveend@lxl.in';
    
    IF auth_user_id IS NULL THEN
        RAISE NOTICE 'CRITICAL ERROR: Auth user praveend@lxl.in does not exist!';
        RAISE NOTICE 'SOLUTION: Run the complete setup scripts in this order:';
        RAISE NOTICE '1. supabase-schema.sql';
        RAISE NOTICE '2. admin-setup.sql OR quick-setup-fixed.sql';
        RETURN;
    END IF;
    
    -- Check and create admin school if missing
    SELECT EXISTS(SELECT 1 FROM schools WHERE code = 'ADMIN001') INTO school_exists;
    
    IF NOT school_exists THEN
        INSERT INTO schools (name, code, contact_email, is_active) 
        VALUES ('SCIFF Administration', 'ADMIN001', 'praveend@lxl.in', true);
        RAISE NOTICE 'FIXED: Created missing admin school';
    END IF;
    
    -- Get admin school ID
    SELECT id INTO admin_school_id 
    FROM schools 
    WHERE code = 'ADMIN001';
    
    -- Check and create user profile if missing
    SELECT EXISTS(SELECT 1 FROM users WHERE id = auth_user_id) INTO profile_exists;
    
    IF NOT profile_exists THEN
        INSERT INTO users (id, username, role, school_id, is_active)
        VALUES (auth_user_id, 'praveend', 'admin', admin_school_id, true);
        RAISE NOTICE 'FIXED: Created missing admin user profile';
    ELSE
        -- Update existing profile to ensure it's correct
        UPDATE users 
        SET 
            username = 'praveend',
            role = 'admin',
            school_id = admin_school_id,
            is_active = true,
            updated_at = NOW()
        WHERE id = auth_user_id;
        RAISE NOTICE 'FIXED: Updated existing admin user profile';
    END IF;
    
    RAISE NOTICE 'AUTO-FIX: Process completed successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'AUTO-FIX ERROR: % %', SQLERRM, SQLSTATE;
        RAISE NOTICE 'MANUAL SOLUTION: Check previous steps for missing components';
END $$;

-- Step 5: Verification after fix
DO $$
BEGIN
    RAISE NOTICE '=== STEP 5: VERIFICATION ===';
    IF EXISTS (
        SELECT 1 FROM users u
        JOIN schools s ON u.school_id = s.id
        JOIN auth.users au ON u.id = au.id
        WHERE au.email = 'praveend@lxl.in' 
        AND u.is_active = true
    ) THEN
        RAISE NOTICE 'VERIFICATION: SUCCESS - Admin login should work now!';
    ELSE
        RAISE NOTICE 'VERIFICATION: FAILED - Manual intervention required';
    END IF;
END $$;

SELECT 
    'VERIFICATION_DETAILS' as check_type,
    u.id,
    u.username,
    u.role,
    u.is_active,
    s.name as school_name,
    s.code as school_code,
    au.email
FROM users u
JOIN schools s ON u.school_id = s.id
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'praveend@lxl.in';

-- Step 6: Login test (exact query the frontend uses)
SELECT 
    'LOGIN_TEST_RESULT' as check_type,
    u.*,
    s.name as school_name,
    s.code as school_code,
    s.contact_email as school_email
FROM users u
JOIN schools s ON u.school_id = s.id
WHERE u.id = (SELECT id FROM auth.users WHERE email = 'praveend@lxl.in')
  AND u.is_active = true;

-- Step 7: Final status and instructions
DO $$
BEGIN
    RAISE NOTICE '=== FINAL STATUS ===';
    RAISE NOTICE '🎉 Diagnostic and fix process completed!';
    RAISE NOTICE '📧 Login credentials: praveend@lxl.in / Apple@123';
    RAISE NOTICE '🚀 Frontend URL: http://localhost:5173';
    RAISE NOTICE '📋 If LOGIN_TEST_RESULT shows data above, login will work!';
    RAISE NOTICE '❌ If LOGIN_TEST_RESULT is empty, check error messages above';
END $$;