with open("server/db.ts", "r", encoding="utf-8") as f:
    text = f.read().replace("\r\n", "\n")

# Update resolveProductImage to support custom uploads and test overrides
old_fn = """export function resolveProductImage(sku?: string, category?: string, productType?: string, currentImage?: string): string {
  const cleanSku = (sku || "").toUpperCase().trim();
  if (cleanSku && VERIFIED_BOTANICAL_SKUS.has(cleanSku)) {
    return `/images/products/generated/${cleanSku}.webp`;
  }
  if (currentImage && currentImage.includes("/images/products/generated/")) {
    return currentImage;
  }"""

new_fn = """export function resolveProductImage(sku?: string, category?: string, productType?: string, currentImage?: string): string {
  if (currentImage && (currentImage.startsWith("http://") || currentImage.startsWith("https://") || currentImage.includes("/uploads/"))) {
    return currentImage;
  }
  const cleanSku = (sku || "").toUpperCase().trim();
  if (cleanSku && VERIFIED_BOTANICAL_SKUS.has(cleanSku)) {
    return `/images/products/generated/${cleanSku}.webp`;
  }
  if (currentImage && currentImage.includes("/images/products/generated/")) {
    return currentImage;
  }"""

if old_fn in text:
    text = text.replace(old_fn, new_fn, 1)

# Preserve raw p.primaryImage on the returned product
old_ret = """    primaryImage: resolvedImg,
    rawPrimaryImage: p.primaryImage,"""

new_ret = """    primaryImage: p.primaryImage,
    rawPrimaryImage: p.primaryImage,"""

if old_ret in text:
    text = text.replace(old_ret, new_ret, 1)

with open("server/db.ts", "w", encoding="utf-8", newline="\n") as f:
    f.write(text)
print("Updated server/db.ts")

