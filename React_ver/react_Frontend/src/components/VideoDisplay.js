import React from 'react';
import './css/VideoDisplay.css';

function VideoDisplay() {
  return (
    <div className="video-container">
      <h2 className="video-header">Video Display</h2>
      <video className="video-element" controls>
        <source src="path_to_your_video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default VideoDisplay;
