-- 🔍 DIAGNOSTIC AND FIX SCRIPT FOR USER PROFILE ISSUE
-- Run this in your Supabase SQL Editor to diagnose and fix the "User profile not found" error

-- Step 1: Check if admin user exists in auth.users
SELECT 
    'AUTH USER CHECK' as check_type,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE email = 'praveend@lxl.in';

-- Step 2: Check if admin user profile exists in users table
SELECT 
    'USER PROFILE CHECK' as check_type,
    id,
    username,
    role,
    school_id,
    is_active,
    created_at
FROM users 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'praveend@lxl.in');

-- Step 3: Check admin school
SELECT 
    'ADMIN SCHOOL CHECK' as check_type,
    id,
    name,
    code,
    contact_email,
    is_active
FROM schools 
WHERE code = 'ADMIN001';

-- Step 4: Fix missing user profile (if needed)
DO $$
DECLARE
    auth_user_id UUID;
    admin_school_id UUID;
    profile_exists BOOLEAN;
BEGIN
    -- Get auth user ID
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'praveend@lxl.in';
    
    -- Get admin school ID
    SELECT id INTO admin_school_id 
    FROM schools 
    WHERE code = 'ADMIN001';
    
    IF auth_user_id IS NOT NULL AND admin_school_id IS NOT NULL THEN
        -- Check if profile exists
        SELECT EXISTS(SELECT 1 FROM users WHERE id = auth_user_id) INTO profile_exists;
        
        IF NOT profile_exists THEN
            -- Create missing user profile
            INSERT INTO users (id, username, role, school_id, is_active)
            VALUES (auth_user_id, 'praveend', 'admin', admin_school_id, true);
            
            RAISE NOTICE 'User profile created for admin user';
        ELSE
            -- Update existing profile to ensure it''s correct
            UPDATE users 
            SET 
                username = 'praveend',
                role = 'admin',
                school_id = admin_school_id,
                is_active = true,
                updated_at = NOW()
            WHERE id = auth_user_id;
            
            RAISE NOTICE 'User profile updated for admin user';
        END IF;
    ELSE
        RAISE NOTICE 'Auth user or admin school not found - check previous steps';
    END IF;
END $$;

-- Step 5: Verify the fix
SELECT 
    'VERIFICATION' as check_type,
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

-- Step 6: Test login query (this is what the frontend runs)
SELECT 
    'LOGIN TEST' as check_type,
    u.*,
    s.name as school_name,
    s.code as school_code,
    s.contact_email as school_email
FROM users u
JOIN schools s ON u.school_id = s.id
WHERE u.id = (SELECT id FROM auth.users WHERE email = 'praveend@lxl.in')
  AND u.is_active = true;

-- Step 7: Final success messages
DO $$
BEGIN
    RAISE NOTICE '🎉 Diagnostic completed! Check the results above.';
    RAISE NOTICE '📧 If LOGIN TEST shows results, you can now login with: praveend@lxl.in / Apple@123';
END $$;