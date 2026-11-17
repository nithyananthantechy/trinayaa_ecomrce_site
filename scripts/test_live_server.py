import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = 'http://localhost:3000/api/trpc/products.list?batch=1&input=%7B%220%22%3A%7B%22limit%22%3A35%7D%7D'

try:
    with urllib.request.urlopen(url) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        items = data[0]['result']['data']
        print(f"SUCCESS: Server is live! Fetched {len(items)} products.")
        print("\n--- SAMPLE RESOLVED PRODUCT IMAGES ---")
        for it in items[:15]:
            sku = it.get('sku')
            name = it.get('name')
            img = it.get('image')
            print(f"  [{sku}] {name[:24]:<24} -> {img}")
except Exception as e:
    print(f"Server check error: {e}")

