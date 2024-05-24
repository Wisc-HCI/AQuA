import React from 'react';
import './App.css';
import VideoDisplay from './components/VideoDisplay';
import Overview from './components/Overview';
import Timeline from './components/Timeline';
import AdditionalInfo from './components/AdditionalInfo';

function App() {
  return (
    <div className="App">
      <div className="part1">
        <VideoDisplay />
      </div>
      <div className="part2">
        <Overview />
      </div>
      <div className="part3">
        <Timeline />
      </div>
      <div className="part4">
        <AdditionalInfo />
      </div>
    </div>
  );
}

export default App;
