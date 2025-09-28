-- SCIFF OTT Platform Database Schema
-- Run this in your Supabase SQL editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE user_role AS ENUM ('admin', 'school_user');

-- Schools table
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) UNIQUE NOT NULL,
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(64) NOT NULL,
    min_age INTEGER,
    max_age INTEGER,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO categories (name, min_age, max_age, description) VALUES
('Below 7 years', 0, 7, 'Content suitable for children below 7 years'),
('10+ years', 10, 15, 'Content suitable for children 10 years and above'),
('13+ years', 13, 18, 'Content suitable for teenagers 13 years and above');

-- Films table
CREATE TABLE films (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    external_url TEXT NOT NULL,
    runtime_seconds INTEGER,
    thumbnail_url TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
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

-- School subscriptions table
CREATE TABLE school_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, category_id)
);

-- Viewing logs table
CREATE TABLE viewing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    film_id UUID REFERENCES films(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    watched_seconds INTEGER DEFAULT 0,
    ip_address INET,
    device_info TEXT,
    watermark_id VARCHAR(128),
    country VARCHAR(2),
    city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Login activity table
CREATE TABLE login_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    session_key VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    logged_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logged_out_at TIMESTAMP WITH TIME ZONE,
    country VARCHAR(2),
    city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banners table
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_films_category_id ON films(category_id);
CREATE INDEX idx_school_subscriptions_school_category ON school_subscriptions(school_id, category_id);
CREATE INDEX idx_school_subscriptions_expiry ON school_subscriptions(expiry_date);
CREATE INDEX idx_viewing_logs_school_film ON viewing_logs(school_id, film_id);
CREATE INDEX idx_viewing_logs_user ON viewing_logs(user_id);
CREATE INDEX idx_viewing_logs_started_at ON viewing_logs(started_at);
CREATE INDEX idx_login_activity_user ON login_activity(user_id);
CREATE INDEX idx_login_activity_session ON login_activity(session_key);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER set_timestamp_schools
    BEFORE UPDATE ON schools
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_categories
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_films
    BEFORE UPDATE ON films
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_users
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_school_subscriptions
    BEFORE UPDATE ON school_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_banners
    BEFORE UPDATE ON banners
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Row Level Security (RLS) Policies
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE films ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Policies for schools table
CREATE POLICY "Schools are viewable by authenticated users" ON schools FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Schools are manageable by admins" ON schools FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Policies for categories table
CREATE POLICY "Categories are viewable by authenticated users" ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Categories are manageable by admins" ON categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Policies for films table
CREATE POLICY "Films are viewable by authenticated users" ON films FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Films are manageable by admins" ON films FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Policies for users table
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);
CREATE POLICY "Users are manageable by admins" ON users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Policies for school_subscriptions table
CREATE POLICY "School subscriptions viewable by school users" ON school_subscriptions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.school_id = school_subscriptions.school_id
    ) OR
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);
CREATE POLICY "School subscriptions manageable by admins" ON school_subscriptions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Policies for viewing_logs table
CREATE POLICY "Viewing logs viewable by school users" ON viewing_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.school_id = viewing_logs.school_id
    ) OR
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);
CREATE POLICY "Viewing logs insertable by authenticated users" ON viewing_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Viewing logs manageable by admins" ON viewing_logs FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Policies for login_activity table
CREATE POLICY "Login activity viewable by user or admin" ON login_activity FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);
CREATE POLICY "Login activity insertable by authenticated users" ON login_activity FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for banners table
CREATE POLICY "Banners are viewable by authenticated users" ON banners FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Banners are manageable by admins" ON banners FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
);

-- Function to check subscription access
CREATE OR REPLACE FUNCTION check_subscription_access(user_id UUID, category_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    school_id UUID;
    has_access BOOLEAN := FALSE;
BEGIN
    -- Get user's school
    SELECT users.school_id INTO school_id FROM users WHERE users.id = user_id;
    
    -- Check if school has active subscription for this category
    SELECT EXISTS(
        SELECT 1 FROM school_subscriptions 
        WHERE school_subscriptions.school_id = school_id 
        AND school_subscriptions.category_id = category_id 
        AND school_subscriptions.active = true 
        AND school_subscriptions.expiry_date > NOW()
    ) INTO has_access;
    
    RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log film viewing
CREATE OR REPLACE FUNCTION log_film_viewing(
    p_film_id UUID,
    p_ip_address INET DEFAULT NULL,
    p_device_info TEXT DEFAULT NULL,
    p_country VARCHAR(2) DEFAULT NULL,
    p_city VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    user_school_id UUID;
BEGIN
    -- Get user's school
    SELECT school_id INTO user_school_id FROM users WHERE id = auth.uid();
    
    -- Create viewing log
    INSERT INTO viewing_logs (
        school_id, film_id, user_id, ip_address, device_info, country, city, watermark_id
    ) VALUES (
        user_school_id, p_film_id, auth.uid(), p_ip_address, p_device_info, p_country, p_city,
        encode(gen_random_bytes(16), 'hex')
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check geo-location
CREATE OR REPLACE FUNCTION is_access_allowed(ip_address INET)
RETURNS BOOLEAN AS $$
BEGIN
    -- For now, return true. In production, implement proper geo-IP checking
    -- You can integrate with MaxMind GeoIP2 or similar service
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;