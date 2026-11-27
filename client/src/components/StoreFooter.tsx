import React from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import BrandMark from "./BrandMark";
import WhatsAppIcon from "./WhatsAppIcon";
import {
  Instagram,
  Facebook,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";

// Exact SVG district contour of Erode, Tamil Nadu
const ERODE_MAP_PATH =
  "M 5.3 23.1 L 0.0 38.9 L 1.8 42.6 L 17.5 47.2 L 14.9 64.8 L 26.3 62.0 L 31.6 72.2 L 36.0 68.5 L 38.6 70.4 L 36.0 75.0 L 43.9 70.4 L 46.5 78.7 L 50.9 74.1 L 56.1 87.0 L 54.4 92.6 L 79.8 92.6 L 100.0 100.0 L 100.0 78.7 L 84.2 58.3 L 93.0 33.3 L 86.8 36.1 L 85.1 32.4 L 87.7 15.7 L 82.5 14.8 L 86.8 6.5 L 86.0 0.0 L 68.4 2.8 L 59.6 18.5 L 42.1 15.7 L 28.1 22.2 L 27.2 27.8 L 15.8 20.4 L 12.3 24.1 Z";

export default function StoreFooter() {
  const [, setLocation] = useLocation();
  const { data: socialLinks } = trpc.content.getSocialLinks.useQuery();

  return (
    <footer className="w-full bg-[#E2BA89] text-[#123D28] border-t border-[#C79E69] select-none transition-colors">
      <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 pt-10 pb-6">
        {/* Responsive Expanded 5-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.9fr_1fr_1.2fr_1.3fr] gap-8 lg:gap-6 items-start">

          {/* Column 1: Brand & Logo (Exact same as Home Page header) */}
          <div className="flex flex-col justify-between pr-0 lg:pr-4">
            <button
              onClick={() => setLocation("/")}
              className="text-left cursor-pointer inline-flex items-center group focus:outline-none"
              title="TRINAYAA Home"
            >
              <BrandMark />
            </button>

            {/* Registered Entity & Location */}
            <div className="mt-4">
              <p className="font-bold text-[13px] tracking-wider text-[#0B2D1D] uppercase">
                TRINAYAA ENTERPRISES
              </p>
              <p className="text-xs text-[#0B2D1D]/90 font-medium mt-0.5">Erode, Tamil Nadu</p>
            </div>

            {/* Social Links Row */}
            <div className="flex items-center gap-2.5 mt-5">
              {/* Instagram */}
              <a
                href={socialLinks?.instagram || "https://instagram.com"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Follow TRINAYAA on Instagram"
                className="w-8 h-8 rounded-full border border-[#123D28]/40 flex items-center justify-center text-[#123D28] hover:bg-[#123D28] hover:text-[#E2BA89] transition-all"
              >
                <Instagram size={15} />
              </a>

              {/* Facebook */}
              <a
                href={socialLinks?.facebook || "https://facebook.com"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Follow TRINAYAA on Facebook"
                className="w-8 h-8 rounded-full border border-[#123D28]/40 flex items-center justify-center text-[#123D28] hover:bg-[#123D28] hover:text-[#E2BA89] transition-all"
              >
                <Facebook size={15} />
              </a>

              {/* WhatsApp */}
              <a
                href={socialLinks?.whatsappUrl || "https://wa.me/919442218990"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="Chat with TRINAYAA on WhatsApp"
                className="w-8 h-8 rounded-full border border-[#123D28]/40 flex items-center justify-center text-[#123D28] hover:bg-[#123D28] hover:text-[#E2BA89] transition-all"
              >
                <WhatsAppIcon size={16} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:border-l lg:border-[#123D28]/25 lg:pl-6">
            <h4 className="font-serif font-bold text-[13px] sm:text-sm tracking-wider uppercase text-[#123D28] mb-3.5">
              QUICK LINKS
            </h4>
            <ul className="space-y-2 text-[13px] text-[#0B2D1D] font-medium">
              <li>
                <button
                  onClick={() => setLocation("/")}
                  className="hover:text-[#7A1B28] hover:underline transition-colors text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/products")}
                  className="hover:text-[#7A1B28] hover:underline transition-colors text-left"
                >
                  Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/about")}
                  className="hover:text-[#7A1B28] hover:underline transition-colors text-left"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/bulk-enquiry")}
                  className="hover:text-[#7A1B28] hover:underline transition-colors text-left"
                >
                  Bulk Enquiries
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/contact")}
                  className="hover:text-[#7A1B28] hover:underline transition-colors text-left"
                >
                  Help
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/contact")}
                  className="hover:text-[#7A1B28] hover:underline transition-colors text-left"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Useful Policies */}
          <div className="lg:border-l lg:border-[#123D28]/25 lg:pl-6">
            <h4 className="font-serif font-bold text-[13px] sm:text-sm tracking-wider uppercase text-[#123D28] mb-3.5">
              USEFUL POLICIES
            </h4>
            <ul className="space-y-2 text-[13px] text-[#0B2D1D] font-medium">
              <li>
                <button
                  onClick={() => setLocation("/policies/privacy")}
                  className="hover:text-[#7A1B28] hover:underline transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/policies/returns")}
                  className="hover:text-[#7A1B28] hover:underline transition-colors text-left"
                >
                  Refund &amp; Returns
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/policies/shipping")}
                  className="hover:text-[#7A1B28] hover:underline transition-colors text-left"
                >
                  Shipping Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/policies/terms")}
                  className="hover:text-[#7A1B28] hover:underline transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div className="lg:border-l lg:border-[#123D28]/25 lg:pl-6">
            <h4 className="font-serif font-bold text-[13px] sm:text-sm tracking-wider uppercase text-[#123D28] mb-3.5">
              CONTACT US
            </h4>
            <div className="space-y-3 text-[13px] text-[#0B2D1D]">
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-[#0B2D1D] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[13px] sm:text-sm text-[#0B2D1D]">TRINAYAA ENTERPRISES</p>
                  <p className="text-xs text-[#0B2D1D]/90 font-medium leading-snug">
                    Erode, Tamil Nadu – 638 001, India
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-[#0B2D1D] shrink-0" />
                <a
                  href={`tel:${(socialLinks?.whatsappPhone || "+919442218990").replace(/[^0-9+]/g, "")}`}
                  className="font-medium text-[#0B2D1D] hover:text-[#7A1B28] hover:underline transition-colors"
                >
                  {socialLinks?.whatsappPhone || "+91 94422 18990"}
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail size={16} className="text-[#0B2D1D] shrink-0" />
                <a
                  href="mailto:support@trinayaa.com"
                  className="font-medium text-[#0B2D1D] hover:text-[#7A1B28] hover:underline transition-colors"
                >
                  support@trinayaa.com
                </a>
              </div>
            </div>
          </div>

          {/* Column 5: Erode Map Badge (White Theme, Green Background Removed per User Request) */}
          <div className="lg:border-l lg:border-[#123D28]/25 lg:pl-6 flex flex-col items-center sm:items-start lg:items-end justify-center">
            <div
              className="w-full max-w-[280px] sm:max-w-[320px] rounded-2xl bg-white border border-[#123D28]/20 shadow-sm p-4 hover:shadow-md transition-all cursor-default flex flex-col justify-between"
              title="TRINAYAA Apothecary & Procurement Origin: Erode, Tamil Nadu, India"
            >
              {/* Top Row: Indian Flag Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="inline-flex items-center gap-1.5 bg-[#FAF7F0] border border-[#123D28]/15 px-2 py-0.5 rounded-full shadow-2xs">
                  <span className="text-xs" role="img" aria-label="Indian Flag">
                    🇮🇳
                  </span>
                  <span className="text-[9.5px] font-bold tracking-wider text-[#123D28] uppercase">
                    INDIA
                  </span>
                </div>
                <span className="text-[9px] font-semibold tracking-wider text-[#123D28]/60 uppercase">
                  Procurement Origin
                </span>
              </div>

              {/* Main Map & Typography */}
              <div className="flex items-center justify-between gap-4">
                {/* Vector Erode District Map */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full drop-shadow-xs"
                    aria-label="Erode District Silhouette"
                  >
                    {/* Shadow Layer */}
                    <path
                      d={ERODE_MAP_PATH}
                      fill="#123D28"
                      opacity="0.12"
                      transform="translate(1, 1.5)"
                    />
                    {/* Main District Map */}
                    <path
                      d={ERODE_MAP_PATH}
                      fill="#123D28"
                      stroke="#0D2C1D"
                      strokeWidth="1"
                      strokeLinejoin="round"
                    />
                    {/* Erode Location Pin Pulse */}
                    <g transform="translate(75, 60)">
                      <circle r="6" fill="#DC2626" opacity="0.25">
                        <animate
                          attributeName="r"
                          values="3;7;3"
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="opacity"
                          values="0.35;0.05;0.35"
                          dur="2.4s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle
                        r="3"
                        fill="#DC2626"
                        stroke="#FFFFFF"
                        strokeWidth="1"
                      />
                    </g>
                  </svg>
                </div>

                {/* Right Typography */}
                <div className="flex-1 flex flex-col justify-center leading-none">
                  <span
                    className="font-serif font-black text-xl sm:text-[23px] tracking-[0.14em] text-[#123D28] uppercase leading-tight"
                    style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                  >
                    ERODE
                  </span>
                  <div className="w-full h-[1.5px] bg-[#123D28]/30 my-2" />
                  <span
                    className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#123D28]/85 uppercase leading-none"
                    style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}
                  >
                    TAMIL NADU
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright */}
        <div className="border-t border-[#123D28]/25 mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#0B2D1D]/90 font-medium gap-2">
          <span>© 2026 TRINAYAA ENTERPRISES. All rights reserved.</span>
          <span className="text-xs text-[#0B2D1D]/80">
            Handcrafted Herbal Botanicals from Erode, Tamil Nadu
          </span>
        </div>
      </div>
    </footer>
  );
}
