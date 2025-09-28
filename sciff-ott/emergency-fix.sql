-- 🚨 EMERGENCY FIX FOR "User profile not found" ERROR
-- This will immediately diagnose and fix the user profile sync issue

-- Step 1: Check what exists in your database
DO $$
BEGIN
    RAISE NOTICE '=== EMERGENCY DIAGNOSTIC ===';
    RAISE NOTICE 'Checking auth users and profiles...';
END $$;

-- Check auth users
SELECT 
    'AUTH_USERS_CHECK' as type,
    count(*) as total_auth_users,
    string_agg(email, ', ') as emails
FROM auth.users;

-- Check user profiles
SELECT 
    'USER_PROFILES_CHECK' as type,
    count(*) as total_profiles,
    string_agg(username, ', ') as usernames
FROM users;

-- Check admin user specifically
SELECT 
    'ADMIN_AUTH_CHECK' as type,
    id,
    email,
    created_at,
    CASE 
        WHEN encrypted_password IS NOT NULL THEN 'Password Set' 
        ELSE 'No Password' 
    END as password_status
FROM auth.users 
WHERE email = 'praveend@lxl.in';

-- Check admin profile
SELECT 
    'ADMIN_PROFILE_CHECK' as type,
    u.id,
    u.username,
    u.role,
    u.is_active,
    s.name as school_name
FROM users u
LEFT JOIN schools s ON u.school_id = s.id
WHERE u.id IN (SELECT id FROM auth.users WHERE email = 'praveend@lxl.in');

-- Step 2: Fix the profile sync issue
DO $$
DECLARE
    auth_user_id UUID;
    admin_school_id UUID;
    profile_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== EMERGENCY FIX ===';
    
    -- Get auth user ID
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = 'praveend@lxl.in';
    
    IF auth_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: No auth user found - need to run complete setup';
        RAISE NOTICE 'SOLUTION: Run supabase-schema.sql then final-fix.sql';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found auth user with ID: %', auth_user_id;
    
    -- Ensure admin school exists
    INSERT INTO schools (name, code, contact_email, is_active) 
    VALUES ('SCIFF Administration', 'ADMIN001', 'praveend@lxl.in', true)
    ON CONFLICT (code) DO NOTHING;
    
    -- Get admin school ID
    SELECT id INTO admin_school_id FROM schools WHERE code = 'ADMIN001';
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM users WHERE id = auth_user_id) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Create missing profile
        INSERT INTO users (id, username, role, school_id, is_active)
        VALUES (auth_user_id, 'praveend', 'admin', admin_school_id, true);
        
        RAISE NOTICE 'FIXED: Created missing admin profile';
    ELSE
        -- Update existing profile to ensure correctness
        UPDATE users 
        SET 
            username = 'praveend',
            role = 'admin',
            school_id = admin_school_id,
            is_active = true,
            updated_at = NOW()
        WHERE id = auth_user_id;
        
        RAISE NOTICE 'FIXED: Updated existing admin profile';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'FIX ERROR: % %', SQLERRM, SQLSTATE;
END $$;

-- Step 3: Test the exact frontend login query
SELECT 
    'LOGIN_TEST' as type,
    u.*,
    s.name as school_name,
    s.code as school_code
FROM users u
JOIN schools s ON u.school_id = s.id
WHERE u.id = (SELECT id FROM auth.users WHERE email = 'praveend@lxl.in')
  AND u.is_active = true;

-- Step 4: Verify password works
DO $$
DECLARE
    password_valid BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = 'praveend@lxl.in' 
        AND encrypted_password = crypt('Apple@123', encrypted_password)
    ) INTO password_valid;
    
    IF password_valid THEN
        RAISE NOTICE '✅ PASSWORD TEST: Apple@123 is correct';
    ELSE
        RAISE NOTICE '❌ PASSWORD TEST: Password is wrong or user missing';
    END IF;
END $$;

-- Final status
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM users u
        JOIN schools s ON u.school_id = s.id
        JOIN auth.users au ON u.id = au.id
        WHERE au.email = 'praveend@lxl.in' 
        AND u.is_active = true
        AND au.encrypted_password = crypt('Apple@123', au.encrypted_password)
    ) THEN
        RAISE NOTICE '🎉 SUCCESS: Login should work now!';
        RAISE NOTICE '📧 Try: praveend@lxl.in / Apple@123';
        RAISE NOTICE '🌐 At: http://localhost:5174';
    ELSE
        RAISE NOTICE '❌ STILL BROKEN: Need to run complete setup scripts';
        RAISE NOTICE '1. Run: supabase-schema.sql';
        RAISE NOTICE '2. Run: final-fix.sql';
    END IF;
END $$;