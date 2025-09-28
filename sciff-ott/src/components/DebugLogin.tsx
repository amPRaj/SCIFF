import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../lib/auth';

const DebugLogin: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const testFullFlow = async () => {
    setTesting(true);
    setLogs([]);
    
    try {
      addLog('🔄 Starting debug test...');
      
      // Test 1: Environment variables
      addLog(`✅ SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL}`);
      addLog(`✅ DEMO_MODE: ${import.meta.env.VITE_DEMO_MODE}`);
      
      // Test 2: Supabase connection
      addLog('🔄 Testing Supabase connection...');
      const { data: schools, error: schoolsError } = await supabase
        .from('schools')
        .select('count', { count: 'exact', head: true });
      
      if (schoolsError) {
        addLog(`❌ Schools table error: ${schoolsError.message}`);
        return;
      }
      addLog(`✅ Schools table accessible`);
      
      // Test 3: Check admin user in auth
      addLog('🔄 Testing direct auth...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'praveend@lxl.in',
        password: 'Apple@123'
      });
      
      if (authError) {
        addLog(`❌ Auth error: ${authError.message}`);
        return;
      }
      addLog(`✅ Auth successful: ${authData.user?.id}`);
      
      // Test 4: Check user profile
      addLog('🔄 Testing user profile...');
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*, school:schools(*)')
        .eq('id', authData.user!.id)
        .eq('is_active', true)
        .single();
      
      if (profileError) {
        addLog(`❌ Profile error: ${profileError.message}`);
        // Try to see what users exist
        const { data: allUsers } = await supabase
          .from('users')
          .select('id, username, role, is_active');
        addLog(`📊 All users in DB: ${JSON.stringify(allUsers)}`);
        return;
      }
      addLog(`✅ Profile found: ${userProfile.username} (${userProfile.role})`);
      addLog(`✅ School: ${userProfile.school.name}`);
      
      // Test 5: Test auth service
      addLog('🔄 Testing authService...');
      await supabase.auth.signOut(); // Sign out first
      
      const result = await authService.login({
        email: 'praveend@lxl.in',
        password: 'Apple@123'
      });
      
      if (result.success) {
        addLog(`✅ AuthService login successful!`);
        addLog(`✅ User: ${result.user?.username} at ${result.user?.school?.name}`);
      } else {
        addLog(`❌ AuthService error: ${result.error}`);
      }
      
    } catch (error) {
      addLog(`❌ Unexpected error: ${error}`);
      console.error('Debug test error:', error);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 w-96 bg-gray-800 border border-gray-600 rounded-lg p-4 max-h-96 overflow-y-auto z-50">
      <h3 className="text-white font-bold mb-2">🐛 Debug Login Test</h3>
      
      <button
        onClick={testFullFlow}
        disabled={testing}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
      >
        {testing ? 'Testing...' : 'Run Debug Test'}
      </button>
      
      <div className="space-y-1 text-sm">
        {logs.map((log, index) => (
          <div
            key={index}
            className={`${
              log.includes('❌') ? 'text-red-400' :
              log.includes('✅') ? 'text-green-400' :
              log.includes('🔄') ? 'text-blue-400' :
              'text-gray-300'
            }`}
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugLogin;