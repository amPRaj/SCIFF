-- Emergency Database Repair Script
-- Run this in Supabase SQL Editor if tables are missing or have access issues

-- Step 1: Create enum type if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'school_user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Temporarily disable RLS for repair
ALTER TABLE IF EXISTS schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS films DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS school_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS viewing_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS login_activity DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS banners DISABLE ROW LEVEL SECURITY;

-- Step 3: Create essential tables
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

-- Step 4: Insert test school and admin user
INSERT INTO schools (name, code, contact_email, is_active) 
VALUES ('Admin School', 'ADMIN_SCHOOL', 'praveend@lxl.in', true)
ON CONFLICT (code) DO NOTHING;

-- Step 5: Check if admin user exists in auth.users
DO $$
DECLARE
    admin_school_id UUID;
    admin_auth_id UUID;
BEGIN
    -- Get admin school ID
    SELECT id INTO admin_school_id FROM schools WHERE code = 'ADMIN_SCHOOL';
    
    -- Check if auth user exists
    SELECT id INTO admin_auth_id FROM auth.users WHERE email = 'praveend@lxl.in';
    
    IF admin_auth_id IS NOT NULL AND admin_school_id IS NOT NULL THEN
        -- Insert/update admin user profile
        INSERT INTO users (id, school_id, username, role, is_active)
        VALUES (admin_auth_id, admin_school_id, 'admin', 'admin', true)
        ON CONFLICT (id) DO UPDATE SET
            school_id = admin_school_id,
            username = 'admin',
            role = 'admin',
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE 'Admin user profile created/updated for: %', admin_auth_id;
    ELSE
        RAISE NOTICE 'Admin auth user not found. Please create auth user first.';
    END IF;
END $$;

-- Step 6: Insert categories
INSERT INTO categories (name, min_age, max_age, description) VALUES
('Below 7 Years', 0, 6, 'Content suitable for children below 7 years'),
('10+ Years', 10, 12, 'Content suitable for children 10 years and above'),
('13+ Years', 13, 18, 'Content suitable for teenagers 13 years and above')
ON CONFLICT DO NOTHING;

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.schools TO anon, authenticated;
GRANT ALL ON public.categories TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

-- Step 8: Quick verification
SELECT 'Schools count' as table_name, count(*) as records FROM schools
UNION ALL
SELECT 'Categories count' as table_name, count(*) as records FROM categories
UNION ALL
SELECT 'Users count' as table_name, count(*) as records FROM users;

-- Final message
SELECT 'Database repair completed. Try logging in again.' as status;