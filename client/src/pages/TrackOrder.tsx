import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Leaf, Mail, MapPin, Package, Search, ShieldCheck, Truck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

function BrandMark() {
  return (
    <div className="brand-mark" aria-label="Trinayaa home">
      <img
        src="/images/brand/trinayaa_logo.png"
        alt="TRINAYAA"
        className="h-10 w-auto object-contain"
      />
    </div>
  );
}

export default function TrackOrder() {
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [error, setError] = useState("");

  const trackQuery = trpc.orders.track.useQuery(
    { orderNumber: activeQuery },
    {
      enabled: Boolean(activeQuery && activeQuery.length >= 5),
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
    if (clean.length < 5) {
      setError("That order ID looks a little short. Try something like TRN-10482.");
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
          <span className="eyebrow">A quiet little update</span>
          <h1>Follow your <em>order.</em></h1>
          <p>Enter the order ID from your confirmation email and we’ll show you where your Trinayaa parcel is on its journey.</p>
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
              placeholder="Enter order ID, e.g. TRN-10482"
            />
          </div>
          <button className="dark-button" type="submit" disabled={trackQuery.isLoading}>
            {trackQuery.isLoading ? "Searching..." : "Track order"} <ArrowRight size={16} />
          </button>
          {(error || (isNotFound && activeQuery)) && (
            <p className="form-error">
              {error || "We couldn't find that order yet. Check the ID in your confirmation email."}
            </p>
          )}
        </form>

        {orderData && (
          <section className="tracking-card">
            <div className="tracking-card-head">
              <div>
                <span className="eyebrow">Order {orderData.orderNumber}</span>
                <h2>{orderData.orderStatus === "Delivered" ? "Delivered to your doorstep" : "On its way to you"}</h2>
                <p>Status: <strong>{orderData.orderStatus}</strong> · Payment: <strong>{orderData.paymentStatus}</strong></p>
              </div>
              <span className="status-pill"><span /> {orderData.orderStatus}</span>
            </div>

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
                    <span>Order logged in database</span>
                    <small>{new Date(orderData.createdAt).toLocaleDateString()}</small>
                  </div>
                </div>
              )}
            </div>

            <div className="tracking-card-footer">
              <span>
                <Package size={17} />{" "}
                {orderData.items?.[0]
                  ? `${orderData.items[0].productNameEn} · ${orderData.items[0].packSize}`
                  : "Botanical parcel"}
              </span>
              <span>
                <Truck size={17} />{" "}
                {orderData.carrier
                  ? `${orderData.carrier}${orderData.trackingNumber ? ` · ${orderData.trackingNumber}` : ""}`
                  : "Manual Fulfilment Updates · Pan India"}
              </span>
            </div>
          </section>
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

      <footer className="minimal-footer">
        <span>© 2026 TRINAYAA ENTERPRISES</span>
        <button onClick={() => setLocation("/")}>Back to shop <ArrowRight size={15} /></button>
      </footer>
    </div>
  );
}
