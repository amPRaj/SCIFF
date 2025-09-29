import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Volume2, VolumeX, Maximize, Minimize, Play, Pause } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User, Film } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

interface SimpleVideoPlayerProps {
  user: User;
}

const SimpleVideoPlayer: React.FC<SimpleVideoPlayerProps> = ({ user }) => {
  const { filmId } = useParams<{ filmId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [film, setFilm] = useState<Film | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  // Load film data
  useEffect(() => {
    if (filmId) {
      loadFilm(filmId);
    }
  }, [filmId]);

  const loadFilm = async (filmId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch film data
      const { data: filmData, error: filmError } = await supabase
        .from('films')
        .select('*')
        .eq('id', filmId)
        .eq('is_active', true)
        .single();

      if (filmError || !filmData) {
        const errorMessage = filmError ? filmError.message : 'Film not found or unavailable';
        setError(errorMessage);
        toast.error(errorMessage);
        navigate('/');
        return;
      }

      // Check subscription access
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('school_subscriptions')
        .select('*')
        .eq('school_id', user.school_id)
        .eq('category_id', filmData.category_id)
        .eq('active', true)
        .gte('expiry_date', new Date().toISOString())
        .single();

      if (subscriptionError || !subscriptionData) {
        const errorMessage = subscriptionError ? subscriptionError.message : 'No active subscription';
        setError(errorMessage);
        toast.error('Access Denied: ' + errorMessage);
        navigate('/');
        return;
      }

      setFilm(filmData);
    } catch (err) {
      console.error('Error loading film:', err);
      setError('Failed to load film');
      toast.error('Failed to load film');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // Video event handlers
  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error('Playback failed:', error);
          toast.error('Failed to play video');
        });
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume > 0 ? volume : 0.5;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="large" />
        <span className="ml-4 text-white">Loading film...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center p-8 bg-gray-900 rounded-lg">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-white mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  if (!film) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Film not found</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={film.external_url}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={(e) => {
          console.error('Video error:', e);
          toast.error('Failed to load video');
        }}
        controls={false}
        playsInline
        muted={isMuted}
      />

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="relative bg-gray-600 h-1 rounded-full">
            <div
              className="absolute left-0 top-0 h-full bg-blue-600 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8" />
              )}
            </button>

            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-20"
              />
            </div>

            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="text-white hover:text-gray-300 transition-colors flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-6 h-6" />
              ) : (
                <Maximize className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Film Title */}
      <div className="absolute top-4 left-4">
        <h1 className="text-white text-xl font-semibold">{film.title}</h1>
      </div>
    </div>
  );
};

export default SimpleVideoPlayer;