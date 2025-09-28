-- Sample Data for SCIFF OTT Platform
-- Run this after setting up the main schema

-- Insert sample schools
INSERT INTO schools (name, code, contact_email, is_active) VALUES
('Delhi Public School', 'DPS001', 'admin@dpsdelhi.edu.in', true),
('St. Xavier''s High School', 'SXS002', 'principal@stxaviers.edu.in', true),
('Kendriya Vidyalaya', 'KV003', 'principal@kv1.edu.in', true),
('DAV Public School', 'DAV004', 'admin@davschool.edu.in', true),
('Ryan International School', 'RIS005', 'admin@ryaninternational.edu.in', true);

-- Insert sample films with YouTube/Vimeo URLs (replace with your actual film URLs)
INSERT INTO films (title, category_id, external_url, runtime_seconds, thumbnail_url, description, is_active) VALUES
-- Below 7 years category films
('The Little Explorer', (SELECT id FROM categories WHERE name = 'Below 7 years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 596, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500', 'A wonderful adventure story for young children', true),
('Magic Garden', (SELECT id FROM categories WHERE name = 'Below 7 years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 653, 'https://images.unsplash.com/photo-1516975527983-3e2a11a9d9cb?w=500', 'Discover the magic in a beautiful garden', true),
('Friendly Animals', (SELECT id FROM categories WHERE name = 'Below 7 years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 15, 'https://images.unsplash.com/photo-1520315342629-6ea920342047?w=500', 'Learn about different animals and their sounds', true),
('Rainbow Colors', (SELECT id FROM categories WHERE name = 'Below 7 years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 15, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500', 'A colorful journey through the rainbow', true),
('Teddy Bear Picnic', (SELECT id FROM categories WHERE name = 'Below 7 years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 60, 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500', 'Join teddy bears for a fun picnic adventure', true),

-- 10+ years category films
('Space Adventure', (SELECT id FROM categories WHERE name = '10+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 15, 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=500', 'Explore the mysteries of space and planets', true),
('The Young Scientist', (SELECT id FROM categories WHERE name = '10+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 15, 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=500', 'Follow a young scientist''s incredible discoveries', true),
('Ocean Depths', (SELECT id FROM categories WHERE name = '10+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 888, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500', 'Dive deep into the ocean and discover marine life', true),
('Time Travelers', (SELECT id FROM categories WHERE name = '10+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4', 15, 'https://images.unsplash.com/photo-1551316679-9c6ae9dec224?w=500', 'A thrilling journey through different time periods', true),
('The Mystery School', (SELECT id FROM categories WHERE name = '10+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 734, 'https://images.unsplash.com/photo-1532153354456-5a9ab7b7b2fb?w=500', 'Solve mysteries in this exciting school adventure', true),

-- 13+ years category films
('The Last Stand', (SELECT id FROM categories WHERE name = '13+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', 22, 'https://images.unsplash.com/photo-1489599162914-09ffb00a3bd3?w=500', 'A gripping tale of courage and determination', true),
('Digital Revolution', (SELECT id FROM categories WHERE name = '13+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', 30, 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500', 'Explore the impact of technology on society', true),
('The Climate Challenge', (SELECT id FROM categories WHERE name = '13+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4', 60, 'https://images.unsplash.com/photo-1569163139750-5e06fea12c1b?w=500', 'Understanding environmental challenges and solutions', true),
('Future Leaders', (SELECT id FROM categories WHERE name = '13+ years'), 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4', 30, 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500', 'Stories of young leaders making a difference', true),
('Innovation Hub', (SELECT id FROM categories WHERE name = '13+ years'), 'https://file-examples.com/storage/fe2bb3b87c62a6de4d99e1d/2017/10/file_example_MP4_1280_10MG.mp4', 30, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500', 'Discover groundbreaking innovations by students', true);

-- Insert sample subscriptions (giving some schools access to different categories)
-- DPS gets access to all categories
INSERT INTO school_subscriptions (school_id, category_id, start_date, expiry_date, active) VALUES
((SELECT id FROM schools WHERE code = 'DPS001'), (SELECT id FROM categories WHERE name = 'Below 7 years'), NOW(), NOW() + INTERVAL '20 days', true),
((SELECT id FROM schools WHERE code = 'DPS001'), (SELECT id FROM categories WHERE name = '10+ years'), NOW(), NOW() + INTERVAL '20 days', true),
((SELECT id FROM schools WHERE code = 'DPS001'), (SELECT id FROM categories WHERE name = '13+ years'), NOW(), NOW() + INTERVAL '20 days', true);

-- St. Xavier's gets access to 10+ and 13+ years
INSERT INTO school_subscriptions (school_id, category_id, start_date, expiry_date, active) VALUES
((SELECT id FROM schools WHERE code = 'SXS002'), (SELECT id FROM categories WHERE name = '10+ years'), NOW(), NOW() + INTERVAL '15 days', true),
((SELECT id FROM schools WHERE code = 'SXS002'), (SELECT id FROM categories WHERE name = '13+ years'), NOW(), NOW() + INTERVAL '15 days', true);

-- KV gets access to Below 7 years and 10+ years
INSERT INTO school_subscriptions (school_id, category_id, start_date, expiry_date, active) VALUES
((SELECT id FROM schools WHERE code = 'KV003'), (SELECT id FROM categories WHERE name = 'Below 7 years'), NOW(), NOW() + INTERVAL '20 days', true),
((SELECT id FROM schools WHERE code = 'KV003'), (SELECT id FROM categories WHERE name = '10+ years'), NOW(), NOW() + INTERVAL '20 days', true);

-- DAV gets access to only Below 7 years
INSERT INTO school_subscriptions (school_id, category_id, start_date, expiry_date, active) VALUES
((SELECT id FROM schools WHERE code = 'DAV004'), (SELECT id FROM categories WHERE name = 'Below 7 years'), NOW(), NOW() + INTERVAL '15 days', true);

-- Ryan International gets access to 13+ years only
INSERT INTO school_subscriptions (school_id, category_id, start_date, expiry_date, active) VALUES
((SELECT id FROM schools WHERE code = 'RIS005'), (SELECT id FROM categories WHERE name = '13+ years'), NOW(), NOW() + INTERVAL '20 days', true);

-- Insert sample banners
INSERT INTO banners (title, image_url, link_url, is_active, display_order) VALUES
('Welcome to SCIFF 2024', 'https://images.unsplash.com/photo-1489599162914-09ffb00a3bd3?w=800&h=400&fit=crop', NULL, true, 1),
('Film Festival Highlights', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop', NULL, true, 2),
('Educational Cinema', 'https://images.unsplash.com/photo-1489599162914-09ffb00a3bd3?w=800&h=400&fit=crop', NULL, true, 3);

-- Create sample users for each school (Password: school123)
-- You'll need to create these via the admin interface or auth API
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
) VALUES 
-- DPS User
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'dps001@sciff.internal', crypt('school123', gen_salt('bf')), now(), now(), '', '', '', '', now(), '{"provider":"email","providers":["email"]}', '{}', FALSE, now(), now()),
-- St. Xavier's User  
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sxs002@sciff.internal', crypt('school123', gen_salt('bf')), now(), now(), '', '', '', '', now(), '{"provider":"email","providers":["email"]}', '{}', FALSE, now(), now()),
-- KV User
('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'kv003@sciff.internal', crypt('school123', gen_salt('bf')), now(), now(), '', '', '', '', now(), '{"provider":"email","providers":["email"]}', '{}', FALSE, now(), now());

-- Create user profiles linking to schools
INSERT INTO users (id, username, role, school_id) VALUES
((SELECT id FROM auth.users WHERE email = 'dps001@sciff.internal'), 'dps001', 'school_user', (SELECT id FROM schools WHERE code = 'DPS001')),
((SELECT id FROM auth.users WHERE email = 'sxs002@sciff.internal'), 'sxs002', 'school_user', (SELECT id FROM schools WHERE code = 'SXS002')),
((SELECT id FROM auth.users WHERE email = 'kv003@sciff.internal'), 'kv003', 'school_user', (SELECT id FROM schools WHERE code = 'KV003'));

-- Create admin user for main administration
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@sciff.internal',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    '',
    '',
    '',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    FALSE,
    now(),
    now()
);

-- Create admin user profile
INSERT INTO users (id, username, role, school_id) VALUES
((SELECT id FROM auth.users WHERE email = 'admin@sciff.internal'), 'admin', 'admin', (SELECT id FROM schools WHERE code = 'DPS001'));

-- Sample viewing logs (for analytics testing)
INSERT INTO viewing_logs (school_id, film_id, user_id, started_at, ended_at, watched_seconds, ip_address, device_info, watermark_id, country, city) VALUES
((SELECT id FROM schools WHERE code = 'DPS001'), (SELECT id FROM films WHERE title = 'The Little Explorer'), (SELECT id FROM users WHERE username = 'dps001'), NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 50 minutes', 596, '103.21.58.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'DPS001-1640000000', 'IN', 'New Delhi'),
((SELECT id FROM schools WHERE code = 'SXS002'), (SELECT id FROM films WHERE title = 'Space Adventure'), (SELECT id FROM users WHERE username = 'sxs002'), NOW() - INTERVAL '1 hour', NOW() - INTERVAL '45 minutes', 900, '103.21.58.2', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'SXS002-1640000001', 'IN', 'Mumbai');

-- Sample login activity
INSERT INTO login_activity (user_id, school_id, session_key, ip_address, user_agent, logged_in_at, logged_out_at, country, city) VALUES
((SELECT id FROM users WHERE username = 'dps001'), (SELECT id FROM schools WHERE code = 'DPS001'), 'session-001', '103.21.58.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour', 'IN', 'New Delhi'),
((SELECT id FROM users WHERE username = 'sxs002'), (SELECT id FROM schools WHERE code = 'SXS002'), 'session-002', '103.21.58.2', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', NOW() - INTERVAL '2 hours', NULL, 'IN', 'Mumbai'),
((SELECT id FROM users WHERE username = 'admin'), (SELECT id FROM schools WHERE code = 'DPS001'), 'session-admin', '103.21.58.3', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NOW() - INTERVAL '1 hour', NULL, 'IN', 'New Delhi');

-- Verify the data
SELECT 'Schools Created:' AS info, COUNT(*) AS count FROM schools
UNION ALL
SELECT 'Films Created:', COUNT(*) FROM films
UNION ALL
SELECT 'Active Subscriptions:', COUNT(*) FROM school_subscriptions WHERE active = true
UNION ALL
SELECT 'Users Created:', COUNT(*) FROM users
UNION ALL
SELECT 'Banners Created:', COUNT(*) FROM banners;