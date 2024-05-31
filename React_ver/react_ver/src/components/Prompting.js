import React from 'react';
import './css/Prompting.css';

function Prompting() {
  return (
    <div className="prompting-container">
      <h2>Prompting</h2>
      <div className="qa-pair">
        <div className="question">Q: What are the main topics covered in this video?</div>
        <div className="answer">A: The main topics covered include AI trends, expert interviews, and detailed analysis of AI advancements.</div>
      </div>
      <div className="qa-pair">
        <div className="question">Q: Can you provide an analysis of the key points discussed?</div>
        <div className="answer">A: Sure, the key points include the significance of AI in 2024, expert opinions, and future predictions.</div>
      </div>
      <div className="qa-pair">
        <div className="question">Q: Summarize the expert opinions presented in the video.</div>
        <div className="answer">A: Experts believe that AI will revolutionize various industries, with significant advancements in machine learning and data processing.</div>
      </div>
    </div>
  );
}

export default Prompting;
