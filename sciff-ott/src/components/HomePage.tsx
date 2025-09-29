import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Play, Users, Shield, Settings, Info, 
  ChevronLeft, ChevronRight, 
  Search, Bell
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User, Category, SchoolSubscription, Banner } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

// Extended Film interface with additional properties for Netflix-style display
interface ExtendedFilm {
  id: string;
  title: string;
  category_id: string;
  external_url: string;
  runtime_seconds?: number;
  thumbnail_url?: string;
  description?: string;
  director?: string;
  year?: number;
  display_order?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  category?: {
    name: string;
    min_age: number;
    max_age: number;
  };
}

interface HomePageProps {
  user: User;
  onLogout: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [films, setFilms] = useState<{ [key: string]: ExtendedFilm[] }>({});
  const [subscriptions, setSubscriptions] = useState<SchoolSubscription[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [scrollPositions, setScrollPositions] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    // Auto-rotate banners every 8 seconds
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

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
      let filmsData: ExtendedFilm[] = [];
      
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

        if (filmsError) {
          console.error('Error loading films:', filmsError);
          toast.error('Failed to load films');
        } else {
          filmsData = filmsResponse || [];
          console.log('Loaded films:', filmsData); // Debug log
        }
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
      }, {} as { [key: string]: ExtendedFilm[] });

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

  const handlePlayFilm = (filmId: string, categoryId: string) => {
    if (!hasSubscriptionForCategory(categoryId)) {
      toast.error('You do not have access to this category');
      return;
    }
    console.log('Navigating to film:', filmId);
    navigate(`/watch/${filmId}`);
  };

  const handleAdminAccess = () => {
    if (user.role === 'admin') {
      navigate('/admin');
    } else {
      toast.error('Access denied: Admin privileges required');
    }
  };

  const handleBannerNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
    } else {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }
  };

  const scrollRow = (categoryId: string, direction: 'left' | 'right') => {
    const container = document.getElementById(`films-${categoryId}`);
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === 'left' 
        ? Math.max(0, (scrollPositions[categoryId] || 0) - scrollAmount)
        : (scrollPositions[categoryId] || 0) + scrollAmount;
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPositions(prev => ({ ...prev, [categoryId]: newPosition }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const currentBanner = banners[currentBannerIndex];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Netflix-style Header */}
      <header className="fixed top-0 w-full z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between px-4 lg:px-16 py-4">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-red-600">SCIFF</h1>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-white hover:text-gray-300 transition-colors">Home</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">My List</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Categories</a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Search className="w-5 h-5 text-white cursor-pointer hover:text-gray-300" />
            <Bell className="w-5 h-5 text-white cursor-pointer hover:text-gray-300" />
            {user.role === 'admin' && (
              <button
                onClick={handleAdminAccess}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            <div className="relative group">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center cursor-pointer">
                {user.school?.name?.charAt(0) || 'U'}
              </div>
              <div className="absolute right-0 mt-2 w-48 bg-black/90 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-2">
                  <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                    {user.school?.name || 'School User'}
                  </div>
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-800 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner Section - Full Screen Width */}
      {currentBanner && (
        <section className="relative h-screen w-full overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={currentBanner.image_url}
              alt={currentBanner.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>

          {/* Banner Content */}
          <div className="relative z-10 h-full flex flex-col justify-center px-4 lg:px-16">
            <div className="max-w-2xl">
              <h1 className="text-4xl lg:text-6xl font-bold mb-4 leading-tight">
                {currentBanner.title}
              </h1>
              <p className="text-lg lg:text-xl text-gray-200 mb-8 leading-relaxed">
                Experience the best educational content curated for your school. 
                Discover amazing films and documentaries across different age groups.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  className="flex items-center justify-center bg-white text-black px-8 py-3 rounded font-semibold text-lg hover:bg-gray-200 transition-all duration-200"
                  onClick={() => currentBanner.link_url && window.open(currentBanner.link_url, '_blank')}
                >
                  <Play className="w-6 h-6 mr-2" />
                  Learn More
                </button>
                <button className="flex items-center justify-center bg-gray-600/70 text-white px-8 py-3 rounded font-semibold text-lg hover:bg-gray-600 transition-all duration-200">
                  <Info className="w-6 h-6 mr-2" />
                  More Info
                </button>
              </div>

              {/* School Info */}
              <div className="mt-8 flex items-center space-x-4 text-sm">
                <div className="flex items-center text-green-400">
                  <Shield className="w-4 h-4 mr-1" />
                  {user.school?.name}
                </div>
                <div className="text-gray-400">
                  Active Subscriptions: {subscriptions.length}
                </div>
                {/* Debug button - only visible in development */}
                {import.meta.env.DEV && (
                  <button
                    onClick={() => navigate('/video-test')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs"
                  >
                    Test Videos
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Banner Navigation */}
          {banners.length > 1 && (
            <>
              <button
                onClick={() => handleBannerNavigation('prev')}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all duration-200"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => handleBannerNavigation('next')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 transition-all duration-200"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Banner Indicators */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentBannerIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentBannerIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {/* Content Rows */}
      <main className="relative z-10 -mt-32 pb-20">
        <div className="space-y-12">
          {categories.map((category) => {
            const categoryFilms = films[category.id] || [];
            const hasAccess = hasSubscriptionForCategory(category.id);

            if (!hasAccess || categoryFilms.length === 0) return null;

            return (
              <section key={category.id} className="px-4 lg:px-16">
                <h2 className="text-2xl font-bold mb-4 text-white">{category.name}</h2>
                
                <div className="relative group">
                  {/* Left Scroll Button */}
                  <button
                    onClick={() => scrollRow(category.id, 'left')}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  {/* Films Row */}
                  <div
                    id={`films-${category.id}`}
                    className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {categoryFilms.map((film) => (
                      <div
                        key={film.id}
                        className="relative flex-shrink-0 w-48 cursor-pointer group/film transform hover:scale-105 transition-all duration-300"
                        onClick={() => handlePlayFilm(film.id, film.category_id)}
                      >
                        <div className="relative rounded-lg overflow-hidden bg-gray-800">
                          {film.thumbnail_url ? (
                            <img
                              src={film.thumbnail_url}
                              alt={film.title}
                              className="w-full h-28 object-cover"
                            />
                          ) : (
                            <div className="w-full h-28 bg-gray-700 flex items-center justify-center">
                              <Play className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/film:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                            <Play className="w-8 h-8 text-white drop-shadow-lg" />
                          </div>
                        </div>

                        {/* Film Info */}
                        <div className="mt-2">
                          <h3 className="text-white font-semibold text-sm line-clamp-1">{film.title}</h3>
                          <div className="flex items-center mt-1 space-x-2">
                            {film.year && (
                              <span className="text-gray-400 text-xs">{film.year}</span>
                            )}
                            {film.runtime_seconds && (
                              <span className="text-gray-400 text-xs">
                                {Math.floor(film.runtime_seconds / 60)}m
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Scroll Button */}
                  <button
                    onClick={() => scrollRow(category.id, 'right')}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 rounded-full p-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </section>
            );
          })}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-20 px-4 lg:px-16">
            <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Welcome to SCIFF
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              No content available yet. Please contact your administrator to set up your school's subscriptions.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;