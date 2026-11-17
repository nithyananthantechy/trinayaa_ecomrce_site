with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Render modal before </div>\n  );\n}
old_end = """        </div>
      )}
    </div>
  );
}"""

new_end = """        </div>
      )}

      {/* Printable Shipping Slip Modal (Phase 6) */}
      {shippingSlipOrderNumber && (
        <ShippingSlipModal
          orderNumber={shippingSlipOrderNumber}
          onClose={() => setShippingSlipOrderNumber(null)}
        />
      )}
    </div>
  );
}"""

assert old_end in content, "Could not find old_end"
content = content.replace(old_end, new_end, 1)

# 2. Append ShippingSlipModal definition
shipping_slip_modal_code = """
// ==========================================
// PRINTABLE SHIPPING SLIP MODAL (PHASE 6)
// ==========================================
function ShippingSlipModal({
  orderNumber,
  onClose,
}: {
  orderNumber: string;
  onClose: () => void;
}) {
  const { data: slip, isLoading, error } = trpc.admin.orders.getShippingSlip.useQuery({ orderNumber });

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-shipping-slip, #printable-shipping-slip * {
            visibility: visible !important;
          }
          #printable-shipping-slip {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 28px !important;
            background: white !important;
            color: black !important;
            font-size: 11px !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-300">
          {/* Modal Header Actions */}
          <div className="p-4 bg-[#FBF8F0] border-b border-[#DEDFD5] flex items-center justify-between no-print">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#AE6A2B] bg-[#E8BF83]/20 px-2 py-0.5 rounded">
                Dispatch Slip
              </span>
              <span className="text-sm font-serif font-bold text-[#123D28]">Order {orderNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={isLoading || !slip}
                className="dark-button text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
              >
                <Printer size={14} /> Print Shipping Slip
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Body */}
          <div className="p-6 overflow-y-auto flex-1 bg-white">
            {isLoading ? (
              <div className="py-16 text-center text-xs text-gray-500 font-medium">Loading shipping slip details...</div>
            ) : error || !slip ? (
              <div className="py-16 text-center text-xs text-rose-600 font-semibold">
                Failed to load shipping slip: {error?.message || "Order not found"}
              </div>
            ) : (
              <div id="printable-shipping-slip" className="max-w-[700px] mx-auto text-black font-sans leading-relaxed text-xs">
                {/* Header with Brand & Logo */}
                <div className="border-b-2 border-black pb-4 mb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="w-9 h-9 rounded-lg border border-black p-1 flex items-center justify-center">
                        <img src="/images/brand/emblem_crisp.png" alt="TRINAYAA" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h1 className="text-xl font-bold font-serif tracking-wider text-black leading-tight">
                          TRINAYAA ENTERPRISES
                        </h1>
                        <p className="text-[10px] text-gray-700 uppercase tracking-wider font-semibold">
                          100% Pure Botanical Powders, Seeds & Herbal Wellness
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">
                      Registered Dispatch Unit: Main Road, Erode, Tamil Nadu — 638001 | trinayaa.in | +91 98432 00111
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="inline-block border border-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1 bg-gray-50">
                      SHIPPING SLIP & INVOICE
                    </div>
                    <div className="font-mono text-sm font-bold text-black">{slip.orderNumber}</div>
                    <div className="text-[10px] text-gray-700">Date: {slip.orderDate}</div>
                  </div>
                </div>

                {/* 2-Column Delivery & Order Details */}
                <div className="grid grid-cols-2 gap-4 mb-4 border border-black p-3 bg-white">
                  <div>
                    <h3 className="font-bold uppercase tracking-wider text-[10px] text-gray-700 border-b border-gray-300 pb-1 mb-1.5">
                      CONSIGNEE / DELIVERY ADDRESS
                    </h3>
                    <div className="text-sm font-bold text-black">{slip.customerName}</div>
                    <div className="text-[11px] font-semibold text-gray-800">Phone: {slip.customerPhone}</div>
                    {slip.customerEmail && <div className="text-[10px] text-gray-600">Email: {slip.customerEmail}</div>}
                    <div className="mt-1 text-[11px] text-gray-900 whitespace-pre-line leading-snug">
                      {slip.formattedAddress}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold uppercase tracking-wider text-[10px] text-gray-700 border-b border-gray-300 pb-1 mb-1.5">
                      DISPATCH & PAYMENT DETAILS
                    </h3>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                      <span className="text-gray-600">Payment Method:</span>
                      <strong className="text-black">{slip.paymentMethod}</strong>
                      <span className="text-gray-600">Payment Status:</span>
                      <strong className="text-black uppercase">{slip.paymentStatus}</strong>
                      <span className="text-gray-600">Fulfilment Status:</span>
                      <strong className="text-black">{slip.orderStatus}</strong>
                      <span className="text-gray-600">Carrier Partner:</span>
                      <strong className="text-black">{slip.carrier || "Standard Dispatch"}</strong>
                      <span className="text-gray-600">AWB / Tracking #:</span>
                      <strong className="text-black font-mono">{slip.trackingNumber || "Pending"}</strong>
                    </div>
                  </div>
                </div>

                {/* Ordered Items Table */}
                <table className="w-full text-left border-collapse border border-black mb-4">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-[10px] font-bold uppercase">
                      <th className="p-2 border-r border-black w-8 text-center">#</th>
                      <th className="p-2 border-r border-black w-24">SKU</th>
                      <th className="p-2 border-r border-black">Botanical Description</th>
                      <th className="p-2 border-r border-black text-center w-16">Pack</th>
                      <th className="p-2 border-r border-black text-center w-12">Qty</th>
                      <th className="p-2 border-r border-black text-right w-16">Price</th>
                      <th className="p-2 text-right w-20">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300 text-[11px]">
                    {slip.items.map((it: any, idx: number) => (
                      <tr key={it.id || idx}>
                        <td className="p-2 border-r border-black text-center text-gray-600">{idx + 1}</td>
                        <td className="p-2 border-r border-black font-mono font-bold text-[10px]">{it.sku}</td>
                        <td className="p-2 border-r border-black font-semibold text-black">
                          {it.productNameEn}
                          {it.productNameTa && (
                            <span className="block text-[10px] font-normal text-gray-700">{it.productNameTa}</span>
                          )}
                        </td>
                        <td className="p-2 border-r border-black text-center">{it.packSize}</td>
                        <td className="p-2 border-r border-black text-center font-bold">{it.quantity}</td>
                        <td className="p-2 border-r border-black text-right">₹{it.price}</td>
                        <td className="p-2 text-right font-bold">₹{it.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Financial Summary */}
                <div className="flex justify-end mb-4">
                  <div className="w-64 border border-black p-2 bg-gray-50 space-y-1 text-[11px]">
                    <div className="flex justify-between text-gray-700">
                      <span>Merchandise Subtotal:</span>
                      <span>₹{slip.subtotal}</span>
                    </div>
                    {slip.discountAmount > 0 && (
                      <div className="flex justify-between text-rose-700">
                        <span>Promotional Discount:</span>
                        <span>-₹{slip.discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-700">
                      <span>Shipping Charges:</span>
                      <span>{slip.shippingFee === 0 ? "FREE" : `₹${slip.shippingFee}`}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-black pt-1 text-xs text-black">
                      <span>Total Payable Amount:</span>
                      <span>₹{slip.total}</span>
                    </div>
                  </div>
                </div>

                {/* Footer and Signatory */}
                <div className="border-t border-dashed border-gray-400 pt-3 text-[10px] text-gray-600 flex justify-between items-end">
                  <div>
                    <p className="font-semibold text-black">Sender & Return Address:</p>
                    <p>TRINAYAA Botanical Enterprises, Main Road, Erode, Tamil Nadu 638001</p>
                    <p className="italic text-[9px] text-gray-500 mt-1">Thank you for choosing pure TRINAYAA botanicals.</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-black">Authorized Signatory</p>
                    <div className="h-6"></div>
                    <p className="font-mono text-[9px] text-gray-700">TRINAYAA DISPATCH UNIT</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
"""

content = content + "\n" + shipping_slip_modal_code

with open('client/src/pages/admin/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ ShippingSlipModal appended to AdminDashboard.tsx successfully")
