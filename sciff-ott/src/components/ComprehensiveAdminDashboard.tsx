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
  RefreshCw,
  Menu,
  Home,
  LogOut,
  ChevronLeft,
  ChevronRight
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  // Enhanced helper function to group subscriptions by school
  const getSchoolSubscriptions = () => {
    const schoolSubs = subscriptions.reduce((acc, sub) => {
      const schoolName = sub.school?.name || 'Unknown School';
      if (!acc[schoolName]) {
        acc[schoolName] = {
          school: sub.school,
          categories: [],
          totalSubscriptions: 0,
          activeSubscriptions: 0
        };
      }
      acc[schoolName].categories.push(sub.category?.name || 'Unknown Category');
      acc[schoolName].totalSubscriptions++;
      if (sub.active && new Date(sub.expiry_date) > new Date()) {
        acc[schoolName].activeSubscriptions++;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(schoolSubs).map(([schoolName, data]) => ({
      schoolName,
      ...data
    }));
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
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Schools</p>
              <p className="text-white text-3xl font-bold">{schools.length}</p>
              <p className="text-blue-200 text-xs mt-1">{schools.filter(s => s.is_active).length} active</p>
            </div>
            <div className="p-3 bg-blue-500/30 rounded-lg">
              <School className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Films</p>
              <p className="text-white text-3xl font-bold">{films.length}</p>
              <p className="text-green-200 text-xs mt-1">{films.filter(f => f.is_active).length} active</p>
            </div>
            <div className="p-3 bg-green-500/30 rounded-lg">
              <Film className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active Subscriptions</p>
              <p className="text-white text-3xl font-bold">
                {subscriptions.filter(s => s.active && new Date(s.expiry_date) > new Date()).length}
              </p>
              <p className="text-purple-200 text-xs mt-1">{subscriptions.length} total</p>
            </div>
            <div className="p-3 bg-purple-500/30 rounded-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Views</p>
              <p className="text-white text-3xl font-bold">{viewingLogs.length}</p>
              <p className="text-orange-200 text-xs mt-1">This month</p>
            </div>
            <div className="p-3 bg-orange-500/30 rounded-lg">
              <PlayCircle className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced School Subscriptions Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <School className="w-5 h-5 mr-2 text-blue-400" />
            School Subscription Summary
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto admin-scrollbar">
            {getSchoolSubscriptions().map((schoolData, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                  <div>
                    <p className="text-white font-medium">{schoolData.schoolName}</p>
                    <p className="text-xs text-gray-400">
                      Categories: {schoolData.categories.join(', ')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-blue-400 font-medium">{schoolData.activeSubscriptions}</span>
                  <span className="text-gray-400">/{schoolData.totalSubscriptions}</span>
                </div>
              </div>
            ))}
            {getSchoolSubscriptions().length === 0 && (
              <p className="text-gray-400 text-center py-4">No school subscriptions found</p>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
            Top Viewed Films
          </h3>
          <div className="space-y-3">
            {getTopFilms().map((item, index) => (
              <div key={item.film_title} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded mr-3 text-gray-300">{index + 1}</span>
                  <span className="text-white font-medium">{item.film_title}</span>
                </div>
                <span className="text-blue-400 font-medium">{item.views} views</span>
              </div>
            ))}
            {getTopFilms().length === 0 && (
              <p className="text-gray-400 text-center py-4">No viewing data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Expiring Subscriptions Alert */}
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
          Expiring Subscriptions (Next 7 Days)
        </h3>
        <div className="space-y-3">
          {getExpiringSubscriptions().map((sub) => (
            <div key={sub.id} className="flex items-center justify-between p-3 bg-yellow-900/30 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-yellow-400 mr-3" />
                <div>
                  <p className="text-white font-medium">{sub.school?.name}</p>
                  <p className="text-sm text-gray-300">{sub.category?.name} - Expires {new Date(sub.expiry_date).toLocaleDateString()}</p>
                </div>
              </div>
              <span className="px-3 py-1 text-xs bg-yellow-900 text-yellow-300 rounded-full">
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
    <div className="h-screen bg-gray-900 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`bg-gray-800 border-r border-gray-700 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } flex flex-col h-full`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center">
                <Film className="w-8 h-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold text-white">SCIFF Admin</span>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation - Scrollable if needed */}
        <nav className="flex-1 py-4 overflow-y-auto admin-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: Home, count: undefined },
            { id: 'schools', label: 'Schools', icon: School, count: schools.length },
            { id: 'categories', label: 'Categories', icon: Users, count: categories.length },
            { id: 'films', label: 'Films', icon: Film, count: films.length },
            { id: 'banners', label: 'Banners', icon: Image, count: banners.length },
            { id: 'subscriptions', label: 'Subscriptions', icon: Calendar, count: subscriptions.length },
            { id: 'analytics', label: 'Analytics', icon: BarChart3, count: undefined },
            { id: 'security', label: 'Security', icon: Shield, count: undefined }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 text-left transition-all duration-200 hover:bg-gray-700 ${
                activeTab === item.id ? 'bg-blue-600 text-white border-r-4 border-blue-400' : 'text-gray-300'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
              title={sidebarCollapsed ? item.label : ''}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-white' : 'text-gray-400'}`} />
              {!sidebarCollapsed && (
                <>
                  <span className="ml-3 font-medium">{item.label}</span>
                  {item.count !== undefined && (
                    <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
                      activeTab === item.id ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* User Section - Fixed at bottom */}
        <div className="border-t border-gray-700 p-4 flex-shrink-0">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.username?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user.username}</p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white text-sm font-medium">
                  {user.username?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors mx-auto"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header - Fixed */}
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white capitalize">{activeTab}</h1>
              <p className="text-gray-400 text-sm">Manage your {activeTab} efficiently</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">Welcome, {user.username}</span>
            </div>
          </div>
        </header>

        {/* Content Area - Scrollable */}
        <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden admin-scrollbar">
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
        </main>
      </div>
    </div>
  );
};

export default ComprehensiveAdminDashboard;