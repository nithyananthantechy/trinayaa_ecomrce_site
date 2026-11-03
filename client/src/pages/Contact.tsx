import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  ShieldCheck,
  Leaf,
  Truck,
  Package,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Menu,
  UserRound,
  ShoppingBag,
  Search,
  Instagram,
  Facebook,
  Youtube
} from "lucide-react";

function BrandMark() {
  return (
    <div className="brand-mark" aria-label="Trinayaa home">
      <img
        src="/images/brand/trinayaa_logo.png"
        alt="TRINAYAA"
        className="h-10 md:h-11 w-auto object-contain"
      />
    </div>
  );
}

function TrustRow() {
  return (
    <section className="trust-row" aria-label="Why Trinayaa">
      <div><Leaf size={27} strokeWidth={1.4} /><span><strong>Quality Sourcing</strong><small>Carefully selected natural ingredients</small></span></div>
      <div><ShieldCheck size={27} strokeWidth={1.4} /><span><strong>Secure Checkout</strong><small>Safe and trusted payments</small></span></div>
      <div><Package size={27} strokeWidth={1.4} /><span><strong>Careful Packing</strong><small>Hygienic and secure packaging</small></span></div>
      <div><Truck size={27} strokeWidth={1.4} /><span><strong>Pan India Delivery</strong><small>Delivering natural wellness across India</small></span></div>
    </section>
  );
}

export default function Contact() {
  const [, setLocation] = useLocation();
  const { data: currentUser } = trpc.auth.me.useQuery();

  // Inquiry form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("Product Inquiry");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Thank you! Your message has been received.", {
        description: "Our botanical support team in Erode will get back to you within 24 hours.",
      });
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    }, 600);
  };

  const faqs = [
    {
      q: "Where are TRINAYAA products processed and shipped from?",
      a: "All natural botanicals, pure seeds, and raw herbal powders are sourced, quality checked, and packaged fresh at our dedicated facility in Erode, Tamil Nadu – 638002."
    },
    {
      q: "What is your standard delivery timeline across India?",
      a: "Orders are dispatched within 24 to 48 hours. Tamil Nadu and South India deliveries take 2 to 3 business days; metropolitan cities across India take 3 to 5 business days."
    },
    {
      q: "Do you offer free shipping?",
      a: "Yes! Free tracked shipping is automatically applied on all orders with a net cart value of ₹799 or more across all serviceable pin codes in India."
    },
    {
      q: "Are TRINAYAA powders 100% natural without additives?",
      a: "Absolutely. We adhere to single-ingredient purity. There are zero added preservatives, chemical binders, maltodextrin, artificial flavors, or coloring agents."
    }
  ];

  return (
    <div className="site-shell min-h-screen bg-[#FBF8F0] text-[#123D28]">
      {/* Top Utility Bar */}
      <div className="utility-bar">
        <div className="utility-inner">
          <div className="utility-links">
            <span><Leaf size={13} /> Pure Herbs</span><i />
            <span>Natural Seeds</span><i />
            <span>Raw Powders</span>
          </div>
          <div className="utility-links utility-right">
            <span><Truck size={14} /> Pan India Delivery <small>(T&C Apply)</small></span><i />
            <button onClick={() => setLocation("/contact")}>Support</button><i />
            <button onClick={() => setLocation("/track-order")}>Track Order</button>
            {currentUser?.role === "ADMIN" && (
              <>
                <i />
                <button onClick={() => setLocation("/admin")} className="font-bold text-[#e8bf83]">Admin Console</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Storefront Header */}
      <header className="site-header">
        <div className="site-header-inner">
          <button className="mobile-menu-button" aria-label="Open menu" onClick={() => setLocation("/")}><Menu size={22} /></button>
          <button className="logo-button" onClick={() => setLocation("/")}><BrandMark /></button>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <button onClick={() => setLocation("/")}>Home</button>
            <button onClick={() => setLocation("/products")}>Products</button>
            <button onClick={() => setLocation("/about")}>About</button>
            <button onClick={() => setLocation("/contact")} className="font-bold text-[#123D28] underline underline-offset-4">Contact</button>
          </nav>
          <div className="header-actions">
            <label className="header-search">
              <Search size={18} />
              <input
                aria-label="Search products"
                placeholder="Search herbs, seeds, powders..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") setLocation("/");
                }}
              />
            </label>
            <button
              className="icon-action account-action"
              aria-label="Account"
              onClick={() => {
                if (currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN") {
                  setLocation("/admin");
                } else {
                  setLocation("/");
                }
              }}
            >
              <UserRound size={22} />
              <span>{currentUser ? (currentUser.role === "ADMIN" ? "Admin" : currentUser.name.split(" ")[0]) : "Account"}</span>
            </button>
            <button className="icon-action cart-action" aria-label="Open cart" onClick={() => setLocation("/")}>
              <ShoppingBag size={23} />
              <span>Cart</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contact Hero Banner */}
      <div className="bg-[#FAF3E5] border-b border-[#E5DECF] py-12 md:py-16">
        <div className="container-wide text-center max-w-3xl mx-auto px-4">
          <span className="eyebrow inline-block text-xs font-bold tracking-widest text-[#8E734B] uppercase mb-2">
            TRINAYAA Care &amp; Support
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#123D28] tracking-tight mb-4">
            We’re Here for Your Wellness Journey
          </h1>
          <p className="text-[#4B5046] text-base md:text-lg leading-relaxed font-serif">
            Have a question about raw herbs, tracking your shipment, or wholesale queries? Our customer care team in Erode is ready to assist you.
          </p>
        </div>
      </div>

      <main className="container-wide py-12 md:py-16 px-4">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-7 rounded-2xl border border-[#E5DECF] shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#EAE3D2] text-[#123D28] flex items-center justify-center mb-5">
              <Phone size={24} />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#123D28] mb-1">Customer Helpline</h2>
            <p className="text-xs text-[#6C7167] mb-3">Available Monday to Saturday, 9:30 AM – 6:30 PM IST</p>
            <a
              href="tel:+919876543210"
              className="text-base font-bold text-[#123D28] hover:text-[#AE6A2B] transition-colors"
            >
              +91 98765 43210
            </a>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-[#E5DECF] shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#EAE3D2] text-[#123D28] flex items-center justify-center mb-5">
              <Mail size={24} />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#123D28] mb-1">Support Email</h2>
            <p className="text-xs text-[#6C7167] mb-3">Order queries, botanical guidance &amp; replacements</p>
            <a
              href="mailto:support@trinayaa.in"
              className="text-base font-bold text-[#123D28] hover:text-[#AE6A2B] transition-colors"
            >
              support@trinayaa.in
            </a>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-[#E5DECF] shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-[#EAE3D2] text-[#123D28] flex items-center justify-center mb-5">
              <MapPin size={24} />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#123D28] mb-1">Packaging Facility</h2>
            <p className="text-xs text-[#6C7167] mb-1">TRINAYAA ENTERPRISES</p>
            <address className="not-italic text-xs text-[#4B5046] leading-relaxed">
              42, Kongu Nagar, Erode,<br />
              Tamil Nadu – 638002, India
            </address>
          </div>
        </div>

        {/* Inquiry Form & Side Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-20">
          <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-2xl border border-[#E5DECF] shadow-sm">
            <span className="eyebrow text-xs font-bold uppercase tracking-wider text-[#8E734B] block mb-1">Send a message</span>
            <h2 className="font-serif text-2xl font-bold text-[#123D28] mb-6">Leave Us an Inquiry</h2>

            {submitted ? (
              <div className="p-8 text-center bg-[#FAF3E5] rounded-xl border border-[#E5DECF]">
                <CheckCircle2 size={42} className="text-[#123D28] mx-auto mb-3" />
                <h3 className="font-serif text-xl font-bold text-[#123D28] mb-2">Message Received</h3>
                <p className="text-sm text-[#4B5046] mb-4">
                  Thank you for reaching out. A botanical wellness specialist will contact you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-5 py-2.5 bg-[#123D28] text-white text-xs font-bold rounded-lg hover:bg-[#1A4D33] transition-colors"
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1 text-[#1A2C20]">Your Name *</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ananya Raman"
                      className="w-full px-3.5 py-2.5 bg-[#FBF8F0] border border-[#DEDFD5] rounded-lg focus:outline-none focus:border-[#123D28]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-[#1A2C20]">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 bg-[#FBF8F0] border border-[#DEDFD5] rounded-lg focus:outline-none focus:border-[#123D28]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1 text-[#1A2C20]">Phone Number (Optional)</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-[#FBF8F0] border border-[#DEDFD5] rounded-lg focus:outline-none focus:border-[#123D28]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-[#1A2C20]">Inquiry Subject</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#FBF8F0] border border-[#DEDFD5] rounded-lg focus:outline-none focus:border-[#123D28]"
                    >
                      <option value="Product Inquiry">Product Inquiry &amp; Guidance</option>
                      <option value="Order Tracking">Order Tracking &amp; Delivery</option>
                      <option value="Wholesale">Wholesale &amp; Bulk Seeds/Powders</option>
                      <option value="Feedback">Feedback &amp; Suggestions</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#1A2C20]">Your Message *</label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us how we can help you..."
                    className="w-full px-3.5 py-2.5 bg-[#FBF8F0] border border-[#DEDFD5] rounded-lg focus:outline-none focus:border-[#123D28]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#123D28] hover:bg-[#1A4D33] text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 text-xs tracking-wider uppercase"
                >
                  <Send size={15} /> {loading ? "Sending..." : "Submit Inquiry"}
                </button>
              </form>
            )}
          </div>

          {/* Side Guidance / Botanical Pledge */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#FAF3E5] p-8 rounded-2xl border border-[#E5DECF]">
              <span className="eyebrow text-xs font-bold uppercase tracking-wider text-[#8E734B] block mb-2">Botanical Pledge</span>
              <h3 className="font-serif text-xl font-bold text-[#123D28] mb-3">Authentic Herbs from Western Tamil Nadu</h3>
              <p className="text-xs text-[#4B5046] leading-relaxed mb-4">
                TRINAYAA works directly with smallholder farmers and traditional gatherers across the Kongu belt and Nilgiri foothills. We never compromise on raw single-ingredient purity.
              </p>
              <div className="space-y-2.5 text-xs text-[#123D28] font-medium">
                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#123D28]" /> 100% Raw, Unadulterated Herbs</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#123D28]" /> Packed Fresh in Airtight Food-Grade Pouches</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#123D28]" /> 7-Day Replacement Guarantee</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E5DECF] flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#EAE3D2] text-[#123D28] flex items-center justify-center shrink-0">
                <Clock size={22} />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-[#123D28]">Track an Existing Order?</h4>
                <p className="text-xs text-[#6C7167] mt-0.5">Check live shipment status with your Order ID.</p>
                <button
                  onClick={() => setLocation("/track-order")}
                  className="text-xs font-bold text-[#123D28] underline underline-offset-4 mt-2 hover:text-[#AE6A2B] transition-colors"
                >
                  Go to Track Order &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="text-center mb-8">
            <span className="eyebrow text-xs font-bold uppercase tracking-widest text-[#8E734B] block mb-2">Help Center</span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#123D28]">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-[#E5DECF] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-serif font-bold text-[#123D28] text-sm md:text-base hover:bg-[#FAF3E5]/50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className={`transition-transform duration-200 ${openFaq === idx ? "rotate-180" : ""}`} />
                </button>
                {openFaq === idx && (
                  <div className="p-5 pt-0 text-xs md:text-sm text-[#4B5046] leading-relaxed border-t border-[#F0EBE0] font-sans">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <TrustRow />
      </main>

      {/* Official Site Footer */}
      <footer className="site-footer">
        <div className="footer-inner container-wide">
          <div className="footer-brand">
            <div className="brand-mark brand-mark-inverse" aria-label="Trinayaa home">
              <img
                src="/images/brand/trinayaa_logo_white.png"
                alt="TRINAYAA"
                className="h-10 md:h-11 w-auto object-contain"
              />
            </div>
            <p>Pure seeds. Raw powders.<br />True herbs.</p>
            <div className="socials">
              <a href="#footer" aria-label="Instagram"><Instagram size={16} /></a>
              <a href="#footer" aria-label="Facebook"><Facebook size={16} /></a>
              <a href="#footer" aria-label="Youtube"><Youtube size={16} /></a>
            </div>
          </div>
          <div className="footer-column">
            <span className="footer-title">Quick links</span>
            <button onClick={() => setLocation("/")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Home</button>
            <button onClick={() => setLocation("/products")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Products</button>
            <button onClick={() => setLocation("/about")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">About</button>
            <button onClick={() => setLocation("/contact")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Contact</button>
          </div>
          <div className="footer-column">
            <span className="footer-title">Customer Care</span>
            <button onClick={() => setLocation("/contact")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Contact Us</button>
            <button onClick={() => setLocation("/track-order")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Track Order</button>
            <button onClick={() => setLocation("/policies/shipping")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Shipping Policy</button>
            <button onClick={() => setLocation("/policies/returns")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Returns &amp; Refunds</button>
          </div>
          <div className="footer-column">
            <span className="footer-title">Headquarters</span>
            <p className="text-xs text-[#DFE7D7]/80 leading-relaxed">
              TRINAYAA ENTERPRISES<br />
              42, Kongu Nagar, Erode,<br />
              Tamil Nadu – 638002, India<br />
              support@trinayaa.in
            </p>
          </div>
        </div>
        <div className="footer-bottom container-wide">
          <span>&copy; 2026 TRINAYAA ENTERPRISES. All rights reserved.</span>
          <div className="footer-policies">
            <button onClick={() => setLocation("/policies/shipping")} className="hover:underline">Shipping</button>
            <button onClick={() => setLocation("/policies/returns")} className="hover:underline">Returns</button>
            <button onClick={() => setLocation("/policies/privacy")} className="hover:underline">Privacy Policy</button>
            <button onClick={() => setLocation("/policies/terms")} className="hover:underline">Terms &amp; Conditions</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
