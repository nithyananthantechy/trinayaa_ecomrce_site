with open('server/db.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = """  return {
    ...p,
    id: p.id,
    name: p.nameEn,
    nameTa: p.nameTa,
    category: p.categoryName || botanicalCategory,
    botanicalCategory,
    categoryName: p.categoryName || botanicalCategory,
    productType: p.productType || "Herb",
    price: p.sellingPrice,
    compareAt: p.mrp > p.sellingPrice ? p.mrp : undefined,
    discountPercent,
    image: p.primaryImage || "/images/products/packaged/pouch_001.png",
    description: p.shortDesc || p.fullDesc || "",
    featured: Boolean(p.featured),
    sizes,
    gallery: gallery.length > 0 ? gallery : [p.primaryImage || "/images/products/packaged/pouch_001.png"],
  };"""

replacement = """  const resolvedImg = resolveProductImage(p.sku, p.categoryName || botanicalCategory, p.productType, p.primaryImage);

  return {
    ...p,
    id: p.id,
    name: p.nameEn,
    nameTa: p.nameTa,
    category: p.categoryName || botanicalCategory,
    botanicalCategory,
    categoryName: p.categoryName || botanicalCategory,
    productType: p.productType || "Herb",
    price: p.sellingPrice,
    compareAt: p.mrp > p.sellingPrice ? p.mrp : undefined,
    discountPercent,
    image: resolvedImg,
    primaryImage: resolvedImg,
    rawPrimaryImage: p.primaryImage,
    description: p.shortDesc || p.fullDesc || "",
    featured: Boolean(p.featured),
    sizes,
    gallery: gallery.length > 0 ? gallery : [resolvedImg],
  };"""

norm_content = content.replace('\r\n', '\n')
norm_target = target.replace('\r\n', '\n')
norm_replacement = replacement.replace('\r\n', '\n')

if norm_target in norm_content:
    norm_content = norm_content.replace(norm_target, norm_replacement, 1)
    with open('server/db.ts', 'w', encoding='utf-8', newline='\n') as f:
        f.write(norm_content)
    print("SUCCESS: server/db.ts updated!")
else:
    print("ERROR: Target block not found in server/db.ts")

