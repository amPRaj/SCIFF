import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { authService } from './lib/auth';
import { demoAuthService } from './lib/demoAuth';
import type { User } from './lib/supabase';

// Components
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import VideoPlayer from './components/VideoPlayer';
import SimpleVideoPlayer from './components/SimpleVideoPlayer';
import AdminDashboard from './components/ComprehensiveAdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import DemoPage from './components/DemoPage';
import DebugLogin from './components/DebugLogin';
import VideoTest from './components/VideoTest';
import TestLogin from './components/TestLogin';
import VideoPlaybackTest from './components/VideoPlaybackTest';

// Role-based redirect component
const RoleBasedRedirect: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect based on user role after login
    if (user.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);
  
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <LoadingSpinner size="large" />
    </div>
  );
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [isDemoMode] = useState(import.meta.env.VITE_DEMO_MODE === 'true');
  
  const currentAuthService = isDemoMode ? demoAuthService : authService;

  useEffect(() => {
    initializeAuth();
    
    // Enable anti-piracy measures
    currentAuthService.disableDevTools();

    if (!isDemoMode) {
      // Check session validity every 5 minutes for production (less aggressive)
      const sessionInterval = setInterval(async () => {
        try {
          const valid = await authService.checkSessionValidity();
          if (!valid) {
            console.log('Session invalid, logging out...');
            setIsSessionValid(false);
            setUser(null);
          }
        } catch (error) {
          console.error('Session check error:', error);
          // Don't logout on network errors, just log the issue
        }
      }, 300000); // 5 minutes instead of 30 seconds

      // Keep session alive every 2 minutes with user activity
      const keepAliveInterval = setInterval(async () => {
        try {
          await authService.keepSessionAlive();
        } catch (error) {
          console.error('Keep alive error:', error);
        }
      }, 1200000); // 12 minutes

      // Listen for user activity to refresh session
      const handleUserActivity = () => {
        authService.keepSessionAlive().catch(err => 
          console.error('Activity-based keep alive error:', err)
        );
      };

      // Add event listeners for user activity
      window.addEventListener('click', handleUserActivity);
      window.addEventListener('keydown', handleUserActivity);
      window.addEventListener('scroll', handleUserActivity);

      return () => {
        clearInterval(sessionInterval);
        clearInterval(keepAliveInterval);
        window.removeEventListener('click', handleUserActivity);
        window.removeEventListener('keydown', handleUserActivity);
        window.removeEventListener('scroll', handleUserActivity);
      };
    }
  }, [isDemoMode]);

  const initializeAuth = async () => {
    try {
      const currentUser = await currentAuthService.getCurrentUser();
      if (currentUser) {
        if (currentUser) {
          const sessionValid = await authService.checkSessionValidity();
          if (sessionValid) {
            setUser(currentUser);
            setIsSessionValid(true);
          } else {
            setIsSessionValid(false);
          }
        }
        
        // Enable watermark for authenticated users
        if (currentUser) {
          currentAuthService.enableWatermark({
            schoolId: currentUser.school_id || 'admin',
            userId: currentUser.id
          });
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsSessionValid(true);
    
    // Enable watermark
    if (loggedInUser) {
      currentAuthService.enableWatermark({
        schoolId: loggedInUser.school_id || 'admin',
        userId: loggedInUser.id
      });
    }
  };

  const handleLogout = async () => {
    await currentAuthService.logout();
    setUser(null);
    setIsSessionValid(false);
    
    // Remove watermark
    const watermark = document.getElementById('sciff-watermark');
    if (watermark) {
      watermark.remove();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Demo mode fallback
  if (isDemoMode) {
    return (
      <div className="min-h-screen bg-gray-900 no-select">
        <DemoPage 
          user={user} 
          onLogin={handleLogin} 
          onLogout={handleLogout} 
        />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
            },
          }}
        />
      </div>
    );
  }

  if (!isSessionValid || !user) {
    return (
      <Router>
        <div className="min-h-screen bg-gray-900">
          <DebugLogin />
          <Routes>
            <Route 
              path="/login" 
              element={<LoginPage onLogin={handleLogin} />} 
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
            },
          }}
        />
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 no-select">
        <Routes>
          {/* Root path - role-based redirect */}
          <Route 
            path="/" 
            element={<RoleBasedRedirect user={user} />}
          />
          
          {/* Test login page */}
          <Route 
            path="/test-login" 
            element={<TestLogin />}
          />
          
          {/* Video playback test page */}
          <Route 
            path="/video-playback-test" 
            element={<VideoPlaybackTest />}
          />
          
          {/* Home page for regular users */}
          <Route 
            path="/home" 
            element={
              <ProtectedRoute user={user}>
                <HomePage user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          
          {/* Video player for all authenticated users */}
          <Route 
            path="/watch/:filmId" 
            element={
              <ProtectedRoute user={user}>
                <SimpleVideoPlayer user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin dashboard - admin only */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute user={user} requireAdmin={true}>
                <AdminDashboard user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          
          {/* Video test page - for debugging */}
          <Route 
            path="/video-test" 
            element={
              <ProtectedRoute user={user}>
                <VideoTest />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback - redirect to role-appropriate page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
          },
        }}
      />
    </Router>
  );
}

export default App;
