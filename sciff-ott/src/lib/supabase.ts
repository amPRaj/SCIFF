import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Database Types
export interface School {
  id: string;
  name: string;
  code: string;
  contact_email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  school_id: string;
  username: string;
  role: 'admin' | 'school_user';
  forced_session_key?: string;
  last_login?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  school?: School;
}

export interface Category {
  id: string;
  name: string;
  min_age?: number;
  max_age?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Film {
  id: string;
  title: string;
  category_id: string;
  external_url: string;
  runtime_seconds?: number;
  thumbnail_url?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface SchoolSubscription {
  id: string;
  school_id: string;
  category_id: string;
  start_date: string;
  expiry_date: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  school?: School;
  category?: Category;
}

export interface ViewingLog {
  id: string;
  school_id: string;
  film_id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  watched_seconds: number;
  ip_address?: string;
  device_info?: string;
  watermark_id?: string;
  created_at: string;
  school?: School;
  film?: Film;
  user?: User;
}

export interface LoginActivity {
  id: string;
  user_id: string;
  school_id: string;
  session_key: string;
  ip_address?: string;
  user_agent?: string;
  logged_in_at: string;
  logged_out_at?: string;
  country?: string;
  city?: string;
  created_at: string;
  user?: User;
  school?: School;
}

export interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}