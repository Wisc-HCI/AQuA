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
        
        video_data = video_record.video_data
        audio_data = video_record.audio_data
        
        logging.debug(f"Most recent video and audio found: {video_record.video_name}")

        return jsonify({
            'video': base64.b64encode(video_data).decode('utf-8'),
            'audio': base64.b64encode(audio_data).decode('utf-8')
        })
        
    except Exception as e:
        logging.error(f"Error retrieving the most recent video and audio: {e}")
        return jsonify({'error': 'Failed to retrieve the most recent video and audio', 'message': str(e)}), 500

##================================================================================================================================================================================

@app.route('/update-json/<int:video_id>', methods=['PUT'])
def update_json(video_id):
    try:
        # Get the JSON data from the request body
        json_data = request.json
        if not json_data:
            return jsonify({'error': 'No JSON data provided'}), 400

        # Find the video by ID
        video = StorageModel.query.get_or_404(video_id)

        # Update the json_data field
        video.json_data = json_data
        db.session.commit()

        return jsonify({'message': 'JSON data updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': 'Failed to update JSON data', 'message': str(e)}), 500

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

#------------------------------------------------------------------------------------------------------------------------------------------------#


if __name__ == '__main__':
    app.run(debug=True)
