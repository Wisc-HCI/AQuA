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



app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
db = SQLAlchemy(app=app)

logging.basicConfig(level=logging.DEBUG)


class StorageModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    data = db.Column(db.LargeBinary, nullable=False)
    audio_data = db.Column(db.LargeBinary, nullable=True)  # New column for audio data
    json_data = db.Column(db.JSON, nullable=True)

with app.app_context():
    db.create_all()

@app.route('/')
def home():
    return "VLM Backend is Running"

@app.route('/upload', methods=['POST'])
def upload_video():
    try:
        # Paths to the video and audio files
        video_file_path = os.path.join('../../pipeline/media/', 'demovid2.mp4')
        audio_file_path = os.path.join('../../pipeline/media/', 'gettysburg.wav')

        # Read the video file
        with open(video_file_path, 'rb') as video_file:
            video_data = video_file.read()

        # Read the audio file
        with open(audio_file_path, 'rb') as audio_file:
            audio_data = audio_file.read()

        # Create a new Video instance with both video and audio data
        new_video = StorageModel(name=os.path.basename(video_file_path), data=video_data, audio_data=audio_data)
        
        # Add the new video to the session and commit to the database
        db.session.add(new_video)
        db.session.commit()

        return jsonify({'message': 'Video and audio uploaded successfully'}), 201
    except Exception as e:
        return jsonify({'error': 'Failed to upload video and audio', 'message': str(e)}), 500

@app.route('/video/name/<string:video_name>', methods=['GET'])
def get_video_by_name(video_name):
    try:
        logging.debug(f"Attempting to retrieve video: {video_name}")
        video = StorageModel.query.filter_by(name=video_name).first_or_404()
        logging.debug(f"Video found: {video.name}")
        return send_file(io.BytesIO(video.data), download_name=video.name, as_attachment=True)
    except Exception as e:
        logging.error(f"Error retrieving video by name: {e}")
        return jsonify({'error': 'Failed to retrieve video by name', 'message': str(e)}), 500
    
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

def analyze_video(video_path):
    cap = cv2.VideoCapture(video_path)
    frames = []
    objects = []
    timestamps = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frames.append(frame)
        # Here you would process each frame, e.g., object detection
        # For simplicity, let's say we detect an object in every frame
        objects.append("Detected Object")
        timestamps.append(cap.get(cv2.CAP_PROP_POS_MSEC))

    cap.release()
    return {
        "frames": frames,
        "objects": objects,
        "timestamps": timestamps
    }

def generate_av_script(frames):
    return [
        {"scene": "Introduction", "description": "This is the introduction scene."},
        {"scene": "Analysis", "description": "This scene analyzes the content."},
        {"scene": "Conclusion", "description": "This is the conclusion scene."}
    ]

def generate_timeline(timestamps):
    timeline = []
    for i, timestamp in enumerate(timestamps):
        timeline.append({"time": timestamp, "event": f"Event {i}"})
    return timeline

@app.route('/analyze-video', methods=['POST'])
def analyze_video_endpoint():
    video_file = request.files['video']
    video_path = os.path.join('uploads', video_file.filename)
    video_file.save(video_path)

    analysis = analyze_video(video_path)

    av_script = generate_av_script(analysis['frames'])
    timeline = generate_timeline(analysis['timestamps'])

    response = {
        "av_script": av_script,
        "timeline": timeline,
        "objects": analysis['objects']
    }

    return jsonify(response)

@app.route('/ask-question', methods=['POST'])
def ask_question():
    data = request.json
    question = data['question']
    # Here you would integrate a language model to answer the question
    # For simplicity, return a mock answer
    answer = "This is a mock answer to the question."
    return jsonify({"answer": answer})


if __name__ == '__main__':
    app.run(debug=True)
