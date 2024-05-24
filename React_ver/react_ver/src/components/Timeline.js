import React from 'react';
import './css/Timeline.css';

function Timeline() {
  return (
    <div className="timeline">
      <h2>Timeline</h2>
      <ul>
        <li>00:00:00 - Start</li>
        <li>00:10:00 - Important Event 1</li>
        <li>00:20:00 - Important Event 2</li>
        {/* Add more timeline events as needed */}
      </ul>
    </div>
  );
}

export default Timeline;
