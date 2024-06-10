import spacy
import subprocess
import os
import argparse

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

def run_detic(video_file, words):

    custom_vocabulary = ','.join(words)

    detic_demo_command = (
        f"python demo.py --config-file configs/Detic_LCOCOI21k_CLIP_SwinB_896b32_4x_ft4x_max-size.yaml "
        f"--video-input ../{video_file} --output output_video.mp4 --vocabulary custom "
        f"--custom_vocabulary {custom_vocabulary} --confidence-threshold 0.3 "
        f"--opts MODEL.WEIGHTS models/Detic_LCOCOI21k_CLIP_SwinB_896b32_4x_ft4x_max-size.pth"
    )

    subprocess.run(detic_demo_command, shell=True, cwd='Detic')

def main(audio_file, video_file):

    generate_transcript(audio_file=audio_file)

    audio_filename = os.path.basename(audio_file)
    transcript_file = os.path.splitext(audio_filename)[0] + '.txt'

    nouns = extract_nouns(transcript_file=transcript_file)

    print("Extracted Nouns", nouns)

    run_detic(video_file=video_file, words=nouns)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Process an audio file and extract nouns from the transcript.")
    parser.add_argument("--audio_file", required=True, help="The path to the audio file.")
    parser.add_argument("--video_file", required=True, help="The path to the video file.")
    
    args = parser.parse_args()
    
    main(args.audio_file, args.video_file)
