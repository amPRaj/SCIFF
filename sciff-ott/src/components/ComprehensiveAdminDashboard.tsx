import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  School, 
  Film, 
  BarChart3, 
  Settings, 
  Plus,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  Activity,
  Globe,
  Shield,
  Clock,
  PlayCircle,
  UserCheck,
  AlertCircle,
  FileText,
  Image,
  Save,
  X,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import type { User } from '../lib/supabase';
import { SchoolsTab, CategoriesTab, FilmsTab } from './admin/AdminTabs';
import { BannersTab, SubscriptionsTab, AnalyticsTab, SecurityTab } from './admin/AdminTabsExtended';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

interface School {
  id: string;
  name: string;
  code: string;
  contact_email: string;
  city: string;
  state: string;
  address?: string;
  pincode?: string;
  principal_name?: string;
  principal_phone?: string;
  is_active: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  min_age: number;
  max_age: number;
  description: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface Film {
  id: string;
  title: string;
  category_id: string;
  category?: {
    name: string;
    min_age: number;
    max_age: number;
  };
  external_url: string;
  thumbnail_url?: string;
  description: string;
  director?: string;
  year?: number;
  runtime_seconds?: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface Banner {
  id: string;
  title: string;
  image_url: string;
  link_url?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface Subscription {
  id: string;
  school: {
    name: string;
    code: string;
  };
  category: {
    name: string;
  };
  start_date: string;
  expiry_date: string;
  active: boolean;
  created_at: string;
}

interface ViewingLog {
  id: string;
  school: {
    name: string;
    code: string;
  };
  film: {
    title: string;
  };
  user?: {
    username: string;
  };
  started_at: string;
  ended_at?: string;
  watched_seconds: number;
  total_duration?: number;
  completion_percentage?: number;
  ip_address?: string;
  device_info?: string;
  country?: string;
  city?: string;
}

interface LoginActivity {
  id: string;
  user?: {
    username: string;
  };
  school?: {
    name: string;
    code: string;
  };
  logged_in_at: string;
  logged_out_at?: string;
  ip_address?: string;
  user_agent?: string;
  country?: string;
  city?: string;
}

const ComprehensiveAdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [schools, setSchools] = useState<School[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [films, setFilms] = useState<Film[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [viewingLogs, setViewingLogs] = useState<ViewingLog[]>([]);
  const [loginActivity, setLoginActivity] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'school' | 'category' | 'film' | 'banner' | 'subscription' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [
        schoolsResponse,
        categoriesResponse,
        filmsResponse,
        bannersResponse,
        subscriptionsResponse,
        viewingLogsResponse,
        loginActivityResponse
      ] = await Promise.all([
        supabase.from('schools').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('display_order'),
        supabase.from('films').select(`
          *,
          category:categories(name, min_age, max_age)
        `).order('created_at', { ascending: false }),
        supabase.from('banners').select('*').order('display_order'),
        supabase.from('school_subscriptions').select(`
          *,
          school:schools(name, code),
          category:categories(name)
        `).order('created_at', { ascending: false }),
        supabase.from('viewing_logs').select(`
          *,
          school:schools(name, code),
          film:films(title),
          user:users(username)
        `).order('started_at', { ascending: false }).limit(100),
        supabase.from('login_activity').select(`
          *,
          user:users(username),
          school:schools(name, code)
        `).order('logged_in_at', { ascending: false }).limit(100)
      ]);

      setSchools(schoolsResponse.data || []);
      setCategories(categoriesResponse.data || []);
      setFilms(filmsResponse.data || []);
      setBanners(bannersResponse.data || []);
      setSubscriptions(subscriptionsResponse.data || []);
      setViewingLogs(viewingLogsResponse.data || []);
      setLoginActivity(loginActivityResponse.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getTopFilms = () => {
    const filmViews = viewingLogs.reduce((acc, log) => {
      const title = log.film?.title || 'Unknown';
      acc[title] = (acc[title] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(filmViews)
      .map(([film_title, views]) => ({ film_title, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  };

  const getExpiringSubscriptions = () => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return subscriptions.filter(sub => {
      const expiryDate = new Date(sub.expiry_date);
      return sub.active && expiryDate > now && expiryDate <= sevenDaysFromNow;
    });
  };

  const getSchoolActivity = () => {
    const schoolViews = viewingLogs.reduce((acc, log) => {
      const name = log.school?.name || 'Unknown';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(schoolViews)
      .map(([school_name, views]) => ({ school_name, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  };

  const TabButton: React.FC<{ 
    id: string; 
    label: string; 
    icon: React.ReactNode; 
    count?: number 
  }> = ({ id, label, icon, count }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
        activeTab === id
          ? 'bg-blue-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
      {count !== undefined && (
        <span className="ml-2 px-2 py-1 text-xs bg-gray-500 rounded-full">
          {count}
        </span>
      )}
    </button>
  );

  const Modal: React.FC<{
    title: string;
    children: React.ReactNode;
    onClose: () => void;
  }> = ({ title, children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-600 rounded-full">
              <School className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total Schools</p>
              <p className="text-2xl font-bold text-white">{schools.length}</p>
              <p className="text-xs text-gray-500">{schools.filter(s => s.is_active).length} active</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-600 rounded-full">
              <Film className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total Films</p>
              <p className="text-2xl font-bold text-white">{films.length}</p>
              <p className="text-xs text-gray-500">{films.filter(f => f.is_active).length} active</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-600 rounded-full">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Active Subscriptions</p>
              <p className="text-2xl font-bold text-white">
                {subscriptions.filter(s => s.active && new Date(s.expiry_date) > new Date()).length}
              </p>
              <p className="text-xs text-gray-500">{subscriptions.length} total</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-600 rounded-full">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total Views</p>
              <p className="text-2xl font-bold text-white">
                {viewingLogs.length}
              </p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Top Viewed Films
          </h3>
          <div className="space-y-3">
            {getTopFilms().map((item, index) => (
              <div key={item.film_title} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded mr-3">{index + 1}</span>
                  <span className="text-white">{item.film_title}</span>
                </div>
                <span className="text-blue-400 font-medium">{item.views} views</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {viewingLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <PlayCircle className="w-4 h-4 text-green-400 mr-3" />
                  <div>
                    <p className="text-white text-sm">{log.film?.title}</p>
                    <p className="text-xs text-gray-400">{log.school?.name}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(log.started_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expiring Subscriptions Alert */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
          Expiring Subscriptions
        </h3>
        <div className="space-y-3">
          {getExpiringSubscriptions().map((sub) => (
            <div key={sub.id} className="flex items-center justify-between p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-yellow-400 mr-3" />
                <div>
                  <p className="text-white font-medium">{sub.school?.name}</p>
                  <p className="text-sm text-gray-400">{sub.category?.name} - Expires {new Date(sub.expiry_date).toLocaleDateString()}</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs bg-yellow-900 text-yellow-300 rounded-full">
                {Math.ceil((new Date(sub.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          ))}
          {getExpiringSubscriptions().length === 0 && (
            <p className="text-gray-400 text-center py-4">No subscriptions expiring soon</p>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Film className="w-8 h-8 text-blue-400 mr-3" />
              <h1 className="text-xl font-bold text-white">SCIFF Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-300">
                Welcome, <span className="font-medium text-white">{user.username}</span>
              </div>
              <button
                onClick={onLogout}
                className="btn-secondary text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          <TabButton
            id="overview"
            label="Overview"
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <TabButton
            id="schools"
            label="Schools"
            icon={<School className="w-5 h-5" />}
            count={schools.length}
          />
          <TabButton
            id="categories"
            label="Categories"
            icon={<Users className="w-5 h-5" />}
            count={categories.length}
          />
          <TabButton
            id="films"
            label="Films"
            icon={<Film className="w-5 h-5" />}
            count={films.length}
          />
          <TabButton
            id="banners"
            label="Banners"
            icon={<Image className="w-5 h-5" />}
            count={banners.length}
          />
          <TabButton
            id="subscriptions"
            label="Subscriptions"
            icon={<Calendar className="w-5 h-5" />}
            count={subscriptions.length}
          />
          <TabButton
            id="analytics"
            label="Analytics"
            icon={<Activity className="w-5 h-5" />}
          />
          <TabButton
            id="security"
            label="Security"
            icon={<Shield className="w-5 h-5" />}
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'schools' && (
          <SchoolsTab 
            schools={schools}
            categories={categories}
            films={films}
            banners={banners}
            subscriptions={subscriptions}
            viewingLogs={viewingLogs}
            loginActivity={loginActivity}
            onRefresh={loadDashboardData}
          />
        )}
        {activeTab === 'categories' && (
          <CategoriesTab 
            schools={schools}
            categories={categories}
            films={films}
            banners={banners}
            subscriptions={subscriptions}
            viewingLogs={viewingLogs}
            loginActivity={loginActivity}
            onRefresh={loadDashboardData}
          />
        )}
        {activeTab === 'films' && (
          <FilmsTab 
            schools={schools}
            categories={categories}
            films={films}
            banners={banners}
            subscriptions={subscriptions}
            viewingLogs={viewingLogs}
            loginActivity={loginActivity}
            onRefresh={loadDashboardData}
          />
        )}
        {activeTab === 'banners' && (
          <BannersTab 
            schools={schools}
            categories={categories}
            films={films}
            banners={banners}
            subscriptions={subscriptions}
            viewingLogs={viewingLogs}
            loginActivity={loginActivity}
            onRefresh={loadDashboardData}
          />
        )}
        {activeTab === 'subscriptions' && (
          <SubscriptionsTab 
            schools={schools}
            categories={categories}
            films={films}
            banners={banners}
            subscriptions={subscriptions}
            viewingLogs={viewingLogs}
            loginActivity={loginActivity}
            onRefresh={loadDashboardData}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsTab 
            schools={schools}
            categories={categories}
            films={films}
            banners={banners}
            subscriptions={subscriptions}
            viewingLogs={viewingLogs}
            loginActivity={loginActivity}
            onRefresh={loadDashboardData}
          />
        )}
        {activeTab === 'security' && (
          <SecurityTab 
            schools={schools}
            categories={categories}
            films={films}
            banners={banners}
            subscriptions={subscriptions}
            viewingLogs={viewingLogs}
            loginActivity={loginActivity}
            onRefresh={loadDashboardData}
          />
        )}
      </div>
    </div>
  );
};

export default ComprehensiveAdminDashboard;