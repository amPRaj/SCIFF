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
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay compliance
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [viewingLogId, setViewingLogId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buffering, setBuffering] = useState(false);
  const [isGumletEmbed, setIsGumletEmbed] = useState(false);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check if URL is a Gumlet embed link
  const isGumletUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('gumlet.io') && url.includes('/embed/');
    } catch {
      return false;
    }
  };

  // Function to extract Gumlet embed ID from URL
  const getGumletEmbedId = (url: string): string | null => {
    try {
      const match = url.match(/\/embed\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  // Function to create Gumlet embed URL
  const createGumletEmbedUrl = (url: string): string => {
    if (isGumletUrl(url)) {
      // Ensure the URL has the correct format for embedding
      const embedId = getGumletEmbedId(url);
      if (embedId) {
        return `https://play.gumlet.io/embed/${embedId}?autoplay=false&loop=false&muted=false`;
      }
    }
    return url;
  };

  // Function to handle Gumlet embed errors
  const handleGumletError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    console.error('Gumlet embed error:', e);
    setError('Failed to load Gumlet video player');
    toast.error('Failed to load Gumlet video player');
  };

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
      setError(null);

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
        const errorMessage = filmError ? filmError.message : 'Film not found or unavailable';
        setError(`Film Error: ${errorMessage}`);
        toast.error(`Film Error: ${errorMessage}`);
        console.error('Film loading error:', filmError);
        navigate('/');
        return;
      }

      // Log the film data for debugging
      console.log('Loaded film data:', filmData);

      // Validate external URL
      if (!filmData.external_url) {
        setError('Film URL is missing');
        toast.error('Film URL is missing');
        console.error('Film URL is missing for film:', filmData);
        navigate('/');
        return;
      }

      // Check if this is a Gumlet embed URL
      const gumletCheck = isGumletUrl(filmData.external_url);
      setIsGumletEmbed(gumletCheck);
      
      if (gumletCheck) {
        console.log('Detected Gumlet embed URL:', filmData.external_url);
      }

      // Check if URL is valid
      try {
        const url = new URL(filmData.external_url);
        console.log('Film URL is valid:', url.href);
      } catch (urlError) {
        setError('Invalid film URL format');
        toast.error('Invalid film URL format');
        console.error('Invalid film URL:', filmData.external_url);
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
        setError(`Access Denied: ${errorMessage}`);
        toast.error(`Access Denied: ${errorMessage}`);
        console.error('Subscription error:', subscriptionError);
        navigate('/');
        return;
      }

      // Test if the video URL is accessible (skip for Gumlet URLs)
      if (!gumletCheck) {
        try {
          const response = await fetch(filmData.external_url, { method: 'HEAD' });
          console.log('Video URL accessibility check:', response.status, response.statusText);
          if (!response.ok) {
            console.warn('Video URL might not be accessible:', response.status);
          }
        } catch (urlAccessError) {
          console.warn('Could not check video URL accessibility:', urlAccessError);
        }
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
        // Don't fail the whole process if logging fails
      } else {
        setViewingLogId(logData?.id);
      }

      setFilm(filmData);
    } catch (error: any) {
      console.error('Error loading film:', error);
      const errorMessage = error.message || 'Failed to load film';
      setError(`Loading Error: ${errorMessage}`);
      toast.error(`Loading Error: ${errorMessage}`);
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
    // Skip this for Gumlet embeds
    if (isGumletEmbed) return;
    
    if (!videoRef.current) {
      console.error('Video element not found');
      setError('Video element not found');
      toast.error('Video element not found');
      return;
    }
    
    setBuffering(true);
    
    // Try to play the video
    const playPromise = videoRef.current.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setBuffering(false);
        })
        .catch(error => {
          console.error('Playback failed:', error);
          const errorMessage = error.message || 'Failed to play video';
          
          // Try to handle different error types
          if (errorMessage.includes('interact') || errorMessage.includes('user')) {
            // User interaction required, show a play button
            setError('Click the play button to start the video');
            toast.error('Please click the play button to start the video');
          } else {
            setError(`Playback Error: ${errorMessage}`);
            toast.error(`Playback Error: ${errorMessage}`);
          }
          setBuffering(false);
        });
    } else {
      // Older browsers might not return a promise
      setIsPlaying(true);
      setBuffering(false);
    }
  };
  
  const playVideo = () => {
    if (!videoRef.current) return;
    
    setBuffering(true);
    
    // Try to play the video
    const playPromise = videoRef.current.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setBuffering(false);
        })
        .catch(error => {
          console.error('Playback failed:', error);
          const errorMessage = error.message || 'Failed to play video';
          
          // Try to handle different error types
          if (errorMessage.includes('interact') || errorMessage.includes('user')) {
            // User interaction required, show a play button
            setError('Click the play button to start the video');
            toast.error('Please click the play button to start the video');
          } else {
            setError(`Playback Error: ${errorMessage}`);
            toast.error(`Playback Error: ${errorMessage}`);
          }
          setBuffering(false);
        });
    } else {
      // Older browsers might not return a promise
      setIsPlaying(true);
      setBuffering(false);
    }
  };

  const handlePause = () => {
    // Skip this for Gumlet embeds
    if (isGumletEmbed) return;
    
    if (!videoRef.current) {
      console.error('Video element not found');
      setError('Video element not found');
      toast.error('Video element not found');
      return;
    }
    
    videoRef.current.pause();
    setIsPlaying(false);
    updateViewingLog(currentTime);
  };

  const handleTimeUpdate = () => {
    // Skip this for Gumlet embeds
    if (isGumletEmbed) return;
    
    if (!videoRef.current) return;
    
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    // Skip this for Gumlet embeds
    if (isGumletEmbed) return;
    
    if (!videoRef.current) return;
    
    setDuration(videoRef.current.duration);
    setBuffering(false);
  };

  const handleEnded = () => {
    // Skip this for Gumlet embeds
    if (isGumletEmbed) return;
    
    if (!videoRef.current) return;
    
    setIsPlaying(false);
    updateViewingLog(duration, true);
    toast.success('Film completed!');
  };

  const handleSeek = (time: number) => {
    // Skip this for Gumlet embeds
    if (isGumletEmbed) return;
    
    if (!videoRef.current) {
      console.error('Video element not found');
      setError('Video element not found');
      toast.error('Video element not found');
      return;
    }
    
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (newVolume: number) => {
    // Skip this for Gumlet embeds
    if (isGumletEmbed) return;
    
    if (!videoRef.current) {
      console.error('Video element not found');
      setError('Video element not found');
      toast.error('Video element not found');
      return;
    }
    
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    // Skip this for Gumlet embeds
    if (isGumletEmbed) return;
    
    if (!videoRef.current) {
      console.error('Video element not found');
      setError('Video element not found');
      toast.error('Video element not found');
      return;
    }
    
    if (isMuted) {
      videoRef.current.volume = volume > 0 ? volume : 0.5;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
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

  // Add this useEffect to check if video element is properly mounted (only for non-Gumlet videos)
  useEffect(() => {
    // Skip this for Gumlet embeds
    if (isGumletEmbed || !film?.external_url) return;
    
    // Add a small delay to ensure the video element is properly mounted
    const timer = setTimeout(() => {
      if (videoRef.current) {
        console.log('Video element mounted:', videoRef.current);
        console.log('Video element src:', videoRef.current.src);
        
        // Initialize video element properties
        videoRef.current.volume = volume;
        videoRef.current.muted = true; // Always start muted for autoplay compliance
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [film, isGumletEmbed, volume]);

  // Add this useEffect to log video element errors (only for non-Gumlet videos)
  useEffect(() => {
    // Skip this for Gumlet embeds
    if (isGumletEmbed) return;
    
    if (!videoRef.current) return;
    
    const videoElement = videoRef.current;

    const handleError = (e: Event) => {
      console.error('Video element error:', e);
      const error = (e.target as HTMLVideoElement).error;
      if (error) {
        let errorMessage = 'Unknown video error';
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMessage = 'Media aborted';
            break;
          case error.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error - check your connection';
            break;
          case error.MEDIA_ERR_DECODE:
            errorMessage = 'Media decode error - video file may be corrupted';
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Source not supported - video format not supported';
            break;
        }
        setError(`Video Error: ${errorMessage}`);
        toast.error(`Video Error: ${errorMessage}`);
        console.error('Video error details:', error);
        
        // Try to reload the video with a different approach
        if (film?.external_url) {
          console.log('Attempting to reload video with modified URL...');
          // Try to reload the video source
          videoElement.load();
        }
      }
      setBuffering(false);
    };

    const handleWaiting = () => {
      setBuffering(true);
    };

    const handlePlaying = () => {
      setBuffering(false);
    };

    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('playing', handlePlaying);
    
    return () => {
      videoElement.removeEventListener('error', handleError);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('playing', handlePlaying);
    };
  }, [film, isGumletEmbed]);

  // Function to create a proxy URL for videos
  const createProxyUrl = (originalUrl: string): string => {
    try {
      const url = new URL(originalUrl);
      // If it's a Google storage URL, use our proxy
      if (url.hostname.includes('googleapis.com') || url.hostname.includes('googleusercontent.com')) {
        // Extract the path and create proxy URL
        return `/api/video-proxy${url.pathname}${url.search}`;
      }
      // For other URLs, return as is
      return originalUrl;
    } catch (error) {
      console.error('Error creating proxy URL:', error);
      return originalUrl;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-2xl p-4">
          <h2 className="text-xl font-semibold text-white mb-4">{error}</h2>
          <p className="text-gray-400 mb-4">
            Please check the video URL or contact your administrator.
          </p>
          
          {film?.external_url && (
            <div className="bg-gray-800 p-4 rounded-lg mb-4 text-left">
              <h3 className="text-white font-semibold mb-2">Debug Information:</h3>
              <p className="text-gray-300 text-sm mb-1">
                <span className="font-medium">Film Title:</span> {film.title}
              </p>
              <p className="text-gray-300 text-sm mb-1">
                <span className="font-medium">Original Video URL:</span> {film.external_url}
              </p>
              {isGumletUrl(film.external_url) && (
                <p className="text-gray-300 text-sm mb-1">
                  <span className="font-medium">Gumlet Embed URL:</span> {createGumletEmbedUrl(film.external_url)}
                </p>
              )}
              <p className="text-gray-300 text-sm">
                <span className="font-medium">Category:</span> {film.category?.name}
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Go Back Home
            </button>
            
            {film?.external_url && (
              <button
                onClick={() => window.open(film.external_url, '_blank')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
              >
                Open Video in New Tab
              </button>
            )}
          </div>
        </div>
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

      {/* Loading/Buffering Indicator */}
      {buffering && !isGumletEmbed && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-black/70 rounded-lg p-4 flex items-center">
            <LoadingSpinner size="medium" />
            <span className="ml-2 text-white">Loading video...</span>
          </div>
        </div>
      )}

      {/* Gumlet Embed */}
      {isGumletEmbed && film?.external_url && (
        <iframe
          src={createGumletEmbedUrl(film.external_url)}
          className="w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          title={film.title}
          onError={handleGumletError}
        />
      )}

      {/* Regular Video Element (only shown when not using Gumlet) */}
      {!isGumletEmbed && film?.external_url && (
        <video
          ref={videoRef}
          src={createProxyUrl(film.external_url)}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
            console.error('Video error event:', e);
            const error = (e.target as HTMLVideoElement).error;
            if (error) {
              let errorMessage = 'Unknown video error';
              switch (error.code) {
                case error.MEDIA_ERR_ABORTED:
                  errorMessage = 'Media aborted';
                  break;
                case error.MEDIA_ERR_NETWORK:
                  errorMessage = 'Network error - check your connection';
                  break;
                case error.MEDIA_ERR_DECODE:
                  errorMessage = 'Media decode error - video file may be corrupted';
                  break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  errorMessage = 'Source not supported - video format not supported';
                  break;
              }
              setError(`Video Error: ${errorMessage}`);
              toast.error(`Video Error: ${errorMessage}`);
              console.error('Video error details:', error);
            }
            setBuffering(false);
          }}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          controls={false}
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          // Add crossOrigin attribute to handle CORS issues
          crossOrigin="anonymous"
          // Add preload to improve loading
          preload="metadata"
          // Add attributes for better mobile support and autoplay compliance
          playsInline
          muted
          autoPlay={false}
        />
      )}

      {/* Custom Controls (only for regular video, not Gumlet) */}
      {!isGumletEmbed && (
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
            <h1 className="text-white text-lg font-semibold">{film?.title}</h1>
            <div />
          </div>

          {/* Center Play/Pause Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="bg-black/50 hover:bg-black/70 rounded-full p-4 transition-colors"
              disabled={buffering}
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
                  disabled={buffering}
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
      )}
    </div>
  );
};

export default VideoPlayer;