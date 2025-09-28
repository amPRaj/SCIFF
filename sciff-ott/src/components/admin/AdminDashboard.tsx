import React from 'react';
import { Routes, Route } from 'react-router-dom';
import type { User } from '../../lib/supabase';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  // Suppress unused variable warnings for now
  console.log('Admin dashboard for user:', user.id);
  console.log('Logout function available:', typeof onLogout);
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">
            Admin Dashboard Coming Soon
          </h2>
          <p className="text-gray-400">
            This will include school management, content management, analytics, and more.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;