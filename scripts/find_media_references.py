import json
import os

path = r'C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.system_generated\logs\transcript.jsonl'
if not os.path.exists(path):
    print("Transcript not found at", path)
    exit(0)

with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
        except Exception:
            continue
        content = str(obj.get('content', ''))
        media = obj.get('media', [])
        low = content.lower()
        if any(w in low for w in ['erode', 'map', 'footer', 'packaging', 'district']):
            print(f"Step {obj.get('step_index')}, Type: {obj.get('type')}, Media count: {len(media)}")
            if media:
                print("  Media:", media)
            print("  Snippet:", content[:200].replace('\n', ' '))
