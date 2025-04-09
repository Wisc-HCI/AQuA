import { useState, useEffect } from "react";
import { Mosaic } from "react-mosaic-component";
import "react-mosaic-component/react-mosaic-component.css";
import VideoDisplay from "./components/VideoDisplay";
import AVScript from "./components/AVScript";
import Prompting from "./components/Prompting";
import Navbar from "./components/Navbar"; // Import Navbar component
import Notes from "./components/Notes"; // Import the Notes component

function App() {
  const [isVideoUploaded, setIsVideoUploaded] = useState(false);
  const [seekTime, setSeekTime] = useState(null);
  const [currentVideoTime, setCurrentVideoTime] = useState(null); // Track current video playback time
  const [videoPausedAt, setVideoPausedAt] = useState(null); // Track when the video is paused

  useEffect(() => {
    // Load saved upload status from localStorage
    const savedUploadStatus = localStorage.getItem('videoUploadStatus');
    if (savedUploadStatus) {
      setIsVideoUploaded(JSON.parse(savedUploadStatus));
    }
  }, []);

  const handleVideoUpload = () => {
    setIsVideoUploaded(true);
    localStorage.setItem('videoUploadStatus', JSON.stringify(true));
  };

  const resetUpload = () => {
    setIsVideoUploaded(false);
    localStorage.setItem('videoUploadStatus', JSON.stringify(false));
    // Clear other related data
    localStorage.removeItem('avScriptData');
  };

  const handleSeekToTime = (time) => {
    // Reset seekTime to null before setting it to the new value
    setSeekTime(null);
    // Use setTimeout to ensure the state update happens in the next tick
    setTimeout(() => {
      setSeekTime(time);
    }, 0);
  };

  const handleVideoPause = (pausedAt) => {
    setVideoPausedAt(pausedAt); // Update paused time for Notes
  };

  const handleVideoPlay = () => {
    setVideoPausedAt(null); // Reset paused time when the video resumes playing
  };

  const handleVideoTimeUpdate = (time) => {
    setCurrentVideoTime(time); // Update current video playback time
  };

  return (
    <div className="pt-5 h-screen bg-white">
      <Navbar />

      <div className="mt-5 h-[calc(100vh-2cm)]">
        <Mosaic
          className="bg-white"
          renderTile={(id) => {
            switch (id) {
              case "video":
                return (
                  <VideoDisplay
                    onUploadComplete={handleVideoUpload}
                    resetUpload={resetUpload}
                    seekTime={seekTime}
                    onVideoPause={handleVideoPause} // Pass pause handler
                    onVideoPlay={handleVideoPlay} // Pass play handler
                    onVideoTimeUpdate={handleVideoTimeUpdate} // Pass current time update handler
                  />
                );
              case "script":
                return (
                  <AVScript
                    isVideoUploaded={isVideoUploaded}
                    onSeekToTime={handleSeekToTime}
                    currentVideoTime={currentVideoTime} // Pass current video time
                  />
                );
              case "prompt":
                return (
                  <Prompting
                    isVideoUploaded={isVideoUploaded}
                    onSeekToTime={handleSeekToTime}
                  />
                );
              case "notes":
                return (
                  <Notes
                    videoPausedAt={videoPausedAt}
                    onSeekToTime={handleSeekToTime}
                  />
                ); // Pass paused timestamp
              default:
                return null;
            }
          }}
          initialValue={{
            direction: "row",
            first: {
              direction: "column",
              first: "video",
              second: "script",
            },
            second: {
              direction: "column",
              first: "prompt",
              second: "notes", // Add Notes below Prompting
            },
          }}
        />
      </div>
    </div>
  );
}

export default App;