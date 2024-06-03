import React from 'react';
import './css/Transcript.css';

function Transcript() {
    const handleClick = (text) => {
        alert(`You clicked on: ${text}`);
    };

    return (
        <div className="transcript-container">
            <div className="text-box" onClick={() => handleClick('Introduction to the topic')}>00:00:01 - Introduction to the topic</div>
            <div className="text-box highlighted" onClick={() => handleClick('Explanation of the main concept')}>00:05:23 - Key point 1: Explanation of the main concept</div>
            <div className="text-box" onClick={() => handleClick('Interview with an expert')}>00:12:45 - Interview with an expert</div>
            <div className="text-box" onClick={() => handleClick('Detailed analysis')}>00:20:30 - Key point 2: Detailed analysis</div>
        </div>
    );
}

export default Transcript;
