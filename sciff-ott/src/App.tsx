import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { authService } from './lib/auth';
import { demoAuthService } from './lib/demoAuth';
import type { User } from './lib/supabase';

// Components
import LoginPage from './components/LoginPage';
import NetflixHomePage from './components/NetflixHomePage';
import VideoPlayer from './components/VideoPlayer';
import AdminDashboard from './components/ComprehensiveAdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import DemoPage from './components/DemoPage';
import DebugLogin from './components/DebugLogin';

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
      }, 120000); // 2 minutes

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
        if (isDemoMode) {
          setUser(currentUser);
          setIsSessionValid(true);
        } else {
          const sessionValid = await authService.checkSessionValidity();
          if (sessionValid) {
            setUser(currentUser);
            setIsSessionValid(true);
          } else {
            setIsSessionValid(false);
          }
        }
        
        // Enable watermark for authenticated users
        currentAuthService.enableWatermark({
          schoolId: currentUser.school_id,
          userId: currentUser.id
        });
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
    currentAuthService.enableWatermark({
      schoolId: loggedInUser.school_id,
      userId: loggedInUser.id
    });
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
          <Route 
            path="/" 
            element={
              <ProtectedRoute user={user}>
                {user.role === 'admin' ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <NetflixHomePage user={user} onLogout={handleLogout} />
                )}
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/watch/:filmId" 
            element={
              <ProtectedRoute user={user}>
                <VideoPlayer user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute user={user} requireAdmin={true}>
                <AdminDashboard user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
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
