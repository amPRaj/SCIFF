import React from 'react';
import type { User } from '../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  user: User;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  user, 
  requireAdmin = false 
}) => {
  if (requireAdmin && user.role !== 'admin') {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center card p-8 max-w-md mx-4">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;