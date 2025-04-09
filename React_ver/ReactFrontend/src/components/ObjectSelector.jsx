import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function ObjectSelector({ isVideoUploaded, onObjectsSelected }) {
  const [objects, setObjects] = useState([]);
  const [selectedObjects, setSelectedObjects] = useState([]);

  useEffect(() => {
    if (isVideoUploaded) {
      console.log('Video uploaded, fetching objects...');
      fetchJsonData(); // Fetch objects when the video has been uploaded
    } else {
      setObjects([]);
    }
  }, [isVideoUploaded]); // Correctly set useEffect dependency

  const fetchJsonData = async () => {
    // try {
    //   const response = await fetch('http://127.0.0.1:5000/retrieve-json', {
    //     method: 'GET',
    //     mode: 'cors',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //   });
    //   if (!response.ok) {
    //     throw new Error(`Failed to fetch JSON data. HTTP status: ${response.status}`);
    //   }
    //   const data = await response.json();
    //   setObjects(data);
    //   console.log('JSON data fetched:', data);
    // } catch (error) {
    //   console.error('Error fetching JSON data:', error);
    // }
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
    <div className="flex items-start">
      <div className="select-section flex flex-col w-40 mr-3">
        {/* <h3 className="mb-1 text-lg">Select an Object</h3> */}
        <select onChange={handleSelect} className=" border border-gray-300 rounded" value="">
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
        <div className="selected-objects flex flex-col w-72 border-l-2 border-gray-300 pl-5 max-h-24 overflow-y-auto mb-2">
          <h3 className="mb-1 text-lg">Selected Objects:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedObjects.map((obj, index) => (
              <button
                key={index}
                className="selected-button bg-gray-100 text-gray-700 border border-gray-300 p-2 rounded-full text-sm shadow-sm hover:bg-red-500 hover:text-white"
                onClick={() => handleRemove(obj)}
              >
                {obj.object}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
ObjectSelector.propTypes = {
  isVideoUploaded: PropTypes.bool.isRequired,
  onObjectsSelected: PropTypes.func.isRequired,
};


export default ObjectSelector;
