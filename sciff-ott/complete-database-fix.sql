-- Complete Database Fix Script
-- Run this in Supabase SQL Editor

-- Step 1: Create admin user in auth.users if not exists
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Check if admin user exists in auth.users
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'praveend@lxl.in';
    
    IF admin_user_id IS NULL THEN
        -- Create admin user in auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            recovery_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            uuid_generate_v4(),
            'authenticated',
            'authenticated',
            'praveend@lxl.in',
            crypt('Apple@123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        );
        
        RAISE NOTICE 'Admin user created in auth.users';
    ELSE
        RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
    END IF;
END $$;

-- Step 2: Create essential tables (run repair script)
-- Create enum type if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'school_user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Disable RLS temporarily
ALTER TABLE IF EXISTS schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;

-- Create tables
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

-- Step 3: Insert admin school
INSERT INTO schools (name, code, contact_email, is_active) 
VALUES ('Admin School', 'ADMIN_SCHOOL', 'praveend@lxl.in', true)
ON CONFLICT (code) DO NOTHING;

-- Step 4: Create admin user profile
DO $$
DECLARE
    admin_school_id UUID;
    admin_auth_id UUID;
BEGIN
    -- Get admin school ID
    SELECT id INTO admin_school_id FROM schools WHERE code = 'ADMIN_SCHOOL';
    
    -- Get admin auth ID
    SELECT id INTO admin_auth_id FROM auth.users WHERE email = 'praveend@lxl.in';
    
    IF admin_auth_id IS NOT NULL AND admin_school_id IS NOT NULL THEN
        -- Insert admin user profile
        INSERT INTO users (id, school_id, username, role, is_active)
        VALUES (admin_auth_id, admin_school_id, 'admin', 'admin', true)
        ON CONFLICT (id) DO UPDATE SET
            school_id = admin_school_id,
            username = 'admin',
            role = 'admin',
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE 'Admin user profile created: %', admin_auth_id;
    ELSE
        RAISE NOTICE 'Error: admin_auth_id=%, admin_school_id=%', admin_auth_id, admin_school_id;
    END IF;
END $$;

-- Step 5: Insert categories
INSERT INTO categories (name, min_age, max_age, description) VALUES
('Below 7 Years', 0, 6, 'Content suitable for children below 7 years'),
('10+ Years', 10, 12, 'Content suitable for children 10 years and above'),
('13+ Years', 13, 18, 'Content suitable for teenagers 13 years and above')
ON CONFLICT DO NOTHING;

-- Step 6: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.schools TO anon, authenticated;
GRANT ALL ON public.categories TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

-- Step 7: Verification
SELECT 
    'Database Fix Complete' as status,
    (SELECT count(*) FROM schools) as schools_count,
    (SELECT count(*) FROM categories) as categories_count,
    (SELECT count(*) FROM users) as users_count,
    (SELECT count(*) FROM auth.users WHERE email = 'praveend@lxl.in') as auth_users_count;