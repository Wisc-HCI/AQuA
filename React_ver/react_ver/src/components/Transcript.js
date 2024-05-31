import React from 'react';
import './css/Transcript.css';

function Transcript() {
  return (
    <div className="transcript-container">
      <div className="text-box">00:00:01 - Introduction to the topic</div>
      <div className="text-box highlighted">00:05:23 - Key point 1: Explanation of the main concept</div>
      <div className="text-box">00:12:45 - Interview with an expert</div>
      <div className="text-box">00:20:30 - Key point 2: Detailed analysis</div>
    </div>
  );
}

export default Transcript;
