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

            // Check for a successful response
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log("Script ran successfully");

            // Fetch the most recent video and audio files from the backend
            await fetchMostRecentVideo();
            await fetchMostRecentAudio();

        } catch (error) {
            console.error('Error:', error); // Log any errors that occur during the process
        }
    };

    /**
     * fetchMostRecentVideo
     * 
     * This function triggers a GET request to the backend to fetch the most recent video file.
     * The video file is returned as a blob and converted into an object URL for display.
     */
    const fetchMostRecentVideo = async () => {
        try {
            // Sending a GET request to retrieve the most recent video
            const response = await fetch('http://127.0.0.1:5000/video/recent', {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Check for a successful response
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Convert the response blob into a video URL
            const blob = await response.blob();
            const videoUrl = URL.createObjectURL(blob);
            setVideoUrl(videoUrl); // Set the video URL in the component state

        } catch (error) {
            console.error('Error fetching the most recent video:', error); // Log any errors that occur
        }
    };

    /**
     * fetchMostRecentAudio
     * 
     * This function triggers a GET request to the backend to fetch the most recent audio file.
     * The audio file is returned as a blob and converted into an object URL for playback.
     */
    const fetchMostRecentAudio = async () => {
        try {
            // Sending a GET request to retrieve the most recent audio
            const response = await fetch('http://127.0.0.1:5000/audio/recent', {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Check for a successful response
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Convert the response blob into an audio URL
            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            setAudioUrl(audioUrl); // Set the audio URL in the component state

        } catch (error) {
            console.error('Error fetching the most recent audio:', error); // Log any errors that occur
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
