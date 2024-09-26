import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ObjectSelector from './ObjectSelector';

function AVScript({ isVideoUploaded }) {
  const [avData, setAVData] = useState(null);
  const [select, setSelect] = useState([]);
  console.log(avData);

  // Function to fetch AV data from the API
  const fetchAVData = async () => {
    try {
      console.log('Fetching AV data...');
      const response = await fetch('http://127.0.0.1:5000/retrieve-AV', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to retrieve AV data. HTTP status: ${response.status}`);
      }

      const result = await response.json();
      if (result) {
        setAVData(result); // Store the retrieved AV data
        console.log('Retrieved AV data:', result);
      } else {
        console.error('No AV data found in the response.');
      }
    } catch (error) {
      console.error('Error fetching AV data:', error);
    }
  };

  // Use effect to fetch AV data when isVideoUploaded changes to true
  useEffect(() => {
    if (isVideoUploaded) {
      fetchAVData();
    } else {
      setAVData(null);
    }
  }, [isVideoUploaded]);

  const handleObjectsSelected = async (selectedObjects) => {
    try {
      console.log('Running AV script and retrieving data...');
      const response = await fetch('http://127.0.0.1:5000/run-and-retrieve-AV', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedObjects }), // Pass the selected objects as JSON
      });

      if (!response.ok) {
        throw new Error(`Failed to run AV script and retrieve data. HTTP status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Result:', result);
      if (result.AV_data) {
        setSelect(selectedObjects);
        setAVData(result.AV_data); // Store the retrieved AV data
        console.log('AV data:', result.AV_data);
      } else {
        console.error('AV script did not run successfully.');
      }
    } catch (error) {
      console.error('Error during AV process:', error);
    }
  };

  return (
    <>
      {/* Pass isVideoUploaded to ObjectSelector */}
      <div className=" bg-white border border-gray-300 rounded-lg p-5 m-0 shadow-lg flex flex-col h-2/3 overflow-y-auto">
        <ObjectSelector isVideoUploaded={isVideoUploaded} onObjectsSelected={handleObjectsSelected} />
        <h2 className="text-2xl text-gray-800 mb-5 border-b-2 border-orange-500 pb-1 text-center">AV Script</h2>
        {avData &&
          avData.map((segment, index) => (
            <div className="scene mb-5" key={index}>
              <h3 className="text-lg text-gray-700 mb-2 border-b border-gray-300 pb-1">Scene {index + 1}</h3>
              <p className="text-base text-gray-600 leading-relaxed">{segment.text}</p>
              {segment.type === 'with' && (
                <p className="text-base text-gray-600 leading-relaxed">
                  {select.map((item, idx) => (
                    <span key={idx}>
                      objects: {item.object}
                      {idx < select.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}
      </div>
    </>
  );
}

// Add propTypes validation for props
AVScript.propTypes = {
  isVideoUploaded: PropTypes.bool.isRequired,
};

export default AVScript;
