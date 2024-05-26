import React from 'react';
import './css/Overview.css';

function Overview() {
  return (
    <div className="overview-container">
      <h2 className="overview-header">Overview</h2>
      <div className="qa-pair">
        <div className="question">Q: What is the purpose of this video?</div>
        <div className="answer">A: The purpose of this video is to demonstrate the capabilities of the Video Language Model (VLM) in analyzing and understanding video content.</div>
      </div>
      <div className="qa-pair">
        <div className="question">Q: How does the VLM work?</div>
        <div className="answer">A: The VLM uses advanced machine learning algorithms to process video frames and extract meaningful information, which is then used to generate a comprehensive overview and timeline of the video's content.</div>
      </div>
      <div className="qa-pair">
        <div className="question">Q: What can users expect from this demonstration?</div>
        <div className="answer">A: Users can expect a detailed analysis of the video's key events, insights into the VLM's processing techniques, and an interactive timeline highlighting important moments in the video.</div>
      </div>
    </div>
  );
}

export default Overview;
