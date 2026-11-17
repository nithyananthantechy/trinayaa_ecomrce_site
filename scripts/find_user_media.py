import json

path = r'C:\Users\Nithyananthan\.gemini\antigravity\brain\34975747-e24c-4255-9bf1-e062de239868\.system_generated\logs\transcript.jsonl'
with open(path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
        except Exception:
            continue
        if obj.get('type') == 'USER_INPUT' and obj.get('media'):
            print(f"Step {obj.get('step_index')}: {len(obj['media'])} media items")
            for m in obj['media']:
                print("  ", m.get('uri'))
            print("  Snippet:", str(obj.get('content', ''))[:100].replace('\n', ' '))
