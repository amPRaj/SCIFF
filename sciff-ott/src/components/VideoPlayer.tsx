import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Volume2, VolumeX, Maximize, Minimize, Play, Pause } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User, Film, ViewingLog } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

interface VideoPlayerProps {
  user: User;
  onLogout: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ user, onLogout }) => {
  const { filmId } = useParams<{ filmId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [film, setFilm] = useState<Film | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [viewingLogId, setViewingLogId] = useState<string | null>(null);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (filmId) {
      loadFilm(filmId);
    }
    
    // Anti-piracy: Disable common screenshot shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable Print Screen, Alt+Print Screen, Cmd+Shift+3/4/5 (macOS screenshots)
      if (
        e.key === 'PrintScreen' ||
        (e.altKey && e.key === 'PrintScreen') ||
        (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key))
      ) {
        e.preventDefault();
        toast.error('Screenshots are not allowed');
      }
    };

    // Disable drag and drop
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [filmId]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds of inactivity
    if (showControls && isPlaying) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  const loadFilm = async (filmId: string) => {
    try {
      setLoading(true);

      // Check if user has access to this film
      const { data: filmData, error: filmError } = await supabase
        .from('films')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', filmId)
        .eq('is_active', true)
        .single();

      if (filmError || !filmData) {
        toast.error('Film not found');
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
        toast.error('You do not have access to this film');
        navigate('/');
        return;
      }

      // Create viewing log
      const { data: logData, error: logError } = await supabase
        .from('viewing_logs')
        .insert({
          school_id: user.school_id,
          film_id: filmId,
          user_id: user.id,
          ip_address: await getClientIP(),
          device_info: navigator.userAgent,
          watermark_id: generateWatermarkId()
        })
        .select('id')
        .single();

      if (logError) {
        console.error('Failed to create viewing log:', logError);
      } else {
        setViewingLogId(logData?.id);
      }

      setFilm(filmData);
    } catch (error) {
      console.error('Error loading film:', error);
      toast.error('Failed to load film');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return '127.0.0.1';
    }
  };

  const generateWatermarkId = (): string => {
    return `${user.school_id.slice(-8)}-${Date.now()}`;
  };

  const updateViewingLog = async (watchedSeconds: number, ended = false) => {
    if (!viewingLogId) return;

    try {
      const updateData: any = {
        watched_seconds: Math.floor(watchedSeconds)
      };

      if (ended) {
        updateData.ended_at = new Date().toISOString();
      }

      await supabase
        .from('viewing_logs')
        .update(updateData)
        .eq('id', viewingLogId);
    } catch (error) {
      console.error('Failed to update viewing log:', error);
    }
  };

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      updateViewingLog(currentTime);
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

  const handleEnded = () => {
    setIsPlaying(false);
    updateViewingLog(duration, true);
    toast.success('Film completed!');
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

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Listen for fullscreen changes
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
      </div>
    );
  }

  if (!film) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-4">Film not found</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden disable-context"
      onMouseMove={handleMouseMove}
    >
      {/* Watermark */}
      <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded z-20 pointer-events-none select-none">
        SCIFF | {user.school?.name} | {new Date().toLocaleString()}
      </div>

      {/* Video Element */}
      <video
        ref={videoRef}
        src={film.external_url}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Custom Controls */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
            Back
          </button>
          <h1 className="text-white text-lg font-semibold">{film.title}</h1>
          <div />
        </div>

        {/* Center Play/Pause Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="bg-black/50 hover:bg-black/70 rounded-full p-4 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-12 h-12 text-white" />
            ) : (
              <Play className="w-12 h-12 text-white" />
            )}
          </button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
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
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
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
    </div>
  );
};

export default VideoPlayer;