import json

path = r'C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.system_generated\logs\transcript.jsonl'
targets = [
    "media_1793727249287_7103aab3.jpg",
    "media_1793727259382_31ba3a94.jpg",
    "media_1793727327691_abd14953.jpg",
    "media_1793727337712_4add50c2.jpg",
    "media_1793729527469_97500b25.jpg",
    "media_1793729614815_75c6b4c4.jpg",
    "media_1793767599928_5ba5201f.jpg",
    "media_1793780449320_bf208ecd.jpg",
    "media_1793782731452_f450f6b3.jpg",
    "media_1793783732751_8b1a2bf2.jpg",
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
                        print(f"File {t} attached to prompt (step {obj.get('step_index')}):")
                        print("  Prompt:", str(obj.get('content'))[:150].replace('\n', ' '))
