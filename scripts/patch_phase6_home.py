with open('client/src/pages/Home.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update stock badge in ProductDetailModal
old_badge = """            <span className="ml-2 font-medium text-xs text-[#2E7D32]">
              • {product.stockAvailability || (product.stock && product.stock > 0 ? "In Stock" : "In Stock")}
            </span>"""

new_badge = """            <span
              className={`ml-2 font-medium text-xs ${
                product.stockAvailability === "Out of Stock"
                  ? "text-rose-600 font-bold"
                  : product.stockAvailability === "Limited availability"
                  ? "text-amber-700 font-semibold"
                  : "text-[#2E7D32]"
              }`}
            >
              • {product.stockAvailability || (product.stock && product.stock > 0 ? "In Stock" : "In Stock")}
            </span>"""

assert old_badge in content, "Could not find old_badge in Home.tsx"
content = content.replace(old_badge, new_badge, 1)

# 2. Update Add to cart button when Out of Stock
old_add_btn = """            <button
              className="dark-button add-detail-button"
              onClick={() => {
                onAdd(product, currentSizeObj.label, currentSizeObj.price, quantity);
                onClose();
              }}
            >
              Add to cart <ShoppingBag size={17} />
            </button>"""

new_add_btn = """            <button
              className="dark-button add-detail-button"
              disabled={product.stockAvailability === "Out of Stock"}
              style={product.stockAvailability === "Out of Stock" ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              onClick={() => {
                if (product.stockAvailability === "Out of Stock") return;
                onAdd(product, currentSizeObj.label, currentSizeObj.price, quantity);
                onClose();
              }}
            >
              {product.stockAvailability === "Out of Stock" ? "Out of stock" : "Add to cart"} <ShoppingBag size={17} />
            </button>"""

assert old_add_btn in content, "Could not find old_add_btn in Home.tsx"
content = content.replace(old_add_btn, new_add_btn, 1)

with open('client/src/pages/Home.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ client/src/pages/Home.tsx updated with stock visibility styling & out-of-stock guard")
