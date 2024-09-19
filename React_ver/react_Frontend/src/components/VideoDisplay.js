import React, { useState, useRef } from 'react';
import './css/VideoDisplay.css';

function VideoDisplay({ onUploadComplete, resetUpload }) {
  const [videoUrl, setVideoUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [uploadOption, setUploadOption] = useState('video-only');
  const [isUploaded, setIsUploaded] = useState(false);

  // Refs for file inputs
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const handleVideoChange = (event) => {
    setSelectedVideo(event.target.files[0]);
  };

  const handleAudioChange = (event) => {
    setSelectedAudio(event.target.files[0]);
  };

  const handleOptionChange = (event) => {
    setUploadOption(event.target.value);
    setSelectedVideo(null);
    setSelectedAudio(null);
  };

  const uploadFiles = async () => {
    if (!selectedVideo || (uploadOption === 'video-and-audio' && !selectedAudio)) {
      alert('Please select the required files.');
      return;
    }

    const formData = new FormData();
    formData.append('video', selectedVideo);
    if (uploadOption === 'video-and-audio') {
      formData.append('audio', selectedAudio);
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        mode: 'cors',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload error! status: ${response.status}`);
      }

      console.log('Files uploaded successfully');
      await runScript();
      setIsUploaded(true);
      onUploadComplete(); // Notify App component about the successful upload
    } catch (error) {
      console.error('Error uploading files:', error);
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
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Script ran successfully');

      await fetchMostRecentVideo();
      if (uploadOption === 'video-and-audio') {
        await fetchMostRecentAudio();
      }
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

  // Internal function to reset state within VideoDisplay component
  const handleResetUpload = () => {
    setSelectedVideo(null);
    setSelectedAudio(null);
    setVideoUrl('');
    setAudioUrl('');
    setIsUploaded(false);
    if (videoInputRef.current) {
      videoInputRef.current.value = ''; // Clear video input field
    }
    if (audioInputRef.current) {
      audioInputRef.current.value = ''; // Clear audio input field
    }
    resetUpload(); // Call the reset function passed from App component
  };

  return (
    <div className="video-container">
      <h2 className="video-header">Video Display</h2>
      {!videoUrl && (
        <>
          <div className="upload-option-container">
            <label>Select Upload Option:</label>
            <select onChange={handleOptionChange} value={uploadOption}>
              <option value="video-only">Video Only</option>
              <option value="video-and-audio">Video and Audio</option>
            </select>
          </div>

          <div className="input-container">
            <label htmlFor="video-upload">Choose Video:</label>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              disabled={isUploaded}
              ref={videoInputRef} // Reference to clear the input
            />
          </div>

          {uploadOption === 'video-and-audio' && (
            <div className="input-container">
              <label htmlFor="audio-upload">Choose Audio:</label>
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                disabled={isUploaded}
                ref={audioInputRef} // Reference to clear the input
              />
            </div>
          )}

          <button onClick={uploadFiles} disabled={isUploaded}>
            Upload and Analyze
          </button>
        </>
      )}
      {videoUrl && <video src={videoUrl} controls width="600" />}
      {isUploaded && (
        <button onClick={handleResetUpload}>
          Upload Again
        </button>
      )}
    </div>
  );
}

export default VideoDisplay;
