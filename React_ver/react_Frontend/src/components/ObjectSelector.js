import React, { useState, useEffect } from 'react';
import './css/ObjectSelector.css';

function ObjectSelector({ isVideoUploaded, onObjectsSelected }) {
  const [objects, setObjects] = useState([]);
  const [selectedObjects, setSelectedObjects] = useState([]);

  useEffect(() => {
    if (isVideoUploaded) {
      console.log('Video uploaded, fetching objects...');
      fetchJsonData(); // Fetch objects when the video has been uploaded
    }
    else{
      setObjects([]);
    }
  }, [isVideoUploaded]); // Correctly set useEffect dependency

  const fetchJsonData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/retrieve-json', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch JSON data. HTTP status: ${response.status}`);
      }
      const data = await response.json();
      setObjects(data);
      console.log('JSON data fetched:', data);
    } catch (error) {
      console.error('Error fetching JSON data:', error);
    }
  };

  const handleSelect = (event) => {
    const selectedObjectName = event.target.value;
    const selectedObject = objects.find((obj) => obj.object === selectedObjectName);

    if (selectedObject) {
      const newSelectedObjects = [...selectedObjects, selectedObject];
      setSelectedObjects(newSelectedObjects);
      setObjects(objects.filter((obj) => obj.object !== selectedObjectName));

      onObjectsSelected(newSelectedObjects);
    }
  };

  const handleRemove = (obj) => {
    const newSelectedObjects = selectedObjects.filter((selected) => selected.object !== obj.object);
    setSelectedObjects(newSelectedObjects);
    setObjects([...objects, obj]);

    onObjectsSelected(newSelectedObjects);
  };

  return (
    <div>
      <div className="container">
        <div className="select-section">
          <h3>Select an Object</h3>
          <select onChange={handleSelect} value="">
            <option value="" disabled>
              Select an object
            </option>
            {objects.map((obj, index) => (
              <option key={index} value={obj.object}>
                {obj.object}
              </option>
            ))}
          </select>
        </div>
        {selectedObjects.length > 0 && (
          <div className="selected-objects">
            <h3>Selected Objects:</h3>
            <div>
              {selectedObjects.map((obj, index) => (
                <button key={index} className="selected-button" onClick={() => handleRemove(obj)}>
                  {obj.object}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ObjectSelector;
