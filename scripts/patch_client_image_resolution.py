import os

def patch_catalog():
    path = "client/src/pages/Catalog.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read().replace("\r\n", "\n")
    
    # 1. Add import
    import_stmt = 'import { resolveProductImage, getCategoryPlaceholder } from "../lib/productImage";\n'
    if import_stmt not in content:
        content = import_stmt + content
    
    # 2. Replace img src and onError in Catalog.tsx
    target_img = '''<img
                    src={p.image || p.primaryImage || "/images/products/packaged/pouch_001.png"}
                    alt={p.nameEn}
                    loading="lazy"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={(e: any) => {
                      e.target.src = "/images/products/packaged/pouch_001.png";
                    }}
                  />'''
    
    replacement_img = '''<img
                    src={resolveProductImage(p.sku, p.category, p.productType, p.image || p.primaryImage)}
                    alt={p.nameEn}
                    loading="lazy"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={(e: any) => {
                      e.target.src = getCategoryPlaceholder(p.category, p.productType);
                    }}
                  />'''
    
    if target_img in content:
        content = content.replace(target_img, replacement_img)
        print("Patched Catalog.tsx successfully!")
    else:
        print("Target img not found in Catalog.tsx (might already be patched)")
        
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)

def patch_product_detail():
    path = "client/src/pages/ProductDetail.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read().replace("\r\n", "\n")
        
    import_stmt = 'import { resolveProductImage, getCategoryPlaceholder } from "../lib/productImage";\n'
    if import_stmt not in content:
        content = import_stmt + content
        
    # Main image
    target_main = '''<img
                src={product.image || product.primaryImage || "/images/products/packaged/pouch_001.png"}
                alt={product.nameEn}
                className="w-full h-full object-contain max-h-[460px] drop-shadow-md hover:scale-105 transition-transform duration-300"
                onError={(e: any) => {
                  e.target.src = "/images/products/packaged/pouch_001.png";
                }}
              />'''
              
    repl_main = '''<img
                src={resolveProductImage(product.sku, product.category, product.productType, product.image || product.primaryImage)}
                alt={product.nameEn}
                className="w-full h-full object-contain max-h-[460px] drop-shadow-md hover:scale-105 transition-transform duration-300"
                onError={(e: any) => {
                  e.target.src = getCategoryPlaceholder(product.category, product.productType);
                }}
              />'''
              
    if target_main in content:
        content = content.replace(target_main, repl_main)
        print("Patched ProductDetail.tsx main image successfully!")
    else:
        print("Target main img not found in ProductDetail.tsx")
        
    # Related image
    target_rel = '''<img
                      src={rel.image || rel.primaryImage || "/images/products/packaged/pouch_001.png"}
                      alt={rel.nameEn}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      onError={(e: any) => {
                        e.target.src = "/images/products/packaged/pouch_001.png";
                      }}
                    />'''
                    
    repl_rel = '''<img
                      src={resolveProductImage(rel.sku, rel.category, rel.productType, rel.image || rel.primaryImage)}
                      alt={rel.nameEn}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      onError={(e: any) => {
                        e.target.src = getCategoryPlaceholder(rel.category, rel.productType);
                      }}
                    />'''
                    
    if target_rel in content:
        content = content.replace(target_rel, repl_rel)
        print("Patched ProductDetail.tsx related image successfully!")
    else:
        print("Target rel img not found in ProductDetail.tsx")
        
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)

def patch_home():
    path = "client/src/pages/Home.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read().replace("\r\n", "\n")
        
    import_stmt = 'import { resolveProductImage, getCategoryPlaceholder } from "../lib/productImage";\n'
    if import_stmt not in content:
        content = import_stmt + content
        
    target_map = '''image: p.image || "/images/products/packaged/pouch_001.png",'''
    repl_map = '''image: resolveProductImage(p.sku, p.category, p.productType, p.image || p.primaryImage),'''
    
    if target_map in content:
        content = content.replace(target_map, repl_map, 1)
        print("Patched Home.tsx dbProducts map successfully!")
    else:
        print("Target dbProducts map not found in Home.tsx")
        
    # Replace onError on product card
    target_card_err = '''onError={(e: any) => {
            e.target.src = "/images/products/packaged/pouch_001.png";
          }}'''
    repl_card_err = '''onError={(e: any) => {
            e.target.src = getCategoryPlaceholder(product.category);
          }}'''
    if target_card_err in content:
        content = content.replace(target_card_err, repl_card_err, 1)
        print("Patched Home.tsx product card onError successfully!")
    else:
        print("Target card onError not found in Home.tsx")

    # Replace modal onError
    target_modal_err = '''<img
            src={product.image}
            alt={product.name}
            onError={(e: any) => { e.target.src = "/images/products/packaged/pouch_001.png"; }}
          />'''
    repl_modal_err = '''<img
            src={product.image}
            alt={product.name}
            onError={(e: any) => { e.target.src = getCategoryPlaceholder(product.category); }}
          />'''
    if target_modal_err in content:
        content = content.replace(target_modal_err, repl_modal_err, 1)
        print("Patched Home.tsx modal onError successfully!")
    else:
        print("Target modal onError not found in Home.tsx")
        
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)

patch_catalog()
patch_product_detail()
patch_home()

