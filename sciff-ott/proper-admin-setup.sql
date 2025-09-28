-- Proper Admin Setup - No Admin School Needed
-- This creates a standalone admin user and proper admin dashboard structure

-- Step 1: Create enum type if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'school_user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Disable RLS temporarily for setup
ALTER TABLE IF EXISTS schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS films DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS school_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS viewing_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS login_activity DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS banners DISABLE ROW LEVEL SECURITY;

-- Step 3: Create tables
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) UNIQUE NOT NULL,
    contact_email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    principal_name VARCHAR(255),
    principal_phone VARCHAR(20),
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
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
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
    director VARCHAR(255),
    year INTEGER,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modified users table - admin users don't need school_id
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NULL, -- NULL for admin users
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
    total_duration INTEGER,
    completion_percentage DECIMAL(5,2),
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
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NULL, -- NULL for admin
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

-- Step 4: Create admin user profile (no school required)
DO $$
DECLARE
    admin_auth_id UUID;
BEGIN
    -- Get admin auth ID
    SELECT id INTO admin_auth_id FROM auth.users WHERE email = 'praveend@lxl.in';
    
    IF admin_auth_id IS NOT NULL THEN
        -- Insert standalone admin user (no school_id)
        INSERT INTO users (id, school_id, username, role, is_active)
        VALUES (admin_auth_id, NULL, 'admin', 'admin', true)
        ON CONFLICT (id) DO UPDATE SET
            school_id = NULL,
            username = 'admin',
            role = 'admin',
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE 'Standalone admin user created: %', admin_auth_id;
    ELSE
        RAISE NOTICE 'Admin auth user not found. Please create in Supabase Auth first.';
    END IF;
END $$;

-- Step 5: Ensure display_order column exists (in case table existed before)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Step 6: Insert default categories
INSERT INTO categories (name, min_age, max_age, description, display_order) VALUES
('Below 7 Years', 0, 6, 'Content suitable for children below 7 years', 1),
('10+ Years', 10, 12, 'Content suitable for children 10 years and above', 2),
('13+ Years', 13, 18, 'Content suitable for teenagers 13 years and above', 3)
ON CONFLICT DO NOTHING;

-- Step 7: Ensure required columns exist in schools table
ALTER TABLE schools ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS state VARCHAR(100);

-- Step 8: Insert Bangalore schools (for demo)
INSERT INTO schools (name, code, contact_email, city, state, is_active) VALUES
('Delhi Public School Bangalore North', 'DPS_BLR_N', 'info@dpsbangalorenorth.com', 'Bangalore', 'Karnataka', true),
('Bangalore International School', 'BIS_BLR', 'admissions@bangaloreinternationalschool.com', 'Bangalore', 'Karnataka', true),
('National Public School Koramangala', 'NPS_KOR', 'info@npskormangala.com', 'Bangalore', 'Karnataka', true),
('Bishop Cotton Boys School', 'BCBS_BLR', 'office@bishoptonboys.edu', 'Bangalore', 'Karnataka', true),
('Kendriya Vidyalaya Hebbal', 'KV_HEB', 'kvhebbal@gmail.com', 'Bangalore', 'Karnataka', true),
('National Academy For Learning', 'NAFL_BLR', 'info@nafl.in', 'Bangalore', 'Karnataka', true),
('The International School Bangalore', 'TISB_BLR', 'admissions@tisb.ac.in', 'Bangalore', 'Karnataka', true),
('Indus International School', 'IIS_BLR', 'info@indusschool.com', 'Bangalore', 'Karnataka', true),
('Ryan International School', 'RYAN_BLR', 'bangalore@ryangroup.org', 'Bangalore', 'Karnataka', true),
('Inventure Academy', 'IA_BLR', 'info@inventureacademy.com', 'Bangalore', 'Karnataka', true)
ON CONFLICT (code) DO NOTHING;

-- Step 9: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.schools TO anon, authenticated;
GRANT ALL ON public.categories TO anon, authenticated;
GRANT ALL ON public.films TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.school_subscriptions TO anon, authenticated;
GRANT ALL ON public.viewing_logs TO anon, authenticated;
GRANT ALL ON public.login_activity TO anon, authenticated;
GRANT ALL ON public.banners TO anon, authenticated;

-- Step 10: Verification
SELECT 
    'Admin Setup Complete' as status,
    (SELECT count(*) FROM schools) as schools_count,
    (SELECT count(*) FROM categories) as categories_count,
    (SELECT count(*) FROM users WHERE role = 'admin') as admin_count,
    (SELECT username FROM users WHERE role = 'admin' LIMIT 1) as admin_username;