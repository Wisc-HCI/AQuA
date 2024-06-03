import React, { useState } from 'react';
import axios from 'axios';
import './css/VideoDisplay.css';

function VideoDisplay() {
    const [videoFile, setVideoFile] = useState(null);

    const handleFileChange = (e) => {
        setVideoFile(e.target.files[0]);
    };

    const handleUpload = () => {
        const formData = new FormData();
        formData.append('video', videoFile);

        axios.post('http://localhost:5000/analyze-video', formData)
            .then(response => {
                console.log(response.data);
                // Process the response data and update the state
            })
            .catch(error => {
                console.error('There was an error uploading the video!', error);
            });
    };

    return (
        <div className="video-container">
            <h2 className="video-header">Video Display</h2>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload and Analyze</button>
        </div>
    );
}

export default VideoDisplay;
