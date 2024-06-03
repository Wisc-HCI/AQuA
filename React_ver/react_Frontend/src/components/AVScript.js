import React from 'react';
import './css/AVScript.css';

function AVScript() {
    return (
        <div className="av-script-container">
            <h2>AV Script</h2>
            <div className="scene">
                <h3>Scene 1: Introduction</h3>
                <p>
                    The video opens with a brief introduction of the topic, setting the stage for the content to follow. Key points to be discussed are highlighted, and the objectives of the video are outlined.
                </p>
            </div>
            <div className="scene">
                <h3>Scene 2: Detailed Analysis</h3>
                <p>
                    This section delves into the core of the subject matter, presenting a detailed analysis supported by interviews with experts, data visualizations, and on-site footage.
                </p>
            </div>
            <div className="scene">
                <h3>Scene 3: Conclusion</h3>
                <p>
                    The video concludes with a summary of the key points discussed, reflecting on the implications and future directions. A call to action encourages viewers to engage further with the topic.
                </p>
            </div>
        </div>
    );
}

export default AVScript;
