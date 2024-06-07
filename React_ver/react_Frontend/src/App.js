import React from 'react';
import './App.css';
import VideoDisplay from './components/VideoDisplay';
import AVScript from './components/AVScript';
import Prompting from './components/Prompting';
import Transcript from './components/Transcript_ObjectInfo/Transcript';
import ObjectInfo from './components/Transcript_ObjectInfo/ObjectInfo';

function App() {
  return (
    <div className="App">
      <div className="top-section">
        <div className="video">
          <VideoDisplay />
        </div>
        <div className="av-script">
          <AVScript />
        </div>
        <div className="prompting">
          <Prompting />
        </div>
      </div>
      <div className="middle-section">
        <Transcript />
      </div>
      <div className="bottom-section">
        <ObjectInfo />
      </div>
    </div>
  );
}

export default App;
