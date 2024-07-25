import React, { useState } from 'react';
import './css/VideoDisplay.css';

function VideoDisplay({ fetchTimelineData }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  const runScript = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/run-script', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}) // Assuming you need to send an empty object
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("Script ran successfully");

      await fetchMostRecentVideo();
      await fetchMostRecentAudio();
      fetchTimelineData(); // Fetch the timeline data after script runs
      console.log("Timeline data fetched"); // Debug log
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMostRecentVideo = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/video/recent', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const videoUrl = URL.createObjectURL(blob);
      setVideoUrl(videoUrl);
    } catch (error) {
      console.error('Error fetching the most recent video:', error);
    }
  };

  const fetchMostRecentAudio = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/audio/recent', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      setAudioUrl(audioUrl);
    } catch (error) {
      console.error('Error fetching the most recent audio:', error);
    }
  };

  return (
    <div className="video-container">
      <h2 className="video-header">Video Display</h2>
      <button onClick={runScript}>Upload and Analyze</button>
      {videoUrl && <video src={videoUrl} controls width="600" />}
      {audioUrl && <audio src={audioUrl} controls />}
    </div>
  );
}

export default VideoDisplay;
