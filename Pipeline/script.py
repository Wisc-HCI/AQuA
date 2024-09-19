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


def generate_and_process_frames(video_path):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print("Error: Could not open video.")
        return
    
    frame_count = 0

    # Get the frame rate of the video
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    print(f"Frames per second: {fps}")

    second_count = 0
    while True:
        ret, frame = cap.read()

        # If the frame was not read successfully, break the loop
        if not ret:
            break

        # Process one frame per second
        if frame_count % fps == 0:
            # Define the Detic Image demo command with the required parameters
            detic_image_demo_command = (
                f"python demo.py --config-file configs/Detic_LCOCOI21k_CLIP_SwinB_896b32_4x_ft4x_max-size.yaml "
                f"--input ../{second_count}.jpg --output ../{second_count}_demo.jpg --vocabulary lvis "
                f"--opts MODEL.WEIGHTS ../models/Detic_LCOCOI21k_CLIP_SwinB_896b32_4x_ft4x_max-size.pth"
            )
            
            # Save the frame to a temporary file
            temp_frame_path = f"{second_count}.jpg"
            output_frame_path = f"{second_count}_demo.jpg"
            cv2.imwrite(temp_frame_path, frame)
            
            # Run the Detic Image demo command
            subprocess.run(detic_image_demo_command, shell=True, cwd='Detic')
            
            # Optionally, remove the temporary file after processing
            os.remove(temp_frame_path)
            os.remove(output_frame_path)
            
            second_count += 1

        frame_count += 1

    # Release the video capture object
    cap.release()
    print(f"Processed {second_count} frames.")


def generate_transcript(audio_file):

    command = f"whisperx {audio_file} --compute_type int8"
    subprocess.run(command, shell=True)


def extract_nouns(transcript_file):
    model = spacy.load("en_core_web_sm")

    with open(transcript_file, "r") as file:
        transcript = file.read()

    doc = model(transcript)

    nouns = set(token.text for token in doc if token.pos_ == "NOUN")
    return nouns


def process_detic_labels(file_path):

    file_content = []
    with open(file_path, 'r') as file:
        for line in file:
            # Extract the list part of the line and convert it to a Python list
            objects_list = ast.literal_eval(line.strip())
            file_content.append(objects_list)

    object_times = defaultdict(list)

    # Populate the object_times dictionary
    for second, objects in enumerate(file_content):
        for obj in objects:
            object_times[obj].append(second)

    # Combine consecutive times into one interval
    def combine_intervals(times):
        intervals = []
        start = times[0]
        for i in range(1, len(times)):
            if times[i] != times[i-1] + 1:
                intervals.append((start, times[i-1]))
                start = times[i]
        intervals.append((start, times[-1]))
        return intervals

    # Create the final JSON structure
    final_data = []
    for obj, times in object_times.items():
        intervals = combine_intervals(times)
        json_intervals = []
        for start, end in intervals:
            if start == end:
                start -= 1  # Subtract 1 from the start if start and end are the same
            json_intervals.append({"start": start, "end": end})
        final_data.append({"object": obj, "times": json_intervals, "source": "video"})

    # Print the final JSON data
    json_output = json.dumps(final_data, indent=2)
    return json_output

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

# def run_detic(video_file, words):

#     custom_vocabulary = ','.join(words)

#     detic_demo_command = (
#         f"python demo.py --config-file configs/Detic_LCOCOI21k_CLIP_SwinB_896b32_4x_ft4x_max-size.yaml "
#         f"--video-input ../media/{video_file} --output ../outputs/output_video.mp4 --vocabulary custom "
#         f"--custom_vocabulary {custom_vocabulary} --confidence-threshold 0.3 "
#         f"--opts MODEL.WEIGHTS ../models/Detic_LCOCOI21k_CLIP_SwinB_896b32_4x_ft4x_max-size.pth"
#     )

#     subprocess.run(detic_demo_command, shell=True, cwd='Detic')

def fetch_files_from_api(api_url,output_path):
    response = requests.get(api_url)
    if response.status_code == 200:
        with open(output_path, 'wb') as f:
            f.write(response.content)
        return output_path
    else:
        return None
    
def default_AVscript():
    with open('recent_audio.json', 'r') as f:
            timestamped_transcript = json.load(f)

            formatted_text = [{"type": "other", "text": segment["text"]} for segment in timestamped_transcript["segments"]]
            formatted_output = json.dumps(formatted_text)
            return formatted_output

def main(custom_nouns=None):
    print("Running script")
    video_path = fetch_files_from_api("http://127.0.0.1:5000/video/recent", 'media/recent_video.mp4')
    print("wrote video")
    audio_path = fetch_files_from_api("http://127.0.0.1:5000/audio/recent", 'media/recent_audio.wav')
    print("wrote audio")

    if video_path and audio_path:
        generate_transcript(audio_file=audio_path)
        print("Transcript generated")

        audio_filename = os.path.basename(audio_path)
        transcript_file = os.path.splitext(audio_filename)[0] + '.txt'

        nouns = extract_nouns(transcript_file=transcript_file)
        
        print("The nouns are:",nouns)

        # path = "outputs/frames"
        # print("Video path is:",video_path)
        # generate_and_process_frames(video_path)
        json_data = process_detic_labels("Detic/labels.txt")

        transcript_json_data = process_transcript_labels(nouns)

        json_data_list = json.loads(json_data)

        final_json = json_data_list + transcript_json_data
        print("Final JSON data:", final_json)

        response = requests.put('http://127.0.0.1:5000/upload-json', json=final_json)

        if response.status_code == 200 or response.status_code == 204:
            print('Updated successfully')
        else:
            print(response)
            print('Failed to update, status code:', response.status_code)
        
        default_AV = default_AVscript()

        try:
            response = requests.put('http://127.0.0.1:5000/upload-AV', json=default_AV)
            if response.status_code == 200:
                print("Segments uploaded successfully")
            else:
                print(f"Failed to upload segments: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Failed to make PUT request: {e}")

    else:
        print("Failed to fetch video and audio data from the API")


if __name__ == "__main__":
    main()
