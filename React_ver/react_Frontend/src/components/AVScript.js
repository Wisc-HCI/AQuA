import React, { useState } from 'react';
import './css/AVScript.css';
import ObjectSelector from './ObjectSelector';

function AVScript() {

    const [avData, setAVData] = useState(null);
    const [select, setselect] = useState([]);

    const handleObjectsSelected = async (selectedObjects) => {
        try {
            console.log('Running AV script...');
            console.log('Selected objects:', selectedObjects);
          // Trigger the AV script with the selected objects
          const runResponse = await fetch('http://127.0.0.1:5000/run-AV', {
            method: 'POST',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ selectedObjects }), // Pass the selected objects as JSON
          });
      
          if (!runResponse.ok) {
            throw new Error(`Failed to run AV script. HTTP status: ${runResponse.status}`);
          }
      
          const result = await runResponse.text();
          
          if (result === 'True') {
            setselect(selectedObjects);
            console.log('retrieving AV data...');
            // After the script is run, retrieve the AV data
            const retrieveResponse = await fetch('http://127.0.0.1:5000/retrieve-AV', {
              method: 'GET',
              mode: 'cors',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            console.log('Retrieve response:', retrieveResponse);
            if (!retrieveResponse.ok) {
              throw new Error(`Failed to retrieve AV data. HTTP status: ${retrieveResponse.status}`);
            }
      
            const data = await retrieveResponse.json();
            console.log('AV data:', data);
            setAVData(data); // Store the retrieved AV data
          } else {
            console.error('AV script did not run successfully.');
          }
        } catch (error) {
          console.error('Error during AV process:', error);
        }
    };
      
    
    return (
        <>
        <ObjectSelector onObjectsSelected={handleObjectsSelected}/>
        <div className="av-script-container">
        <h2>AV Script</h2>
        {avData && avData.map((segment, index) => (
            <div className="scene" key={index}>
                <h3>Scene {index + 1}</h3>
                <p>{segment.text}</p>
                {segment.type === 'with' && (
                    <p>
                        {select.map((item, idx) => (
                            <span key={idx}>
                              objects:{item.object}{idx < select.length - 1 ? ', ' : ''}
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

export default AVScript;

