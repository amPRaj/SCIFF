import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Film } from '../lib/supabase';

const VideoTest: React.FC = () => {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, { status: string; message: string }>>({});

  useEffect(() => {
    loadFilms();
  }, []);

  const loadFilms = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('films')
        .select('*')
        .eq('is_active', true)
        .limit(5);

      if (error) throw error;
      setFilms(data || []);
    } catch (error) {
      console.error('Error loading films:', error);
    } finally {
      setLoading(false);
    }
  };

  const testVideoUrl = async (filmId: string, url: string) => {
    try {
      // Update status to testing
      setTestResults(prev => ({
        ...prev,
        [filmId]: { status: 'testing', message: 'Testing URL...' }
      }));

      // Test with HEAD request first
      const headResponse = await fetch(url, { method: 'HEAD' });
      
      if (headResponse.ok) {
        setTestResults(prev => ({
          ...prev,
          [filmId]: { status: 'success', message: `OK (${headResponse.status})` }
        }));
      } else {
        // Try with GET request
        const getResponse = await fetch(url, { method: 'GET', mode: 'no-cors' });
        setTestResults(prev => ({
          ...prev,
          [filmId]: { status: 'warning', message: `HEAD failed (${headResponse.status}), but GET returned ${getResponse.status}` }
        }));
      }
    } catch (error) {
      console.error(`Error testing URL for film ${filmId}:`, error);
      setTestResults(prev => ({
        ...prev,
        [filmId]: { status: 'error', message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }
      }));
    }
  };

  if (loading) {
    return <div className="p-4">Loading films...</div>;
  }

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Video URL Test</h1>
      <p className="mb-4">This page tests video URLs to diagnose playback issues.</p>
      
      <div className="space-y-4">
        {films.map(film => (
          <div key={film.id} className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-semibold">{film.title}</h2>
            <p className="text-gray-300 mb-2">URL: {film.external_url}</p>
            
            <div className="flex items-center space-x-2 mb-2">
              <button
                onClick={() => film.external_url && testVideoUrl(film.id, film.external_url)}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
              >
                Test URL
              </button>
              
              {testResults[film.id] && (
                <span className={`px-2 py-1 rounded text-sm ${
                  testResults[film.id].status === 'success' ? 'bg-green-600' :
                  testResults[film.id].status === 'warning' ? 'bg-yellow-600' :
                  testResults[film.id].status === 'error' ? 'bg-red-600' :
                  'bg-gray-600'
                }`}>
                  {testResults[film.id].message}
                </span>
              )}
            </div>
            
            {testResults[film.id]?.status === 'error' && (
              <div className="mt-2 text-sm text-gray-300">
                <p>Possible solutions:</p>
                <ul className="list-disc list-inside">
                  <li>Check if the URL is accessible from your browser</li>
                  <li>Verify the video file format is supported (MP4, WebM, Ogg)</li>
                  <li>Ensure the server hosting the video allows cross-origin requests</li>
                  <li>Contact your administrator to verify the video URL</li>
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {films.length === 0 && (
        <div className="text-center py-8">
          <p>No films found. Please add some films to the database.</p>
        </div>
      )}
    </div>
  );
};

export default VideoTest;