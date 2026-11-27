import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Leaf,
  Mail,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  Truck,
  Phone,
  Calendar,
  CreditCard,
  Copy,
  Printer,
} from "lucide-react";
import { FormEvent, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

import BrandMark from "@/components/BrandMark";
import StoreFooter from "@/components/StoreFooter";

export default function TrackOrder() {
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [error, setError] = useState("");

  // Automatically read orderId or orderNumber from URL query params (e.g. from QR scan)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const initialOrder = params.get("orderId") || params.get("orderNumber") || params.get("id");
      if (initialOrder && initialOrder.trim().length >= 4) {
        const clean = initialOrder.trim().toUpperCase();
        setOrderId(clean);
        setActiveQuery(clean);
      }
    }
  }, []);

  const trackQuery = trpc.orders.track.useQuery(
    { orderNumber: activeQuery },
    {
      enabled: Boolean(activeQuery && activeQuery.length >= 4),
      retry: false,
    }
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const clean = orderId.trim();
    if (!clean) {
      setError("Enter an order ID to see your shipment status.");
      setActiveQuery("");
      return;
    }
    if (clean.length < 4) {
      setError("That order ID looks a little short. Try something like TRN-10501.");
      setActiveQuery("");
      return;
    }
    setError("");
    setActiveQuery(clean.toUpperCase());
  };

  const orderData = trackQuery.data;
  const isNotFound = trackQuery.isError;

  return (
    <div className="track-page">
      <div className="utility-bar">
        <div className="utility-inner">
          <div className="utility-links">
            <span><Leaf size={13} /> Pure Herbs</span><i />
            <span>Natural Seeds</span><i />
            <span>Raw Powders</span>
          </div>
          <div className="utility-links utility-right">
            <span><Truck size={14} /> Pan India Delivery <small>(T&C Apply)</small></span><i />
            <button onClick={() => toast.info("Our care team replies within one business day.")}>Support</button>
          </div>
        </div>
      </div>

      <header className="site-header">
        <div className="site-header-inner">
          <button className="logo-button" onClick={() => setLocation("/")}><BrandMark /></button>
          <nav className="desktop-nav track-nav">
            <button onClick={() => setLocation("/")}>Home</button>
            <button onClick={() => setLocation("/products")}>Products</button>
            <button onClick={() => setLocation("/about")}>About</button>
            <button onClick={() => setLocation("/contact")}>Contact</button>
          </nav>
          <div className="header-actions">
            <button className="icon-action account-action" onClick={() => setLocation("/")}><ShieldCheck size={20} /><span>Store</span></button>
            <button className="icon-action" onClick={() => setLocation("/")}><ArrowLeft size={20} /><span>Back to shop</span></button>
          </div>
        </div>
      </header>

      <main className="track-main container-wide">
        <div className="track-intro">
          <span className="eyebrow">Smart Parcel & Order Verification</span>
          <h1>Follow your <em>order.</em></h1>
          <p>Scan your parcel QR sticker or enter the order ID to inspect complete item details, dispatch routing, and live status.</p>
        </div>

        <form className={`track-form ${error || isNotFound ? "has-error" : ""}`} onSubmit={handleSubmit}>
          <div className="track-input">
            <Search size={19} />
            <input
              aria-label="Order ID"
              value={orderId}
              onChange={(event) => {
                setOrderId(event.target.value);
                setError("");
              }}
              placeholder="Enter order ID, e.g. TRN-10501"
            />
          </div>
          <button className="dark-button" type="submit" disabled={trackQuery.isLoading}>
            {trackQuery.isLoading ? "Searching..." : "Track order"} <ArrowRight size={16} />
          </button>
          {(error || (isNotFound && activeQuery)) && (
            <p className="form-error">
              {error || `We couldn't find order "${activeQuery}". Check the ID printed on the parcel sticker.`}
            </p>
          )}
        </form>

        {orderData && (
          <div className="space-y-6 mt-8">
            {/* Top Tracking Card & Timeline */}
            <section className="tracking-card">
              <div className="tracking-card-head">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="eyebrow !mb-0">TRINAYAA Official Dispatch</span>
                    <span className="text-[11px] font-mono font-bold bg-[#E8BF83]/20 text-[#AE6A2B] px-2 py-0.5 rounded">
                      Order #{orderData.orderNumber}
                    </span>
                  </div>
                  <h2>{orderData.orderStatus === "Delivered" ? "Delivered to your doorstep" : "On its way to you"}</h2>
                  <p>
                    Status: <strong className="text-[#123D28]">{orderData.orderStatus}</strong> · Payment: <strong className="uppercase">{orderData.paymentStatus}</strong> ({orderData.paymentMethod || "Prepaid"})
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="status-pill"><span /> {orderData.orderStatus}</span>
                  {orderData.trackingNumber && (
                    <span className="text-[11px] font-mono text-gray-500">
                      AWB: <strong>{orderData.trackingNumber}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Milestones Timeline */}
              <div className="timeline">
                {orderData.history && orderData.history.length > 0 ? (
                  orderData.history.map((h: any, index: number) => (
                    <div
                      className={`timeline-step is-done ${index === orderData.history.length - 1 ? "is-current" : ""}`}
                      key={h.status + index}
                    >
                      <div className="timeline-icon">
                        <CheckCircle2 size={18} />
                      </div>
                      <div className="timeline-copy">
                        <strong>{h.status}</strong>
                        <span>{h.note || "Order milestone recorded"}</span>
                        <small>{new Date(h.createdAt).toLocaleString("en-IN")}</small>
                      </div>
                      {index < orderData.history.length - 1 && <div className="timeline-connector" />}
                    </div>
                  ))
                ) : (
                  <div className="timeline-step is-done is-current">
                    <div className="timeline-icon"><CheckCircle2 size={18} /></div>
                    <div className="timeline-copy">
                      <strong>{orderData.orderStatus}</strong>
                      <span>Order verified in dispatch system</span>
                      <small>{new Date(orderData.createdAt).toLocaleDateString()}</small>
                    </div>
                  </div>
                )}
              </div>

              <div className="tracking-card-footer">
                <span>
                  <Package size={17} />{" "}
                  {orderData.items?.length
                    ? `${orderData.items.reduce((s: number, it: any) => s + (it.quantity || 1), 0)} Botanical Packs (${orderData.items.length} unique items)`
                    : "Botanical parcel"}
                </span>
                <span>
                  <Truck size={17} />{" "}
                  {orderData.carrier
                    ? `${orderData.carrier}${orderData.trackingNumber ? ` · ${orderData.trackingNumber}` : ""}`
                    : "TRINAYAA Express Logistics · Pan India"}
                </span>
              </div>
            </section>

            {/* Consignee & Shipping Destination */}
            <section className="bg-white rounded-2xl p-6 border border-[#DEDFD5] shadow-xs">
              <div className="flex items-center justify-between border-b border-[#EBECE4] pb-3 mb-4">
                <div className="flex items-center gap-2 text-[#123D28] font-serif font-bold text-base">
                  <MapPin size={18} className="text-[#AE6A2B]" />
                  <span>Consignee & Delivery Destination</span>
                </div>
                {orderData.pinCode && (
                  <span className="font-mono text-xs font-bold bg-[#123D28] text-white px-2.5 py-1 rounded">
                    PIN: {orderData.pinCode}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 block uppercase tracking-wider text-[10px] font-bold">Recipient Member</span>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">{orderData.recipientName || orderData.customerName || "Customer"}</div>
                  {(orderData.recipientPhone || orderData.customerPhone) && (
                    <div className="text-gray-600 mt-1 flex items-center gap-1.5 font-medium">
                      <Phone size={13} className="text-gray-400" />
                      <span>{orderData.recipientPhone || orderData.customerPhone}</span>
                    </div>
                  )}
                  {orderData.customerEmail && (
                    <div className="text-gray-600 mt-0.5 flex items-center gap-1.5">
                      <Mail size={13} className="text-gray-400" />
                      <span>{orderData.customerEmail}</span>
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-gray-500 block uppercase tracking-wider text-[10px] font-bold">Shipping Address</span>
                  <div className="text-gray-800 font-medium mt-0.5 leading-relaxed">
                    {orderData.shippingAddress || "Delivery Address on Dispatch Label"}
                  </div>
                </div>
              </div>
            </section>

            {/* Complete Breakdown of Individual Products Ordered */}
            <section className="bg-white rounded-2xl p-6 border border-[#DEDFD5] shadow-xs">
              <div className="flex items-center justify-between border-b border-[#EBECE4] pb-3 mb-4">
                <div className="flex items-center gap-2 text-[#123D28] font-serif font-bold text-base">
                  <Package size={18} className="text-[#AE6A2B]" />
                  <span>Individual Products in this Parcel ({orderData.items?.length || 0})</span>
                </div>
                <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Verified Botanical Batch
                </span>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-gray-600 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Product Description</th>
                      <th className="py-2.5 px-3 text-center">Pack Size</th>
                      <th className="py-2.5 px-3 text-center">Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(orderData.items || []).map((it: any, idx: number) => (
                      <tr key={it.productId || idx} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-3 text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-gray-900">{it.productNameEn}</div>
                          {it.productNameTa && (
                            <div className="text-[11px] text-gray-500 font-normal">{it.productNameTa}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-gray-700">{it.packSize || "100g"}</td>
                        <td className="py-3 px-3 text-center font-bold text-[#123D28]">{it.quantity}</td>
                        <td className="py-3 px-3 text-right text-gray-700">₹{it.price}</td>
                        <td className="py-3 px-3 text-right font-bold text-gray-900">₹{it.subtotal || (it.price * it.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Summary */}
              <div className="mt-6 pt-4 border-t border-[#EBECE4] flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="text-[11px] text-gray-500 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium text-[#123D28]">
                    <ShieldCheck size={14} className="text-emerald-700" />
                    <span>100% Genuine TRINAYAA Harvest • Sealed & Tamper-Evident</span>
                  </div>
                  <div>Payment Mode: <strong className="text-gray-800">{orderData.paymentMethod || "Prepaid"}</strong> ({orderData.paymentStatus})</div>
                  <div>Order Placed: {new Date(orderData.createdAt).toLocaleString("en-IN")}</div>
                </div>

                <div className="w-full md:w-64 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between text-gray-600">
                    <span>Items Subtotal:</span>
                    <span>₹{orderData.subtotal}</span>
                  </div>
                  {orderData.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-700">
                      <span>Discount {orderData.couponCode ? `(${orderData.couponCode})` : ""}:</span>
                      <span>-₹{orderData.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping Charges:</span>
                    <span>{orderData.shippingFee === 0 ? "FREE" : `₹${orderData.shippingFee}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-[#123D28] border-t border-slate-300 pt-2">
                    <span>Total Amount:</span>
                    <span>₹{orderData.total}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        <section className="track-help">
          <div>
            <span className="eyebrow">Need a hand?</span>
            <h2>We’re close by.</h2>
            <p>For changes to an order or a little help choosing a botanical, our care team is here.</p>
          </div>
          <div className="help-links">
            <a href="mailto:support@trinayaa.in"><Mail size={17} /><span><strong>Email us</strong><small>support@trinayaa.in</small></span></a>
            <a href="tel:+919876543210"><Clock3 size={17} /><span><strong>Call us</strong><small>+91 98765 43210</small></span></a>
          </div>
        </section>
      </main>

      {/* Official Master Store Footer */}
      <StoreFooter />
    </div>
  );
}
