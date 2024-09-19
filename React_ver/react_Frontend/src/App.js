import React, { useState } from 'react';
import './App.css';
import VideoDisplay from './components/VideoDisplay';
import AVScript from './components/AVScript';
import Prompting from './components/Prompting';

function App() {
  const [isVideoUploaded, setIsVideoUploaded] = useState(false);

  const handleVideoUpload = () => {
    setIsVideoUploaded(true);
  };

  const resetUpload = () => {
    setIsVideoUploaded(false);
  };

  return (
    <div className="App">
      <div className="top-section">
        <div className="video">
          <VideoDisplay onUploadComplete={handleVideoUpload} resetUpload={resetUpload} />
        </div>
        <div className="av-script">
          {/* Pass the prop correctly */}
          <AVScript isVideoUploaded={isVideoUploaded} />
        </div>
        <div className="prompting">
          <Prompting />
        </div>
      </div>
    </div>
  );
}

export default App;
