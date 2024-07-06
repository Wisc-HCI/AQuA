import React, { useState } from 'react';
// import axios from 'axios';
import './css/VideoDisplay.css';

function VideoDisplay({ setAvScript, setTimeline, setObjects }) {
    // const [videoFile, setVideoFile] = useState(null);
    // const [videoUrl, setVideoUrl] = useState('');
    // const [isAnalyzed, setIsAnalyzed] = useState(false);

    // const handleFileChange = (e) => {
    //     setVideoFile(e.target.files[0]);
    //     setVideoUrl(URL.createObjectURL(e.target.files[0]));
    //     setIsAnalyzed(false); // Reset analyzed state when a new file is selected
    // };

    // // const handleUpload = () => {
    // //     const formData = new FormData();
    // //     formData.append('video', videoFile);

    // //     axios.post('http://localhost:5000/analyze-video', formData)
    // //         .then(response => {
    // //             setAvScript(response.data.av_script);
    // //             setTimeline(response.data.timeline);
    // //             setObjects(response.data.objects);
    // //             setIsAnalyzed(true); // Set analyzed state to true after successful analysis
    // //         })
    // //         .catch(error => {
    // //             console.error('There was an error uploading the video!', error);
    // //         });
    // // };

    const runScript = async () => {  
        try {
            const response = await fetch('http://127.0.0.1:5000/run-script', {
                method: 'POST',
                mode:'no-cors',
                crossDomain: true,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}) // Assuming you need to send an empty object
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // console.log("wassup")

            const data = response;
            console.log(data);
            if (data) {
                alert(`Error: ${data.error}`);
            } else {
                alert(`Output: ${data.output}`);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="video-container">
            <h2 className="video-header">Video Display</h2>
            {/* <input type="file" onChange={handleFileChange} /> */}
            {/* <button onClick={handleUpload}>Upload and Analyze</button> */}
            <button onClick={runScript}>Upload and Analyze</button>
            {/* {videoUrl && <video src={videoUrl} controls width="600" />}
            {isAnalyzed && <p>Video analysis completed and results are updated.</p>} */}
        </div>
    );
}

export default VideoDisplay;
