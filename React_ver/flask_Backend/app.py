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
import requests

#--------------------------------------------------------------------------------------------------------------------------------#
# INITIALIZATION
#--------------------------------------------------------------------------------------------------------------------------------#

# Initialize the Flask app and configure it using settings from a configuration file.
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS to allow requests from different origins.
CORS(app)

# Initialize SQLAlchemy ORM to interface with the database.
db = SQLAlchemy(app=app)

# Configure logging for the application at the DEBUG level to capture detailed logs.
logging.basicConfig(level=logging.DEBUG)

#--------------------------------------------------------------------------------------------------------------------------------#
# DATABASE MODEL
#--------------------------------------------------------------------------------------------------------------------------------#

# Define the 'StorageModel' database model that maps to a table in the database.
class StorageModel(db.Model):
    __tablename__ = 'storage_model'  # Optional: You can explicitly set the table name (not done here).

    # Define the columns in the table.
    id = db.Column(db.Integer, primary_key=True)  # Primary key, unique ID for each row.
    video_name = db.Column(db.String(100), nullable=False)  # Stores the name of the video file (cannot be null).
    video_data = db.Column(db.LargeBinary, nullable=False)  # Stores the binary data of the video file (cannot be null).
    audio_name = db.Column(db.String(100), nullable=True)  # Stores the name of the associated audio file (can be null).
    audio_data = db.Column(db.LargeBinary, nullable=True)  # Stores the binary data of the associated audio file (can be null).
    json_data = db.Column(db.JSON, nullable=True)  # Stores additional JSON data related to the video/audio (can be null).
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)  # Automatically stores the creation date/time.

# Ensure the table is created within the database context.
with app.app_context():
    db.create_all()  # Creates the table if it doesn't already exist in the database.

#--------------------------------------------------------------------------------------------------------------------------------#
# ROUTE DEFINITIONS
#--------------------------------------------------------------------------------------------------------------------------------#

# Route: '/'
# Purpose: A simple health check route to confirm the backend is running.
@app.route('/')
def home():
    return "VLM Backend is Running"

#--------------------------------------------------------------------------------------------------------------------------------#
# ROUTE: '/upload' [POST]
# Purpose: Uploads both a video file and an audio file to the backend, saving them to the database.
@app.route('/upload', methods=['POST'])
def upload_video():
    try:
        # Get the video and audio files from the HTTP POST request.
        video_file = request.files['video']
        audio_file = request.files['audio']

        # Read the binary data from the uploaded video file.
        video_data = video_file.read()
        video_name = video_file.filename

        # Read the binary data from the uploaded audio file.
        audio_data = audio_file.read()
        audio_name = audio_file.filename

        # Create a new database record for the uploaded video and audio files.
        new_video = StorageModel(
            video_name=video_name,
            video_data=video_data,
            audio_name=audio_name,
            audio_data=audio_data
        )
        
        # Add the new record to the database and commit the transaction.
        db.session.add(new_video)
        db.session.commit()

        # Return a success message to the client.
        return jsonify({'message': 'Video and audio uploaded successfully'}), 201
    except Exception as e:
        # Return an error message in case of failure, including the exception details.
        return jsonify({'error': 'Failed to upload video and audio', 'message': str(e)}), 500

#--------------------------------------------------------------------------------------------------------------------------------#
# ROUTE: '/video/recent' [GET]
# Purpose: Retrieves the most recent video file stored in the database.
@app.route('/video/recent', methods=['GET'])
def get_most_recent_video():
    try:
        # Log the retrieval attempt for debugging purposes.
        logging.debug("Attempting to retrieve the most recent video and audio")

        # Query the database for the most recently uploaded video (by creation date).
        video_record = StorageModel.query.order_by(StorageModel.created_at.desc()).first_or_404()

        # Send the video file back to the client as a downloadable attachment.
        video_file = send_file(io.BytesIO(video_record.video_data), download_name=video_record.video_name, as_attachment=True)
        
        logging.debug(f"Most recent video found: {video_record.video_name}")

        return video_file 
    except Exception as e:
        # Log any errors and return an error message to the client.
        logging.error(f"Error retrieving the most recent video and audio: {e}")
        return jsonify({'error': 'Failed to retrieve the most recent video and audio', 'message': str(e)}), 500

#--------------------------------------------------------------------------------------------------------------------------------#
# ROUTE: '/audio/recent' [GET]
# Purpose: Retrieves the most recent audio file stored in the database.
@app.route('/audio/recent', methods=['GET'])
def get_most_recent_audio():
    try:
        # Log the retrieval attempt for debugging purposes.
        logging.debug("Attempting to retrieve the most recent video and audio")

        # Query the database for the most recently uploaded audio file (by creation date).
        video_record = StorageModel.query.order_by(StorageModel.created_at.desc()).first_or_404()

        # Send the audio file back to the client as a downloadable attachment.
        audio_file = send_file(io.BytesIO(video_record.audio_data), download_name=video_record.audio_name, as_attachment=True)
        
        logging.debug(f"Most recent audio found: {video_record.video_name}")

        return audio_file
    except Exception as e:
        # Log any errors and return an error message to the client.
        logging.error(f"Error retrieving the most recent video and audio: {e}")
        return jsonify({'error': 'Failed to retrieve the most recent video and audio', 'message': str(e)}), 500

#--------------------------------------------------------------------------------------------------------------------------------#
# ROUTE: '/upload-json' [PUT]
# Purpose: Updates the JSON metadata for the most recent video/audio record in the database.
@app.route('/upload-json', methods=['PUT'])
def upload_json():
    try:
        # Get the JSON data from the request body.
        json_data = request.json
        if not json_data:
            return jsonify({'error': 'No JSON data provided'}), 400

        # Retrieve the most recent video record.
        video_record = StorageModel.query.order_by(StorageModel.created_at.desc()).first()
        if not video_record:
            return jsonify({'error': 'No video records found'}), 404

        # Update the JSON data in the retrieved record.
        video_record.json_data = json_data
        db.session.commit()

        return jsonify({'message': 'JSON data updated successfully'}), 200
    except Exception as e:
        # Handle and return any errors that occur during the update.
        return jsonify({'error': 'Failed to update JSON data', 'message': str(e)}), 500

#--------------------------------------------------------------------------------------------------------------------------------#
# ROUTE: '/retrieve-json' [GET]
# Purpose: Retrieves the JSON metadata associated with the most recent video/audio record.
@app.route('/retrieve-json', methods=['GET'])
def retrieve_json():
    try:
        # Query the database for the most recent video record.
        video_record = StorageModel.query.order_by(StorageModel.created_at.desc()).first_or_404()

        # Return the JSON data associated with the video record.
        return video_record.json_data
    except Exception as e:
        # Handle and return any errors that occur during retrieval.
        return jsonify({'error': 'Failed to retrieve JSON data', 'message': str(e)}), 500

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
        response.raise_for_status()
        llm_response = response.json()

        # Extract the answer from the LLM response.
        answer = llm_response['choices'][0]['message']['content']

        # Send another request to the LLM to generate follow-up questions based on the original prompt.
        follow_up_response = requests.post(
            'https://test-llm-openai.openai.azure.com/openai/deployments/Testbed/chat/completions?api-version=2024-02-01',
            headers={
                'Authorization': 'Bearer a2cc2b6310e4424ca9230faf143a048f',
                'api-key': 'a2cc2b6310e4424ca9230faf143a048f'
            },
            json={
                'model': 'gpt-4',
                'messages': [
                    {'role': 'system', 'content': 'Generate follow-up questions related to the topic of this prompt.'},
                    {'role': 'user', 'content': prompt}
                ],
                'max_tokens': 100,
                'n': 1,
                'temperature': 0.7
            }
        )
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

# Starts the Flask app in debug mode, which enables detailed error pages and hot-reloading.
if __name__ == '__main__':
    app.run(debug=True)