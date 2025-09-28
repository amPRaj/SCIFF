import React, { useState } from 'react';
import { demoAuthService, getDemoData } from '../lib/demoAuth';
import type { User } from '../lib/supabase';
import { Film, Play, LogOut, Shield, Clock } from 'lucide-react';

interface DemoPageProps {
  onLogin: (user: User) => void;
  user?: User | null;
  onLogout?: () => void;
}

const DemoPage: React.FC<DemoPageProps> = ({ onLogin, user, onLogout }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoData = getDemoData();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await demoAuthService.login({ username, password });
      if (result.success && result.user) {
        onLogin(result.user);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await demoAuthService.logout();
    if (onLogout) onLogout();
  };

  if (!user) {
    // Login Page
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-600 p-3 rounded-full shadow-glow">
                <Film className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              SCIFF OTT Platform
            </h1>
            <p className="text-gray-400">
              School Cinema International Film Festival - Demo Mode
            </p>
          </div>

          {/* Login Form */}
          <div className="card p-8">
            <div className="flex items-center mb-6">
              <Shield className="w-5 h-5 text-blue-400 mr-2" />
              <h2 className="text-xl font-semibold text-white">Demo Login</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                  placeholder="Enter demo or admin"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter demo123 or admin123"
                  required
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 glass-effect rounded-lg border border-blue-500/20">
              <h4 className="text-sm font-semibold text-white mb-2">Demo Credentials</h4>
              <div className="text-xs text-gray-300 space-y-1">
                <div><strong>School User:</strong> demo / demo123</div>
                <div><strong>Admin User:</strong> admin / admin123</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Home Page for logged in users
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">SCIFF OTT - Demo</h1>
              <div className="ml-4 text-sm text-gray-400">
                Welcome, {user.school?.name || 'Demo User'}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user.role === 'admin' && (
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                  Admin
                </span>
              )}
              <button
                onClick={handleLogout}
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
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demoData.banners.map((banner) => (
              <div key={banner.id} className="relative rounded-xl overflow-hidden shadow-lg">
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-lg font-semibold text-white">{banner.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {demoData.categories.map((category) => {
            const categoryFilms = demoData.films.filter(film => film.category_id === category.id);
            const hasSubscription = demoData.subscriptions.some(sub => 
              sub.category_id === category.id && new Date(sub.expiry_date) > new Date()
            );

            return (
              <div key={category.id}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <h2 className="text-2xl font-bold text-white mr-4">{category.name}</h2>
                    {hasSubscription ? (
                      <div className="flex items-center text-green-400 text-sm">
                        <Shield className="w-4 h-4 mr-1" />
                        Demo Access
                      </div>
                    ) : (
                      <div className="flex items-center text-red-400 text-sm">
                        <Shield className="w-4 h-4 mr-1" />
                        No Access
                      </div>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {categoryFilms.length} film{categoryFilms.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {!hasSubscription ? (
                  <div className="card p-8 text-center">
                    <Shield className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-300 mb-2">
                      Subscription Required
                    </h3>
                    <p className="text-gray-500">
                      Contact your administrator to get access to {category.name} content.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {categoryFilms.map((film) => (
                      <div
                        key={film.id}
                        className="card-hover overflow-hidden group"
                        onClick={() => {
                          alert(`Playing: ${film.title}\nURL: ${film.external_url}`);
                        }}
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

        {/* Demo Info */}
        <div className="mt-12 card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Demo Mode Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-medium text-white mb-2">Available Features:</h4>
              <ul className="space-y-1">
                <li>• Login system with demo credentials</li>
                <li>• Age-based content categories</li>
                <li>• Film browsing and selection</li>
                <li>• Subscription-based access control</li>
                <li>• Anti-piracy watermarking</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Next Steps:</h4>
              <ul className="space-y-1">
                <li>• Set up Supabase database</li>
                <li>• Configure real authentication</li>
                <li>• Add video streaming</li>
                <li>• Implement admin dashboard</li>
                <li>• Enable analytics tracking</li>
                <li>• Deploy to production</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DemoPage;