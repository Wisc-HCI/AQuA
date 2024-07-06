import spacy
import subprocess
import os
import argparse
import cv2
import sys
import json

def generate_frames(video_path, output_folder):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print("Error: Could not open video.")
        return
    
    frame_count = 0

    # Get the frame rate of the video
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    print(f"Frames per second: {fps}")

    frame_count = 0
    second_count = 0
    while True:
        ret, frame = cap.read()

        # If the frame was not read successfully, break the loop
        if not ret:
            break

        # Save one frame per second
        if frame_count % fps == 0:
            frame_filename = os.path.join(output_folder, f'frame_{second_count:04d}.jpg')
            cv2.imwrite(frame_filename, frame)
            second_count += 1

        frame_count += 1

    # Release the video capture object
    cap.release()
    print(f"Saved {second_count} frames to {output_folder}")

def process_frames(folder_path):
    for filename in os.listdir(folder_path):

        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            detic_Image_demo_command = (
                f"python demo.py --config-file configs/Detic_LCOCOI21k_CLIP_SwinB_896b32_4x_ft4x_max-size.yaml "
                f"--input ../outputs/frames/{filename} --output ../outputs/{filename}_demo.jpg --vocabulary lvis "
                f"--opts MODEL.WEIGHTS ../models/Detic_LCOCOI21k_CLIP_SwinB_896b32_4x_ft4x_max-size.pth"
            )
            subprocess.run(detic_Image_demo_command, shell=True, cwd='Detic')

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


def timestamped_nouns(nouns, filename):
    with open(filename, 'r') as file:
        data = json.load(file)
    
    noun_details = []
    for segment in data['segments']:
        for word in segment['words']:
            if word['word'] in nouns:
                noun_details.append({
                    'word': word['word'],
                    'start': word['start'],
                    'end': word['end'],
                    'score': word['score']
                })
    return noun_details

def run_detic(video_file, words):

    custom_vocabulary = ','.join(words)

    detic_demo_command = (
        f"python demo.py --config-file configs/Detic_LCOCOI21k_CLIP_SwinB_896b32_4x_ft4x_max-size.yaml "
        f"--video-input ../media/{video_file} --output ../outputs/output_video.mp4 --vocabulary custom "
        f"--custom_vocabulary {custom_vocabulary} --confidence-threshold 0.3 "
        f"--opts MODEL.WEIGHTS ../models/Detic_LCOCOI21k_CLIP_SwinB_896b32_4x_ft4x_max-size.pth"
    )

    subprocess.run(detic_demo_command, shell=True, cwd='Detic')

# def main(audio_file, video_file, custom_nouns=None):

#     generate_transcript(audio_file=audio_file)

#     audio_filename = os.path.basename(audio_file)
#     transcript_file = os.path.splitext(audio_filename)[0] + '.txt'

#     if custom_nouns:
#         nouns = custom_nouns.split(',')
#     else:
#         nouns = extract_nouns(transcript_file=transcript_file)

#     print("Extracted Nouns", nouns)

#     # nouns1 = ["pencil","person","watch"]
#     run_detic(video_file=video_file, words=nouns)

def main(video_path, output_folder):
    generate_frames(video_path=video_path, output_folder=output_folder)
    path = "outputs/frames"
    process_frames(path)

if __name__ == "__main__":
    
    parser = argparse.ArgumentParser(description="Process an audio file and extract nouns from the transcript.")
    #parser.add_argument("--audio_file", required=True, help="The path to the audio file.")
    parser.add_argument("--video_file", required=True, help="The path to the video file.")
    #parser.add_argument("--custom_nouns", help="Optional custom nouns as comma-separated values to use instead of extracted ones.")
    parser.add_argument('--output_folder', type=str, help='Path to the folder where frames will be saved.')
    
    args = parser.parse_args()
    
    #main(args.audio_file, args.video_file, args.custom_nouns)
    main(args.video_file, args.output_folder)
