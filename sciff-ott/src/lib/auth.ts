import { supabase } from './supabase';
import type { User } from './supabase';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  error?: string;
  requiresLogout?: boolean;
}

export interface GeolocationInfo {
  country: string;
  city: string;
  ip: string;
}

class AuthService {
  private sessionKey: string | null = null;

  constructor() {
    this.sessionKey = this.generateSessionKey();
  }

  private generateSessionKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }

  private async getGeolocation(): Promise<GeolocationInfo> {
    try {
      // In production, use a proper geolocation service
      // For now, we'll use a mock response
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      return {
        country: data.country_code || 'IN',
        city: data.city || 'Unknown',
        ip: data.ip || '127.0.0.1'
      };
    } catch (error) {
      console.error('Geolocation error:', error);
      return {
        country: 'IN',
        city: 'Unknown',
        ip: '127.0.0.1'
      };
    }
  }

  private isValidCountry(country: string): boolean {
    const allowedCountries = import.meta.env.VITE_ALLOWED_COUNTRIES?.split(',') || ['IN'];
    return allowedCountries.includes(country);
  }

  private async enforceSessionLimit(userId: string): Promise<void> {
    try {
      // Get current user's forced session key
      const { data: userData } = await supabase
        .from('users')
        .select('forced_session_key, role')
        .eq('id', userId)
        .single();

      // For admin users, we allow multiple sessions but update the primary one
      if (userData?.role === 'admin') {
        // Just update the session key without forcing logout
        await supabase
          .from('users')
          .update({ 
            forced_session_key: this.sessionKey,
            last_login: new Date().toISOString()
          })
          .eq('id', userId);
        return;
      }

      // For regular users, enforce single device login
      if (userData?.forced_session_key && userData.forced_session_key !== this.sessionKey) {
        // Logout previous session by updating the session key
        await supabase
          .from('login_activity')
          .update({ logged_out_at: new Date().toISOString() })
          .eq('user_id', userId)
          .eq('session_key', userData.forced_session_key)
          .is('logged_out_at', null);
      }

      // Update user's forced session key
      await supabase
        .from('users')
        .update({ 
          forced_session_key: this.sessionKey,
          last_login: new Date().toISOString()
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Session enforcement error:', error);
    }
  }

  private async logLoginActivity(userId: string, schoolId: string | null, geo: GeolocationInfo): Promise<void> {
    try {
      await supabase
        .from('login_activity')
        .insert({
          user_id: userId,
          school_id: schoolId,
          session_key: this.sessionKey,
          ip_address: geo.ip,
          user_agent: navigator.userAgent,
          country: geo.country,
          city: geo.city
        });
    } catch (error) {
      console.error('Login activity logging error:', error);
    }
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('Login attempt for:', credentials.email);
      
      // Get geolocation info
      const geo = await this.getGeolocation();

      // Check if access is allowed from this country
      if (!this.isValidCountry(geo.country)) {
        return {
          success: false,
          error: 'Access denied: Service not available in your region'
        };
      }

      // Sign in with Supabase Auth using email directly
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Authentication failed'
        };
      }

      console.log('Auth successful, checking user profile for:', authData.user.id);

      // Get user data after successful auth
      const { data: userDataAfterAuth, error: userErrorAfterAuth } = await supabase
        .from('users')
        .select(`
          *,
          school:schools(*)
        `)
        .eq('id', authData.user.id)
        .eq('is_active', true)
        .single();

      if (userErrorAfterAuth || !userDataAfterAuth) {
        console.error('User profile error:', userErrorAfterAuth);
        console.log('Attempting to create missing profile...');
        
        // Try to create missing user profile for admin
        if (credentials.email === 'praveend@lxl.in') {
          try {
            console.log('Creating standalone admin profile...');
            
            // Create admin profile without school requirement
            const { error: createError } = await supabase
              .from('users')
              .insert({
                id: authData.user.id,
                username: 'admin',
                role: 'admin',
                school_id: null, // Admin doesn't need a school
                is_active: true
              });

            if (createError) {
              console.error('Profile creation error:', createError);
              throw createError;
            }

            console.log('Admin profile created successfully');

            // Retry getting user data
            const { data: retryUserData, error: retryError } = await supabase
              .from('users')
              .select(`
                *,
                school:schools(*)
              `)
              .eq('id', authData.user.id)
              .single();

            if (retryError || !retryUserData) {
              console.error('Retry fetch error:', retryError);
              throw new Error('Failed to fetch created profile');
            }

            console.log('Successfully created and fetched admin profile');

            // Enforce single device login
            await this.enforceSessionLimit(authData.user.id);
            // Log login activity (no school_id for admin)
            await this.logLoginActivity(authData.user.id, null, geo);
            
            return {
              success: true,
              user: retryUserData as User
            };

          } catch (autoFixError) {
            console.error('Auto-fix attempt failed:', autoFixError);
            const errorMessage = autoFixError instanceof Error ? autoFixError.message : 'Unknown error';
            return {
              success: false,
              error: `Profile creation failed: ${errorMessage}. Please run the database setup scripts.`
            };
          }
        }
        
        return {
          success: false,
          error: 'User profile not found. Please contact administrator.'
        };
      }

      console.log('User profile found successfully');

      // Enforce single device login
      await this.enforceSessionLimit(authData.user.id);

      // Log login activity
      await this.logLoginActivity(authData.user.id, userDataAfterAuth.school_id, geo);

      return {
        success: true,
        user: userDataAfterAuth as User
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && this.sessionKey) {
        // Update login activity with logout time
        await supabase
          .from('login_activity')
          .update({ logged_out_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('session_key', this.sessionKey)
          .is('logged_out_at', null);
      }

      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear session key
      this.sessionKey = null;
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data: userData } = await supabase
        .from('users')
        .select(`
          *,
          school:schools(*)
        `)
        .eq('id', user.id)
        .single();

      return userData as User || null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async checkSessionValidity(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No auth user found');
        return false;
      }

      // For admin users, we're more lenient with session checks
      const { data: userData } = await supabase
        .from('users')
        .select('forced_session_key, role, last_login')
        .eq('id', user.id)
        .single();

      if (!userData) {
        console.log('No user data found');
        return false;
      }

      // Admin users get longer sessions
      if (userData.role === 'admin') {
        // Check if session is older than 24 hours for admin
        if (userData.last_login) {
          const lastLogin = new Date(userData.last_login);
          const now = new Date();
          const hoursSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLogin > 24) {
            console.log('Admin session expired after 24 hours');
            await this.logout();
            return false;
          }
        }
        
        // For admin, don't enforce strict session key matching
        return true;
      }

      // For regular users, enforce single device login
      if (!userData.forced_session_key || userData.forced_session_key !== this.sessionKey) {
        console.log('Session key mismatch - another device logged in');
        // Session has been invalidated by another login
        await this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validity check error:', error);
      // Don't logout on network errors, return true to maintain session
      return true;
    }
  }

  async refreshSession(): Promise<void> {
    try {
      // Refresh the Supabase auth session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        throw error;
      }

      // Update last_login timestamp to extend session
      if (data.user) {
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      throw error;
    }
  }

  // Add method to keep session alive
  async keepSessionAlive(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      // Update last activity timestamp
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      return true;
    } catch (error) {
      console.error('Keep session alive error:', error);
      return false;
    }
  }

  // Admin functions
  async createSchoolUser(userData: {
    username: string;
    email: string;
    password: string;
    schoolId: string;
    role?: 'admin' | 'school_user';
  }): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });

      if (authError || !authData.user) {
        return {
          success: false,
          error: authError?.message || 'Failed to create user'
        };
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          username: userData.username,
          school_id: userData.schoolId,
          role: userData.role || 'school_user'
        });

      if (profileError) {
        // Cleanup auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return {
          success: false,
          error: profileError.message
        };
      }

      return {
        success: true,
        userId: authData.user.id
      };
    } catch (error) {
      console.error('Create school user error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  // Anti-piracy helpers
  disableDevTools(): void {
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    });

    // Disable right-click context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });

    // Detect if DevTools is open
    let devtools = {
      open: false,
      orientation: null
    };

    const threshold = 160;

    setInterval(() => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          console.clear();
          console.log('%cDeveloper tools detected! This action has been logged.', 'color: red; font-size: 20px;');
          // You could also redirect or show a warning here
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }

  enableWatermark(userInfo: { schoolId: string; userId: string }): void {
    if (!import.meta.env.VITE_WATERMARK_ENABLED) return;

    const watermark = document.createElement('div');
    watermark.id = 'sciff-watermark';
    watermark.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 5px 10px;
      font-size: 12px;
      border-radius: 4px;
      z-index: 9999;
      pointer-events: none;
      user-select: none;
      font-family: monospace;
    `;
    
    const now = new Date();
    const schoolIdDisplay = userInfo.schoolId ? userInfo.schoolId.slice(-8) : 'ADMIN';
    watermark.textContent = `SCIFF | ${schoolIdDisplay} | ${now.toLocaleString()}`;
    
    document.body.appendChild(watermark);

    // Update timestamp every minute
    setInterval(() => {
      const now = new Date();
      watermark.textContent = `SCIFF | ${schoolIdDisplay} | ${now.toLocaleString()}`;
    }, 60000);
  }
}

export const authService = new AuthService();