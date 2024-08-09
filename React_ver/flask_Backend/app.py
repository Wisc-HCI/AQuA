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

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
db = SQLAlchemy(app=app)

logging.basicConfig(level=logging.DEBUG)

class StorageModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    video_name = db.Column(db.String(100), nullable=False)
    video_data = db.Column(db.LargeBinary, nullable=False)
    audio_name = db.Column(db.String(100), nullable=True)  # New column for audio name
    audio_data = db.Column(db.LargeBinary, nullable=True)  # New column for audio data
    json_data = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return "VLM Backend is Running"

@app.route('/upload', methods=['POST'])
def upload_video():
    try:
        # Get the files from the request
        video_file = request.files['video']
        audio_file = request.files['audio']

        # Read the video file data
        video_data = video_file.read()
        video_name = video_file.filename

        # Read the audio file data
        audio_data = audio_file.read()
        audio_name = audio_file.filename

        # Create a new Video instance with both video and audio data
        new_video = StorageModel(
            video_name=video_name,
            video_data=video_data,
            audio_name=audio_name,
            audio_data=audio_data
        )
        
        # Add the new video to the session and commit to the database
        db.session.add(new_video)
        db.session.commit()

        return jsonify({'message': 'Video and audio uploaded successfully'}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to upload video and audio', 'message': str(e)}), 500

@app.route('/video/recent', methods=['GET'])
def get_most_recent_video():
    try:
        logging.debug("Attempting to retrieve the most recent video and audio")
        video_record = StorageModel.query.order_by(StorageModel.created_at.desc()).first_or_404()

        video_file = send_file(io.BytesIO(video_record.video_data), download_name=video_record.video_name, as_attachment=True)
        
        logging.debug(f"Most recent video found: {video_record.video_name}")

        return video_file 
        
    except Exception as e:
        logging.error(f"Error retrieving the most recent video and audio: {e}")
        return jsonify({'error': 'Failed to retrieve the most recent video and audio', 'message': str(e)}), 500

@app.route('/audio/recent', methods=['GET'])
def get_most_recent_audio():
    try:
        logging.debug("Attempting to retrieve the most recent video and audio")
        video_record = StorageModel.query.order_by(StorageModel.created_at.desc()).first_or_404()

        audio_file = send_file(io.BytesIO(video_record.audio_data), download_name=video_record.audio_name, as_attachment=True)
        
        logging.debug(f"Most recent audio found: {video_record.video_name}")

        return audio_file
        
    except Exception as e:
        logging.error(f"Error retrieving the most recent video and audio: {e}")
        return jsonify({'error': 'Failed to retrieve the most recent video and audio', 'message': str(e)}), 500

@app.route('/upload-json', methods=['PUT'])
def upload_json():
    try:
        # Get the JSON data from the request body
        json_data = request.json
        if not json_data:
            return jsonify({'error': 'No JSON data provided'}), 400

        # Find the latest video record
        video_record = StorageModel.query.order_by(StorageModel.created_at.desc()).first()
        if not video_record:
            return jsonify({'error': 'No video records found'}), 404

        # Update the json_data field
        video_record.json_data = json_data
        db.session.commit()

        return jsonify({'message': 'JSON data updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to update JSON data', 'message': str(e)}), 500
    
@app.route('/retrieve-json', methods=['GET'])
def retrieve_json():
    try:
        
        video_record = StorageModel.query.order_by(StorageModel.created_at.desc()).first_or_404()

        if not video_record:
            return jsonify({'error': 'No video records found'}), 404

        # Update the json_data field
        json_data = video_record.json_data

        return json_data
    
    except Exception as e:
        return jsonify({'error': 'Failed to retrieve JSON data', 'message': str(e)}), 500

@app.route('/run-script', methods=['POST'])
def run_script():
    print("Running script")
    try:
        print("Running script2")
        # Construct the path to the script.py file
        script_path = os.path.join(os.path.dirname(__file__), '../../Pipeline/script.py')
        # Ensure the path is absolute
        script_path = os.path.abspath(script_path)
        command = f'python {script_path}'
        # Run the script
        subprocess.run(command, shell=True)
        return "True"
    except Exception as e:
        return "False"

@app.route('/chat', methods=['POST'])
def chat():
    prompt = request.json.get('prompt')
    try:
        response = requests.post(
            'https://test-llm-openai.openai.azure.com/openai/deployments/Testbed/chat/completions?api-version=2024-02-01', #the completions?api-version=2024-02-01 required for this api to work
            headers={
                'Authorization': 'Bearer a2cc2b6310e4424ca9230faf143a048f',
                'api-key': 'a2cc2b6310e4424ca9230faf143a048f'
            },
            json={
                'model': 'gpt-3.5',
                'messages': [{'role': 'user', 'content': prompt}],
                'max_tokens': 150
            }
        )
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        print(f"Error: {e}")
        print(f"Response content: {e.response.content if e.response else 'No response content'}")
        return jsonify({'error': str(e)}), 500

#------------------------------------------------------------------------------------------------------------------------------------------------#

if __name__ == '__main__':
    app.run(debug=True)
