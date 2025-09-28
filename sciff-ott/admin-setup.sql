-- 🔐 SCIFF OTT Admin Setup for praveend@lxl.in
-- Run this after running supabase-schema.sql

-- Create admin school
INSERT INTO schools (name, code, contact_email, is_active) 
VALUES ('SCIFF Administration', 'ADMIN001', 'praveend@lxl.in', true);

-- Create admin user with real credentials
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
    'praveend@lxl.in',
    crypt('Apple@123', gen_salt('bf')),
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
INSERT INTO users (id, username, role, school_id)
SELECT 
    id, 
    'praveend', 
    'admin', 
    (SELECT id FROM schools WHERE code = 'ADMIN001' LIMIT 1)
FROM auth.users WHERE email = 'praveend@lxl.in';

-- Verify setup
SELECT 
    'Admin Setup Complete!' as status,
    u.username,
    u.role,
    s.name as school_name,
    au.email
FROM users u
JOIN schools s ON u.school_id = s.id
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'praveend@lxl.in';

-- Success message
SELECT '🎉 Admin Login: praveend@lxl.in / Apple@123' as message;