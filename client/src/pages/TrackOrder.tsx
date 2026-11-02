import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Leaf, Mail, MapPin, Package, Search, ShieldCheck, Truck } from "lucide-react";
import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

function BrandMark() {
  return <div className="brand-mark"><div className="brand-leaf"><Leaf size={25} strokeWidth={1.5} /></div><div><div className="brand-name">TRINAYAA</div><div className="brand-tagline">PURE SEEDS · RAW POWDERS · TRUE HERBS</div></div></div>;
}

const checkpoints = [
  { title: "Order placed", detail: "We have received your order", time: "02 Nov · 10:42 AM", icon: CheckCircle2, done: true },
  { title: "Packed with care", detail: "Your botanicals are being prepared", time: "02 Nov · 04:10 PM", icon: Package, done: true },
  { title: "On the way", detail: "Your parcel has left our shelves", time: "Expected tomorrow", icon: Truck, done: false },
  { title: "Delivered", detail: "A little more nature at your doorstep", time: "Expected 05 Nov", icon: MapPin, done: false },
];

export default function TrackOrder() {
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState("");
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!orderId.trim()) {
      setError("Enter an order ID to see your shipment status.");
      setSearched(false);
      return;
    }
    if (orderId.trim().length < 5) {
      setError("That order ID looks a little short. Try something like TRN-10482.");
      setSearched(false);
      return;
    }
    if (!/^TRN-\d{5}$/i.test(orderId.trim())) {
      setError("Enter the order ID in the format TRN-10482.");
      setSearched(false);
      return;
    }
    if (orderId.trim().toUpperCase() !== "TRN-10482") {
      setError("We couldn't find that order yet. Check the ID in your confirmation email.");
      setSearched(false);
      return;
    }
    setError("");
    setSearched(true);
  };

  return <div className="track-page"><div className="utility-bar"><div className="utility-inner"><div className="utility-links"><span><Leaf size={13} /> Pure Herbs</span><i /><span>Natural Seeds</span><i /><span>Raw Powders</span></div><div className="utility-links utility-right"><span><Truck size={14} /> Pan India Delivery <small>(T&C Apply)</small></span><i /><span>Support</span></div></div></div><header className="site-header"><div className="site-header-inner"><button className="logo-button" onClick={() => setLocation("/")}><BrandMark /></button><nav className="desktop-nav track-nav"><a href="/">Shop All</a><a href="/">Seeds</a><a href="/">Raw Powders</a><a href="/">Herbs</a><a href="/">About Us</a><button onClick={() => toast.info("Write to support@trinayaa.in and we will be in touch.")}>Contact</button></nav><div className="header-actions"><button className="icon-action account-action" onClick={() => toast.info("Account sign-in will connect to your customer profile.")}><ShieldCheck size={20} /><span>Account</span></button><button className="icon-action" onClick={() => setLocation("/")}><ArrowLeft size={20} /><span>Back to shop</span></button></div></div></header><main className="track-main container-wide"><div className="track-intro"><span className="eyebrow">A quiet little update</span><h1>Follow your <em>order.</em></h1><p>Enter the order ID from your confirmation email and we’ll show you where your Trinayaa parcel is on its journey.</p></div><form className={`track-form ${error ? "has-error" : ""}`} onSubmit={handleSubmit}><div className="track-input"><Search size={19} /><input aria-label="Order ID" value={orderId} onChange={(event) => { setOrderId(event.target.value); setError(""); }} placeholder="Enter order ID, e.g. TRN-10482" /></div><button className="dark-button" type="submit">Track order <ArrowRight size={16} /></button>{error && <p className="form-error">{error}</p>}</form>{searched && <section className="tracking-card"><div className="tracking-card-head"><div><span className="eyebrow">Order {orderId.toUpperCase()}</span><h2>On its way to you</h2><p>Estimated delivery <strong>05 November 2026</strong></p></div><span className="status-pill"><span /> In transit</span></div><div className="timeline">{checkpoints.map(({ title, detail, time, icon: Icon, done }, index) => <div className={`timeline-step ${done ? "is-done" : ""} ${index === 2 ? "is-current" : ""}`} key={title}><div className="timeline-icon"><Icon size={18} /></div><div className="timeline-copy"><strong>{title}</strong><span>{detail}</span><small>{time}</small></div>{index < checkpoints.length - 1 && <div className="timeline-connector" />}</div>)}</div><div className="tracking-card-footer"><span><Package size={17} /> Moringa Leaf Powder · 100 g</span><span><Truck size={17} /> BlueDart · Tracking updates enabled</span></div></section>}<section className="track-help"><div><span className="eyebrow">Need a hand?</span><h2>We’re close by.</h2><p>For changes to an order or a little help choosing a botanical, our care team is here.</p></div><div className="help-links"><a href="mailto:support@trinayaa.in"><Mail size={17} /><span><strong>Email us</strong><small>support@trinayaa.in</small></span></a><a href="tel:+919876543210"><Clock3 size={17} /><span><strong>Call us</strong><small>+91 98765 43210</small></span></a></div></section></main><footer className="minimal-footer"><span>© 2026 TRINAYAA ENTERPRISES</span><button onClick={() => setLocation("/")}>Back to shop <ArrowRight size={15} /></button></footer></div>;
}
