import gradio as gr

def display_video():
    video_url = "path_to_your_video.mp4"
    return video_url

def overview():
    return """
    ### Overview
    **Q: What is the purpose of this video?**  
    A: The purpose of this video is to demonstrate the capabilities of the Video Language Model (VLM) in analyzing and understanding video content.

    **Q: How does the VLM work?**  
    A: The VLM uses advanced machine learning algorithms to process video frames and extract meaningful information, which is then used to generate a comprehensive overview and timeline of the video's content.

    **Q: What can users expect from this demonstration?**  
    A: Users can expect a detailed analysis of the video's key events, insights into the VLM's processing techniques, and an interactive timeline highlighting important moments in the video.
    """

def timeline():
    return """
    ### Timeline
    - **00:00:00** - Start
    - **00:10:00** - Important Event 1
    - **00:20:00** - Important Event 2
    """

def additional_info():
    return """
    ### Additional Information
    Here you can provide additional information or analysis related to the video and its content.
    """

# Define the layout
with gr.Blocks() as demo:
    with gr.Row():
        with gr.Column():
            gr.Video(display_video, label="Video Display")
        with gr.Column():
            gr.Markdown(overview)
    with gr.Row():
        with gr.Column():
            gr.Markdown(timeline)
    with gr.Row():
        with gr.Column():
            gr.Markdown(additional_info)

# Run the app
demo.launch()
