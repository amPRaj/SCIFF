# API Documentation - SCIFF OTT Platform

## Database Functions

### Authentication Functions

#### `check_subscription_access(user_id, category_id)`
Checks if a user's school has active subscription for a specific category.

```sql
SELECT check_subscription_access('user-uuid', 'category-uuid');
-- Returns: boolean (true if access granted)
```

#### `log_film_viewing(film_id, ip_address, device_info, country, city)`
Creates a viewing log entry and returns the log ID.

```sql
SELECT log_film_viewing(
  'film-uuid',
  '192.168.1.1'::inet,
  'Mozilla/5.0...',
  'IN',
  'Mumbai'
);
-- Returns: UUID (viewing log ID)
```

#### `is_access_allowed(ip_address)`
Checks if access is allowed from a specific IP address (geo-blocking).

```sql
SELECT is_access_allowed('103.21.58.1'::inet);
-- Returns: boolean (true if allowed)
```

## Row Level Security Policies

### Schools Table
- **SELECT**: Viewable by authenticated users
- **INSERT/UPDATE/DELETE**: Admin only

### Films Table
- **SELECT**: Viewable by authenticated users
- **INSERT/UPDATE/DELETE**: Admin only

### School Subscriptions Table
- **SELECT**: Users can view their school's subscriptions, admins can view all
- **INSERT/UPDATE/DELETE**: Admin only

### Viewing Logs Table
- **SELECT**: Users can view their school's logs, admins can view all
- **INSERT**: Any authenticated user (for logging views)
- **UPDATE/DELETE**: Admin only

## Frontend API Functions

### Authentication Service (`authService`)

#### `login(credentials)`
```typescript
const result = await authService.login({
  username: 'school001',
  password: 'password123'
});

// Returns: { success: boolean, user?: User, error?: string }
```

#### `logout()`
```typescript
await authService.logout();
```

#### `getCurrentUser()`
```typescript
const user = await authService.getCurrentUser();
// Returns: User | null
```

#### `checkSessionValidity()`
```typescript
const isValid = await authService.checkSessionValidity();
// Returns: boolean
```

#### `createSchoolUser(userData)`
```typescript
const result = await authService.createSchoolUser({
  username: 'school001',
  email: 'school001@example.com',
  password: 'password123',
  schoolId: 'school-uuid',
  role: 'school_user'
});

// Returns: { success: boolean, error?: string, userId?: string }
```

### Supabase Queries

#### Get Films by Category
```typescript
const { data: films } = await supabase
  .from('films')
  .select(`
    *,
    category:categories(*)
  `)
  .eq('category_id', categoryId)
  .eq('is_active', true);
```

#### Get School Subscriptions
```typescript
const { data: subscriptions } = await supabase
  .from('school_subscriptions')
  .select(`
    *,
    category:categories(*),
    school:schools(*)
  `)
  .eq('school_id', schoolId)
  .eq('active', true)
  .gte('expiry_date', new Date().toISOString());
```

#### Create Viewing Log
```typescript
const { data: logData } = await supabase
  .from('viewing_logs')
  .insert({
    school_id: schoolId,
    film_id: filmId,
    user_id: userId,
    ip_address: ipAddress,
    device_info: navigator.userAgent,
    watermark_id: generateWatermarkId()
  })
  .select('id')
  .single();
```

#### Update Viewing Log
```typescript
await supabase
  .from('viewing_logs')
  .update({
    watched_seconds: Math.floor(watchedSeconds),
    ended_at: new Date().toISOString()
  })
  .eq('id', viewingLogId);
```

## Analytics Queries

### School-wise Viewing Statistics
```sql
SELECT 
  s.name as school_name,
  s.code as school_code,
  COUNT(vl.id) as total_views,
  SUM(vl.watched_seconds) as total_watch_time,
  AVG(vl.watched_seconds) as avg_watch_time
FROM schools s
LEFT JOIN viewing_logs vl ON s.id = vl.school_id
WHERE vl.started_at >= NOW() - INTERVAL '30 days'
GROUP BY s.id, s.name, s.code
ORDER BY total_views DESC;
```

### Film Popularity
```sql
SELECT 
  f.title,
  c.name as category,
  COUNT(vl.id) as view_count,
  AVG(vl.watched_seconds) as avg_watch_time,
  f.runtime_seconds,
  ROUND(AVG(vl.watched_seconds) * 100.0 / f.runtime_seconds, 2) as completion_rate
FROM films f
JOIN categories c ON f.category_id = c.id
LEFT JOIN viewing_logs vl ON f.id = vl.film_id
WHERE vl.started_at >= NOW() - INTERVAL '30 days'
GROUP BY f.id, f.title, c.name, f.runtime_seconds
ORDER BY view_count DESC;
```

### Login Activity Summary
```sql
SELECT 
  s.name as school_name,
  u.username,
  COUNT(la.id) as login_count,
  MAX(la.logged_in_at) as last_login,
  COUNT(CASE WHEN la.logged_out_at IS NULL THEN 1 END) as active_sessions
FROM login_activity la
JOIN users u ON la.user_id = u.id
JOIN schools s ON la.school_id = s.id
WHERE la.logged_in_at >= NOW() - INTERVAL '7 days'
GROUP BY s.id, s.name, u.id, u.username
ORDER BY login_count DESC;
```

### Subscription Utilization
```sql
SELECT 
  c.name as category,
  COUNT(ss.id) as subscribed_schools,
  COUNT(CASE WHEN ss.expiry_date > NOW() THEN 1 END) as active_subscriptions,
  COUNT(vl.id) as total_views,
  ROUND(COUNT(vl.id)::numeric / NULLIF(COUNT(ss.id), 0), 2) as views_per_school
FROM categories c
LEFT JOIN school_subscriptions ss ON c.id = ss.category_id
LEFT JOIN viewing_logs vl ON ss.school_id = vl.school_id 
  AND vl.started_at >= ss.start_date 
  AND vl.started_at <= ss.expiry_date
GROUP BY c.id, c.name
ORDER BY total_views DESC;
```

## Environment Variables

### Required Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=SCIFF OTT Platform
VITE_ENCRYPTION_KEY=your-secret-key
VITE_ALLOWED_COUNTRIES=IN
VITE_WATERMARK_ENABLED=true
```

### Optional Variables
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_DRM_LICENSE_URL=https://drm-provider.com/license
VITE_CDN_BASE_URL=https://cdn.yourdomain.com
VITE_ANALYTICS_ID=your-analytics-id
```

## Error Codes

### Authentication Errors
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Account suspended
- `AUTH_003`: Session expired
- `AUTH_004`: Geographic restriction
- `AUTH_005`: Device limit exceeded

### Access Errors
- `ACCESS_001`: No subscription found
- `ACCESS_002`: Subscription expired
- `ACCESS_003`: Category not accessible
- `ACCESS_004`: Content not available

### System Errors
- `SYS_001`: Database connection error
- `SYS_002`: Video streaming error
- `SYS_003`: Analytics logging error
- `SYS_004`: File upload error

## Rate Limiting

### API Endpoints
- Login: 5 attempts per minute per IP
- Video requests: 10 per minute per user
- Analytics queries: 100 per hour per admin

### Implementation Example
```typescript
// In auth service
const rateLimiter = new Map();

const checkRateLimit = (key: string, limit: number, window: number) => {
  const now = Date.now();
  const windowStart = now - window;
  
  if (!rateLimiter.has(key)) {
    rateLimiter.set(key, []);
  }
  
  const attempts = rateLimiter.get(key)
    .filter((time: number) => time > windowStart);
  
  if (attempts.length >= limit) {
    throw new Error('Rate limit exceeded');
  }
  
  attempts.push(now);
  rateLimiter.set(key, attempts);
};
```

## Security Headers

### Required Headers
```nginx
# CSP for video security
Content-Security-Policy: media-src 'self' https://your-cdn.com;

# Prevent embedding
X-Frame-Options: DENY

# HTTPS only
Strict-Transport-Security: max-age=31536000; includeSubDomains

# Prevent MIME sniffing
X-Content-Type-Options: nosniff
```

## Monitoring & Alerts

### Key Metrics to Monitor
1. Failed login attempts > 10/minute
2. Video streaming errors > 5%
3. Database query time > 1000ms
4. Concurrent users > 1000
5. Storage usage > 80%

### Alert Configuration
```yaml
alerts:
  - name: "High Failed Logins"
    condition: "failed_logins_per_minute > 10"
    action: "notify_admin"
  
  - name: "Video Streaming Issues"
    condition: "video_error_rate > 0.05"
    action: "notify_tech_team"
  
  - name: "Database Performance"
    condition: "avg_query_time > 1000"
    action: "scale_database"
```