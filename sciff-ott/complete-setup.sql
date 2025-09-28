-- 🛠️ COMPLETE DATABASE SETUP FOR SCIFF OTT PLATFORM
-- This script will set up everything from scratch
-- Run this in Supabase SQL Editor (it includes schema + data)

-- Step 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Create types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'school_user');
    END IF;
END $$;

-- Step 3: Create tables
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) UNIQUE NOT NULL,
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(64) NOT NULL,
    min_age INTEGER,
    max_age INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS films (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    external_url TEXT NOT NULL,
    runtime_seconds INTEGER,
    thumbnail_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE NOT NULL,
    role user_role DEFAULT 'school_user',
    forced_session_key VARCHAR(255),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, category_id)
);

CREATE TABLE IF NOT EXISTS viewing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    film_id UUID REFERENCES films(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    watched_seconds INTEGER DEFAULT 0,
    ip_address INET,
    device_info TEXT,
    watermark_id VARCHAR(128),
    country VARCHAR(2),
    city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    session_key VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    logged_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logged_out_at TIMESTAMP WITH TIME ZONE,
    country VARCHAR(2),
    city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_films_category_id ON films(category_id);
CREATE INDEX IF NOT EXISTS idx_school_subscriptions_school_category ON school_subscriptions(school_id, category_id);
CREATE INDEX IF NOT EXISTS idx_school_subscriptions_expiry ON school_subscriptions(expiry_date);
CREATE INDEX IF NOT EXISTS idx_viewing_logs_school_film ON viewing_logs(school_id, film_id);
CREATE INDEX IF NOT EXISTS idx_viewing_logs_user ON viewing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_viewing_logs_started_at ON viewing_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_login_activity_user ON login_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_login_activity_session ON login_activity(session_key);

-- Step 5: Create trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_schools') THEN
        CREATE TRIGGER set_timestamp_schools
            BEFORE UPDATE ON schools
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_categories') THEN
        CREATE TRIGGER set_timestamp_categories
            BEFORE UPDATE ON categories
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_films') THEN
        CREATE TRIGGER set_timestamp_films
            BEFORE UPDATE ON films
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_users') THEN
        CREATE TRIGGER set_timestamp_users
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_school_subscriptions') THEN
        CREATE TRIGGER set_timestamp_school_subscriptions
            BEFORE UPDATE ON school_subscriptions
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_banners') THEN
        CREATE TRIGGER set_timestamp_banners
            BEFORE UPDATE ON banners
            FOR EACH ROW
            EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
END $$;

-- Step 7: Enable RLS
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE films ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies
DO $$
BEGIN
    -- Schools policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Schools are viewable by authenticated users') THEN
        CREATE POLICY "Schools are viewable by authenticated users" ON schools FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Schools are manageable by admins') THEN
        CREATE POLICY "Schools are manageable by admins" ON schools FOR ALL USING (
            EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
        );
    END IF;
    
    -- Categories policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Categories are viewable by authenticated users') THEN
        CREATE POLICY "Categories are viewable by authenticated users" ON categories FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Categories are manageable by admins') THEN
        CREATE POLICY "Categories are manageable by admins" ON categories FOR ALL USING (
            EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
        );
    END IF;
    
    -- Films policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Films are viewable by authenticated users') THEN
        CREATE POLICY "Films are viewable by authenticated users" ON films FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Films are manageable by admins') THEN
        CREATE POLICY "Films are manageable by admins" ON films FOR ALL USING (
            EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
        );
    END IF;
    
    -- Users policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users are manageable by admins') THEN
        CREATE POLICY "Users are manageable by admins" ON users FOR ALL USING (
            EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
        );
    END IF;
END $$;

-- Step 9: Insert default categories (with duplicate handling)
DO $$
BEGIN
    -- Insert categories only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Below 7 years') THEN
        INSERT INTO categories (name, min_age, max_age, description) VALUES
        ('Below 7 years', 0, 7, 'Content suitable for children below 7 years');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = '10+ years') THEN
        INSERT INTO categories (name, min_age, max_age, description) VALUES
        ('10+ years', 10, 15, 'Content suitable for children 10 years and above');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM categories WHERE name = '13+ years') THEN
        INSERT INTO categories (name, min_age, max_age, description) VALUES
        ('13+ years', 13, 18, 'Content suitable for teenagers 13 years and above');
    END IF;
    
    RAISE NOTICE 'Categories setup completed';
END $$;

-- Step 10: Create admin setup with better cleanup
DO $$
DECLARE
    admin_user_id UUID;
    admin_school_id UUID;
BEGIN
    -- More thorough cleanup of existing admin data
    DELETE FROM school_subscriptions WHERE school_id IN (SELECT id FROM schools WHERE code = 'ADMIN001');
    DELETE FROM users WHERE id IN (SELECT id FROM auth.users WHERE email = 'praveend@lxl.in');
    DELETE FROM auth.users WHERE email = 'praveend@lxl.in';
    DELETE FROM schools WHERE code = 'ADMIN001';
    
    -- Clean up any duplicate categories using a safer approach
    WITH duplicate_categories AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as rn
        FROM categories
    )
    DELETE FROM categories WHERE id IN (
        SELECT id FROM duplicate_categories WHERE rn > 1
    );
    
    -- Create admin school
    INSERT INTO schools (name, code, contact_email, is_active) 
    VALUES ('SCIFF Administration', 'ADMIN001', 'praveend@lxl.in', true)
    RETURNING id INTO admin_school_id;
    
    -- Generate UUID for admin
    admin_user_id := gen_random_uuid();
    
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
    
    RAISE NOTICE 'Admin user created successfully: praveend@lxl.in / Apple@123';
END $$;

-- Step 11: Add sample data
DO $$
BEGIN
    -- Add films
    IF NOT EXISTS (SELECT 1 FROM films WHERE title = 'The Little Explorer') THEN
        INSERT INTO films (title, category_id, external_url, runtime_seconds, thumbnail_url, description, is_active) VALUES
        ('The Little Explorer', (SELECT id FROM categories WHERE name = 'Below 7 years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 596, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=300&fit=crop', 'A wonderful adventure story for young children', true),
        ('Magic Garden', (SELECT id FROM categories WHERE name = 'Below 7 years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 653, 'https://images.unsplash.com/photo-1516975527983-3e2a11a9d9cb?w=500&h=300&fit=crop', 'Discover the magic in a beautiful garden', true),
        ('Space Adventure', (SELECT id FROM categories WHERE name = '10+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 888, 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=500&h=300&fit=crop', 'Explore the mysteries of space and planets', true),
        ('The Young Scientist', (SELECT id FROM categories WHERE name = '10+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', 734, 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=500&h=300&fit=crop', 'Follow a young scientist''s incredible discoveries', true),
        ('Future Leaders', (SELECT id FROM categories WHERE name = '13+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 596, 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=500&h=300&fit=crop', 'Stories of young leaders making a difference', true),
        ('Digital Revolution', (SELECT id FROM categories WHERE name = '13+ years'), 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 888, 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=300&fit=crop', 'Explore the impact of technology on society', true);
    END IF;
    
    -- Add banners
    IF NOT EXISTS (SELECT 1 FROM banners WHERE title = 'Welcome to SCIFF 2024') THEN
        INSERT INTO banners (title, image_url, link_url, is_active, display_order) VALUES
        ('Welcome to SCIFF 2024', 'https://images.unsplash.com/photo-1489599162914-09ffb00a3bd3?w=800&h=400&fit=crop', NULL, true, 1),
        ('Film Festival Highlights', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop', NULL, true, 2),
        ('Educational Cinema Experience', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&h=400&fit=crop', NULL, true, 3);
    END IF;
    
    -- Add Bangalore schools
    INSERT INTO schools (name, code, contact_email, is_active)
    SELECT * FROM (VALUES
        ('Bishop Cotton Boys School Bangalore', 'BCBS001', 'principal@bishopscottonboys.edu.in', true),
        ('Mallya Aditi International School', 'MAIS002', 'admissions@mallya-aditi.org', true),
        ('The International School Bangalore', 'TISB003', 'info@tisb.org', true),
        ('Inventure Academy', 'INVA004', 'admissions@inventureacademy.com', true),
        ('Greenwood High International School', 'GHIS005', 'info@greenwoodhigh.edu.in', true)
    ) AS t(name, code, contact_email, is_active)
    WHERE NOT EXISTS (SELECT 1 FROM schools WHERE schools.code = t.code);
    
    -- Add subscriptions (15 days) with proper duplicate handling
    INSERT INTO school_subscriptions (school_id, category_id, start_date, expiry_date, active)
    SELECT 
        s.id as school_id,
        c.id as category_id,
        NOW() as start_date,
        NOW() + INTERVAL '15 days' as expiry_date,
        true as active
    FROM 
        (SELECT id FROM schools WHERE code = 'ADMIN001' LIMIT 1) s,
        (SELECT id FROM categories WHERE name IN ('Below 7 years', '10+ years', '13+ years')) c
    UNION ALL
    SELECT 
        s.id as school_id,
        c.id as category_id,
        NOW() as start_date,
        NOW() + INTERVAL '15 days' as expiry_date,
        true as active
    FROM 
        (SELECT id FROM schools WHERE code = 'BCBS001' LIMIT 1) s,
        (SELECT id FROM categories WHERE name IN ('Below 7 years', '10+ years', '13+ years')) c
    WHERE EXISTS (SELECT 1 FROM schools WHERE code = 'BCBS001')
    ON CONFLICT (school_id, category_id) DO UPDATE SET
    expiry_date = EXCLUDED.expiry_date,
    active = EXCLUDED.active;
    
    RAISE NOTICE 'Sample data added successfully';
END $$;

-- Step 12: Final verification
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
        RAISE NOTICE '🎉 COMPLETE SETUP SUCCESSFUL!';
        RAISE NOTICE '📧 Login: praveend@lxl.in / Apple@123';
        RAISE NOTICE '🌐 Frontend: http://localhost:5174';
        RAISE NOTICE '✅ Platform is ready for use!';
    ELSE
        RAISE NOTICE '❌ Setup verification failed';
    END IF;
END $$;

-- Show final status
SELECT 
    'SETUP_COMPLETE' as status,
    (SELECT COUNT(*) FROM schools) as total_schools,
    (SELECT COUNT(*) FROM films) as total_films,
    (SELECT COUNT(*) FROM categories) as total_categories,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM banners) as total_banners;

-- Show admin details
SELECT 
    'ADMIN_READY' as type,
    u.username,
    u.role,
    s.name as school,
    au.email
FROM users u
JOIN schools s ON u.school_id = s.id
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'praveend@lxl.in';