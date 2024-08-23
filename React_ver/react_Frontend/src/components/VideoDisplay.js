import React, { useState } from 'react';
import './css/VideoDisplay.css';

/**
 * VideoDisplay Component
 * 
 * This component is responsible for displaying video and audio fetched from the backend
 * after running a script on the server. It fetches the most recent video and audio files
 * and displays them in a UI that allows for playback.
 * 
 * Props:
 * - setAvScript: A function to update the script (not yet used in this component)
 * - setTimeline: A function to update the timeline (not yet used in this component)
 * - setObjects: A function to update objects (not yet used in this component)
 */
function VideoDisplay({ setAvScript, setTimeline, setObjects }) {
    // Local state to store video and audio URLs for playback
    const [videoUrl, setVideoUrl] = useState(''); // Stores the video URL generated from the fetched blob
    const [audioUrl, setAudioUrl] = useState(''); // Stores the audio URL generated from the fetched blob

    /**
     * runScript
     * 
     * This function triggers a POST request to the backend server to run a script. 
     * After the script runs successfully, it fetches the most recent video and audio 
     * from the backend.
     */
    const runScript = async () => {
        try {
            // Sending a POST request to run the script on the backend
            const response = await fetch('http://127.0.0.1:5000/run-script', {
                method: 'POST', // HTTP method used for the request
                mode: 'cors', // Enable Cross-Origin Resource Sharing
                headers: {
                    'Content-Type': 'application/json', // The request content-type is JSON
                },
                body: JSON.stringify({}) // Empty payload sent in the body
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
            {/* Component title */}
            <h2 className="video-header">Video Display</h2>

            {/* Button to trigger the script and fetch video/audio */}
            <button onClick={runScript}>Upload and Analyze</button>

            {/* Display the video if the URL is available */}
            {videoUrl && <video src={videoUrl} controls width="600" />}

            {/* Display the audio if the URL is available */}
            {audioUrl && <audio src={audioUrl} controls />}
        </div>
    );
}

export default VideoDisplay;
