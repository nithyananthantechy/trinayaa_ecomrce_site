with open('client/src/lib/productImage.ts', 'r', encoding='utf-8') as f:
    text = f.read()
import re
skus = re.findall(r'"(TRN-\d{4})"', text)
print(f"Total SKUs in VERIFIED_BOTANICAL_SKUS: {len(skus)}")
print("Min SKU:", min(skus), "Max SKU:", max(skus))
expected = {f"TRN-{i}" for i in range(1001, 1163)}
actual = set(skus)
diff = expected - actual
print("Missing SKUs:", diff if diff else "None! Exactly 1001 to 1162 (162 total)")

