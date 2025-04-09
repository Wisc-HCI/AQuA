import spacy
import subprocess
import os
import argparse
import cv2
import sys
import json
import requests
import base64
from collections import defaultdict
import ast
from concurrent.futures import ThreadPoolExecutor, as_completed
from ultralytics import YOLO
import cv2
from openai import AzureOpenAI

def generate_transcript(audio_file):
    token = "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"
    command = f"whisperx {audio_file} --compute_type int8 --diarize --hf_token {token}"
    subprocess.run(command, shell=True)


def extract_nouns(transcript_file):
    model = spacy.load("en_core_web_sm")

    with open(transcript_file, "r") as file:
        transcript = file.read()

    doc = model(transcript)

    nouns = set(token.text for token in doc if token.pos_ == "NOUN")
    return nouns


def process_transcript_labels(nouns):
    with open('recent_audio.json','r') as f:
        data = json.load(f)
    
    words = []
    for segment in data["segments"]:
        for word_info in segment["words"]:
            word = word_info["word"]
            start = word_info["start"]
            end = word_info["end"]
            words.append({"word": word, "start": start, "end": end})
    
    noun_times = []
    for noun in nouns:
        noun_data = {"object": noun, "times": [], "source": "audio"}
        for word_info in words:
            if word_info["word"].strip('.,') == noun:
                noun_data["times"].append({"start": word_info["start"], "end": word_info["end"]})
        noun_times.append(noun_data)
    
    return noun_times


def fetch_files_from_api(api_url,output_path):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    response = requests.get(api_url)
    if response.status_code == 200:
        with open(output_path, 'wb') as f:
            f.write(response.content)
        return output_path
    else:
        return None
    


def detect_objects_in_segments(video_path, transcript_data, confidence_threshold=0.5):
    """
    Detect objects in video segments defined by transcript data using YOLO.

    Args:
        video_path (str): Path to the input video
        transcript_data (list): List of dictionaries with 'start_time' and 'end_time'
        confidence_threshold (float): Minimum confidence threshold for detections

    Returns:
        list: Updated transcript data with detected objects for each segment
    """
    # Load the YOLO model
    model = YOLO('yolov8n.pt')  # Using YOLOv8 nano model

    # Initialize video capture
    cap = cv2.VideoCapture(video_path)
    
    # Get video frame rate
    fps = cap.get(cv2.CAP_PROP_FPS)

    for segment in transcript_data:
        start_frame = int(segment['start_time'] * fps)
        end_frame = int(segment['end_time'] * fps)

        # Set video to start frame
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)

        # Store unique detected objects for this segment
        detected_objects = set()

        # Process frames in the segment
        for frame_num in range(start_frame, end_frame):
            ret, frame = cap.read()
            if not ret:
                break

            # Run inference on the frame
            results = model(frame)

            # Process results
            for r in results:
                boxes = r.boxes

                for box in boxes:
                    # Get confidence score
                    confidence = float(box.conf)
                    
                    if confidence >= confidence_threshold:
                        # Get class name
                        class_id = int(box.cls)
                        class_name = model.names[class_id]
                        
                        # Add to detected objects set (unique by class name)
                        detected_objects.add(class_name)

        # Add detected objects to the transcript segment
        segment['Objects'] = list(detected_objects)

    cap.release()
    
    return transcript_data

def process_transcript_and_detect_objects(video_path, confidence_threshold=0.65):
    json_file_path = 'recent_audio.json'
    output_json_file_path = 'data/data.json'
    
    with open(json_file_path, 'r') as f:
        data = json.load(f)

    transcript_data = []

    previous_speaker = None
    consolidated_text = ""
    start_time = None
    end_time = None

    for segment in data["segments"]:
        current_speaker = segment["speaker"].lower()  # Convert to lowercase

        # Check if the speaker label is in the expected format
        if current_speaker.startswith('speaker_'):
            try:
                speaker_number = int(current_speaker.split('_')[1]) + 1
                current_speaker = f"Speaker-{speaker_number}"
            except (IndexError, ValueError) as e:
                print(f"Error processing speaker label '{current_speaker}': {e}")
                current_speaker = "unknown"
        else:
            print(f"Unexpected speaker format: {current_speaker}")
            current_speaker = "unknown"

        current_text = segment["text"]
        current_start = segment["start"]
        current_end = segment["end"]

        if current_speaker == previous_speaker:
            # Concatenate text and adjust end time
            consolidated_text += " " + current_text
            end_time = current_end
        else:
            # Add to transcript data
            if previous_speaker is not None:
                transcript_data.append({
                    "start_time": start_time,
                    "end_time": end_time,
                    "text": consolidated_text,
                    "speaker": previous_speaker
                })

            # Reset for the new speaker
            previous_speaker = current_speaker
            consolidated_text = current_text
            start_time = current_start
            end_time = current_end

    # Add the last speaker's consolidated text to the transcript data
    if previous_speaker is not None:
        transcript_data.append({
            "start_time": start_time,
            "end_time": end_time,
            "text": consolidated_text,
            "speaker": previous_speaker
        })
    
    transcript_data = detect_objects_in_segments(video_path, transcript_data, confidence_threshold)

    with open(output_json_file_path, 'w') as f:
        json.dump(transcript_data, f, indent=4)

    return json.dumps(transcript_data)

def main(custom_nouns=None):
    print("Running script")
    video_path = fetch_files_from_api("http://127.0.0.1:5000/video/recent", 'media/recent_video.mp4')
    print("wrote video")
    audio_path = fetch_files_from_api("http://127.0.0.1:5000/audio/recent", 'media/recent_audio.wav')
    print("wrote audio")
    print("Video path is:", video_path)

    if video_path and audio_path:
        # generate_transcript(audio_file=audio_path)
        # print("Transcript generated")

        # audio_filename = os.path.basename(audio_path)
        # transcript_file = os.path.splitext(audio_filename)[0] + '.txt'

        # nouns = extract_nouns(transcript_file=transcript_file)
        
        # print("The nouns are:", nouns)


        # Pass the parsed data to the function
        # data = process_transcript_and_detect_objects(video_path=video_path, confidence_threshold=0.5)
        # print("Transcript data with objects:", data)

        # try:
        #     response = requests.put('http://127.0.0.1:5000/upload-AV', json=data)
        #     if response.status_code == 200:
        #         print("Segments uploaded successfully")
        #     else:
        #         print(f"Failed to upload segments: {response.status_code} - {response.text}")
        # except Exception as e:
        #     print(f"Failed to make PUT request: {e}")

        print("done")

    else:
        print("Failed to fetch video and audio data from the API")



if __name__ == "__main__":
    main()

