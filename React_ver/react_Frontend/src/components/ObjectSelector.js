import React, { useState, useEffect } from 'react';
import './css/ObjectSelector.css';

function ObjectSelector({ onObjectsSelected }) {
    const [objects, setObjects] = useState([]);
    const [selectedObjects, setSelectedObjects] = useState([]); 

    // Fetch the objects from the backend when the component mounts
    useEffect(() => {
        
        const fetchJsonData = async () => {
            console.log('Fetching JSON data...');
          try {
            const response = await fetch('http://127.0.0.1:5000/retrieve-json', {
              method: 'GET',
              mode: 'cors',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            console.log('Response:', response); 
            if (!response.ok) {
              throw new Error(`Failed to fetch JSON data. HTTP status: ${response.status}`);
            }
            console.log('Fetching data...');
            const data = await response.json();
            setObjects(data); // Directly set the data as it's an array of objects
            console.log('JSON data:', data);
          } catch (error) {
            console.error('Error fetching JSON data:', error);
          }
        };
      
        fetchJsonData();
    }, []);



    const handleSelect = (event) => {
        const selectedObjectName = event.target.value;
        const selectedObject = objects.find(obj => obj.object === selectedObjectName);
        
        if (selectedObject) {
            const newSelectedObjects = [...selectedObjects, selectedObject];
            setSelectedObjects(newSelectedObjects);
            setObjects(objects.filter(obj => obj.object !== selectedObjectName));

            // Call the prop function to pass selected objects to the parent component
            onObjectsSelected(newSelectedObjects);
        }
    };

    const handleRemove = (obj) => {
        const newSelectedObjects = selectedObjects.filter(selected => selected.object !== obj.object);
        setSelectedObjects(newSelectedObjects);
        setObjects([...objects, obj]);

        // Call the prop function to update the parent component
        onObjectsSelected(newSelectedObjects);
    };

    return (
        <div>
            <div className="container">
                <div className="select-section">
                    <h3>Select an Object</h3>
                    <select onChange={handleSelect} value="">
                        <option value="" disabled>Select an object</option>
                        {objects.map((obj, index) => (
                            <option key={index} value={obj.object}>{obj.object}</option>
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
