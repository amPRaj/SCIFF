# SCIFF OTT Platform - Production Setup Guide

## 🚀 Complete Setup Instructions

### Phase 1: Supabase Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note down Project URL and Anon Key

2. **Database Setup**
   ```sql
   -- Step 1: Run the main schema
   -- Copy and paste contents of supabase-schema.sql into SQL Editor
   
   -- Step 2: Run sample data (optional)
   -- Copy and paste contents of sample-data.sql into SQL Editor
   ```

3. **Authentication Settings**
   - Go to Authentication → Settings
   - Enable Email confirmation: OFF (for development)
   - Add these URLs to redirect URLs:
     - `http://localhost:5173/**`
     - `https://yourdomain.com/**` (for production)

### Phase 2: Frontend Setup

1. **Environment Configuration**
   ```bash
   # Update .env.local
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_APP_NAME=SCIFF OTT Platform
   VITE_ENCRYPTION_KEY=sciff-ott-secret-key-2024
   VITE_ALLOWED_COUNTRIES=IN
   VITE_WATERMARK_ENABLED=true
   ```

2. **Install and Run**
   ```bash
   npm install
   npm run dev
   ```

### Phase 3: Initial Data Setup

1. **Login with Admin Account**
   - Username: `admin`
   - Password: `admin123`

2. **Test with Sample Schools**
   - Username: `dps001`, Password: `school123` (Access: All categories)
   - Username: `sxs002`, Password: `school123` (Access: 10+ and 13+ years)
   - Username: `kv003`, Password: `school123` (Access: Below 7 and 10+ years)

### Phase 4: Production Deployment

#### Option A: Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - Other environment variables
```

#### Option B: Netlify Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist

# Add environment variables in Netlify dashboard
```

### Phase 5: Content Management

1. **Adding Schools (Bulk Upload)**
   - Prepare CSV with columns: name, code, contact_email
   - Use admin dashboard to upload

2. **Adding Films**
   - Upload video files to your CDN (AWS S3, Cloudflare, etc.)
   - Add film URLs through admin dashboard
   - Ensure videos are publicly accessible but not easily guessable URLs

3. **Managing Subscriptions**
   - Assign categories to schools
   - Set expiry dates (15/20 days)
   - Monitor usage through analytics

### Phase 6: Security Hardening

1. **Video URLs Security**
   ```javascript
   // Implement signed URLs for video access
   // Use CDN with time-limited access tokens
   // Example with AWS CloudFront:
   const signedUrl = getSignedUrl(videoUrl, expiresIn: 3600);
   ```

2. **DRM Integration (Optional)**
   ```javascript
   // Integrate with DRM providers like:
   // - AWS Elemental MediaConvert + DRM
   // - Widevine/PlayReady
   // - BuyDRM, EZDRM, etc.
   ```

3. **Enhanced Geo-blocking**
   ```javascript
   // Use MaxMind GeoIP2 or similar service
   // Block VPNs and proxy servers
   // Implement country-level restrictions
   ```

### Phase 7: Monitoring & Analytics

1. **Error Tracking**
   ```bash
   # Install Sentry
   npm install @sentry/react @sentry/tracing
   
   # Configure in main.tsx
   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
     environment: "production"
   });
   ```

2. **Performance Monitoring**
   - Use Vercel Analytics or Google Analytics
   - Monitor video loading times
   - Track user engagement metrics

3. **Database Monitoring**
   - Use Supabase dashboard for query performance
   - Set up alerts for high usage
   - Monitor viewing patterns

### Phase 8: Backup & Recovery

1. **Database Backups**
   ```sql
   -- Create backup function in Supabase
   CREATE OR REPLACE FUNCTION backup_viewing_logs()
   RETURNS void AS $$
   BEGIN
     -- Export viewing logs periodically
     -- Implementation depends on your backup strategy
   END;
   $$ LANGUAGE plpgsql;
   ```

2. **File Backups**
   - Regular backup of environment configurations
   - Version control for database schema changes
   - Document recovery procedures

## 🔧 Customization Options

### UI Customization
1. **Branding**
   - Update logo in `src/assets/`
   - Modify colors in `tailwind.config.js`
   - Update app name in environment variables

2. **Content Categories**
   ```sql
   -- Add new categories
   INSERT INTO categories (name, min_age, max_age, description) VALUES
   ('Adult Education', 18, 99, 'Content for adult learners');
   ```

### Feature Extensions
1. **Payment Integration**
   - Add Stripe/Razorpay for subscription payments
   - Implement auto-renewal systems

2. **Mobile App**
   - Use React Native with same backend
   - Enhanced security for mobile platforms

3. **Live Streaming**
   - Integrate with streaming services
   - Add real-time chat features

## 📋 Maintenance Checklist

### Daily
- [ ] Monitor error logs
- [ ] Check viewing statistics
- [ ] Verify system uptime

### Weekly
- [ ] Review user activity reports
- [ ] Check subscription expirations
- [ ] Monitor storage usage

### Monthly
- [ ] Database performance review
- [ ] Security audit
- [ ] User feedback analysis
- [ ] Content engagement review

## 🆘 Troubleshooting Guide

### Common Issues

1. **Login Issues**
   ```sql
   -- Check user exists
   SELECT * FROM users WHERE username = 'username';
   
   -- Check subscription status
   SELECT * FROM school_subscriptions 
   WHERE school_id = 'school-id' AND active = true;
   ```

2. **Video Playback Issues**
   - Verify video URL accessibility
   - Check CORS settings on CDN
   - Validate subscription access

3. **Performance Issues**
   ```sql
   -- Check query performance
   EXPLAIN ANALYZE SELECT * FROM films 
   WHERE category_id = 'category-id';
   
   -- Add indexes if needed
   CREATE INDEX IF NOT EXISTS idx_films_category_active 
   ON films(category_id, is_active);
   ```

### Support Contacts
- Technical Issues: [Your support email]
- Content Issues: [Content team email]
- Emergency: [Emergency contact]

## 📊 Success Metrics

### Key Performance Indicators
- **User Engagement**: Average watch time per session
- **Content Performance**: Most watched films by category
- **System Performance**: Page load times, video start times
- **Security Metrics**: Failed login attempts, blocked access attempts

### Reporting Schedule
- **Daily**: System health and user activity
- **Weekly**: Content performance and user engagement
- **Monthly**: Comprehensive analytics and recommendations

---

**Note**: This platform is built for scalability and security. Regular updates and monitoring are essential for optimal performance.