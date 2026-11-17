import os

client_dir = 'client/public/images/products/generated'
public_dir = 'public/images/products/generated'

missing_client = [f"TRN-{i}.webp" for i in range(1001, 1163) if not os.path.exists(os.path.join(client_dir, f"TRN-{i}.webp"))]
missing_public = [f"TRN-{i}.webp" for i in range(1001, 1163) if not os.path.exists(os.path.join(public_dir, f"TRN-{i}.webp"))]

print("Missing client webps:", len(missing_client))
print("Missing public webps:", len(missing_public))

