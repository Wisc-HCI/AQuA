import React from 'react';
import './css/Overview.css';

function Overview() {
  return (
    <div className="overview-container">
      <h2 className="overview-header">Overview</h2>
      <p className="overview-text">
        This is a brief description of the video content and the VLM (Video Language Model) application. 
        The overview provides context and key points about what is covered in the video, helping users 
        understand the main topics and objectives.
      </p>
    </div>
  );
}

export default Overview;
