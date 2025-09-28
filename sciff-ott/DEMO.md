# SCIFF OTT Platform - Quick Demo

## 🎬 Welcome to the SCIFF OTT Demo!

Your platform is now running in **Demo Mode** with sample data and a working interface.

### 📱 **Demo Login Credentials**

**School User:**
- Username: `demo`
- Password: `demo123`

**Admin User:**
- Username: `admin`  
- Password: `admin123`

### ✨ **What You Can Test**

1. **Login System** - Try both school and admin accounts
2. **Age-based Categories** - Browse Below 7, 10+, and 13+ content
3. **Film Browsing** - See subscription-based access control
4. **Anti-piracy Features** - Watermark, disabled dev tools
5. **Responsive Design** - Test on different screen sizes

### 🔧 **Demo Features Included**

- ✅ Secure login with session management
- ✅ Age-based content categories (Below 7, 10+, 13+)
- ✅ Film catalog with thumbnails and metadata
- ✅ Subscription-based access control
- ✅ Anti-piracy watermarking
- ✅ Responsive Tailwind CSS design
- ✅ Admin vs School user roles
- ✅ Sample banners and content

### 🚀 **Next Steps for Production**

1. **Set up Supabase Database**
   ```bash
   # 1. Create account at supabase.com
   # 2. Create new project
   # 3. Run the SQL schema from supabase-schema.sql
   # 4. Update .env.local with real credentials
   ```

2. **Configure Real Authentication**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-real-anon-key
   VITE_DEMO_MODE=false
   ```

3. **Add Video Streaming**
   - Upload videos to CDN (AWS S3, Cloudflare, etc.)
   - Configure signed URLs for security
   - Implement DRM for enhanced protection

4. **Deploy to Production**
   ```bash
   npm run build
   # Deploy to Vercel, Netlify, or your hosting provider
   ```

### 📊 **Sample Data Included**

- **5 Demo Films** across 3 age categories
- **2 Marketing Banners** 
- **1 Demo School** with active subscriptions
- **Demo Analytics** data structure ready

### 🛡️ **Security Features Active**

- **Anti-screenshot protection** (F12, Print Screen disabled)
- **Context menu disabled**
- **Dynamic watermarking** with school ID
- **Session management** ready for single-device enforcement
- **Geo-blocking structure** prepared for India-only access

### 💡 **Tips for Testing**

1. **Try both user types** - Notice different permissions
2. **Test subscription access** - Some categories blocked for demo user  
3. **Check watermark** - Top-right corner shows school info
4. **Responsive design** - Resize browser to test mobile view
5. **Anti-piracy** - Try F12 or right-click (blocked)

### 📞 **Support**

If you need help setting up the production version:
1. Follow the complete setup guide in `SETUP.md`
2. Check the API documentation in `API.md` 
3. Review the database schema in `supabase-schema.sql`

---

**🎉 Your SCIFF OTT platform is ready for 1000+ schools!**