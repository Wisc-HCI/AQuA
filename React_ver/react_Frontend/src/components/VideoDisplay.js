import React, { useState } from 'react';
import axios from 'axios';
import './css/VideoDisplay.css';

function VideoDisplay({ setAvScript, setTimeline, setObjects }) {
    const [videoFile, setVideoFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [isAnalyzed, setIsAnalyzed] = useState(false);

    const handleFileChange = (e) => {
        setVideoFile(e.target.files[0]);
        setVideoUrl(URL.createObjectURL(e.target.files[0]));
        setIsAnalyzed(false); // Reset analyzed state when a new file is selected
    };

    const handleUpload = () => {
        const formData = new FormData();
        formData.append('video', videoFile);

        axios.post('http://localhost:5000/analyze-video', formData)
            .then(response => {
                setAvScript(response.data.av_script);
                setTimeline(response.data.timeline);
                setObjects(response.data.objects);
                setIsAnalyzed(true); // Set analyzed state to true after successful analysis
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
            {videoUrl && <video src={videoUrl} controls width="600" />}
            {isAnalyzed && <p>Video analysis completed and results are updated.</p>}
        </div>
    );
}

export default VideoDisplay;
