import json

path = r'C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.system_generated\logs\transcript.jsonl'
targets = [
    "media_1793704002816_9d57003b.jpg",
    "media_1793720840675_647e560f.png",
    "media_1793782755385_252498bd.jpg",
    "media_1793782797186_c536d33c.jpg",
    "media_1793786328860_7a6fd660.jpg",
    "media_1793793584160_bb515413.jpg"
]

with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
        except Exception:
            continue
        if obj.get('type') == 'USER_INPUT' and obj.get('media'):
            for m in obj['media']:
                uri = m.get('uri', '')
                for t in targets:
                    if t in uri:
                        print(f"File {t} at step {obj.get('step_index')}:")
                        print("  Prompt:", str(obj.get('content'))[:250].replace('\n', ' '))
