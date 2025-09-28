-- 🔍 QUICK DATABASE VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to check current state

-- Check if tables exist
SELECT 
    'TABLE_CHECK' as check_type,
    table_name,
    'EXISTS' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('schools', 'categories', 'films', 'users', 'banners')
ORDER BY table_name;

-- Check if auth.users table is accessible
SELECT 
    'AUTH_USERS_CHECK' as check_type,
    COUNT(*) as total_auth_users
FROM auth.users;

-- Check if any data exists
DO $$
DECLARE
    schools_count INTEGER;
    categories_count INTEGER;
    users_count INTEGER;
BEGIN
    -- Check if schools table exists and count records
    BEGIN
        SELECT COUNT(*) INTO schools_count FROM schools;
        RAISE NOTICE 'Schools table: % records', schools_count;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Schools table: DOES NOT EXIST';
            schools_count := -1;
    END;
    
    -- Check if categories table exists and count records
    BEGIN
        SELECT COUNT(*) INTO categories_count FROM categories;
        RAISE NOTICE 'Categories table: % records', categories_count;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Categories table: DOES NOT EXIST';
            categories_count := -1;
    END;
    
    -- Check if users table exists and count records
    BEGIN
        SELECT COUNT(*) INTO users_count FROM users;
        RAISE NOTICE 'Users table: % records', users_count;
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE 'Users table: DOES NOT EXIST';
            users_count := -1;
    END;
    
    -- Summary
    IF schools_count = -1 OR categories_count = -1 OR users_count = -1 THEN
        RAISE NOTICE '❌ SCHEMA NOT DEPLOYED: Run complete-setup.sql';
    ELSE
        RAISE NOTICE '✅ SCHEMA EXISTS: % schools, % categories, % users', 
                     schools_count, categories_count, users_count;
    END IF;
END $$;