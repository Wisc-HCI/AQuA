from flask import Flask, request, jsonify, send_file
import os
import cv2
import numpy as np
import subprocess
from flask_cors import CORS
from config import Config
from flask_sqlalchemy import SQLAlchemy
import io
import logging
from datetime import datetime
import base64
import json
from flask_migrate import Migrate
import requests
from io import BytesIO
from moviepy.editor import VideoFileClip
import tempfile
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain.chains import ConversationalRetrievalChain, LLMChain
from langchain.memory import ConversationBufferMemory
from langchain_text_splitters import CharacterTextSplitter
from langchain.document_loaders import DirectoryLoader, TextLoader
from langchain.prompts import ChatPromptTemplate
from langchain_openai import AzureOpenAI, AzureOpenAIEmbeddings
import openai
from langchain.schema.runnable import RunnableSequence, RunnablePassthrough
from chromadb.config import Settings
import chromadb
from langchain.chains import RetrievalQA
import google.generativeai as genai
import time
#--------------------------------------------------------------------------------------------------------------------------------#
# INITIALIZATION
#--------------------------------------------------------------------------------------------------------------------------------#

# Initialize the Flask application and load configuration settings from the 'Config' class.
app = Flask(__name__)
app.config.from_object(Config)

# Enable Cross-Origin Resource Sharing (CORS) for the app, allowing it to handle requests from different domains.
CORS(app)

# Initialize SQLAlchemy to manage interactions with the database.
db = SQLAlchemy(app=app)
migrate = Migrate(app, db)

# Set up logging to capture detailed debug-level logs, which can be useful for troubleshooting.
logging.basicConfig(level=logging.DEBUG)


genai_model = None
genai_video_file = None

#--------------------------------------------------------------------------------------------------------------------------------#
# DATABASE MODEL
#--------------------------------------------------------------------------------------------------------------------------------#

# Define the 'StorageModel' class, representing a table in the database to store video, audio, and JSON data.
class StorageModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    video_name = db.Column(db.String(100), nullable=False)
    video_data = db.Column(db.LargeBinary, nullable=False)
    audio_name = db.Column(db.String(100), nullable=True)  # New column for audio name
    audio_data = db.Column(db.LargeBinary, nullable=True)  # New column for audio data
    json_data = db.Column(db.JSON, nullable=True)
    AV_segmented = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

with app.app_context():
    db.create_all()

#--------------------------------------------------------------------------------------------------------------------------------#
# ROUTES
#--------------------------------------------------------------------------------------------------------------------------------#

# Define the root route for the application, which returns a simple confirmation message.
@app.route('/')
def home():
    return "VLM Backend is Running"

#--------------------------------------------------------------------------------------------------------------------------------#
# ROUTE: '/upload' [POST]
# Purpose: Handles the upload of video and audio files, storing them in the database.
@app.route('/upload', methods=['POST'])
def upload_video():
    try:
        # Check if video is in the request files
        if 'video' not in request.files:
            return jsonify({'error': 'No video file uploaded'}), 400

        video_file = request.files['video']
        video_data = video_file.read()
        video_name = video_file.filename

        # Check if audio is also provided
        audio_file = request.files.get('audio')  # Using get() to avoid KeyError
        if audio_file:
            # If audio file is provided, use it
            audio_data = audio_file.read()
            audio_name = audio_file.filename
        else:
            # If no audio file is provided, extract audio from the video
            with tempfile.NamedTemporaryFile(delete=True, suffix='.mp4') as temp_video:
                temp_video.write(video_data)
                temp_video.flush()  # Ensure data is written to the file

                video_clip = VideoFileClip(temp_video.name)

                # Extract audio from video and save as MP3
                with tempfile.NamedTemporaryFile(delete=True, suffix='.mp3') as temp_audio:
                    video_clip.audio.write_audiofile(temp_audio.name, codec='mp3')  # Save audio to temporary file
                    audio_name = f"{video_name.rsplit('.', 1)[0]}.mp3"  # Use video name for audio file with mp3 extension
                    
                    temp_audio.seek(0)  # Reset buffer position
                    audio_data = temp_audio.read()  # Read audio data from temp file

                video_clip.close()  # Close video clip to free resources

        # Create a new instance of the StorageModel to store the video and audio in the database.
        new_video = StorageModel(
            video_name=video_name,
            video_data=video_data,
            audio_name=audio_name,
            audio_data=audio_data
        )
        
        # Add the new video instance to the database session and commit the changes to store the data.
        db.session.add(new_video)
        db.session.commit()

        # Return a success message if the operation is successful.
        return jsonify({'message': 'Video and audio uploaded successfully'}), 201

    except Exception as e:
        # Return an error message if something goes wrong during the upload process.
        return jsonify({'error': 'Failed to upload video and audio', 'message': str(e)}), 500

#--------------------------------------------------------------------------------------------------------------------------------#
# ROUTE: '/video/recent' [GET]
# Purpose: Retrieves and sends the most recently uploaded video file.
@app.route('/video/recent', methods=['GET'])
def get_most_recent_video():
    try:
        # Log an attempt to retrieve the most recent video.
        logging.debug("Attempting to retrieve the most recent video and audio")
        
        # Query the database to find the most recently uploaded video.
        video_record = StorageModel.query.order_by(StorageModel.created_at.desc()).first_or_404()

        # Send the video file as an attachment to the client.
        video_file = send_file(io.BytesIO(video_record.video_data), download_name=video_record.video_name, as_attachment=True)
        
        # Log the name of the retrieved video.
        logging.debug(f"Most recent video found: {video_record.video_name}")

        # Return the video file to the client.
        return video_file 
        
    except Exception as e:
        # Log any errors and return an error message if the retrieval fails.
        logging.error(f"Error retrieving the most recent video and audio: {e}")
        return jsonify({'error': 'Failed to retrieve the most recent video and audio', 'message': str(e)}), 500

#--------------------------------------------------------------------------------------------------------------------------------#
# ROUTE: '/audio/recent' [GET]
# Purpose: Retrieves and sends the most recently uploaded audio file.
@app.route('/audio/recent', methods=['GET'])
def get_most_recent_audio():
    try:
        # Log an attempt to retrieve the most recent audio.
        logging.debug("Attempting to retrieve the most recent video and audio")
        
        # Query the database to find the most recently uploaded audio.
        video_record = StorageModel.query.order_by(StorageModel.created_at.desc()).first_or_404()

        # Send the audio file as an attachment to the client.
        audio_file = send_file(io.BytesIO(video_record.audio_data), download_name=video_record.audio_name, as_attachment=True)
        
        # Log the name of the retrieved video (associated with the audio).
        logging.debug(f"Most recent audio found: {video_record.video_name}")

        # Return the audio file to the client.
        return audio_file
        
    except Exception as e:
        # Log any errors and return an error message if the retrieval fails.
        logging.error(f"Error retrieving the most recent video and audio: {e}")
        return jsonify({'error': 'Failed to retrieve the most recent video and audio', 'message': str(e)}), 500
    
##================================================================================================================================================================================

@app.route('/upload-AV', methods=['PUT'])
def upload_AV():
    try:
        # Get the JSON data from the request body
        AV_data = request.json
        if not AV_data:
            return jsonify({'error': 'No JSON data provided'}), 400

        # Find the latest video record
        video_record = StorageModel.query.order_by(StorageModel.created_at.desc()).first()
        if not video_record:
            return jsonify({'error': 'No video records found'}), 404

        # Update the json_data field
        video_record.AV_segmented  = AV_data
        db.session.commit()

        return jsonify({'message': 'JSON data updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to update JSON data', 'message': str(e)}), 500    

##================================================================================================================================================================================

@app.route('/retrieve-AV', methods=['GET'])
def retrieve_AV():
    try: 
        video_record = StorageModel.query.order_by(StorageModel.created_at.desc()).first_or_404()

        if not video_record:
            return jsonify({'error': 'No video records found'}), 404

        # Update the json_data field
        AV_data = video_record.AV_segmented

        return AV_data
    
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve JSON data', 'message': str(e)}), 500
    
##================================================================================================================================================================================
def send_email(recipient_email):
    message = Mail(
        from_email='nikhilkss2002@gmail.com',  # Replace with your verified sender email
        to_emails=recipient_email,
        subject='Your Video Has Been Uploaded and Processed',
        html_content=f'<strong>Your video has been successfully uploaded and processed.</strong>'
    )
    try:
        sg = SendGridAPIClient('')
        response = sg.send(message)
        print(f"Email sent to {recipient_email}")
        return response.status_code
    except Exception as e:
        print(f"Error sending email: {e}")
        return None
    
def initialize_genai(video_file):
    global genai_model, genai_video_file
    genai.configure(api_key="")
    genai_model = genai.GenerativeModel("gemini-2.0-flash-lite")
    print(f"Uploading file...")
    genai_video_file = genai.upload_file(path=video_file)
    print(f"Completed upload: {genai_video_file.uri}")
    print("Uploaded")

    # Check whether the file is ready to be used.
    while genai_video_file.state.name == "PROCESSING":
        print('.', end='')
        time.sleep(10)
        genai_video_file = genai.get_file(genai_video_file.name)
    
    print(f"Final state: {genai_video_file.state.name}")  # Add this debug line

    if genai_video_file.state.name == "FAILED":
        return "Failed"
    return "Success"

@app.route('/run-script', methods=['POST'])
def run_script():
    print("Running script")
    try:
        data = request.get_json()
        print(data)
        email = data.get('email')  # Get email from the frontend
        vid = requests.get('http://127.0.0.1:5000/video/recent')

        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as temp_video:
            temp_video.write(vid.content)
            temp_video_path = temp_video.name
            
        print(f"Temporary video saved at: {temp_video_path}")

        print(email)
        res = initialize_genai(temp_video_path)
        print(res)

        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        if res == "Failed":
            return jsonify({'error': 'Failed to upload video'}), 500
        # Construct the path to the script.py file
        script_path = os.path.join(os.path.dirname(__file__), '../../Pipeline')
        # Ensure the path is absolute
        script_path = os.path.abspath(script_path)
        command = f'python script.py'
        # Run the script
        subprocess.run(command, shell=True, cwd=script_path)
        return "True"
    
        
    except Exception as e:
        # Return "False" if the script execution fails.
        return "False"


# ROUTE: '/chat' [POST]
# Purpose: Interacts with an external LLM API to generate a response and dynamic follow-up questions based on user input.
@app.route('/chat', methods=['POST'])
def chat():
    if genai_model is None:
        return jsonify({'error': 'Model not initialized'}), 500
    
    # Retrieve the prompt (user input) from the JSON request body.
    prompt = request.json.get('prompt')
    goal = request.json.get('goal')
    print("Prompt: ", prompt)
    print("Goal: ", goal)

    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_file = os.path.join(current_dir, '..', '..', 'Pipeline', 'data', 'transcript.txt')
    with open(data_file, 'r') as f:
        data = f.read()


    try:

        final_prompt = f"""
        Context: You are an Intelligent and friendly assistant that analyzes videos. Given a video,there are 7 broad categories of actions a user might ask for assistance in:
        Explore, Elaborate, Filter, Connect, Retrieve, Abstract, and Summary. 
        Be sure to respond to the user with the type of action you believe they are requesting. For example, if the user says: 'Please describe the video' you should respond with '[Summary]' along with the actual summary of the dataset. All actions should be within [].
        Only respond to questions that are related to the video. If the user asks a question that is not related to the video respond with "I'm sorry, the video is not related to that.".
        Lasltly, provide timestamps for the information you are providing in [] when relevant. An example response would be: "The name of the main character is Alex. [00:00-00:20]"

        User Goal: {goal}
        Prompt: {prompt}

        Based on the user goal, provide a response.
        """

        print("generating response")

        response = genai_model.generate_content([genai_video_file, final_prompt], request_options={"timeout": 600})
        answer = response.text

        print("generating follow-up questions")
        
        # Construct the context suggestions prompt
        Context_suggestions = f"""
        Based on the following data:
        data:{data}
        Given this wide potential of information, there are 7 broad categories of actions a user might ask for assistance in:
        Explore, Elaborate, Filter, Retrieve, Abstract, and Summary. Include the type of suggestion as well. For Example: What is the gray wire connected to?(retrieve)
        """

        # Send the request to the GPT API
        follow_up_response = requests.post(
            'https://test-llm-openai.openai.azure.com/openai/deployments/Testbed/chat/completions?api-version=2024-02-01',
            headers={
                'Authorization': 'Bearer a2cc2b6310e4424ca9230faf143a048f',
                'api-key': ''
            },
            json={
                'model': 'gpt-4',
                'messages': [
                    {'role': 'system', 'content': Context_suggestions},
                    {'role': 'user', 'content': f"""Based on the goal:{goal}. Generate 4 follow-up questions that a user might ask to explore the topic further. Each question should be 45 characters or less.
                    The questions should be related to the video and the user goal.
                    """},
                ],
                'max_tokens': 200,  # Increase token limit to allow more detailed suggestions
                'n': 1,
                'temperature': 0.5,  # Lower temperature for more deterministic output
                'top_p': 0.9  # Narrow the focus for high-probability completions
            }
        )

        # Raise an exception if the request failed.
        follow_up_response.raise_for_status()
        follow_up_questions = follow_up_response.json()['choices'][0]['message']['content']

        # Parse the follow-up questions into a list (assuming the response format contains line breaks).
        suggestions = [q.strip() for q in follow_up_questions.split('\n') if q]
        # suggestions = []
        # Return both the answer and the follow-up questions as JSON.
        return jsonify({
            'answer': answer,
            'suggestions': suggestions
        })
    except requests.RequestException as e:
        # Handle and log any errors that occur during the interaction with the LLM API.
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500


# @app.route('/chat', methods=['POST'])
# def chat():
#     if genai_model is None:
#         return jsonify({'error': 'Model not initialized'}), 500
    
#     # Retrieve user input
#     prompt = request.json.get('prompt')
#     goal = request.json.get('goal')
#     print("Prompt: ", prompt)
#     print("Goal: ", goal)

#     # Load data file
#     current_dir = os.path.dirname(os.path.abspath(__file__))
#     data_file = os.path.join(current_dir, '..', '..', 'Pipeline', 'data', 'data.json')
#     with open(data_file, 'r') as f:
#         data = json.load(f)

#     try:
#         final_prompt = f"""
#         Context: You are an Intelligent and friendly assistant that analyzes videos. Given a video, there are 7 broad categories of actions a user might ask for assistance in:
#         Explore, Elaborate, Filter, Connect, Retrieve, Abstract, and Summary. 
#         Respond with the type of action you believe they are requesting. For example, if the user says: 'Please describe the video' you should respond with '[Summary]' along with the actual summary of the dataset. All actions should be within [].
#         Only respond to questions related to the video. If the user asks something unrelated, respond with "I'm sorry, the video is not related to that."
#         Provide timestamps in [] when relevant. Example response: "The main character is Alex. [00:00-00:20]"

#         User Goal: {goal}
#         Prompt: {prompt}

#         Based on the user goal, provide a response.
#         """

#         print("Generating response...")
#         response = genai_model.generate_content([final_prompt], request_options={"timeout": 600})
#         answer = response.text

#         print("Generating follow-up questions...")

#         context_suggestions = f"""
#         Given this information, there are 7 broad categories of actions a user might ask for assistance in:
#         Explore, Elaborate, Filter, Retrieve, Abstract, and Summary. 
#         Include the type of suggestion as well. Example: "What is the gray wire connected to? (Retrieve)"
#         """

#         follow_up_prompt = f"""
#         Based on the goal: {goal}.
#         Generate 4 follow-up questions that a user might ask to explore the topic further. Each question should be 45 characters or less.
#         The questions should be related to the video and the user goal.
#         """

#         follow_up_response = genai_model.generate_content([context_suggestions, follow_up_prompt])
#         follow_up_questions = follow_up_response.text.split("\n")

#         suggestions = [q.strip() for q in follow_up_questions if q]

#         return jsonify({
#             'answer': answer,
#             'suggestions': suggestions
#         })
#     except Exception as e:
#         print(f"Error: {e}")
#         return jsonify({'error': str(e)}), 500
    
    
@app.route('/log', methods=['POST'])
def log_action():
    try:
        data = request.get_json(force=True)  # Add force=True to handle no-cors requests
        log_entry = data.get('log_entry')
        if not log_entry:
            return jsonify({'error': 'No log entry provided'}), 400
            
        with open('execution_log.txt', 'a') as f:
            f.write(log_entry)
            
        response = jsonify({'status': 'success'})
        response.headers.add('Access-Control-Allow-Origin', '*')  # Add CORS header
        return response
        
    except Exception as e:
        logging.error(f"Logging error: {str(e)}")
        return jsonify({'error': 'Failed to log entry', 'message': str(e)}), 500

#--------------------------------------------------------------------------------------------------------------------------------#
# MAIN EXECUTION
#--------------------------------------------------------------------------------------------------------------------------------#

# Starts the Flask application in debug mode, enabling detailed error pages and automatic reloading on code changes.
if __name__ == '__main__':
    print("Initializing RAG")
    # initialize_rag()
    print("RAG initialized")
    app.run(debug=True)

