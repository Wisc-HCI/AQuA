import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import logToFile from '../utils/logger';

function VideoDisplay({ onUploadComplete, resetUpload, seekTime, onVideoPause, onVideoPlay, onVideoTimeUpdate }) {
  const [videoUrl, setVideoUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [uploadOption, setUploadOption] = useState("video-only");
  const [isUploaded, setIsUploaded] = useState(false);
  const videoRef = useRef(null); // Ref to access the video element
  const [email, setEmail] = useState("");

  console.log(audioUrl)

  // Refs for file inputs
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  useEffect(() => {
    // Seek to the desired time in the video when the `seekTime` prop changes
    if (videoRef.current && seekTime !== null) {
      videoRef.current.currentTime = seekTime;
      videoRef.current.play(); // Optionally, play the video after seeking
    }
  }, [seekTime]);

  useEffect(() => {
    if (videoRef.current) {
      const handlePause = () => {
        if (onVideoPause) {
          onVideoPause(videoRef.current.currentTime); // Notify parent about paused time
        }
        logToFile('VideoDisplay', 'Video Pause', `Paused at: ${videoRef.current.currentTime}`);
      };

      const handlePlay = () => {
        if (onVideoPlay) {
          onVideoPlay(); // Notify parent that video is playing
        }
        logToFile('VideoDisplay', 'Video Play', 'Video started playing');
      };

      const handleTimeUpdate = () => {
        if (onVideoTimeUpdate) {
          onVideoTimeUpdate(videoRef.current.currentTime); // Notify parent about current video time
        }
      };

      videoRef.current.addEventListener("pause", handlePause);
      videoRef.current.addEventListener("play", handlePlay);
      videoRef.current.addEventListener("timeupdate", handleTimeUpdate);

      return () => {
        videoRef.current.removeEventListener("pause", handlePause);
        videoRef.current.removeEventListener("play", handlePlay);
        videoRef.current.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [onVideoPause, onVideoPlay, onVideoTimeUpdate]);

  useEffect(() => {
    // Load saved video URL and upload status from localStorage
    const savedVideoUrl = localStorage.getItem('videoUrl');
    const savedAudioUrl = localStorage.getItem('audioUrl');
    const savedUploadOption = localStorage.getItem('uploadOption');
    const savedEmail = localStorage.getItem('userEmail');
    
    if (savedVideoUrl) {
      setVideoUrl(savedVideoUrl);
    }
    if (savedAudioUrl) {
      setAudioUrl(savedAudioUrl);
    }
    if (savedUploadOption) {
      setUploadOption(savedUploadOption);
    }
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleVideoChange = (event) => {
    setSelectedVideo(event.target.files[0]);
    logToFile('VideoDisplay', 'Select Video', `Selected video: ${event.target.files[0].name}`);
  };

  const handleAudioChange = (event) => {
    setSelectedAudio(event.target.files[0]);
    logToFile('VideoDisplay', 'Select Audio', `Selected audio: ${event.target.files[0].name}`);
  };

  const handleOptionChange = (event) => {
    setUploadOption(event.target.value);
    setSelectedVideo(null);
    setSelectedAudio(null);
    localStorage.setItem('uploadOption', event.target.value);
    logToFile('VideoDisplay', 'Change Upload Option', `Changed to: ${event.target.value}`);
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    localStorage.setItem('userEmail', newEmail);
  };

  const uploadFiles = async () => {
    if (!selectedVideo || (uploadOption === "video-and-audio" && !selectedAudio)) {
      alert("Please select the required files.");
      return;
    }

    logToFile('VideoDisplay', 'Upload', `Started upload process with option: ${uploadOption}`);

    if (!email) {
      alert("Please enter your email.");
      return;
    }

    const formData = new FormData();
    formData.append("video", selectedVideo);
    if (uploadOption === "video-and-audio") {
      formData.append("audio", selectedAudio);
    }

    try {
      console.log("Files uploaded successfully");
      console.log(selectedVideo);
      await runScript();
      setIsUploaded(true);
      onUploadComplete(); // Notify App component about the successful upload
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const runScript = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/run-script", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("Script ran successfully");

      await fetchMostRecentVideo();
      if (uploadOption === "video-and-audio") {
        await fetchMostRecentAudio();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchMostRecentVideo = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/video/recent", {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const videoUrl = URL.createObjectURL(blob);
      setVideoUrl(videoUrl);
      localStorage.setItem('videoUrl', videoUrl);
    } catch (error) {
      console.error("Error fetching the most recent video:", error);
    }
  };

  const fetchMostRecentAudio = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/audio/recent", {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      setAudioUrl(audioUrl);
      localStorage.setItem('audioUrl', audioUrl);
    } catch (error) {
      console.error("Error fetching the most recent audio:", error);
    }
  };

  const handleResetUpload = () => {
    setSelectedVideo(null);
    setSelectedAudio(null);
    setVideoUrl("");
    setAudioUrl("");
    setIsUploaded(false);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
    if (audioInputRef.current) {
      audioInputRef.current.value = "";
    }
    // Clear localStorage items
    localStorage.removeItem('videoUrl');
    localStorage.removeItem('audioUrl');
    localStorage.removeItem('uploadOption');
    resetUpload();
  };

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  // Add this function to handle initial video loading
  const loadInitialVideo = async () => {
    const savedVideoUrl = localStorage.getItem('videoUrl');
    const savedAudioUrl = localStorage.getItem('audioUrl');
    const savedUploadOption = localStorage.getItem('uploadOption');
    const savedEmail = localStorage.getItem('userEmail');
    
    if (savedVideoUrl) {
      // Re-fetch the video instead of using the saved URL
      await fetchMostRecentVideo();
    }
    if (savedAudioUrl && savedUploadOption === 'video-and-audio') {
      // Re-fetch the audio if needed
      await fetchMostRecentAudio();
    }
    if (savedUploadOption) {
      setUploadOption(savedUploadOption);
    }
    if (savedEmail) {
      setEmail(savedEmail);
    }
  };

  // Modify the initial useEffect
  useEffect(() => {
    loadInitialVideo();
  }, []);

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-5 shadow-lg flex flex-col overflow-y-auto">
      <h2 className="text-xl text-gray-800 mb-5 border-b-2 border-green-500 pb-1">Video Display</h2>
      {!videoUrl && (
        <>
          <div className="mb-4">
            <label className="block mb-2">Select Upload Option:</label>
            <select
              className="border border-gray-300 rounded-lg p-2"
              onChange={handleOptionChange}
              value={uploadOption}
            >
              <option value="video-only">Video Only</option>
              <option value="video-and-audio">Video and Audio</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="video-upload" className="block mb-2">Choose Video:</label>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              disabled={isUploaded}
              ref={videoInputRef}
              className="block w-full text-gray-900 border border-gray-300 rounded-lg cursor-pointer focus:outline-none p-2"
            />
          </div>

          {uploadOption === "video-and-audio" && (
            <div className="mb-4">
              <label htmlFor="audio-upload" className="block mb-2">Choose Audio:</label>
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                onChange={handleAudioChange}
                disabled={isUploaded}
                ref={audioInputRef}
                className="block w-full text-gray-900 border border-gray-300 rounded-lg cursor-pointer focus:outline-none p-2"
              />
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block mb-2">Enter Email:</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              disabled={isUploaded}
              className="block w-full text-gray-900 border border-gray-300 rounded-lg cursor-pointer focus:outline-none p-2"
            />
          </div>

          <button
            onClick={uploadFiles}
            disabled={isUploaded}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
          >
            Upload and Analyze
          </button>
        </>
      )}
      {videoUrl && <video ref={videoRef} src={videoUrl} controls width="600" className="mt-4" />}
      {isUploaded && (
        <button
          onClick={handleResetUpload}
          className="mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
        >
          Upload Again
        </button>
      )}
    </div>
  );
}

VideoDisplay.propTypes = {
  onUploadComplete: PropTypes.func.isRequired,
  resetUpload: PropTypes.func.isRequired,
  seekTime: PropTypes.number,
  onVideoPause: PropTypes.func, // Notify parent when video is paused
  onVideoPlay: PropTypes.func, // Notify parent when video resumes playing
  onVideoTimeUpdate: PropTypes.func, // Notify parent of the current video time
};

export default VideoDisplay;
