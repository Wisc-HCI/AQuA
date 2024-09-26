import { useState } from "react";
import VideoDisplay from "./components/VideoDisplay";
import AVScript from "./components/AVScript";
import Prompting from "./components/Prompting";

function App() {
  const [isVideoUploaded, setIsVideoUploaded] = useState(false);

  const handleVideoUpload = () => {
    setIsVideoUploaded(true);
  };

  const resetUpload = () => {
    setIsVideoUploaded(false);
  };

  return (
    <div className="p-5 h-screen">
      {/* Flex container with full height */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:space-x-4 space-y-4 md:space-y-0 h-full">
        
        {/* Video Display Section */}
        <div className="w-full md:w-1/3 flex flex-col h-full">
          <VideoDisplay onUploadComplete={handleVideoUpload} resetUpload={resetUpload} />
        </div>

        {/* AV Script Section */}
        <div className="w-full md:w-1/3 flex flex-col h-full">
          <AVScript isVideoUploaded={isVideoUploaded} />
        </div>

        {/* Prompting Section */}
        <div className="w-full md:w-1/3 flex flex-col h-full">
          <Prompting />
        </div>
        
      </div>
    </div>
  );
}

export default App;

