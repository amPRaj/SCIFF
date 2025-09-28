-- 🔍 DETAILED DIAGNOSIS FOR SCIFF OTT PLATFORM
-- You have 5 auth users, let's check what's going on with the tables

-- Step 1: Check which tables exist
SELECT 
    'TABLE_EXISTS' as check_type,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('schools', 'categories', 'films', 'users', 'banners', 'school_subscriptions')
ORDER BY table_name;

-- Step 2: Check RLS status on tables
SELECT 
    'RLS_STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('schools', 'categories', 'films', 'users', 'banners');

-- Step 3: Check if we can access schools table directly
DO $$
BEGIN
    BEGIN
        -- Try to count schools
        PERFORM COUNT(*) FROM schools;
        RAISE NOTICE '✅ SCHOOLS TABLE: Accessible';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE '❌ SCHOOLS TABLE: RLS policy blocking access';
        WHEN undefined_table THEN
            RAISE NOTICE '❌ SCHOOLS TABLE: Does not exist';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ SCHOOLS TABLE: Other error - %', SQLERRM;
    END;
END $$;

-- Step 4: Check auth users details
SELECT 
    'AUTH_USERS_DETAILS' as check_type,
    email,
    created_at,
    email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users
ORDER BY created_at DESC;

-- Step 5: Check if admin user exists
SELECT 
    'ADMIN_USER_CHECK' as check_type,
    COUNT(*) as admin_count
FROM auth.users 
WHERE email = 'praveend@lxl.in';

-- Step 6: Try to access users table (if it exists)
DO $$
BEGIN
    BEGIN
        -- Try to count users
        PERFORM COUNT(*) FROM users;
        RAISE NOTICE '✅ USERS TABLE: Accessible';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE '❌ USERS TABLE: RLS policy blocking access';
        WHEN undefined_table THEN
            RAISE NOTICE '❌ USERS TABLE: Does not exist';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ USERS TABLE: Other error - %', SQLERRM;
    END;
END $$;

-- Step 7: Check if categories exist
DO $$
BEGIN
    BEGIN
        -- Try to count categories
        PERFORM COUNT(*) FROM categories;
        RAISE NOTICE '✅ CATEGORIES TABLE: Accessible';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE '❌ CATEGORIES TABLE: RLS policy blocking access';
        WHEN undefined_table THEN
            RAISE NOTICE '❌ CATEGORIES TABLE: Does not exist';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ CATEGORIES TABLE: Other error - %', SQLERRM;
    END;
END $$;

-- Step 8: Final diagnosis
DO $$
DECLARE
    tables_exist INTEGER;
    auth_users INTEGER;
    admin_exists INTEGER;
BEGIN
    -- Count how many core tables exist
    SELECT COUNT(*) INTO tables_exist
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('schools', 'categories', 'films', 'users');
    
    -- Count auth users
    SELECT COUNT(*) INTO auth_users FROM auth.users;
    
    -- Check if admin exists
    SELECT COUNT(*) INTO admin_exists 
    FROM auth.users WHERE email = 'praveend@lxl.in';
    
    RAISE NOTICE '=== DIAGNOSIS SUMMARY ===';
    RAISE NOTICE 'Core tables exist: %/4', tables_exist;
    RAISE NOTICE 'Auth users: %', auth_users;
    RAISE NOTICE 'Admin user exists: %', admin_exists > 0;
    
    IF tables_exist = 4 AND admin_exists > 0 THEN
        RAISE NOTICE '✅ SCHEMA LOOKS GOOD - Check RLS policies';
    ELSIF tables_exist = 0 THEN
        RAISE NOTICE '❌ NO SCHEMA - Run complete-setup.sql';
    ELSIF admin_exists = 0 THEN
        RAISE NOTICE '❌ NO ADMIN USER - Run admin setup';
    ELSE
        RAISE NOTICE '⚠️ PARTIAL SETUP - Check individual tables';
    END IF;
END $$;