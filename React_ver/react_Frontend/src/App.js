import React, { useState } from 'react';
import './App.css';
import moment from 'moment';
import VideoDisplay from './components/VideoDisplay';
import AVScript from './components/AVScript';
import Prompting from './components/Prompting';
import Transcript from './components/Transcript_ObjectInfo/Transcript';
import ObjectInfo from './components/Transcript_ObjectInfo/ObjectInfo';
import Scheduler from './components/Transcript_ObjectInfo/Scheduler';

function App() {
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);

  const fetchTimelineData = async () => {
    try {
      const response = await fetch('http://localhost:5000/retrieve-json');
      const data = await response.json();
      console.log("Fetched data:", data); // Debug log

      // Transform data
      const transformedGroups = data.map((item, index) => ({
        id: index + 1,
        title: item.object,
      }));

      const transformedItems = data.flatMap((item, index) =>
        item.times.map((time, subIndex) => ({
          id: `${index + 1}-${subIndex + 1}`,
          group: index + 1,
          title: `${item.object} #${subIndex + 1}`,
          start_time: moment.duration(time.start, 'seconds').toISOString(),
          end_time: moment.duration(time.end, 'seconds').toISOString(),
          className: 'task-new'
        }))
      );

      setGroups(transformedGroups);
      setItems(transformedItems);
    } catch (error) {
      console.error('Error fetching data', error);
    }
  };

  return (
    <div className="App">
      <div className="top-section">
        <div className="video">
          <VideoDisplay fetchTimelineData={fetchTimelineData} />
        </div>
        {/* <div className="av-script">
          <AVScript />
        </div> */}
        <div className="prompting">
          <Prompting />
        </div>
      </div>
      <div className="middle-section">
        <Scheduler groups={groups} items={items} />
      </div>
    </div>
  );
}

export default App;