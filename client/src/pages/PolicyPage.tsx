import { ArrowLeft, CheckCircle2, Mail, MapPin, Phone, ShieldCheck, Truck } from "lucide-react";
import { useLocation, useRoute } from "wouter";

interface PolicyContent {
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    bullets?: string[];
  }>;
}

const POLICIES: Record<string, PolicyContent> = {
  shipping: {
    title: "Shipping & Delivery Policy",
    subtitle: "Pan-India tracked delivery for fresh botanical herbs, pure seeds, and raw powders.",
    lastUpdated: "November 2026",
    sections: [
      {
        heading: "1. Order Processing & Dispatch",
        paragraphs: [
          "All orders placed on TRINAYAA (https://trinayaa.in) are processed and dispatched directly from our dedicated traditional herb packaging facility in Erode, Tamil Nadu – 638002.",
          "Orders placed before 2:00 PM IST on business days are dispatched within 24 to 48 hours following payment verification. Orders placed on Sundays or national holidays are dispatched on the next operational business day.",
        ],
      },
      {
        heading: "2. Shipping Charges & Free Delivery Threshold",
        paragraphs: [
          "We offer transparent, upfront delivery pricing without hidden surcharges.",
        ],
        bullets: [
          "Free Delivery: Available across all serviceable Indian pin codes on all orders with a net cart value of ₹799 or more.",
          "Standard Delivery: A nominal flat shipping charge of ₹60 is applied to orders below ₹799.",
        ],
      },
      {
        heading: "3. Delivery Timelines & Courier Partners",
        paragraphs: [
          "We partner with reputable national courier and postal networks (including India Post Speed Post, ST Courier, Professional Couriers, and Blue Dart) to ensure safe, tracked delivery to your doorstep.",
        ],
        bullets: [
          "Tamil Nadu & South India: Estimated delivery within 2 to 3 business days from dispatch.",
          "Rest of India (Metros & Major Cities): Estimated delivery within 3 to 5 business days.",
          "North-East & Remote Regions: Estimated delivery within 5 to 7 business days.",
        ],
      },
      {
        heading: "4. Real-Time Tracking",
        paragraphs: [
          "Once your package is handed over to our courier partner, you will receive real-time tracking updates via email and SMS.",
          "You can also track your shipment at any time by entering your Order ID (e.g. TRN-10482) on our dedicated tracking page: https://trinayaa.in/track-order.",
        ],
      },
      {
        heading: "5. Packaging & Product Protection",
        paragraphs: [
          "All natural botanicals, seeds, and powders are packed in food-grade, airtight, tamper-evident individual pouches. Pouches are cushioned in sturdy eco-conscious shipping boxes to protect herbs against moisture and transit handling.",
        ],
      },
    ],
  },
  returns: {
    title: "Return & Refund Policy",
    subtitle: "Our commitment to honest botanical quality and customer satisfaction.",
    lastUpdated: "November 2026",
    sections: [
      {
        heading: "1. 7-Day Replacement Guarantee",
        paragraphs: [
          "Because TRINAYAA products are 100% natural, unadulterated botanical ingredients, we prioritize supreme product integrity and safety. We offer a 7-day replacement guarantee from the date of delivery if:",
        ],
        bullets: [
          "The package arrived physically damaged or unsealed.",
          "An incorrect product or variant was delivered.",
          "The package was lost or confirmed damaged in transit by our courier partner.",
        ],
      },
      {
        heading: "2. Replacement Process",
        paragraphs: [
          "To initiate a replacement request:",
        ],
        bullets: [
          "Send an email to support@trinayaa.in within 7 days of receiving your package.",
          "Include your Order ID (e.g. TRN-10482) and brief photos showing the outer package and damaged item.",
          "Our customer care team will review your request and dispatch a replacement package within 2 business days at zero additional cost to you.",
        ],
      },
      {
        heading: "3. Refunds & Payment Reversals",
        paragraphs: [
          "In situations where a replacement is unavailable or mutually agreed upon, a full refund will be processed to your original payment method (Razorpay: UPI, Credit/Debit Card, or NetBanking).",
          "Refunds are credited to your original bank account or card within 5 to 7 business days in accordance with Indian banking settlement standards.",
        ],
      },
      {
        heading: "4. Non-Returnable Scenarios",
        paragraphs: [
          "To safeguard product hygiene, opened pouches cannot be accepted for return unless defective or damaged prior to receipt.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "How TRINAYAA safeguards your personal data, transactions, and privacy.",
    lastUpdated: "November 2026",
    sections: [
      {
        heading: "1. Information We Collect",
        paragraphs: [
          "TRINAYAA Enterprises collects only the necessary information required to process and deliver your orders safely:",
        ],
        bullets: [
          "Contact details: Full name, email address, and mobile phone number.",
          "Shipping details: Delivery street address, city, district, state, and pin code.",
          "Account credentials: Cryptographically hashed passwords (using PBKDF2/scrypt; plain text passwords are never stored).",
          "Order history: Purchased products, quantities, order numbers, and tracking information.",
        ],
      },
      {
        heading: "2. Payment Security",
        paragraphs: [
          "All online payments on TRINAYAA are processed through Razorpay, a PCI-DSS Level 1 certified payment gateway.",
          "TRINAYAA never stores, processes, or transmits credit/debit card numbers, UPI PINs, or CVV codes on our servers. All sensitive financial transactions occur through secure 256-bit SSL encrypted gateway channels.",
        ],
      },
      {
        heading: "3. Data Sharing & Third Parties",
        paragraphs: [
          "We do not sell, rent, or trade your personal information to marketing brokers or advertising networks. We share contact and shipping details solely with:",
        ],
        bullets: [
          "Courier & logistics partners strictly for package delivery.",
          "Transactional notification services for order status confirmations via SMS or email.",
        ],
      },
      {
        heading: "4. Data Retention & Your Rights",
        paragraphs: [
          "You may request access to, correction of, or deletion of your personal account data at any time by contacting support@trinayaa.in.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    subtitle: "Terms of service and user agreement for TRINAYAA Enterprises.",
    lastUpdated: "November 2026",
    sections: [
      {
        heading: "1. Agreement to Terms",
        paragraphs: [
          "By accessing or purchasing through TRINAYAA (https://trinayaa.in), you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please do not use this website.",
        ],
      },
      {
        heading: "2. Botanical Product Information & Medical Disclaimer",
        paragraphs: [
          "TRINAYAA Enterprises provides 100% natural, single-ingredient botanical herbs, pure seeds, and raw powders. Traditional Tamil and Ayurvedic names are provided for cultural, botanical, and identification purposes.",
          "TRINAYAA products are traditional natural ingredients and dietary botanicals. They are not intended to diagnose, treat, cure, or prevent any illness or disease. Consult a qualified healthcare professional before using herbs for therapeutic dietary regimens.",
        ],
      },
      {
        heading: "3. Pricing & Orders",
        paragraphs: [
          "All prices are quoted in Indian Rupees (INR) and are inclusive of applicable taxes. TRINAYAA reserves the right to modify prices, catalogue offerings, or promotional discounts at any time.",
          "An order is confirmed only upon successful verification of payment via our Razorpay payment gateway.",
        ],
      },
      {
        heading: "4. Governing Law & Jurisdiction",
        paragraphs: [
          "These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or related to your use of this website shall be subject to the exclusive jurisdiction of the competent courts in Erode, Tamil Nadu.",
        ],
      },
    ],
  },
  about: {
    title: "About TRINAYAA Enterprises",
    subtitle: "Pure Seeds. Raw Powders. True Herbs. Good ingredients need nothing extra.",
    lastUpdated: "November 2026",
    sections: [
      {
        heading: "1. Our Heritage & Philosophy",
        paragraphs: [
          "Rooted in Erode, Tamil Nadu, TRINAYAA Enterprises was founded on a simple truth: everyday wellness begins with unadulterated nature that you can see, smell, and trust.",
          "In a marketplace crowded with synthetic additives, artificial extracts, and complex health promises, TRINAYAA returns to the uncompromised purity of the botanical ingredient itself.",
        ],
      },
      {
        heading: "2. Small-Batch Ethical Sourcing",
        paragraphs: [
          "We partner directly with traditional herb growers, organic farmers, and rural foraging communities across Tamil Nadu. Our ingredients are harvested in accordance with seasonal rhythms, ensuring natural potency and freshness.",
        ],
        bullets: [
          "100% Natural: No artificial colors, preservatives, or chemical residues.",
          "Clean Processing: Gently sun-dried and traditionally stone-milled.",
          "Bilingual Heritage: Honoring authentic Tamil botanical traditions (சித்த மருத்துவம் / நாட்டு மருத்துவம்) alongside English nomenclature.",
        ],
      },
      {
        heading: "3. Pan-India Delivery from Erode",
        paragraphs: [
          "From our apothecary facility in Erode, we hygienically pack each pouch fresh to order, delivering our authentic botanicals to homes across every state in India.",
        ],
      },
    ],
  },
  contact: {
    title: "Contact Customer Care",
    subtitle: "We are here to assist with product inquiries, order tracking, and botanical guidance.",
    lastUpdated: "November 2026",
    sections: [
      {
        heading: "1. Reach Us Directly",
        paragraphs: [
          "Our care team in Erode is available Monday through Saturday from 9:30 AM to 6:30 PM IST.",
        ],
        bullets: [
          "Customer Support Email: support@trinayaa.in",
          "Customer Helpline: +91 98765 43210",
          "Registered Facility Address: TRINAYAA ENTERPRISES, Erode, Tamil Nadu – 638002, India",
        ],
      },
      {
        heading: "2. Order Inquiries & Tracking",
        paragraphs: [
          "For tracking an existing order, please visit https://trinayaa.in/track-order with your 8-character Order ID (e.g. TRN-10482).",
          "We respond to all email inquiries within one business day.",
        ],
      },
    ],
  },
};

export default function PolicyPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/policies/:type");
  const [matchAbout] = useRoute("/about");
  const [matchContact] = useRoute("/contact");

  let policyKey = "shipping";
  if (matchAbout) policyKey = "about";
  else if (matchContact) policyKey = "contact";
  else if (params?.type && POLICIES[params.type]) policyKey = params.type;

  const content = POLICIES[policyKey] || POLICIES.shipping;

  return (
    <div className="site-shell min-h-screen bg-[#FBF8F0] text-[#123D28]">
      {/* Top Header Bar */}
      <header className="border-b border-[#E5DECF] bg-white sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-sm font-semibold tracking-wide hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={18} />
            <span>Back to Store</span>
          </button>
          <div className="text-center cursor-pointer" onClick={() => setLocation("/")}>
            <span className="text-xl font-bold tracking-widest uppercase block">TRINAYAA</span>
            <span className="text-[10px] tracking-wider text-[#6B7280] uppercase block">Pure Seeds · Raw Powders · True Herbs</span>
          </div>
          <button
            onClick={() => setLocation("/track-order")}
            className="text-xs font-medium text-[#123D28] underline underline-offset-4 hover:opacity-80"
          >
            Track Order
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-10 md:py-16">
        {/* Breadcrumb */}
        <nav className="text-xs text-[#6B7280] mb-6 flex items-center gap-2" aria-label="Breadcrumb">
          <button onClick={() => setLocation("/")} className="hover:underline">Home</button>
          <span>/</span>
          <span className="text-[#123D28] font-medium">{content.title}</span>
        </nav>

        {/* Title */}
        <div className="border-b border-[#E5DECF] pb-8 mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-[#123D28] bg-[#EAE3D2] px-3 py-1 rounded-full mb-3">
            <ShieldCheck size={14} /> Official Store Policy
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#123D28] mb-3">
            {content.title}
          </h1>
          <p className="text-base text-[#4A5568] max-w-2xl leading-relaxed">
            {content.subtitle}
          </p>
          <span className="text-xs text-[#718096] block mt-4">
            Last Updated: {content.lastUpdated} · TRINAYAA ENTERPRISES
          </span>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {content.sections.map((sec, idx) => (
            <section key={idx} className="bg-white p-6 md:p-8 rounded-xl border border-[#E5DECF] shadow-xs">
              <h2 className="text-xl font-serif font-bold text-[#123D28] mb-4">
                {sec.heading}
              </h2>
              <div className="space-y-3 text-sm text-[#374151] leading-relaxed">
                {sec.paragraphs.map((p, pIdx) => (
                  <p key={pIdx}>{p}</p>
                ))}
              </div>
              {sec.bullets && sec.bullets.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm text-[#374151]">
                  {sec.bullets.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-[#123D28] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* Contact Strip */}
        <div className="mt-12 p-6 rounded-xl bg-[#EAE3D2] border border-[#D5CBB5] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-base text-[#123D28]">Have a question about this policy?</h3>
            <p className="text-xs text-[#4A5568] mt-1">Our customer care team in Erode is here to help.</p>
          </div>
          <div className="flex gap-3">
            <a
              href="mailto:support@trinayaa.in"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#123D28] text-white text-xs font-medium hover:opacity-95 transition-opacity"
            >
              <Mail size={14} /> support@trinayaa.in
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5DECF] bg-white py-6 mt-16 text-center text-xs text-[#718096]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 TRINAYAA ENTERPRISES. All rights reserved.</span>
          <div className="flex gap-4">
            <button onClick={() => setLocation("/policies/shipping")} className="hover:underline">Shipping</button>
            <button onClick={() => setLocation("/policies/returns")} className="hover:underline">Returns</button>
            <button onClick={() => setLocation("/policies/privacy")} className="hover:underline">Privacy</button>
            <button onClick={() => setLocation("/policies/terms")} className="hover:underline">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
