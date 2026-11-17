import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
home_path = os.path.join(base_dir, "client", "src", "pages", "Home.tsx")
admin_path = os.path.join(base_dir, "client", "src", "pages", "admin", "AdminDashboard.tsx")

# 1. Patch Home.tsx
with open(home_path, "r", encoding="utf-8") as f:
    home_content = f.read()

# Add checkCodEligibility query in CheckoutModal
target_home_query = """  const saveAddressMutation = trpc.addresses.create.useMutation();

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);"""

replace_home_query = """  const saveAddressMutation = trpc.addresses.create.useMutation();

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Phase 5: Server-side COD Eligibility Check
  const { data: codEligibility } = trpc.orders.checkCodEligibility.useQuery(
    {
      items: cart.map((it) => ({
        productId: it.id,
        packSize: it.size,
        quantity: it.quantity,
      })),
      couponCode: appliedCoupon?.code,
    },
    { enabled: open && cart.length > 0 }
  );

  const isCodAvailableForCart = codEligibility?.isEligible ?? true;
  const codIneligibilityReason = codEligibility?.reason;

  useEffect(() => {
    if (!isCodAvailableForCart && payment === "cod") {
      setPayment("upi");
    }
  }, [isCodAvailableForCart, payment]);"""

if target_home_query in home_content and "checkCodEligibility" not in home_content:
    home_content = home_content.replace(target_home_query, replace_home_query, 1)
    print("✓ Added COD eligibility query and auto-switch in Home.tsx")

# Prevent COD submit if ineligible
target_submit_auth = """    if (!currentUser) {
      toast.error("Please login or create an account to complete your order");
      onRequireAuth();
      return;
    }"""

replace_submit_auth = """    if (!currentUser) {
      toast.error("Please login or create an account to complete your order");
      onRequireAuth();
      return;
    }

    if (payment === "cod" && !isCodAvailableForCart) {
      toast.error(codIneligibilityReason || "Cash on Delivery is unavailable for this cart.");
      return;
    }"""

if target_submit_auth in home_content and 'payment === "cod" && !isCodAvailableForCart' not in home_content:
    home_content = home_content.replace(target_submit_auth, replace_submit_auth, 1)
    print("✓ Added COD submit rejection in Home.tsx")

# Replace payment options render to handle disabled COD with reason
target_payment_options = """                  <div className="payment-options">
                    {[
                      ["upi", "UPI / QR", "Fast and familiar"],
                      ["card", "Card", "Visa, Mastercard & RuPay"],
                      ["cod", "Cash on delivery", "Available across India"],
                    ].map(([value, title, desc]) => (
                      <label className={`payment-option ${payment === value ? "is-selected" : ""}`} key={value}>
                        <input type="radio" name="payment" value={value} checked={payment === value} onChange={(e) => setPayment(e.target.value)} />
                        <span className="payment-icon">
                          {value === "upi" ? <Sparkles size={18} /> : value === "card" ? <CreditCard size={18} /> : <Package size={18} />}
                        </span>
                        <span><strong>{title}</strong><small>{desc}</small></span>
                        {payment === value && <CheckCircle2 size={18} className="payment-check" />}
                      </label>
                    ))}
                  </div>"""

replace_payment_options = """                  <div className="payment-options">
                    {[
                      { value: "upi", title: "UPI / QR", desc: "Fast and familiar", disabled: false },
                      { value: "card", title: "Card", desc: "Visa, Mastercard & RuPay", disabled: false },
                      {
                        value: "cod",
                        title: "Cash on delivery",
                        desc: isCodAvailableForCart
                          ? "Available across India"
                          : codIneligibilityReason || "Unavailable for this order",
                        disabled: !isCodAvailableForCart,
                      },
                    ].map((opt) => (
                      <label
                        className={`payment-option ${payment === opt.value ? "is-selected" : ""} ${
                          opt.disabled ? "opacity-60 cursor-not-allowed bg-slate-50/80" : ""
                        }`}
                        key={opt.value}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={opt.value}
                          disabled={opt.disabled}
                          checked={payment === opt.value}
                          onChange={(e) => {
                            if (!opt.disabled) setPayment(e.target.value);
                          }}
                        />
                        <span className="payment-icon">
                          {opt.value === "upi" ? <Sparkles size={18} /> : opt.value === "card" ? <CreditCard size={18} /> : <Package size={18} />}
                        </span>
                        <span>
                          <strong>{opt.title}</strong>
                          <small className={opt.disabled ? "text-amber-800 font-semibold" : ""}>{opt.desc}</small>
                        </span>
                        {payment === opt.value && <CheckCircle2 size={18} className="payment-check" />}
                      </label>
                    ))}
                  </div>"""

if target_payment_options in home_content:
    home_content = home_content.replace(target_payment_options, replace_payment_options, 1)
    print("✓ Updated payment options UI in Home.tsx with COD status and reasons")

with open(home_path, "w", encoding="utf-8") as f:
    f.write(home_content)

# 2. Patch AdminDashboard.tsx
with open(admin_path, "r", encoding="utf-8") as f:
    admin_content = f.read()

# Add mutations and state for COD controls
target_admin_mutations = "  const archiveProductMutation = trpc.admin.products.archive.useMutation({"
replace_admin_mutations = """  // Phase 5: Product COD and Store Settings Mutations
  const { data: storeSettings, refetch: refetchSettings } = trpc.admin.settings.getMinimumCod.useQuery(undefined, {
    enabled: Boolean(currentUser && activeTab === "settings"),
  });
  const [minCodValue, setMinCodValue] = useState("150");

  useEffect(() => {
    if (storeSettings?.minimumCodOrderValue !== undefined) {
      setMinCodValue(String(storeSettings.minimumCodOrderValue));
    }
  }, [storeSettings]);

  const setMinCodMutation = trpc.admin.settings.setMinimumCod.useMutation({
    onSuccess: (res) => {
      toast.success(`Minimum COD order value updated to ₹${res.minimumCodOrderValue}`);
      refetchSettings();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update minimum COD setting");
    },
  });

  const toggleCodMutation = trpc.admin.products.toggleCod.useMutation({
    onSuccess: (updated) => {
      toast.success(`COD for ${updated.nameEn} ${updated.isCodAvailable ? "enabled" : "disabled"}`);
      refetchProducts();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to toggle COD setting");
    },
  });

  const archiveProductMutation = trpc.admin.products.archive.useMutation({"""

if target_admin_mutations in admin_content and "toggleCodMutation" not in admin_content:
    admin_content = admin_content.replace(target_admin_mutations, replace_admin_mutations, 1)
    print("✓ Added toggleCodMutation and setMinCodMutation to AdminDashboard.tsx")

# Add COD header to products table
target_th = """                        <th className="py-3 px-3">Stock Level</th>
                        <th className="py-3 px-3">Status</th>"""
replace_th = """                        <th className="py-3 px-3">Stock Level</th>
                        <th className="py-3 px-3 text-center">COD</th>
                        <th className="py-3 px-3">Status</th>"""

if target_th in admin_content and '<th className="py-3 px-3 text-center">COD</th>' not in admin_content:
    admin_content = admin_content.replace(target_th, replace_th, 1)
    print("✓ Added COD column header to products table")

# Add COD toggle button to products table rows
target_td = """                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${"""

replace_td = """                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                toggleCodMutation.mutate({
                                  id: p.id,
                                  isCodAvailable: !p.isCodAvailable,
                                });
                              }}
                              disabled={toggleCodMutation.isPending}
                              title={p.isCodAvailable ? "Click to disable COD for this product" : "Click to enable COD for this product"}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                p.isCodAvailable
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              }`}
                            >
                              {p.isCodAvailable ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                              {p.isCodAvailable ? "COD ON" : "COD OFF"}
                            </button>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${"""

if target_td in admin_content and "toggleCodMutation.mutate" not in admin_content:
    admin_content = admin_content.replace(target_td, replace_td, 1)
    print("✓ Added COD toggle button in products table rows")

# Add isCodAvailable in Add/Edit Product Modal
target_modal_data = """                const data = {
                  sku: form.sku.value.trim(),
                  nameEn: form.nameEn.value.trim(),
                  nameTa: form.nameTa.value.trim(),
                  category: form.category.value,
                  sellingPrice,
                  mrp,
                  stock: parseInt(form.stock.value, 10),
                  status: form.status.value,
                  shortDesc: form.shortDesc.value.trim(),
                  primaryImage: form.primaryImage.value.trim(),
                };"""

replace_modal_data = """                const data = {
                  sku: form.sku.value.trim(),
                  nameEn: form.nameEn.value.trim(),
                  nameTa: form.nameTa.value.trim(),
                  category: form.category.value,
                  sellingPrice,
                  mrp,
                  stock: parseInt(form.stock.value, 10),
                  status: form.status.value,
                  isCodAvailable: form.isCodAvailable.checked,
                  shortDesc: form.shortDesc.value.trim(),
                  primaryImage: form.primaryImage.value.trim(),
                };"""

if target_modal_data in admin_content:
    admin_content = admin_content.replace(target_modal_data, replace_modal_data, 1)
    print("✓ Added isCodAvailable to Add/Edit product submit data")

target_modal_inputs = """              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  name="shortDesc"
                  rows={2}
                  defaultValue={editingProduct?.description || ""}
                  className="w-full px-2.5 py-1.5 border rounded bg-[#FBF8F0]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">"""

replace_modal_inputs = """              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  name="shortDesc"
                  rows={2}
                  defaultValue={editingProduct?.description || ""}
                  className="w-full px-2.5 py-1.5 border rounded bg-[#FBF8F0]"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-[#FBF8F0] border border-[#DEDFD5] rounded">
                <input
                  type="checkbox"
                  id="isCodAvailable"
                  name="isCodAvailable"
                  defaultChecked={editingProduct ? Boolean(editingProduct.isCodAvailable) : true}
                  className="rounded accent-[#123D28] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isCodAvailable" className="font-semibold text-[#123D28] cursor-pointer">
                  Cash on Delivery (COD) Available
                </label>
                <span className="text-[10px] text-[#6C7167] ml-auto">
                  Uncheck to restrict this item to online payment only.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">"""

if target_modal_inputs in admin_content and 'id="isCodAvailable"' not in admin_content:
    admin_content = admin_content.replace(target_modal_inputs, replace_modal_inputs, 1)
    print("✓ Added COD toggle in Product Add/Edit Modal")

# Add Minimum COD setting in Store Configuration
target_settings = """                <div>
                  <label className="block font-semibold mb-1">Free Delivery Threshold (₹)</label>
                  <input
                    type="number"
                    defaultValue={799}
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                  />
                </div>"""

replace_settings = """                <div>
                  <label className="block font-semibold mb-1">Free Delivery Threshold (₹)</label>
                  <input
                    type="number"
                    defaultValue={799}
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                  />
                </div>

                <div className="p-3 bg-[#FBF8F0] border border-[#DEDFD5] rounded space-y-2">
                  <label className="block font-semibold text-[#123D28]">Minimum Cash on Delivery (COD) Order Value (₹)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={minCodValue}
                      onChange={(e) => setMinCodValue(e.target.value)}
                      placeholder="150"
                      className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-white font-bold text-[#123D28]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseFloat(minCodValue);
                        if (isNaN(val) || val < 0) {
                          toast.error("Please enter a valid non-negative number.");
                          return;
                        }
                        setMinCodMutation.mutate({ minimumCodOrderValue: val });
                      }}
                      disabled={setMinCodMutation.isPending}
                      className="dark-button text-xs py-2 px-4 shrink-0"
                    >
                      {setMinCodMutation.isPending ? "Saving..." : "Save Setting"}
                    </button>
                  </div>
                  <span className="text-[10px] text-[#6C7167] block">
                    Orders with merchandise value below this threshold will not be eligible for Cash on Delivery. (Default: ₹150).
                  </span>
                </div>"""

if target_settings in admin_content and "Minimum Cash on Delivery (COD) Order Value" not in admin_content:
    admin_content = admin_content.replace(target_settings, replace_settings, 1)
    print("✓ Added Minimum COD Order Value setting to Settings tab in AdminDashboard.tsx")

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(admin_content)

print("Frontend files patched successfully.")
