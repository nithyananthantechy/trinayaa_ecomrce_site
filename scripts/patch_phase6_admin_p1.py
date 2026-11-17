with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Printer to lucide-react imports if not present
if "Printer," not in content and "Printer" not in content:
    content = content.replace("Eye,\n  SlidersHorizontal,", "Eye,\n  Printer,\n  SlidersHorizontal,", 1)

# 2. Add state for shipping slip and low stock threshold query
old_state_anchor = """  const [minCodValue, setMinCodValue] = useState("150");"""

new_state_anchor = """  const [minCodValue, setMinCodValue] = useState("150");

  // Phase 6: Low Stock Threshold and Shipping Slip States
  const [shippingSlipOrderNumber, setShippingSlipOrderNumber] = useState<string | null>(null);
  const [productStockFilter, setProductStockFilter] = useState<"all" | "low_stock" | "out_of_stock" | "in_stock">("all");
  const { data: lowStockThresholdData, refetch: refetchLowStockThreshold } = trpc.admin.settings.getLowStockThreshold.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });
  const currentThreshold = lowStockThresholdData?.threshold ?? 10;
  const [thresholdInputVal, setThresholdInputVal] = useState("10");

  useEffect(() => {
    if (lowStockThresholdData?.threshold !== undefined) {
      setThresholdInputVal(String(lowStockThresholdData.threshold));
    }
  }, [lowStockThresholdData]);

  const setLowStockThresholdMutation = trpc.admin.settings.setLowStockThreshold.useMutation({
    onSuccess: (res) => {
      toast.success(`Low-stock alert threshold updated to ${res.threshold} units`);
      refetchLowStockThreshold();
      refetchProducts();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update low-stock threshold");
    },
  });"""

assert old_state_anchor in content, "Could not find old_state_anchor"
content = content.replace(old_state_anchor, new_state_anchor, 1)

# 3. Update filteredProducts logic to filter by stock
old_pagination = """  // Filtered products for pagination
  const pageSize = 15;
  const paginatedProducts = products.slice(productPage * pageSize, (productPage + 1) * pageSize);
  const totalPages = Math.ceil(products.length / pageSize) || 1;"""

new_pagination = """  // Filtered products for pagination (Phase 6: stock level filter support)
  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      if (productStockFilter === "low_stock") {
        return p.stock > 0 && p.stock <= currentThreshold;
      }
      if (productStockFilter === "out_of_stock") {
        return p.stock <= 0;
      }
      if (productStockFilter === "in_stock") {
        return p.stock > currentThreshold;
      }
      return true;
    });
  }, [products, productStockFilter, currentThreshold]);

  const pageSize = 15;
  const paginatedProducts = filteredProducts.slice(productPage * pageSize, (productPage + 1) * pageSize);
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;"""

assert old_pagination in content, "Could not find old_pagination"
content = content.replace(old_pagination, new_pagination, 1)

# 4. In Products toolbar, add stock level filter dropdown
old_category_select = """                  <select
                    value={productCategory}
                    onChange={(e) => {
                      setProductCategory(e.target.value);
                      setProductPage(0);
                    }}
                    className="text-xs py-2 px-3 bg-[#FBF8F0] border border-[#DEDFD5] rounded-md focus:outline-none focus:border-[#123D28]"
                  >
                    <option value="All">All Categories ({products.length})</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>"""

new_category_select = """                  <select
                    value={productCategory}
                    onChange={(e) => {
                      setProductCategory(e.target.value);
                      setProductPage(0);
                    }}
                    className="text-xs py-2 px-3 bg-[#FBF8F0] border border-[#DEDFD5] rounded-md focus:outline-none focus:border-[#123D28]"
                  >
                    <option value="All">All Categories ({products.length})</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={productStockFilter}
                    onChange={(e) => {
                      setProductStockFilter(e.target.value as any);
                      setProductPage(0);
                    }}
                    className="text-xs py-2 px-3 bg-[#FBF8F0] border border-[#DEDFD5] rounded-md focus:outline-none focus:border-[#123D28] font-medium"
                  >
                    <option value="all">All Stock Levels</option>
                    <option value="low_stock">⚠️ Low Stock (≤ {currentThreshold})</option>
                    <option value="out_of_stock">❌ Out of Stock (0)</option>
                    <option value="in_stock">✅ In Stock (&gt; {currentThreshold})</option>
                  </select>"""

assert old_category_select in content, "Could not find old_category_select"
content = content.replace(old_category_select, new_category_select, 1)

# 5. In Products table, display low-stock badge next to stock input
old_stock_input = """                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              defaultValue={p.stock}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val !== p.stock) {
                                  updateStockMutation.mutate({ id: p.id, stock: val });
                                }
                              }}
                              className={`w-16 px-1.5 py-1 text-xs border rounded font-bold ${
                                p.stock <= 0
                                  ? "border-red-400 bg-red-50 text-red-800"
                                  : p.stock < 10
                                  ? "border-amber-400 bg-amber-50 text-amber-800"
                                  : "border-[#DEDFD5] bg-white"
                              }`}
                            />
                          </td>"""

new_stock_input = """                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                defaultValue={p.stock}
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val) && val !== p.stock) {
                                    updateStockMutation.mutate({ id: p.id, stock: val });
                                  }
                                }}
                                className={`w-14 px-1.5 py-1 text-xs border rounded font-bold ${
                                  p.stock <= 0
                                    ? "border-red-400 bg-red-50 text-red-800"
                                    : p.stock <= currentThreshold
                                    ? "border-amber-400 bg-amber-50 text-amber-800"
                                    : "border-[#DEDFD5] bg-white"
                                }`}
                              />
                              {p.stock <= 0 ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 shrink-0">
                                  Out of Stock
                                </span>
                              ) : p.stock <= currentThreshold ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                                  ⚠️ Low
                                </span>
                              ) : (
                                <span className="px-1 py-0.5 rounded text-[10px] font-medium text-emerald-700 shrink-0">
                                  In Stock
                                </span>
                              )}
                            </div>
                          </td>"""

assert old_stock_input in content, "Could not find old_stock_input"
content = content.replace(old_stock_input, new_stock_input, 1)

# 6. In Orders table actions, add Print Slip button
old_order_actions = """                          <td className="py-3 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(o)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#123D28] hover:bg-[#1F5638] text-white rounded-lg text-xs font-semibold shadow-xs transition-all duration-150 hover:shadow-sm active:scale-95 cursor-pointer border border-[#0d2a1c]"
                              style={{ backgroundColor: "#123D28", color: "#ffffff", display: "inline-flex", alignItems: "center" }}
                            >
                              <Eye size={13} className="text-emerald-300" />
                              <span>View</span>
                            </button>
                          </td>"""

new_order_actions = """                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setShippingSlipOrderNumber(o.orderNumber)}
                                title="Print Dispatch / Shipping Slip"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FBF8F0] hover:bg-[#E8BF83]/30 text-[#123D28] border border-[#DEDFD5] rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                              >
                                <Printer size={13} className="text-[#AE6A2B]" />
                                <span>Slip</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(o)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#123D28] hover:bg-[#1F5638] text-white rounded-lg text-xs font-semibold shadow-xs transition-all duration-150 hover:shadow-sm active:scale-95 cursor-pointer border border-[#0d2a1c]"
                                style={{ backgroundColor: "#123D28", color: "#ffffff", display: "inline-flex", alignItems: "center" }}
                              >
                                <Eye size={13} className="text-emerald-300" />
                                <span>View</span>
                              </button>
                            </div>
                          </td>"""

assert old_order_actions in content, "Could not find old_order_actions"
content = content.replace(old_order_actions, new_order_actions, 1)

# 7. In SelectedOrder Modal, add Print Shipping Slip button
old_modal_header = """            <div className="flex items-center justify-between border-b border-[#DEDFD5] pb-3 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#AE6A2B]">Order Details</span>
                <h3 className="font-serif text-xl font-bold text-[#123D28]">{selectedOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-[#6C7167] hover:text-[#123D28]">
                <X size={20} />
              </button>
            </div>"""

new_modal_header = """            <div className="flex items-center justify-between border-b border-[#DEDFD5] pb-3 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#AE6A2B]">Order Details</span>
                <h3 className="font-serif text-xl font-bold text-[#123D28]">{selectedOrder.orderNumber}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShippingSlipOrderNumber(selectedOrder.orderNumber)}
                  className="px-2.5 py-1.5 bg-[#FBF8F0] hover:bg-[#DEDFD5]/40 text-[#123D28] border border-[#DEDFD5] rounded-md text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer size={13} className="text-[#AE6A2B]" /> Print Shipping Slip
                </button>
                <button onClick={() => setSelectedOrder(null)} className="text-[#6C7167] hover:text-[#123D28]">
                  <X size={20} />
                </button>
              </div>
            </div>"""

assert old_modal_header in content, "Could not find old_modal_header"
content = content.replace(old_modal_header, new_modal_header, 1)

# 8. In Settings tab, make Low-Stock Alert Trigger Threshold interactive
old_low_stock_ui = """                <div>
                  <label className="block font-semibold mb-1">Low-Stock Alert Trigger Threshold</label>
                  <input
                    type="number"
                    defaultValue={10}
                    disabled
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-gray-100 text-[#6C7167]"
                  />
                  <span className="text-[10px] text-[#6C7167]">Triggered whenever stock falls to 10 or below.</span>
                </div>"""

new_low_stock_ui = """                <div className="p-3 bg-[#FBF8F0] border border-[#DEDFD5] rounded space-y-2">
                  <label className="block font-semibold text-[#123D28]">Low-Stock Telegram Alert Threshold (Units)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={thresholdInputVal}
                      onChange={(e) => setThresholdInputVal(e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-white font-bold text-[#123D28]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseInt(thresholdInputVal, 10);
                        if (isNaN(val) || val < 0) {
                          toast.error("Please enter a valid non-negative integer for stock threshold.");
                          return;
                        }
                        setLowStockThresholdMutation.mutate({ threshold: val });
                      }}
                      disabled={setLowStockThresholdMutation.isPending}
                      className="dark-button text-xs py-2 px-4 shrink-0"
                    >
                      {setLowStockThresholdMutation.isPending ? "Saving..." : "Save Setting"}
                    </button>
                  </div>
                  <span className="text-[10px] text-[#6C7167] block">
                    Automated Telegram notification is sent to authorized administrators whenever a product's available stock drops to or below this count (Default: 10 units).
                  </span>
                </div>"""

assert old_low_stock_ui in content, "Could not find old_low_stock_ui"
content = content.replace(old_low_stock_ui, new_low_stock_ui, 1)

with open('client/src/pages/admin/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ client/src/pages/admin/AdminDashboard.tsx updated successfully part 1")
