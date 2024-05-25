import React from 'react';
import './css/Timeline.css';

function Timeline() {
  return (
    <div className="timeline-container">
      <h2 className="timeline-header">Timeline</h2>
      <ul className="timeline-list">
        <li>00:00:00 - Start</li>
        <li>00:10:00 - Important Event 1</li>
        <li>00:20:00 - Important Event 2</li>
      </ul>
    </div>
  );
}

export default Timeline;
