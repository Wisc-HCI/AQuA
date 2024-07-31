import json

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

    segment_number = 1
    for segment in segments:
        if segment['type'] == 'other':
            print(f"Segment {segment_number} (text not containing the words '{words}'): {segment['text']}")
        elif segment['type'] == 'with':
            print(f"Segment {segment_number} (containing the words '{words}'): {segment['text']}")
        segment_number += 1

    return segments

def segment_data_video(data, objects):
    segments = []
    last_end = 0
    current_group = "before_object"
    segment_counter = 1
    
    for obj_start, obj_end in objects:
        # before the object
        before_text = []
        while data and data[0]['end'] <= obj_start:
            before_text.append(data.pop(0))
        
        if before_text:
            segments.append({
                'text': ' '.join([item['text'] for item in before_text])
            })
        
        # with the object
        with_text = []
        while data and data[0]['start'] < obj_end:
            with_text.append(data.pop(0))
        
        if with_text:
            segments.append({
                'text': ' '.join([item['text'] for item in with_text])
            })
        
        current_group = "after_object" if current_group == "before_object" else "after_second_object"
    
    # after the last object
    if data:
        segments.append({
            'text': ' '.join([item['text'] for item in data])
        })
    
    for i, segment in enumerate(segments, 1):
        print(f"Segment {i}: {segment['text']}")
    
    return segments



def main(objects_json):
    print("Running AVscript")
    timestamped_transcript = None
    with open('recent_audio.json','r') as f:
        timestamped_transcript = json.load(f)
    
    if(timestamped_transcript!=None):
        data = trim_audio(timestamped_transcript)
        if check_sources(objects_json) == "audio":
            words = []
            for item in objects_json:
                words.append(item["object"])
            segments = segment_text_audio(data, words)
        elif check_sources(objects_json) == "video" or check_sources(objects_json) == "both":
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
    else:
        print("No audio transcript found")

if __name__ == "__main__":
    main()