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
  Filter
} from 'lucide-react';
import type { User } from '../lib/supabase';

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
  is_active: boolean;
  created_at: string;
}

interface Film {
  id: string;
  title: string;
  category: {
    name: string;
    min_age: number;
    max_age: number;
  };
  external_url: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [schools, setSchools] = useState<School[]>([]);
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load schools
      const { data: schoolsData } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });

      // Load films with categories
      const { data: filmsData } = await supabase
        .from('films')
        .select(`
          *,
          category:categories(name, min_age, max_age)
        `)
        .order('created_at', { ascending: false });

      setSchools(schoolsData || []);
      setFilms(filmsData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-600 rounded-full">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Active Schools</p>
              <p className="text-2xl font-bold text-white">
                {schools.filter(s => s.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-600 rounded-full">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Active Films</p>
              <p className="text-2xl font-bold text-white">
                {films.filter(f => f.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {schools.slice(0, 5).map((school) => (
            <div key={school.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <School className="w-5 h-5 text-blue-400 mr-3" />
                <div>
                  <p className="text-white font-medium">{school.name}</p>
                  <p className="text-sm text-gray-400">{school.city}, {school.state}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                school.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
              }`}>
                {school.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const SchoolsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Schools Management</h3>
        <div className="flex space-x-3">
          <button className="btn-secondary flex items-center">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </button>
          <button className="btn-primary flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Add School
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search schools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <button className="btn-secondary flex items-center">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </button>
      </div>

      {/* Schools Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {schools
                .filter(school => 
                  school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  school.code.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((school) => (
                <tr key={school.id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">{school.name}</div>
                      <div className="text-sm text-gray-400">Created: {new Date(school.created_at).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {school.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {school.city}, {school.state}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {school.contact_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      school.is_active 
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-red-900 text-red-300'
                    }`}>
                      {school.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-400 hover:text-blue-300">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-yellow-400 hover:text-yellow-300">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const FilmsTab = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Films Management</h3>
        <button className="btn-primary flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Film
        </button>
      </div>

      {/* Films Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {films.map((film) => (
          <div key={film.id} className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-lg font-semibold text-white">{film.title}</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${
                film.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
              }`}>
                {film.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-300">
              <p><strong>Category:</strong> {film.category?.name}</p>
              <p><strong>Age Group:</strong> {film.category?.min_age}+ years</p>
              <p className="text-gray-400 line-clamp-2">{film.description}</p>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-gray-400">
                Added: {new Date(film.created_at).toLocaleDateString()}
              </span>
              <div className="flex space-x-2">
                <button className="text-blue-400 hover:text-blue-300">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="text-yellow-400 hover:text-yellow-300">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="text-red-400 hover:text-red-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
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
        <div className="flex space-x-4 mb-8">
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
            id="films"
            label="Films"
            icon={<Film className="w-5 h-5" />}
            count={films.length}
          />
          <TabButton
            id="analytics"
            label="Analytics"
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <TabButton
            id="settings"
            label="Settings"
            icon={<Settings className="w-5 h-5" />}
          />
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'schools' && <SchoolsTab />}
        {activeTab === 'films' && <FilmsTab />}
        {activeTab === 'analytics' && (
          <div className="card p-8 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Analytics Coming Soon</h3>
            <p className="text-gray-400">Detailed viewing analytics and reports will be available here.</p>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="card p-8 text-center">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Settings Coming Soon</h3>
            <p className="text-gray-400">Platform settings and configuration options will be available here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;