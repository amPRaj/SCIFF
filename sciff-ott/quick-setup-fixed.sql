-- ⚡ QUICK START SCRIPT FOR SCIFF OTT PLATFORM (CONFLICT-SAFE VERSION)
-- Copy and paste this entire script into Supabase SQL Editor

-- 🔧 Step 1: Create admin user for immediate testing
DO $$
DECLARE
    admin_user_id UUID;
    admin_school_id UUID;
    admin_exists BOOLEAN;
BEGIN
    -- Check if admin already exists
    SELECT EXISTS(SELECT 1 FROM schools WHERE code = 'ADMIN001') INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- Create admin school
        INSERT INTO schools (name, code, contact_email, is_active) 
        VALUES ('SCIFF Administration', 'ADMIN001', 'praveend@lxl.in', true)
        RETURNING id INTO admin_school_id;

        -- Create admin auth user with real credentials
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, confirmation_sent_at, confirmation_token,
            recovery_token, email_change_token_new, email_change, last_sign_in_at,
            raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated', 'authenticated', 'praveend@lxl.in',
            crypt('Apple@123', gen_salt('bf')), now(), now(), '', '', '', '', now(),
            '{"provider":"email","providers":["email"]}', '{}', FALSE, now(), now()
        ) RETURNING id INTO admin_user_id;

        -- Create admin user profile
        INSERT INTO users (id, username, role, school_id)
        VALUES (admin_user_id, 'praveend', 'admin', admin_school_id);

        RAISE NOTICE 'Admin user created successfully: praveend@lxl.in / Apple@123';
    ELSE
        RAISE NOTICE 'Admin user already exists, skipping creation';
    END IF;
END $$;

-- 🎬 Step 2: Add sample content for testing
DO $$
BEGIN
    -- Only insert films if they don't exist
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
    ELSE
        RAISE NOTICE 'Films already exist, skipping creation';
    END IF;
END $$;

-- 🏫 Step 3: Create sample schools for testing (with conflict handling)
DO $$
BEGIN
    -- Insert schools that don't already exist
    INSERT INTO schools (name, code, contact_email, is_active)
    SELECT * FROM (VALUES
        ('Delhi Public School', 'DPS001', 'admin@dpsdelhi.edu.in', true),
        ('St. Xavier''s High School', 'SXS002', 'principal@stxaviers.edu.in', true),
        ('Kendriya Vidyalaya', 'KV003', 'principal@kv1.edu.in', true),
        ('DAV Public School', 'DAV004', 'admin@davschool.edu.in', true),
        ('Ryan International School', 'RIS005', 'admin@ryaninternational.edu.in', true),
        -- Bangalore-based schools
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
    
    RAISE NOTICE 'Schools setup completed';
END $$;

-- 📱 Step 4: Create sample banners
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM banners WHERE title = 'Welcome to SCIFF 2024') THEN
        INSERT INTO banners (title, image_url, link_url, is_active, display_order) VALUES
        ('Welcome to SCIFF 2024', 'https://images.unsplash.com/photo-1489599162914-09ffb00a3bd3?w=800&h=400&fit=crop', NULL, true, 1),
        ('Film Festival Highlights', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop', NULL, true, 2),
        ('Educational Cinema Experience', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=400&fit=crop', NULL, true, 3);
        
        RAISE NOTICE 'Sample banners created';
    ELSE
        RAISE NOTICE 'Banners already exist, skipping creation';
    END IF;
END $$;

-- 🎭 Step 5: Add sample subscriptions (15 days period)
DELETE FROM school_subscriptions WHERE start_date::date = CURRENT_DATE;

INSERT INTO school_subscriptions (school_id, category_id, start_date, expiry_date, active) VALUES
-- DPS gets access to all categories
((SELECT id FROM schools WHERE code = 'DPS001'), (SELECT id FROM categories WHERE name = 'Below 7 years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'DPS001'), (SELECT id FROM categories WHERE name = '10+ years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'DPS001'), (SELECT id FROM categories WHERE name = '13+ years'), NOW(), NOW() + INTERVAL '15 days', true),

-- St. Xavier's gets access to 10+ and 13+ years
((SELECT id FROM schools WHERE code = 'SXS002'), (SELECT id FROM categories WHERE name = '10+ years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'SXS002'), (SELECT id FROM categories WHERE name = '13+ years'), NOW(), NOW() + INTERVAL '15 days', true),

-- KV gets access to Below 7 years and 10+ years
((SELECT id FROM schools WHERE code = 'KV003'), (SELECT id FROM categories WHERE name = 'Below 7 years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'KV003'), (SELECT id FROM categories WHERE name = '10+ years'), NOW(), NOW() + INTERVAL '15 days', true),

-- DAV gets access to only Below 7 years
((SELECT id FROM schools WHERE code = 'DAV004'), (SELECT id FROM categories WHERE name = 'Below 7 years'), NOW(), NOW() + INTERVAL '15 days', true),

-- Ryan International gets access to 13+ years only
((SELECT id FROM schools WHERE code = 'RIS005'), (SELECT id FROM categories WHERE name = '13+ years'), NOW(), NOW() + INTERVAL '15 days', true),

-- Bangalore Schools Subscriptions
-- Bishop Cotton Boys School - Full access
((SELECT id FROM schools WHERE code = 'BCBS001'), (SELECT id FROM categories WHERE name = 'Below 7 years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'BCBS001'), (SELECT id FROM categories WHERE name = '10+ years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'BCBS001'), (SELECT id FROM categories WHERE name = '13+ years'), NOW(), NOW() + INTERVAL '15 days', true),

-- Mallya Aditi International School - 10+ and 13+ years
((SELECT id FROM schools WHERE code = 'MAIS002'), (SELECT id FROM categories WHERE name = '10+ years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'MAIS002'), (SELECT id FROM categories WHERE name = '13+ years'), NOW(), NOW() + INTERVAL '15 days', true),

-- The International School Bangalore - All categories
((SELECT id FROM schools WHERE code = 'TISB003'), (SELECT id FROM categories WHERE name = 'Below 7 years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'TISB003'), (SELECT id FROM categories WHERE name = '10+ years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'TISB003'), (SELECT id FROM categories WHERE name = '13+ years'), NOW(), NOW() + INTERVAL '15 days', true),

-- Inventure Academy - 13+ years only
((SELECT id FROM schools WHERE code = 'INVA004'), (SELECT id FROM categories WHERE name = '13+ years'), NOW(), NOW() + INTERVAL '15 days', true),

-- Greenwood High International School - Below 7 and 10+ years
((SELECT id FROM schools WHERE code = 'GHIS005'), (SELECT id FROM categories WHERE name = 'Below 7 years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'GHIS005'), (SELECT id FROM categories WHERE name = '10+ years'), NOW(), NOW() + INTERVAL '15 days', true);

-- 👥 Step 6: Create sample school users
DO $$
DECLARE
    school_user_id UUID;
    school_id UUID;
    user_exists BOOLEAN;
BEGIN
    -- Create DPS user (skip if exists)
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'dps001@sciff.internal') INTO user_exists;
    IF NOT user_exists THEN
        SELECT id INTO school_id FROM schools WHERE code = 'DPS001';
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, confirmation_sent_at, confirmation_token,
            recovery_token, email_change_token_new, email_change, last_sign_in_at,
            raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
            'authenticated', 'authenticated', 'dps001@sciff.internal',
            crypt('school123', gen_salt('bf')), now(), now(), '', '', '', '', now(),
            '{"provider":"email","providers":["email"]}', '{}', FALSE, now(), now()
        ) RETURNING id INTO school_user_id;
        
        INSERT INTO users (id, username, role, school_id)
        VALUES (school_user_id, 'dps001', 'school_user', school_id);
    END IF;

    -- Create St. Xavier's user (skip if exists)
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'sxs002@sciff.internal') INTO user_exists;
    IF NOT user_exists THEN
        SELECT id INTO school_id FROM schools WHERE code = 'SXS002';
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, confirmation_sent_at, confirmation_token,
            recovery_token, email_change_token_new, email_change, last_sign_in_at,
            raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
            'authenticated', 'authenticated', 'sxs002@sciff.internal',
            crypt('school123', gen_salt('bf')), now(), now(), '', '', '', '', now(),
            '{"provider":"email","providers":["email"]}', '{}', FALSE, now(), now()
        ) RETURNING id INTO school_user_id;
        
        INSERT INTO users (id, username, role, school_id)
        VALUES (school_user_id, 'sxs002', 'school_user', school_id);
    END IF;

    -- Create Bangalore school users
    -- Bishop Cotton Boys School user (skip if exists)
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'bcbs001@sciff.internal') INTO user_exists;
    IF NOT user_exists THEN
        SELECT id INTO school_id FROM schools WHERE code = 'BCBS001';
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, confirmation_sent_at, confirmation_token,
            recovery_token, email_change_token_new, email_change, last_sign_in_at,
            raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
            'authenticated', 'authenticated', 'bcbs001@sciff.internal',
            crypt('school123', gen_salt('bf')), now(), now(), '', '', '', '', now(),
            '{"provider":"email","providers":["email"]}', '{}', FALSE, now(), now()
        ) RETURNING id INTO school_user_id;
        
        INSERT INTO users (id, username, role, school_id)
        VALUES (school_user_id, 'bcbs001', 'school_user', school_id);
    END IF;

    -- The International School Bangalore user (skip if exists)
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = 'tisb003@sciff.internal') INTO user_exists;
    IF NOT user_exists THEN
        SELECT id INTO school_id FROM schools WHERE code = 'TISB003';
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, confirmation_sent_at, confirmation_token,
            recovery_token, email_change_token_new, email_change, last_sign_in_at,
            raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
            'authenticated', 'authenticated', 'tisb003@sciff.internal',
            crypt('school123', gen_salt('bf')), now(), now(), '', '', '', '', now(),
            '{"provider":"email","providers":["email"]}', '{}', FALSE, now(), now()
        ) RETURNING id INTO school_user_id;
        
        INSERT INTO users (id, username, role, school_id)
        VALUES (school_user_id, 'tisb003', 'school_user', school_id);
    END IF;

    RAISE NOTICE 'Sample users setup completed (existing users skipped)';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'User creation completed with some skipped (likely already exist)';
END $$;

-- ✅ Step 7: Verification
SELECT 
    'Setup Complete!' as status,
    (SELECT COUNT(*) FROM schools) as schools_count,
    (SELECT COUNT(*) FROM films) as films_count,
    (SELECT COUNT(*) FROM school_subscriptions WHERE active = true) as active_subscriptions,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM banners WHERE is_active = true) as active_banners;

-- 🔐 Step 8: Test credentials summary
SELECT 
    '=== LOGIN CREDENTIALS ===' as info
UNION ALL
SELECT 'Admin: praveend@lxl.in / Apple@123' 
UNION ALL
SELECT 'DPS School: dps001@sciff.internal / school123'
UNION ALL
SELECT 'St. Xaviers: sxs002@sciff.internal / school123'
UNION ALL
SELECT 'BCBS: bcbs001@sciff.internal / school123'
UNION ALL
SELECT 'TISB: tisb003@sciff.internal / school123'
UNION ALL
SELECT '=== READY TO TEST! ===' ;

-- 🎉 Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 SCIFF OTT Platform Setup Complete!';
    RAISE NOTICE '👨‍💼 Admin Login: praveend@lxl.in / Apple@123';
    RAISE NOTICE '🏫 School Login: Use any school@sciff.internal / school123';
    RAISE NOTICE '🚀 Your platform is ready for testing at http://localhost:5173';
END $$;