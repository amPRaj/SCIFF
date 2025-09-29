import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Film, Shield } from 'lucide-react';
import { authService } from '../lib/auth';
import type { User } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    
    try {
      console.log('🔄 Login attempt started for:', data.email);
      
      const result = await authService.login(data);
      
      console.log('🔍 Login result:', {
        success: result.success,
        error: result.error,
        hasUser: !!result.user
      });
      
      if (result.success && result.user) {
        console.log('✅ Login successful for user:', {
          id: result.user.id,
          username: result.user.username,
          role: result.user.role,
          school: result.user.school?.name
        });
        toast.success('Login successful!');
        onLogin(result.user);
      } else {
        console.error('❌ Login failed:', result.error);
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('💥 Login exception:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 animate-fade-in">
      <div className="max-w-md w-full animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-yellow-600 p-3 rounded-full shadow-glow">
              <Film className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            SCIFF OTT Platform
          </h1>
          <p className="text-gray-400">
            School Cinema International Film Festival
          </p>
        </div>

        {/* Login Form */}
        <div className="card p-8 border border-gray-700">
          <div className="flex items-center mb-6">
            <Shield className="w-5 h-5 text-blue-400 mr-2" />
            <h2 className="text-xl font-semibold text-white">Secure Login</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                id="email"
                className="input-field"
                placeholder="Enter your email"
                autoComplete="email"
                disabled={loading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="input-field pr-12"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 p-4 glass-effect rounded-lg border border-blue-500/20">
            <div className="flex">
              <Shield className="w-5 h-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Security Notice</h4>
                <p className="text-xs text-gray-300">
                  This platform is geo-restricted to India and supports single device access per user.
                  All activities are monitored for security purposes.
                </p>
              </div>
            </div>
          </div>

          {/* Development Mode Helper */}
          {import.meta.env.DEV && (
            <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-600/30 rounded-lg">
              <p className="text-xs text-yellow-300 font-medium mb-1">🔧 Development Mode</p>
              <p className="text-xs text-yellow-200">
                Admin: praveend@lxl.in / Apple@123
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 SCIFF OTT Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;