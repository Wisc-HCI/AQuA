import gradio as gr

def display_video():
    video_url = "path_to_your_video.mp4"
    return video_url

def overview():
    return """
    <div class='qa-pair'>
        <div class='question'>Q: What is the purpose of this video?</div>
        <div class='answer'>A: The purpose of this video is to demonstrate the capabilities of the Video Language Model (VLM) in analyzing and understanding video content.</div>
    </div>
    <div class='qa-pair'>
        <div class='question'>Q: How does the VLM work?</div>
        <div class='answer'>A: The VLM uses advanced machine learning algorithms to process video frames and extract meaningful information, which is then used to generate a comprehensive overview and timeline of the video's content.</div>
    </div>
    <div class='qa-pair'>
        <div class='question'>Q: What can users expect from this demonstration?</div>
        <div class='answer'>A: Users can expect a detailed analysis of the video's key events, insights into the VLM's processing techniques, and an interactive timeline highlighting important moments in the video.</div>
    </div>
    """

def timeline():
    return """
    <div class='qa-pair'>
        <div class='question'>Q: What is the timeline of key events in the video?</div>
        <div class='answer'>
            <ul class='timeline-list'>
                <li><strong>00:00:00</strong> - Start</li>
                <li><strong>00:10:00</strong> - Important Event 1</li>
                <li><strong>00:20:00</strong> - Important Event 2</li>
            </ul>
        </div>
    </div>
    """

def additional_info():
    return """
    <div class='qa-pair'>
        <div class='question'>Q: Is there any additional information or analysis related to the video content?</div>
        <div class='answer'>A: Here I will provide additional information or analysis related to the video and its content.</div>
    </div>
    """

# Define custom CSS for styling
custom_css = """
body {
    font-family: 'Arial', sans-serif;
    background-color: #f4f4f9;
    margin: 0;
    padding: 0;
}

h2 {
    color: #333;
}

.gradio-container {
    max-width: 1200px;
    margin: auto;
    padding: 20px;
    border-radius: 10px;
    background-color: #fff;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

#video-container, #overview-container, #timeline-container, #additional-info-container {
    margin-bottom: 20px;
}

.qa-pair {
    margin-bottom: 20px;
}

.timeline-list li strong {
    color: #000;  /* Ensure timestamp text color is black */
}

.question {
    background-color: #e0e0e0;
    padding: 10px;
    border-radius: 8px;
    font-weight: bold;
    color: #333;
    margin-bottom: 5px;
}

.answer {
    background-color: #fff;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #ddd;
    color: #000;
}

.timeline-list {
    list-style-type: none;
    padding: 0;
}

.timeline-list li {
    font-size: 1em;
    color: #000;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 8px;
    border: 1px solid #ddd;
    background-color: #fff;
    transition: background-color 0.3s;
}

.timeline-list li:hover {
    background-color: #f0f0f0;
}

.timeline-list li::before {
    content: "• ";
    color: #006A4E;
    font-weight: bold;
}

.additional-info-text {
    font-size: 1em;
    color: #555;
    line-height: 1.6;
    background-color: #fff;
    border-radius: 8px;
    padding: 15px;
    border: 1px solid #ddd;
}

.header {
    text-align: center;
    padding: 20px;
    background-color: #4CAF50;
    color: white;
    border-radius: 8px 8px 0 0;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.footer {
    text-align: center;
    padding: 10px;
    background-color: #4CAF50;
    color: white;
    border-radius: 0 0 8px 8px;
    box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.1);
    margin-top: 20px;
}
"""

# Define the layout
with gr.Blocks(css=custom_css) as demo:
    gr.Markdown("<div class='header'><h1>Video Language Model (VLM) Demo</h1></div>")
    with gr.Row():
        with gr.Column():
            gr.Video(display_video, label="Video Display", elem_id="video-container")
        with gr.Column():
            gr.Markdown(overview, elem_id="overview-container")
    with gr.Row():
        with gr.Column():
            gr.Markdown(timeline, elem_id="timeline-container")
    with gr.Row():
        with gr.Column():
            gr.Markdown(additional_info, elem_id="additional-info-container")
    gr.Markdown("<div class='footer'>Powered by Gradio</div>")

# Run the app
demo.launch()
