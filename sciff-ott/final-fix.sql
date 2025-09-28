-- 🚀 FINAL COMPLETE FIX FOR SCIFF OTT PLATFORM
-- This script will completely set up your platform from scratch
-- Run this in Supabase SQL Editor after running supabase-schema.sql

-- Step 1: Clean up any existing broken data
DO $$
BEGIN
    RAISE NOTICE '=== STEP 1: CLEANUP ===';
    
    -- Remove any broken admin users
    DELETE FROM users WHERE id IN (
        SELECT au.id FROM auth.users au 
        WHERE au.email = 'praveend@lxl.in'
    );
    DELETE FROM auth.users WHERE email = 'praveend@lxl.in';
    
    -- Remove duplicate schools
    DELETE FROM schools WHERE code = 'ADMIN001';
    
    RAISE NOTICE 'Cleanup completed';
END $$;

-- Step 2: Create admin school
INSERT INTO schools (name, code, contact_email, is_active) 
VALUES ('SCIFF Administration', 'ADMIN001', 'praveend@lxl.in', true);

-- Step 3: Create admin auth user with correct password
DO $$
DECLARE
    admin_user_id UUID;
    admin_school_id UUID;
BEGIN
    RAISE NOTICE '=== STEP 3: CREATE ADMIN USER ===';
    
    -- Generate UUID for admin
    admin_user_id := gen_random_uuid();
    
    -- Get admin school ID
    SELECT id INTO admin_school_id FROM schools WHERE code = 'ADMIN001';
    
    -- Create auth user
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, confirmation_sent_at, confirmation_token,
        recovery_token, email_change_token_new, email_change, last_sign_in_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        admin_user_id,
        'authenticated', 'authenticated', 'praveend@lxl.in',
        crypt('Apple@123', gen_salt('bf')), 
        now(), now(), '', '', '', '', now(),
        '{"provider":"email","providers":["email"]}', '{}', 
        FALSE, now(), now()
    );
    
    -- Create user profile
    INSERT INTO users (id, username, role, school_id, is_active)
    VALUES (admin_user_id, 'praveend', 'admin', admin_school_id, true);
    
    RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
END $$;

-- Step 4: Add sample films
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM films WHERE title = 'The Little Explorer') THEN
        INSERT INTO films (title, category_id, external_url, runtime_seconds, thumbnail_url, description, is_active) VALUES
        -- Below 7 years films
        ('The Little Explorer', (SELECT id FROM categories WHERE name = 'Below 7 years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 596, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=300&fit=crop', 'A wonderful adventure story for young children', true),
        ('Magic Garden', (SELECT id FROM categories WHERE name = 'Below 7 years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 653, 'https://images.unsplash.com/photo-1516975527983-3e2a11a9d9cb?w=500&h=300&fit=crop', 'Discover the magic in a beautiful garden', true),
        ('Friendly Animals', (SELECT id FROM categories WHERE name = 'Below 7 years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 15, 'https://images.unsplash.com/photo-1520315342629-6ea920342047?w=500&h=300&fit=crop', 'Learn about different animals and their sounds', true),

        -- 10+ years films  
        ('Space Adventure', (SELECT id FROM categories WHERE name = '10+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 888, 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=500&h=300&fit=crop', 'Explore the mysteries of space and planets', true),
        ('The Young Scientist', (SELECT id FROM categories WHERE name = '10+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 734, 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=500&h=300&fit=crop', 'Follow a young scientist''s incredible discoveries', true),
        ('Ocean Depths', (SELECT id FROM categories WHERE name = '10+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 596, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=300&fit=crop', 'Dive deep into the ocean and discover marine life', true),

        -- 13+ years films
        ('Future Leaders', (SELECT id FROM categories WHERE name = '13+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 596, 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&h=300&fit=crop', 'Stories of young leaders making a difference', true),
        ('Digital Revolution', (SELECT id FROM categories WHERE name = '13+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 888, 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=300&fit=crop', 'Explore the impact of technology on society', true),
        ('The Climate Challenge', (SELECT id FROM categories WHERE name = '13+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 734, 'https://images.unsplash.com/photo-1569163139750-5e06fea12c1b?w=500&h=300&fit=crop', 'Understanding environmental challenges and solutions', true);
        
        RAISE NOTICE 'Sample films created';
    END IF;
END $$;

-- Step 5: Add Bangalore schools
DO $$
BEGIN
    INSERT INTO schools (name, code, contact_email, is_active)
    SELECT * FROM (VALUES
        ('Bishop Cotton Boys School Bangalore', 'BCBS001', 'principal@bishopscottonboys.edu.in', true),
        ('Mallya Aditi International School', 'MAIS002', 'admissions@mallya-aditi.org', true),
        ('The International School Bangalore', 'TISB003', 'info@tisb.org', true),
        ('Inventure Academy', 'INVA004', 'admissions@inventureacademy.com', true),
        ('Greenwood High International School', 'GHIS005', 'info@greenwoodhigh.edu.in', true),
        ('Candor International School', 'CIS006', 'info@candorschool.com', true),
        ('GEAR Innovative International School', 'GIIS007', 'admissions@gearschool.in', true),
        ('Delhi Public School Bangalore North', 'DPSBN008', 'info@dpsbnorth.edu.in', true),
        ('Nahar International School', 'NIS009', 'principal@naharinternational.com', true),
        ('Vidyashilp Academy', 'VSA010', 'admissions@vidyashilp.com', true)
    ) AS t(name, code, contact_email, is_active)
    WHERE NOT EXISTS (SELECT 1 FROM schools WHERE schools.code = t.code);
    
    RAISE NOTICE 'Bangalore schools added';
END $$;

-- Step 6: Add banners
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM banners WHERE title = 'Welcome to SCIFF 2024') THEN
        INSERT INTO banners (title, image_url, link_url, is_active, display_order) VALUES
        ('Welcome to SCIFF 2024', 'https://images.unsplash.com/photo-1489599162914-09ffb00a3bd3?w=800&h=400&fit=crop', NULL, true, 1),
        ('Film Festival Highlights', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop', NULL, true, 2),
        ('Educational Cinema Experience', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=400&fit=crop', NULL, true, 3);
        
        RAISE NOTICE 'Sample banners created';
    END IF;
END $$;

-- Step 7: Add 15-day subscriptions for schools
INSERT INTO school_subscriptions (school_id, category_id, start_date, expiry_date, active) VALUES
-- Admin gets all access
((SELECT id FROM schools WHERE code = 'ADMIN001'), (SELECT id FROM categories WHERE name = 'Below 7 years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'ADMIN001'), (SELECT id FROM categories WHERE name = '10+ years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'ADMIN001'), (SELECT id FROM categories WHERE name = '13+ years'), NOW(), NOW() + INTERVAL '15 days', true),

-- Bishop Cotton Boys School - Full access
((SELECT id FROM schools WHERE code = 'BCBS001'), (SELECT id FROM categories WHERE name = 'Below 7 years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'BCBS001'), (SELECT id FROM categories WHERE name = '10+ years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'BCBS001'), (SELECT id FROM categories WHERE name = '13+ years'), NOW(), NOW() + INTERVAL '15 days', true),

-- TISB - All categories
((SELECT id FROM schools WHERE code = 'TISB003'), (SELECT id FROM categories WHERE name = 'Below 7 years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'TISB003'), (SELECT id FROM categories WHERE name = '10+ years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'TISB003'), (SELECT id FROM categories WHERE name = '13+ years'), NOW(), NOW() + INTERVAL '15 days', true)

ON CONFLICT (school_id, category_id) DO UPDATE SET
expiry_date = EXCLUDED.expiry_date,
active = EXCLUDED.active;

-- Step 8: Final verification
DO $$
BEGIN
    RAISE NOTICE '=== FINAL VERIFICATION ===';
    
    IF EXISTS (
        SELECT 1 FROM users u
        JOIN schools s ON u.school_id = s.id
        JOIN auth.users au ON u.id = au.id
        WHERE au.email = 'praveend@lxl.in' 
        AND u.is_active = true
        AND au.encrypted_password = crypt('Apple@123', au.encrypted_password)
    ) THEN
        RAISE NOTICE '✅ SUCCESS: Admin login will work!';
        RAISE NOTICE '📧 Login: praveend@lxl.in / Apple@123';
        RAISE NOTICE '🌐 Frontend: http://localhost:5174';
        RAISE NOTICE '🎯 Platform is ready!';
    ELSE
        RAISE NOTICE '❌ FAILED: Something went wrong during setup';
    END IF;
END $$;

-- Show final stats
SELECT 
    'SETUP_COMPLETE' as status,
    (SELECT COUNT(*) FROM schools) as total_schools,
    (SELECT COUNT(*) FROM films) as total_films,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM school_subscriptions WHERE active = true) as active_subscriptions;

-- Show admin user details
SELECT 
    'ADMIN_USER' as type,
    u.username,
    u.role,
    s.name as school,
    au.email,
    'Apple@123' as password
FROM users u
JOIN schools s ON u.school_id = s.id
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'praveend@lxl.in';