import React, { useState, useRef } from 'react';

const VideoPlaybackTest: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [proxyUrl, setProxyUrl] = useState('/api/video-proxy/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [useProxy, setUseProxy] = useState(true);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const testVideoPlayback = () => {
    if (videoRef.current) {
      setError('');
      setPlaying(false);
      setLoaded(false);
      
      videoRef.current.src = useProxy ? proxyUrl : videoUrl;
      
      videoRef.current.onloadeddata = () => {
        setLoaded(true);
        console.log('Video loaded successfully');
      };
      
      videoRef.current.onerror = (e) => {
        setError(`Video error occurred`);
        console.error('Video error:', e);
      };
      
      // Try to play
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlaying(true);
            console.log('Video playing successfully');
          })
          .catch(error => {
            setError(`Playback failed: ${error.message}`);
            console.error('Playback error:', error);
          });
      }
    }
  };

  const pauseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Video Playback Test</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">Direct Video URL</label>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-gray-300 mb-2">Proxy Video URL</label>
            <input
              type="text"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="useProxy"
              checked={useProxy}
              onChange={(e) => setUseProxy(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="useProxy" className="text-gray-300">Use Proxy URL</label>
          </div>
          
          <button
            onClick={testVideoPlayback}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Test Video Playback
          </button>
          
          {playing && (
            <button
              onClick={pauseVideo}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Pause Video
            </button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {loaded && (
        <div className="bg-green-600 text-white p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">Success</h3>
          <p>Video loaded successfully!</p>
        </div>
      )}
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Video Player</h2>
        <video
          ref={videoRef}
          controls
          className="w-full h-64 bg-black"
          crossOrigin="anonymous"
        />
      </div>
    </div>
  );
};

export default VideoPlaybackTest;