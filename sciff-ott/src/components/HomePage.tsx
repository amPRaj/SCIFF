import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut, Play, Clock, Users, Shield, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User, Category, Film, SchoolSubscription, Banner } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

interface HomePageProps {
  user: User;
  onLogout: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [films, setFilms] = useState<{ [key: string]: Film[] }>({});
  const [subscriptions, setSubscriptions] = useState<SchoolSubscription[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Load school subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('school_subscriptions')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('school_id', user.school_id)
        .eq('active', true)
        .gte('expiry_date', new Date().toISOString());

      if (subscriptionsError) throw subscriptionsError;

      // Load films for subscribed categories
      const subscribedCategoryIds = subscriptionsData?.map(sub => sub.category_id) || [];
      let filmsData: Film[] = [];
      
      if (subscribedCategoryIds.length > 0) {
        const { data: filmsResponse, error: filmsError } = await supabase
          .from('films')
          .select(`
            *,
            category:categories(*)
          `)
          .in('category_id', subscribedCategoryIds)
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (filmsError) throw filmsError;
        filmsData = filmsResponse || [];
      }

      // Load banners
      const { data: bannersData, error: bannersError } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (bannersError) throw bannersError;

      // Group films by category
      const filmsByCategory = filmsData.reduce((acc, film) => {
        const categoryId = film.category_id;
        if (!acc[categoryId]) {
          acc[categoryId] = [];
        }
        acc[categoryId].push(film);
        return acc;
      }, {} as { [key: string]: Film[] });

      setCategories(categoriesData || []);
      setSubscriptions(subscriptionsData || []);
      setFilms(filmsByCategory);
      setBanners(bannersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const hasSubscriptionForCategory = (categoryId: string): boolean => {
    return subscriptions.some(sub => sub.category_id === categoryId);
  };

  const getSubscriptionForCategory = (categoryId: string): SchoolSubscription | undefined => {
    return subscriptions.find(sub => sub.category_id === categoryId);
  };

  const handlePlayFilm = (filmId: string, categoryId: string) => {
    if (!hasSubscriptionForCategory(categoryId)) {
      toast.error('You do not have access to this category');
      return;
    }
    navigate(`/watch/${filmId}`);
  };

  const handleAdminAccess = () => {
    if (user.role === 'admin') {
      navigate('/admin');
    } else {
      toast.error('Access denied: Admin privileges required');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 animate-fade-in">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">SCIFF OTT</h1>
              <div className="ml-4 text-sm text-gray-400">
                Welcome, {user.school?.name || 'School User'}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user.role === 'admin' && (
                <button
                  onClick={handleAdminAccess}
                  className="btn-secondary flex items-center text-sm"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Admin
                </button>
              )}
              <button
                onClick={onLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banners */}
        {banners.length > 0 && (
          <div className="mb-8 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <div key={banner.id} className="relative rounded-xl overflow-hidden shadow-lg group">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-lg font-semibold text-white">{banner.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="space-y-8">
          {categories.map((category) => {
            const categoryFilms = films[category.id] || [];
            const subscription = getSubscriptionForCategory(category.id);
            const hasAccess = hasSubscriptionForCategory(category.id);

            return (
              <div key={category.id}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <h2 className="text-2xl font-bold text-white mr-4">{category.name}</h2>
                    {hasAccess ? (
                      <div className="flex items-center text-green-400 text-sm">
                        <Shield className="w-4 h-4 mr-1" />
                        Subscribed
                        {subscription && (
                          <span className="ml-2 text-gray-400">
                            (Expires: {new Date(subscription.expiry_date).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center text-red-400 text-sm">
                        <Shield className="w-4 h-4 mr-1" />
                        No Access
                      </div>
                    )}
                  </div>
                  {categoryFilms.length > 0 && (
                    <div className="text-gray-400 text-sm">
                      {categoryFilms.length} film{categoryFilms.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                {!hasAccess ? (
                  <div className="card p-8 text-center">
                    <Shield className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">
                      Subscription Required
                    </h3>
                    <p className="text-gray-500">
                      Contact your administrator to get access to {category.name} content.
                    </p>
                  </div>
                ) : categoryFilms.length === 0 ? (
                  <div className="card p-8 text-center">
                    <Play className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">
                      No Films Available
                    </h3>
                    <p className="text-gray-500">
                      No films are currently available in this category.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {categoryFilms.map((film) => (
                      <div
                        key={film.id}
                        className="card-hover overflow-hidden group"
                        onClick={() => handlePlayFilm(film.id, film.category_id)}
                      >
                        {film.thumbnail_url && (
                          <div className="relative">
                            <img
                              src={film.thumbnail_url}
                              alt={film.title}
                              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="w-12 h-12 text-white shadow-glow" />
                            </div>
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-white mb-2 line-clamp-1">{film.title}</h3>
                          {film.runtime_seconds && (
                            <div className="flex items-center text-gray-400 text-sm mb-2">
                              <Clock className="w-4 h-4 mr-1" />
                              {Math.floor(film.runtime_seconds / 60)} min
                            </div>
                          )}
                          {film.description && (
                            <p className="text-gray-500 text-sm line-clamp-2">
                              {film.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-12 animate-slide-up">
            <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No Content Available
            </h3>
            <p className="text-gray-500">
              No categories or content are currently available. Please contact your administrator.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;