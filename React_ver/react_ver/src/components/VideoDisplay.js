import React from 'react';
import './css/VideoDisplay.css';

function VideoDisplay() {
  return (
    <div className="video-display">
      <h2>Video Display</h2>
      <video width="100%" controls>
        <source src="path_to_your_video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

export default VideoDisplay;
