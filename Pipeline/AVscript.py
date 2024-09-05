import json
import sys
import requests
import os

def trim_audio(json_transcript):
    extracted_segments = [
        {
            "start": segment["start"],
            "end": segment["end"],
            "text": segment["text"].strip()
        }
        for segment in json_transcript["segments"]
    ]
    return extracted_segments

def check_sources(objects_json):
    sources = set()
    for item in objects_json:
        sources.add(item["source"])
        
    if len(sources) == 1:
        return sources.pop()
    else:
        return "both"

def find_intersections(object_json):
    if not object_json:
        return "No intersections"

    # Convert times to tuples for easier processing
    def convert_times(times):
        return [(t['start'], t['end']) for t in times]

    # Start with the first object's intervals
    intersections = convert_times(object_json[0]['times'])

    for i in range(1, len(object_json)):
        current_intersections = []
        current_times = convert_times(object_json[i]['times'])
        for interval1 in intersections:
            for interval2 in current_times:
                start = max(interval1[0], interval2[0])
                end = min(interval1[1], interval2[1])
                if start < end:
                    current_intersections.append((start, end))
        intersections = current_intersections
        # If no intersections remain, break early
        if not intersections:
            return "No intersections"

    return intersections if intersections else "No intersections"
    

def segment_text_audio(data, words):
    segments = []
    temp_segment = ""
    multiple_words = len(words) > 1
    word_list = words

    for item in data:
        text = item['text'].strip()
        if multiple_words:
            if all(word in text for word in word_list):
                if temp_segment:
                    segments.append({'type': 'other', 'text': temp_segment.strip()})
                    temp_segment = ""
                if segments and segments[-1]['type'] == 'with':
                    segments[-1]['text'] += " " + text
                else:
                    segments.append({'type': 'with', 'text': text})
            else:
                temp_segment += " " + text
        else:
            if word_list[0] in text:
                if temp_segment:
                    segments.append({'type': 'other', 'text': temp_segment.strip()})
                    temp_segment = ""
                if segments and segments[-1]['type'] == 'with':
                    segments[-1]['text'] += " " + text
                else:
                    segments.append({'type': 'with', 'text': text})
            else:
                temp_segment += " " + text

    if temp_segment:
        segments.append({'type': 'other', 'text': temp_segment.strip()})

    return segments

def segment_data_video(data, objects):
    segments = []
    
    for obj_start, obj_end in objects:
        # Other (before the object)
        other_text = []
        while data and data[0]['end'] <= obj_start:
            other_text.append(data.pop(0))
        
        if other_text:
            segments.append({
                'type': 'other',
                'text': ' '.join([item['text'] for item in other_text])
            })
        
        # With the object
        with_text = []
        while data and data[0]['start'] < obj_end:
            with_text.append(data.pop(0))
        
        if with_text:
            segments.append({
                'type': 'with',
                'text': ' '.join([item['text'] for item in with_text])
            })
    
    # Other (after the last object)
    if data:
        segments.append({
            'type': 'other',
            'text': ' '.join([item['text'] for item in data])
        })
    
    for i, segment in enumerate(segments, 1):
        print(f"Segment {i}: {segment['text']}")
    
    return segments




def main():
    if len(sys.argv) != 2:
        print("Usage: python AVscript.py <objects_json>")
        sys.exit(1)
    
    try:
        objects_json = json.loads(sys.argv[1])
        objects_json = objects_json['selectedObjects']
    except json.JSONDecodeError:
        print("Invalid JSON")
        sys.exit(1)

    print("Objects JSON:", objects_json)

    print("Running AVscript")
    timestamped_transcript = None

    print(os.getcwd())

    try:
        with open('../../Pipeline/recent_audio.json', 'r') as f:
            timestamped_transcript = json.load(f)
    except FileNotFoundError:
        print("recent_audio.json file not found. Please ensure the file is in the correct directory.")
        # handle the case when the file is not found


    # with open('recent_audio.json','r') as f:
    #     timestamped_transcript = json.load(f)
    
    if(timestamped_transcript!=None):
        data = trim_audio(timestamped_transcript)
        if check_sources(objects_json) == "audio":
            words = []
            for item in objects_json:
                words.append(item["object"])
            print("Hello")
            segments = segment_text_audio(data, words)
        elif check_sources(objects_json) == "video" or check_sources(objects_json) == "both":
            print("Bye")
            if len(objects_json) == 1:
                times = objects_json[0].get('times', [])
                tuples = [(time['start'], time['end']) for time in times]
                objects = tuples
                segments = segment_data_video(data, objects)
            else:
                objects= find_intersections(objects_json)
                if objects == "No intersections":
                    print("No intersections found")
                else:
                    segments = segment_data_video(data, objects)
        
        print("segments:", segments)
        
        if segments:  
            try:
                response = requests.put('http://localhost:5000/upload-AV', json=segments)
                if response.status_code == 200:
                    print("Segments uploaded successfully")
                else:
                    print(f"Failed to upload segments: {response.status_code} - {response.text}")
            except Exception as e:
                print(f"Failed to make PUT request: {e}")

    else:
        print("No audio transcript found")

if __name__ == "__main__":
    main()

