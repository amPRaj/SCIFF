-- 🔧 FIX RLS POLICIES FOR SCIFF OTT PLATFORM
-- This will fix Row Level Security access issues

-- First, check current RLS status
SELECT 
    'CURRENT_RLS_STATUS' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('schools', 'categories', 'films', 'users', 'banners');

-- Temporarily disable RLS for testing (re-enable after setup)
DO $$
BEGIN
    -- Disable RLS on core tables for initial access
    BEGIN
        ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS on schools table';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '❌ Schools table does not exist';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Could not disable RLS on schools: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS on categories table';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '❌ Categories table does not exist';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Could not disable RLS on categories: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE films DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS on films table';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '❌ Films table does not exist';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Could not disable RLS on films: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE users DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS on users table';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '❌ Users table does not exist';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Could not disable RLS on users: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE banners DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ Disabled RLS on banners table';
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '❌ Banners table does not exist';
        WHEN OTHERS THEN
            RAISE NOTICE '⚠️ Could not disable RLS on banners: %', SQLERRM;
    END;
END $$;

-- Now test table access
DO $$
DECLARE
    schools_count INTEGER;
    categories_count INTEGER;
    users_count INTEGER;
BEGIN
    RAISE NOTICE '=== TESTING TABLE ACCESS ===';
    
    BEGIN
        SELECT COUNT(*) INTO schools_count FROM schools;
        RAISE NOTICE '✅ Schools table: % records', schools_count;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Schools table still inaccessible: %', SQLERRM;
            schools_count := -1;
    END;
    
    BEGIN
        SELECT COUNT(*) INTO categories_count FROM categories;
        RAISE NOTICE '✅ Categories table: % records', categories_count;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Categories table still inaccessible: %', SQLERRM;
            categories_count := -1;
    END;
    
    BEGIN
        SELECT COUNT(*) INTO users_count FROM users;
        RAISE NOTICE '✅ Users table: % records', users_count;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Users table still inaccessible: %', SQLERRM;
            users_count := -1;
    END;
    
    -- Summary
    IF schools_count >= 0 AND categories_count >= 0 AND users_count >= 0 THEN
        RAISE NOTICE '🎉 SUCCESS: Tables are now accessible!';
        RAISE NOTICE '📊 Data: % schools, % categories, % users', 
                     schools_count, categories_count, users_count;
    ELSE
        RAISE NOTICE '❌ STILL ISSUES: Some tables remain inaccessible';
        RAISE NOTICE '🔧 SOLUTION: Run complete-setup.sql to create missing tables';
    END IF;
END $$;