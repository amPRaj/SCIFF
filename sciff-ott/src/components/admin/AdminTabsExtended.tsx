import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Plus, Search, Edit, Trash2, Save, X, Calendar, Clock, 
  PlayCircle, UserCheck, BarChart3, Activity, Globe, Shield,
  Image, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';

interface TabProps {
  schools: any[];
  categories: any[];
  films: any[];
  banners: any[];
  subscriptions: any[];
  viewingLogs: any[];
  loginActivity: any[];
  onRefresh: () => void;
}

// Banners Tab Component
export const BannersTab: React.FC<TabProps> = ({ banners, onRefresh }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    image_url: '',
    link_url: '',
    display_order: 0
  });

  const handleSaveBanner = async () => {
    try {
      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update(formData)
          .eq('id', editingBanner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('banners')
          .insert([{ ...formData, is_active: true }]);
        if (error) throw error;
      }
      
      setShowAddForm(false);
      setEditingBanner(null);
      setFormData({ title: '', image_url: '', link_url: '', display_order: 0 });
      onRefresh();
    } catch (error) {
      console.error('Error saving banner:', error);
    }
  };

  const toggleBannerStatus = async (bannerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: !currentStatus })
        .eq('id', bannerId);
      
      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error toggling banner status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Banners Management</h3>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner) => (
          <div key={banner.id} className="card p-6">
            <div className="mb-4">
              {banner.image_url && (
                <img 
                  src={banner.image_url} 
                  alt={banner.title}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              )}
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-semibold text-white">{banner.title}</h4>
                <button
                  onClick={() => toggleBannerStatus(banner.id, banner.is_active)}
                  className={`px-2 py-1 text-xs rounded-full ${
                    banner.is_active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}
                >
                  {banner.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-300">
              {banner.link_url && (
                <p><strong>Link:</strong> <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">View</a></p>
              )}
              <p><strong>Order:</strong> {banner.display_order}</p>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <button 
                onClick={() => {
                  setEditingBanner(banner);
                  setFormData({
                    title: banner.title,
                    image_url: banner.image_url,
                    link_url: banner.link_url || '',
                    display_order: banner.display_order
                  });
                  setShowAddForm(true);
                }}
                className="text-yellow-400 hover:text-yellow-300"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                {editingBanner ? 'Edit Banner' : 'Add New Banner'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingBanner(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Banner Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Image URL *</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Link URL (optional)</label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value)})}
                  className="input-field"
                  min="0"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingBanner(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveBanner}
                className="btn-primary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingBanner ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subscriptions Tab Component
export const SubscriptionsTab: React.FC<TabProps> = ({ subscriptions, schools, categories, onRefresh }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any>(null);
  const [formData, setFormData] = useState({
    school_id: '',
    category_id: '',
    expiry_date: '',
    duration_days: 15
  });

  const handleSaveSubscription = async () => {
    try {
      const startDate = new Date();
      const expiryDate = new Date(startDate.getTime() + formData.duration_days * 24 * 60 * 60 * 1000);
      
      const subscriptionData = {
        school_id: formData.school_id,
        category_id: formData.category_id,
        start_date: startDate.toISOString(),
        expiry_date: expiryDate.toISOString(),
        active: true
      };

      if (editingSubscription) {
        const { error } = await supabase
          .from('school_subscriptions')
          .update(subscriptionData)
          .eq('id', editingSubscription.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('school_subscriptions')
          .insert([subscriptionData]);
        if (error) throw error;
      }
      
      setShowAddForm(false);
      setEditingSubscription(null);
      setFormData({ school_id: '', category_id: '', expiry_date: '', duration_days: 15 });
      onRefresh();
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const toggleSubscriptionStatus = async (subscriptionId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('school_subscriptions')
        .update({ active: !currentStatus })
        .eq('id', subscriptionId);
      
      if (error) throw error;
      onRefresh();
    } catch (error) {
      console.error('Error toggling subscription status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Subscriptions Management</h3>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Subscription
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {subscriptions.map((sub) => {
                const isExpired = new Date(sub.expiry_date) < new Date();
                const isExpiringSoon = !isExpired && new Date(sub.expiry_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                
                return (
                  <tr key={sub.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {sub.school?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {sub.category?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(sub.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(sub.expiry_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        isExpired 
                          ? 'bg-red-900 text-red-300'
                          : isExpiringSoon
                          ? 'bg-yellow-900 text-yellow-300'
                          : sub.active
                          ? 'bg-green-900 text-green-300'
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : sub.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => toggleSubscriptionStatus(sub.id, sub.active)}
                          className={`${sub.active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                        >
                          {sub.active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => {
                            setEditingSubscription(sub);
                            setFormData({
                              school_id: sub.school_id,
                              category_id: sub.category_id,
                              expiry_date: sub.expiry_date,
                              duration_days: Math.ceil((new Date(sub.expiry_date).getTime() - new Date(sub.start_date).getTime()) / (1000 * 60 * 60 * 24))
                            });
                            setShowAddForm(true);
                          }}
                          className="text-yellow-400 hover:text-yellow-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                {editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingSubscription(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">School *</label>
                <select
                  value={formData.school_id}
                  onChange={(e) => setFormData({...formData, school_id: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="">Select School</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category *</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                  className="input-field"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Duration (Days)</label>
                <select
                  value={formData.duration_days}
                  onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value)})}
                  className="input-field"
                >
                  <option value={15}>15 Days</option>
                  <option value={20}>20 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingSubscription(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSubscription}
                className="btn-primary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingSubscription ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Analytics Tab Component
export const AnalyticsTab: React.FC<TabProps> = ({ viewingLogs, loginActivity, films, schools }) => {
  const getTopFilms = () => {
    const filmViews = viewingLogs.reduce((acc, log) => {
      const title = log.film?.title || 'Unknown';
      acc[title] = (acc[title] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(filmViews)
      .map(([film_title, views]) => ({ film_title, views: views as number }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  };

  const getSchoolActivity = () => {
    const schoolViews = viewingLogs.reduce((acc, log) => {
      const name = log.school?.name || 'Unknown';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(schoolViews)
      .map(([school_name, views]) => ({ school_name, views: views as number }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  };

  const getCompletionStats = () => {
    const completionData = viewingLogs
      .filter(log => log.completion_percentage && log.completion_percentage > 0)
      .reduce((acc, log) => {
        const percentage = Math.round(log.completion_percentage || 0);
        if (percentage >= 90) acc.high++;
        else if (percentage >= 50) acc.medium++;
        else acc.low++;
        return acc;
      }, { high: 0, medium: 0, low: 0 });

    return completionData;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Analytics Dashboard</h3>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-600 rounded-full">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total Views</p>
              <p className="text-2xl font-bold text-white">{viewingLogs.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-600 rounded-full">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Total Watch Time</p>
              <p className="text-2xl font-bold text-white">
                {Math.round(viewingLogs.reduce((acc, log) => acc + (log.watched_seconds || 0), 0) / 3600)}h
              </p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-600 rounded-full">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-white">
                {new Set(loginActivity.filter(la => la.logged_out_at === null).map(la => la.user?.username)).size}
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
              <p className="text-sm text-gray-400">Avg. Completion</p>
              <p className="text-2xl font-bold text-white">
                {Math.round(
                  viewingLogs
                    .filter(log => log.completion_percentage)
                    .reduce((acc, log) => acc + (log.completion_percentage || 0), 0) /
                  viewingLogs.filter(log => log.completion_percentage).length || 0
                )}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Top Films by Views</h4>
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
          <h4 className="text-lg font-semibold text-white mb-4">School Activity</h4>
          <div className="space-y-3">
            {getSchoolActivity().map((item, index) => (
              <div key={item.school_name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xs bg-gray-700 px-2 py-1 rounded mr-3">{index + 1}</span>
                  <span className="text-white">{item.school_name}</span>
                </div>
                <span className="text-green-400 font-medium">{item.views} views</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Completion Rate Breakdown */}
      <div className="card p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Video Completion Rates</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            const stats = getCompletionStats();
            return (
              <>
                <div className="bg-green-900/20 border border-green-800 p-4 rounded-lg">
                  <div className="text-green-400 text-2xl font-bold">{stats.high}</div>
                  <div className="text-green-300 text-sm">High Completion (90%+)</div>
                </div>
                <div className="bg-yellow-900/20 border border-yellow-800 p-4 rounded-lg">
                  <div className="text-yellow-400 text-2xl font-bold">{stats.medium}</div>
                  <div className="text-yellow-300 text-sm">Medium Completion (50-89%)</div>
                </div>
                <div className="bg-red-900/20 border border-red-800 p-4 rounded-lg">
                  <div className="text-red-400 text-2xl font-bold">{stats.low}</div>
                  <div className="text-red-300 text-sm">Low Completion (0-49%)</div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
      
      {/* Recent Viewing Logs */}
      <div className="card p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Recent Viewing Activity</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Film</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">School</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Watch Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Completion</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {viewingLogs.slice(0, 15).map((log) => (
                <tr key={log.id} className="hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm text-white">{log.film?.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{log.school?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{log.user?.username || 'Anonymous'}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{Math.round((log.watched_seconds || 0) / 60)}m</td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {log.completion_percentage ? (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        log.completion_percentage >= 90 ? 'bg-green-900 text-green-300' :
                        log.completion_percentage >= 50 ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {Math.round(log.completion_percentage)}%
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{new Date(log.started_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Security Tab Component
export const SecurityTab: React.FC<TabProps> = ({ loginActivity, viewingLogs }) => {
  const getSecurityStats = () => {
    const today = new Date().toDateString();
    const activeSessions = loginActivity.filter(la => la.logged_out_at === null);
    const todayLogins = loginActivity.filter(la => 
      new Date(la.logged_in_at).toDateString() === today
    );
    const uniqueCountries = new Set(loginActivity.filter(la => la.country).map(la => la.country));
    const suspiciousActivity = loginActivity.filter(la => 
      la.country && la.country !== 'IN' // Non-India logins
    );

    return {
      activeSessions: activeSessions.length,
      todayLogins: todayLogins.length,
      uniqueCountries: uniqueCountries.size,
      suspiciousActivity: suspiciousActivity.length
    };
  };

  const stats = getSecurityStats();

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white">Security & Access Control</h3>
      
      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-600 rounded-full">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Active Sessions</p>
              <p className="text-2xl font-bold text-white">{stats.activeSessions}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-600 rounded-full">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Today's Logins</p>
              <p className="text-2xl font-bold text-white">{stats.todayLogins}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-600 rounded-full">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Countries</p>
              <p className="text-2xl font-bold text-white">{stats.uniqueCountries}</p>
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-600 rounded-full">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-400">Suspicious Activity</p>
              <p className="text-2xl font-bold text-white">{stats.suspiciousActivity}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Suspicious Activity Alert */}
      {stats.suspiciousActivity > 0 && (
        <div className="card p-6 border-l-4 border-red-500 bg-red-900/10">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-400 mr-3" />
            <div>
              <h4 className="text-lg font-semibold text-red-400">Security Alert</h4>
              <p className="text-gray-300">
                {stats.suspiciousActivity} login(s) detected from outside India. 
                Review the security logs below for details.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Recent Login Activity */}
      <div className="card p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Recent Login Activity</h4>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">School</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">IP Address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Login Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {loginActivity.slice(0, 20).map((activity) => {
                const isNonIndia = activity.country && activity.country !== 'IN';
                return (
                  <tr key={activity.id} className={`hover:bg-gray-700 ${
                    isNonIndia ? 'bg-red-900/10' : ''
                  }`}>
                    <td className="px-4 py-3 text-sm text-white">{activity.user?.username || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{activity.school?.name || 'Admin'}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">{activity.ip_address}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {activity.city && activity.country ? `${activity.city}, ${activity.country}` : 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {new Date(activity.logged_in_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activity.logged_out_at 
                          ? 'bg-gray-700 text-gray-300' 
                          : 'bg-green-900 text-green-300'
                      }`}>
                        {activity.logged_out_at ? 'Logged Out' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        isNonIndia 
                          ? 'bg-red-900 text-red-300' 
                          : 'bg-green-900 text-green-300'
                      }`}>
                        {isNonIndia ? 'High Risk' : 'Normal'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};