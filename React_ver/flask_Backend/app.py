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

#--------------------------------------------------------------------------------------------------------------------------------#
# ROUTE: '/upload-json' [PUT]
# Purpose: Uploads and associates JSON data with the most recently uploaded video.
@app.route('/upload-json', methods=['PUT'])
def upload_json():
    try:
        # Retrieve the JSON data from the request body.
        json_data = request.json
        print(json_data)
        if not json_data:
            return jsonify({'error': 'No JSON data provided'}), 400

        # Query the database to find the most recently uploaded video.
        video_record = StorageModel.query.order_by(StorageModel.created_at.desc()).first()
        if not video_record:
            return jsonify({'error': 'No video records found'}), 404

        # Update the video record with the new JSON data.
        video_record.json_data = json_data
        db.session.commit()

        # Return a success message if the operation is successful.
        return jsonify({'message': 'JSON data updated successfully'}), 200
    except Exception as e:
        # Return an error message if something goes wrong during the update process.
        return jsonify({'error': 'Failed to update JSON data', 'message': str(e)}), 500

#--------------------------------------------------------------------------------------------------------------------------------#
# ROUTE: '/retrieve-json' [GET]
# Purpose: Retrieves the JSON data associated with the most recently uploaded video.
@app.route('/retrieve-json', methods=['GET'])
def retrieve_json():
    try:
        # Query the database to find the most recently uploaded video and its associated JSON data.
        video_record = StorageModel.query.order_by(StorageModel.created_at.desc()).first_or_404()

        if not video_record:
            return jsonify({'error': 'No video records found'}), 404

        # Retrieve the JSON data from the video record.
        json_data = video_record.json_data

        # Return the JSON data to the client.
        return json_data
    
    except Exception as e:
        # Return an error message if something goes wrong during the retrieval process.
        return jsonify({'error': 'Failed to retrieve JSON data', 'message': str(e)}), 500

    
##================================================================================================================================================================================
#have to get the object values and send it to the script
@app.route('/run-AV', methods=['POST'])
def run_AV():
    print("Running AVscript")
    try:
        data = request.get_json()
        json_string = json.dumps(data)
        # Construct the path to the script.py file
        script_path = os.path.join(os.path.dirname(__file__), '../../Pipeline/AVscript.py')
        # Ensure the path is absolute
        script_path = os.path.abspath(script_path)
        command = f'python {script_path} \'{json_string}\''
        # Run the script
        subprocess.run(command, shell=True)
        return "True"
    except Exception as e:
        return "False"

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
@app.route('/run-and-retrieve-AV', methods=['POST'])
def run_and_retrieve_AV():
    print("Running AVscript and retrieving data")
    try:
        # Step 1: Run the AV script
        data = request.get_json()  # Get the selected objects from the request
        json_string = json.dumps(data)
        # Construct the path to the AV script
        script_path = os.path.join(os.path.dirname(__file__), '../../Pipeline/AVscript.py')
        script_path = os.path.abspath(script_path)
        command = f'python {script_path} \'{json_string}\''
        result = subprocess.run(command, shell=True)

        if result.returncode != 0:  # Check if the script ran successfully
            return jsonify({'error': 'Failed to run AV script'}), 500
        
        # Step 2: Retrieve the AV data
        video_record = StorageModel.query.order_by(StorageModel.created_at.desc()).first_or_404()

        if not video_record:
            return jsonify({'error': 'No video records found'}), 404

        AV_data = video_record.AV_segmented  # Retrieve the AV segmented data

        # Return the AV data in the response
        return jsonify({'message': 'AV script ran successfully', 'AV_data': AV_data}), 200

    except Exception as e:
        return jsonify({'error': 'Error during AV process', 'message': str(e)}), 500
    
##================================================================================================================================================================================

@app.route('/run-script', methods=['POST'])
def run_script():
    print("Running script")
    try:
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

#--------------------------------------------------------------------------------------------------------------------------------#
# ROUTE: '/chat' [POST]
# Purpose: Interacts with an external LLM API to generate a response and dynamic follow-up questions based on user input.
@app.route('/chat', methods=['POST'])
def chat():
    # Retrieve the prompt (user input) from the JSON request body.
    prompt = request.json.get('prompt')
    try:
        # Send the prompt to the LLM API to generate a response.
        response = requests.post(
            #make sure to include the version at the end of this url below:
            'https://test-llm-openai.openai.azure.com/openai/deployments/Testbed/chat/completions?api-version=2024-02-01',
            headers={
                'Authorization': 'Bearer a2cc2b6310e4424ca9230faf143a048f',
                'api-key': 'a2cc2b6310e4424ca9230faf143a048f'
            },
            json={
                'model': 'gpt-4',
                'messages': [{'role': 'user', 'content': prompt}],
                'max_tokens': 300,
                'n': 1,
                'stop': None,
                'temperature': 0.7
            }
        )
        # Raise an exception if the request failed.
        response.raise_for_status()
        llm_response = response.json()

        # Extract the answer from the LLM response.
        answer = llm_response['choices'][0]['message']['content']

        # Send another request to the LLM to generate follow-up questions based on the original prompt.
        follow_up_response = requests.post(
            # Make sure to include the latest version being used here:
            'https://test-llm-openai.openai.azure.com/openai/deployments/Testbed/chat/completions?api-version=2024-02-01',
            headers={
                'Authorization': 'Bearer a2cc2b6310e4424ca9230faf143a048f',
                'api-key': 'a2cc2b6310e4424ca9230faf143a048f'
            },
            json={
                'model': 'gpt-4',
                'messages': [
                    {'role': 'system', 'content': 'Generate follow-up questions related to the topic of this prompt in 55 characters.'},
                    {'role': 'user', 'content': prompt}
                ],
                'max_tokens': 100,
                'n': 1,
                'temperature': 0.7
            }
        )
        # Raise an exception if the request failed.
        follow_up_response.raise_for_status()
        follow_up_questions = follow_up_response.json()['choices'][0]['message']['content']

        # Parse the follow-up questions into a list (assuming the response format contains line breaks).
        suggestions = [q.strip() for q in follow_up_questions.split('\n') if q]

        # Return both the answer and the follow-up questions as JSON.
        return jsonify({
            'answer': answer,
            'suggestions': suggestions
        })
    except requests.RequestException as e:
        # Handle and log any errors that occur during the interaction with the LLM API.
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

#--------------------------------------------------------------------------------------------------------------------------------#
# MAIN EXECUTION
#--------------------------------------------------------------------------------------------------------------------------------#

# Starts the Flask application in debug mode, enabling detailed error pages and automatic reloading on code changes.
if __name__ == '__main__':
    app.run(debug=True)
