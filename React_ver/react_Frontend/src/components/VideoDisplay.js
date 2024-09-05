import React, { useState } from 'react';
import './css/VideoDisplay.css';

function VideoDisplay({ fetchTimelineData }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);

  const handleVideoChange = (event) => {
    setSelectedVideo(event.target.files[0]);
  };

  const handleAudioChange = (event) => {
    setSelectedAudio(event.target.files[0]);
  };

  const uploadFiles = async () => {
    if (!selectedVideo || !selectedAudio) {
      alert("Please select both video and audio files.");
      return;
    }

    const formData = new FormData();
    formData.append('video', selectedVideo);
    formData.append('audio', selectedAudio);

    try {
      const response = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        mode: 'cors',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload error! status: ${response.status}`);
      }

      console.log("Video and audio uploaded successfully");
      await runScript(); // Run the script after uploading
    } catch (error) {
      console.error('Error uploading video and audio:', error);
    }
  };

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
      {!videoUrl && (
        <>
          <div className="input-container">
            <label htmlFor="video-upload">Choose Video:</label>
            <input id="video-upload" type="file" accept="video/*" onChange={handleVideoChange} />
          </div>
          <div className="input-container">
            <label htmlFor="audio-upload">Choose Audio:</label>
            <input id="audio-upload" type="file" accept="audio/*" onChange={handleAudioChange} />
          </div>
          <button onClick={uploadFiles}>Upload and Analyze</button>
        </>
      )}
      {videoUrl && <video src={videoUrl} controls width="600" />}
    </div>
  );
}

export default VideoDisplay;
