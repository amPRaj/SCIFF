# SCIFF OTT Platform

A secure Over-The-Top (OTT) streaming platform for School Cinema International Film Festival (SCIFF) to showcase films to 1000+ schools with advanced anti-piracy features and comprehensive analytics.

## 🎯 Features

### Core Features
- **Secure Login System** with single device restriction
- **Geo-blocking** (India only access)
- **Age-based Categories**: Below 7 years, 10+ years, 13+ years
- **Anti-piracy Protection**: Watermarking, screenshot prevention, DRM-ready
- **Subscription Management** with expiry dates (15/20 days)
- **Real-time Analytics** and viewing logs
- **Admin Dashboard** for content and user management

### Security Features
- ✅ Single device login enforcement
- ✅ IP-based geo-restriction
- ✅ Anti-screenshot measures
- ✅ Dynamic watermarking
- ✅ Developer tools detection
- ✅ Context menu disabled
- ✅ Drag & drop prevention
- ✅ Comprehensive activity logging

### Admin Features
- School management (bulk upload via Excel/CSV)
- Content management (film URLs, categories)
- Banner management
- Subscription management
- Analytics dashboard
- User activity monitoring
- Export reports

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Router DOM** for routing
- **React Hook Form** for form handling
- **Lucide React** for icons
- **React Hot Toast** for notifications

### Backend
- **Supabase** (PostgreSQL + Auth + Real-time)
- **Row Level Security (RLS)** for data protection
- **Edge Functions** for serverless logic

### Video Player
- Custom HTML5 video player with anti-piracy features
- Support for external video URLs
- Forensic watermarking ready
- DRM integration ready

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 2. Environment Setup

1. **Clone and Install Dependencies**
   ```bash
   cd sciff-ott
   npm install
   ```

2. **Setup Supabase**
   - Create a new project on [Supabase](https://supabase.com)
   - Go to Settings → API to get your keys
   - Update `.env.local` with your Supabase credentials:

   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   VITE_APP_NAME=SCIFF OTT Platform
   VITE_ENCRYPTION_KEY=sciff-ott-secret-key-2024
   VITE_ALLOWED_COUNTRIES=IN
   VITE_WATERMARK_ENABLED=true
   ```

3. **Database Setup**
   - Go to your Supabase dashboard → SQL Editor
   - Copy and paste the contents of `supabase-schema.sql`
   - Run the SQL to create all tables, policies, and functions

4. **Create Default Admin User**
   ```sql
   -- In Supabase SQL Editor
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
     updated_at,
     phone,
     phone_confirmed_at,
     phone_change,
     phone_change_token,
     phone_change_sent_at,
     email_change_token_current,
     email_change_confirm_status,
     banned_until,
     reauthentication_token,
     reauthentication_sent_at
   ) values (
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
     now(),
     NULL,
     NULL,
     '',
     '',
     NULL,
     '',
     0,
     NULL,
     '',
     NULL
   );

   -- Create admin user profile
   INSERT INTO users (id, username, role, school_id)
   SELECT id, 'admin', 'admin', (SELECT id FROM schools LIMIT 1)
   FROM auth.users WHERE email = 'admin@sciff.internal';
   ```

### 3. Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:5173
```

### 4. Default Login Credentials
- **Username**: `admin`
- **Password**: `admin123`

## 📊 Database Schema

### Core Tables
- `schools` - School information
- `users` - User accounts linked to schools
- `categories` - Age-based content categories
- `films` - Film metadata with external URLs
- `school_subscriptions` - Subscription management
- `viewing_logs` - Detailed viewing analytics
- `login_activity` - User session tracking
- `banners` - Homepage banner management

### Key Features
- **Row Level Security (RLS)** on all tables
- **Automated triggers** for timestamp updates
- **Comprehensive indexing** for performance
- **Stored procedures** for complex operations

## 🎬 Usage Guide

### For Schools (End Users)
1. **Login** with provided credentials
2. **Browse Categories** based on subscription access
3. **Watch Films** with secure video player
4. **Automatic Logging** of all viewing activity

### For Administrators
1. **School Management**
   - Add schools manually or via bulk upload
   - Manage school details and status

2. **User Management**
   - Create user accounts for schools
   - Assign roles and permissions

3. **Content Management**
   - Add film URLs to categories
   - Manage film metadata and thumbnails
   - Upload and manage banners

4. **Subscription Management**
   - Assign category access to schools
   - Set expiry dates (15/20 days)
   - Monitor subscription status

5. **Analytics & Reports**
   - View detailed viewing statistics
   - Monitor user activity and login patterns
   - Export data for analysis

## 🔒 Security Implementation

### Anti-Piracy Measures
1. **Dynamic Watermarking**
   - School ID + timestamp overlay
   - Forensic watermarking ready

2. **Screenshot Prevention**
   - Disabled keyboard shortcuts
   - Print Screen detection
   - macOS screenshot prevention

3. **Developer Tools Protection**
   - F12, Ctrl+Shift+I/J disabled
   - DevTools detection
   - Console warnings

4. **Video Protection**
   - Custom controls only
   - Download disabled
   - Right-click disabled
   - Picture-in-picture disabled

### Access Control
1. **Single Device Login**
   - Session management
   - Automatic logout from other devices

2. **Geo-restriction**
   - IP-based country detection
   - India-only access

3. **Subscription Validation**
   - Real-time access checking
   - Expiry date enforcement

## 📈 Analytics & Monitoring

### Tracked Metrics
- **Film Views**: Total views per film
- **School Activity**: Viewing patterns per school
- **User Sessions**: Login/logout times and locations
- **Device Information**: Browser and device details
- **Watching Duration**: Actual time watched vs. film length

### Reports Available
- School-wise viewing reports
- Film popularity analytics
- User activity summaries
- Subscription utilization
- Geographic access patterns

## 🚀 Deployment

### Production Setup
1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel/Netlify**
   ```bash
   # Vercel
   npm install -g vercel
   vercel

   # Or Netlify
   npm install -g netlify-cli
   netlify deploy --prod
   ```

3. **Configure Environment Variables**
   - Set production Supabase credentials
   - Update allowed origins in Supabase
   - Configure DRM settings if using

### Production Considerations
- **CDN Integration**: For video delivery
- **DRM Service**: For enhanced protection
- **Monitoring**: Set up error tracking
- **Backups**: Regular database backups
- **SSL**: Ensure HTTPS everywhere

## 🆘 Troubleshooting

### Common Issues
1. **Cannot login**
   - Check Supabase credentials
   - Verify user exists in database
   - Check geographic restrictions

2. **Videos not playing**
   - Verify external URL accessibility
   - Check subscription status
   - Validate CORS settings

3. **Blank admin dashboard**
   - Verify admin role in database
   - Check RLS policies
   - Ensure proper authentication

### Support
For technical support and feature requests, contact the development team.

## 📝 License

© 2024 SCIFF OTT Platform. All rights reserved.

---

**Note**: This platform is designed specifically for educational institutions and includes robust security measures for content protection. All viewing activities are logged for analytics and anti-piracy purposes.