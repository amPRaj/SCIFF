-- 🔄 RESET ADMIN USER SCRIPT
-- This will completely remove and recreate the admin user
-- Use this if login keeps failing

-- Step 1: Clean up existing admin user (if any)
DO $$
DECLARE
    existing_admin_id UUID;
BEGIN
    -- Get existing admin user ID
    SELECT id INTO existing_admin_id 
    FROM auth.users 
    WHERE email = 'praveend@lxl.in';
    
    IF existing_admin_id IS NOT NULL THEN
        -- Delete from users table first
        DELETE FROM users WHERE id = existing_admin_id;
        
        -- Delete from auth.users
        DELETE FROM auth.users WHERE id = existing_admin_id;
        
        RAISE NOTICE 'Existing admin user cleaned up';
    END IF;
    
    -- Ensure admin school exists
    INSERT INTO schools (name, code, contact_email, is_active) 
    VALUES ('SCIFF Administration', 'ADMIN001', 'praveend@lxl.in', true)
    ON CONFLICT (code) DO NOTHING;
    
    RAISE NOTICE 'Admin school ready';
END $$;

-- Step 2: Create fresh admin user
DO $$
DECLARE
    new_admin_id UUID;
    admin_school_id UUID;
BEGIN
    -- Generate new UUID
    new_admin_id := gen_random_uuid();
    
    -- Get admin school ID
    SELECT id INTO admin_school_id FROM schools WHERE code = 'ADMIN001';
    
    -- Create auth user with proper password hash
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, confirmation_sent_at, confirmation_token,
        recovery_token, email_change_token_new, email_change, last_sign_in_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_admin_id,
        'authenticated', 'authenticated', 'praveend@lxl.in',
        crypt('Apple@123', gen_salt('bf')), 
        now(), now(), '', '', '', '', now(),
        '{"provider":"email","providers":["email"]}', '{}', 
        FALSE, now(), now()
    );
    
    -- Create user profile
    INSERT INTO users (id, username, role, school_id, is_active)
    VALUES (new_admin_id, 'praveend', 'admin', admin_school_id, true);
    
    RAISE NOTICE 'Fresh admin user created with ID: %', new_admin_id;
    RAISE NOTICE 'Login: praveend@lxl.in / Apple@123';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating admin user: % %', SQLERRM, SQLSTATE;
END $$;

-- Step 3: Verify the new admin user
SELECT 
    'NEW_ADMIN_VERIFICATION' as check_type,
    u.id,
    u.username,
    u.role,
    s.name as school_name,
    au.email,
    au.email_confirmed_at
FROM users u
JOIN schools s ON u.school_id = s.id
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'praveend@lxl.in';

DO $$
BEGIN
    RAISE NOTICE '=== ADMIN RESET COMPLETE ===';
    RAISE NOTICE '✅ Try logging in now with: praveend@lxl.in / Apple@123';
    RAISE NOTICE '🌐 Frontend: http://localhost:5173';
END $$;