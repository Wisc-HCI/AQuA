import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import logToFile from '../utils/logger';

// Utility function to convert seconds to minutes:seconds format
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

function AVScript({ isVideoUploaded, onSeekToTime, currentVideoTime, seekTime }) {
  const [avData, setAVData] = useState(null);
  const [editIndex, setEditIndex] = useState(null); // Track which segment is in edit mode
  const [editedSegment, setEditedSegment] = useState(null); // Track edited segment
  const segmentRefs = useRef([]); // Ref array to enable auto-scrolling

  // Function to fetch AV data from the API
  const fetchAVData = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/retrieve-AV", {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to retrieve AV data. HTTP status: ${response.status}`);
      }

      const result = await response.json();
      if (result) {
        // Check for existing star status in localStorage
        const savedAVData = localStorage.getItem('avScriptData');
        let dataWithStars;
        
        if (savedAVData) {
          const savedData = JSON.parse(savedAVData);
          // Merge new data with saved star status
          dataWithStars = result.map((segment, index) => ({
            ...segment,
            starred: savedData[index]?.starred || false
          }));
        } else {
          dataWithStars = result.map((segment) => ({ ...segment, starred: false }));
        }
        
        setAVData(dataWithStars);
        localStorage.setItem('avScriptData', JSON.stringify(dataWithStars));
      }
    } catch (error) {
      console.error("Error fetching AV data:", error);
    }
  };

  // Fetch AV data when `isVideoUploaded` changes to true
  useEffect(() => {
    if (isVideoUploaded) {
      fetchAVData();
    } else {
      setAVData(null);
    }
  }, [isVideoUploaded]);

  // Scroll to the relevant segment when `currentVideoTime` changes
  useEffect(() => {
    if (currentVideoTime && avData) {
      scrollToSegment(currentVideoTime);
    }
  }, [currentVideoTime, avData]);

  // Scroll to the relevant segment when `seekTime` is updated
  useEffect(() => {
    if (seekTime && avData) {
      scrollToSegment(seekTime);
    }
  }, [seekTime, avData]);

  // Scroll to the segment that matches or encompasses the provided time
  const scrollToSegment = (time) => {
    const currentIndex = avData.findIndex(
      (segment) => segment.start_time <= time && segment.end_time > time
    );

    if (currentIndex !== -1 && segmentRefs.current[currentIndex]) {
      segmentRefs.current[currentIndex].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  // Handle edit button click
  const handleEditClick = (index) => {
    setEditIndex(index);
    setEditedSegment({ ...avData[index] });
    logToFile('AVScript', 'Edit Segment', `Started editing segment ${index + 1}`);
  };

  // Handle save button click
  const handleSaveClick = async () => {
    const updatedData = [...avData];
    const originalSegment = avData[editIndex];
    
    // Create a changes summary
    const changes = [];
    if (originalSegment.speaker !== editedSegment.speaker) {
      changes.push(`Speaker changed from "${originalSegment.speaker}" to "${editedSegment.speaker}"`);
    }
    if (originalSegment.text !== editedSegment.text) {
      changes.push(`Text changed from "${originalSegment.text}" to "${editedSegment.text}"`);
    }
    if (JSON.stringify(originalSegment.Objects) !== JSON.stringify(editedSegment.Objects)) {
      changes.push(`Objects changed from [${originalSegment.Objects.join(', ')}] to [${editedSegment.Objects.join(', ')}]`);
    }

    updatedData[editIndex] = editedSegment;
    setAVData(updatedData);
    setEditIndex(null);
    setEditedSegment(null);
    
    // Log the specific changes
    const changesSummary = changes.length > 0 
      ? `Changes made: ${changes.join(' | ')}` 
      : 'No changes made';
    logToFile('AVScript', 'Save Segment', `Saved changes to segment ${editIndex + 1}. ${changesSummary}`);
    
    await updateAVData(updatedData);
  };

  // Function to update AV data in the database
  const updateAVData = async (updatedData) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/upload-AV", {
        method: "PUT",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData), // Send the entire updated data
      });

      if (!response.ok) {
        throw new Error(`Failed to update AV data. HTTP status: ${response.status}`);
      }

      console.log("AV data updated successfully");
    } catch (error) {
      console.error("Error updating AV data:", error);
    }
  };

  // Handle change in editable fields
  const handleFieldChange = (field, value) => {
    setEditedSegment((prev) => ({ ...prev, [field]: value }));
  };

  // Handle segment click to seek to its start time
  const handleSegmentClick = (time) => {
    onSeekToTime(time);
    logToFile('AVScript', 'Seek', `Jumped to timestamp ${formatTime(time)}`);
  };

  // Toggle star status for a segment
  const toggleStar = (index) => {
    const updatedData = [...avData];
    updatedData[index].starred = !updatedData[index].starred;
    setAVData(updatedData);
    logToFile('AVScript', 'Toggle Star', `${updatedData[index].starred ? 'Starred' : 'Unstarred'} segment ${index + 1}`);
  };

  // Add new function to determine if a segment is current
  const isCurrentSegment = (segment) => {
    return currentVideoTime >= segment.start_time && currentVideoTime < segment.end_time;
  };

  // Add this useEffect after the existing state declarations
  useEffect(() => {
    // Load saved AV data from localStorage
    const savedAVData = localStorage.getItem('avScriptData');
    if (savedAVData && !avData) {
      setAVData(JSON.parse(savedAVData));
    }
  }, []);

  // Add this useEffect to save AV data changes
  useEffect(() => {
    if (avData) {
      localStorage.setItem('avScriptData', JSON.stringify(avData));
    }
  }, [avData]);

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-5 m-0 shadow-lg flex flex-col overflow-y-auto">
      <h2 className="text-2xl text-gray-800 mb-5 border-b-2 border-orange-500 pb-1 text-center">AV Script</h2>
      {avData &&
        avData.map((segment, index) => (
          <div
            ref={(el) => (segmentRefs.current[index] = el)}
            className={`scene mb-5 p-3 rounded-lg transition-colors ${
              isCurrentSegment(segment) ? "bg-gray-100" : "bg-white"
            }`}
            key={index}
          >
            <h3 className="text-lg text-gray-700 mb-2 border-b border-gray-300 pb-1 flex items-center">
              <span className="flex-1">
                Scene {index + 1}{" "}
                <span
                  className="text-sm text-blue-500 cursor-pointer underline"
                  onClick={() => handleSegmentClick(segment.start_time)} // Clickable only on this span
                >
                  [{formatTime(segment.start_time)} - {formatTime(segment.end_time)}]
                </span>
              </span>
              <button
                onClick={() => toggleStar(index)}
                className={`text-2xl ${
                  segment.starred ? "text-yellow-500" : "text-gray-400"
                } hover:text-yellow-600 transition-colors`}
                aria-label="Star this segment"
              >
                {segment.starred ? "★" : "☆"}
              </button>
            </h3>

            {editIndex === index ? (
              // Edit Mode
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Speaker:
                  <input
                    type="text"
                    value={editedSegment.speaker}
                    onChange={(e) => handleFieldChange("speaker", e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700 mt-3">
                  Text:
                  <textarea
                    value={editedSegment.text}
                    onChange={(e) => handleFieldChange("text", e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700 mt-3">
                  Objects:
                  <input
                    type="text"
                    value={editedSegment.Objects.join(", ")}
                    onChange={(e) =>
                      handleFieldChange(
                        "Objects",
                        e.target.value.split(",").map((obj) => obj.trim())
                      )
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </label>
                <button
                  onClick={handleSaveClick}
                  className="mt-3 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            ) : (
              // Normal Mode
              <div>
                <p className="text-base text-gray-600 leading-relaxed">
                  <strong>{segment.speaker}: </strong>
                  {segment.text}
                </p>
                <p className="text-base text-gray-600 leading-relaxed">
                  <strong>Objects: </strong>
                  {segment.Objects.join(", ")}
                </p>
                <button
                  onClick={() => handleEditClick(index)}
                  className="mt-3 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

AVScript.propTypes = {
  isVideoUploaded: PropTypes.bool.isRequired,
  onSeekToTime: PropTypes.func.isRequired,
  currentVideoTime: PropTypes.number, // Pass current video time for auto-scrolling
  seekTime: PropTypes.number, // Time clicked in the video
};

export default AVScript;
