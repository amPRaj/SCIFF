# 🚀 SCIFF OTT Backend Setup Guide

Since you've added your Supabase API keys, let's complete the backend setup for your SCIFF OTT platform.

## ✅ **Step 1: Database Schema Setup**

### 1.1 Go to Supabase SQL Editor
1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**

### 1.2 Run the Database Schema
Copy and paste the entire content from `supabase-schema.sql` into the SQL editor and execute it.

**This will create:**
- ✅ All required tables (schools, users, categories, films, etc.)
- ✅ Row Level Security (RLS) policies
- ✅ Database functions for access control
- ✅ Triggers for automatic timestamps
- ✅ Indexes for performance
- ✅ Default age categories (Below 7, 10+, 13+)

## ✅ **Step 2: Authentication Configuration**

### 2.1 Configure Auth Settings
1. Go to **Authentication → Settings** in Supabase
2. Update these settings:

```
Site URL: http://localhost:5173
Additional Redirect URLs: 
- http://localhost:5173/**
- https://yourdomain.com/** (for production)

Enable email confirmations: OFF (for development)
Enable phone confirmations: OFF
```

### 2.2 Disable Public Registration
1. Go to **Authentication → Settings → Auth**
2. Turn OFF **"Enable email signups"**
3. This ensures only admins can create accounts

## ✅ **Step 3: Create Admin User**

### 3.1 Create First Admin Account
Run this SQL in Supabase SQL Editor:

```sql
-- Create admin auth user
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

-- Create a sample school first
INSERT INTO schools (name, code, contact_email, is_active) VALUES
('SCIFF Admin School', 'ADMIN001', 'admin@sciff.edu', true);

-- Create admin user profile
INSERT INTO users (id, username, role, school_id)
SELECT 
    id, 
    'admin', 
    'admin', 
    (SELECT id FROM schools WHERE code = 'ADMIN001' LIMIT 1)
FROM auth.users WHERE email = 'admin@sciff.internal';
```

## ✅ **Step 4: Add Sample Data (Optional)**

### 4.1 Run Sample Data Script
Copy and paste the content from `sample-data.sql` to get:
- ✅ 5 sample schools
- ✅ 15 demo films across 3 categories
- ✅ Active subscriptions
- ✅ Sample users
- ✅ Marketing banners

## ✅ **Step 5: Configure Storage (Optional)**

### 5.1 Create Storage Buckets
If you plan to upload thumbnails/banners:

```sql
-- Create storage bucket for thumbnails
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);

-- Set storage policies
CREATE POLICY "Thumbnails are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');
```

## ✅ **Step 6: Test Your Setup**

### 6.1 Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 6.2 Test Login
1. Go to `http://localhost:5173`
2. Login with: `admin` / `admin123`
3. You should see the full platform interface

### 6.3 Verify Database Connection
Check that you can see:
- ✅ Login page loads
- ✅ Authentication works
- ✅ Categories appear
- ✅ Films are displayed (if sample data added)

## 🛠️ **Advanced Configuration**

### Analytics Setup
To enable detailed analytics, add these environment variables:

```env
# Add to .env.local
VITE_ANALYTICS_ENABLED=true
VITE_GEOLOCATION_API_KEY=your_maxmind_key
```

### Email Notifications
Configure SMTP in Supabase:
1. Go to **Settings → Auth**
2. Configure SMTP settings for password reset emails

### File Storage
For video file management:
1. Set up CDN (AWS CloudFront, Cloudflare)
2. Configure signed URLs for security
3. Add DRM integration (optional)

## 🔧 **Troubleshooting**

### Common Issues:

**1. "Cannot connect to Supabase"**
- Verify your API keys in `.env.local`
- Check if Supabase project is active
- Ensure network connection

**2. "Authentication failed"**
- Run the admin user creation SQL
- Check if RLS policies are applied
- Verify email format in auth.users table

**3. "No categories showing"**
- Run the schema SQL completely
- Check if default categories were inserted
- Verify RLS policies allow reading

**4. "Permission denied"**
- Check RLS policies in Supabase dashboard
- Ensure user has correct role
- Verify school_id associations

### Database Queries for Debugging:

```sql
-- Check if admin user exists
SELECT * FROM auth.users WHERE email = 'admin@sciff.internal';

-- Check user profiles
SELECT u.*, s.name as school_name 
FROM users u 
LEFT JOIN schools s ON u.school_id = s.id;

-- Check categories
SELECT * FROM categories;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('users', 'schools', 'categories');
```

## 🎯 **Next Steps**

1. **Add Real Schools**: Use admin dashboard to import school data
2. **Upload Content**: Add film URLs through admin interface
3. **Configure CDN**: Set up video delivery infrastructure
4. **Deploy**: Follow deployment guide in `SETUP.md`
5. **Monitor**: Set up analytics and error tracking

## 📞 **Support Checklist**

Before asking for help, verify:
- [ ] Supabase project is active and accessible
- [ ] All SQL schemas have been executed
- [ ] Environment variables are correctly set
- [ ] Admin user was created successfully
- [ ] RLS policies are enabled
- [ ] Network/firewall allows Supabase connections

---

**🎉 Your SCIFF OTT backend is now fully configured and ready for 1000+ schools!**