import React from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import BrandMark from "./BrandMark";
import {
  Instagram,
  Facebook,
  Youtube,
  MapPin,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";

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
            <div className="mt-4 text-xs">
              <p className="font-bold tracking-wider text-[#123D28] uppercase">
                TRINAYAA ENTERPRISES
              </p>
              <p className="text-[#123D28]/80 mt-0.5">Erode, Tamil Nadu</p>
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

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                title="TRINAYAA on YouTube"
                className="w-8 h-8 rounded-full border border-[#123D28]/40 flex items-center justify-center text-[#123D28] hover:bg-[#123D28] hover:text-[#E2BA89] transition-all"
              >
                <Youtube size={15} />
              </a>

              {/* WhatsApp (Near Instagram as requested) */}
              <a
                href={socialLinks?.whatsappUrl || "https://wa.me/919442218990"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="Chat with TRINAYAA on WhatsApp"
                className="w-8 h-8 rounded-full border border-[#123D28]/40 flex items-center justify-center text-[#123D28] hover:bg-[#123D28] hover:text-[#E2BA89] transition-all"
              >
                <MessageCircle size={15} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:border-l lg:border-[#123D28]/25 lg:pl-6">
            <h4 className="font-serif font-bold text-xs tracking-wider uppercase text-[#123D28] mb-3">
              QUICK LINKS
            </h4>
            <ul className="space-y-1.5 text-xs text-[#123D28]/85">
              <li>
                <button
                  onClick={() => setLocation("/")}
                  className="hover:text-[#123D28] hover:underline transition-colors text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/products")}
                  className="hover:text-[#123D28] hover:underline transition-colors text-left"
                >
                  Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/about")}
                  className="hover:text-[#123D28] hover:underline transition-colors text-left"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/bulk-enquiry")}
                  className="hover:text-[#123D28] hover:underline transition-colors text-left"
                >
                  Bulk Enquiries
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/contact")}
                  className="hover:text-[#123D28] hover:underline transition-colors text-left"
                >
                  Help
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/contact")}
                  className="hover:text-[#123D28] hover:underline transition-colors text-left"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Useful Policies */}
          <div className="lg:border-l lg:border-[#123D28]/25 lg:pl-6">
            <h4 className="font-serif font-bold text-xs tracking-wider uppercase text-[#123D28] mb-3">
              USEFUL POLICIES
            </h4>
            <ul className="space-y-1.5 text-xs text-[#123D28]/85">
              <li>
                <button
                  onClick={() => setLocation("/policies/privacy")}
                  className="hover:text-[#123D28] hover:underline transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/policies/returns")}
                  className="hover:text-[#123D28] hover:underline transition-colors text-left"
                >
                  Refund &amp; Returns
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/policies/shipping")}
                  className="hover:text-[#123D28] hover:underline transition-colors text-left"
                >
                  Shipping Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/policies/terms")}
                  className="hover:text-[#123D28] hover:underline transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div className="lg:border-l lg:border-[#123D28]/25 lg:pl-6">
            <h4 className="font-serif font-bold text-xs tracking-wider uppercase text-[#123D28] mb-3">
              CONTACT US
            </h4>
            <div className="space-y-3 text-xs text-[#123D28]/85">
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="text-[#123D28] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#123D28]">TRINAYAA ENTERPRISES</p>
                  <p className="text-[11px] text-[#123D28]/80 leading-snug">
                    Erode, Tamil Nadu – 638 001, India
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone size={15} className="text-[#123D28] shrink-0" />
                <a
                  href={`tel:${(socialLinks?.whatsappPhone || "+919442218990").replace(/[^0-9+]/g, "")}`}
                  className="hover:text-[#123D28] hover:underline"
                >
                  {socialLinks?.whatsappPhone || "+91 94422 18990"}
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail size={15} className="text-[#123D28] shrink-0" />
                <a
                  href="mailto:support@trinayaa.com"
                  className="hover:text-[#123D28] hover:underline"
                >
                  support@trinayaa.com
                </a>
              </div>
            </div>
          </div>

          {/* Column 5: Erode Map Badge (Expands to fit the right area seamlessly) */}
          <div className="lg:border-l lg:border-[#123D28]/25 lg:pl-6 flex flex-col items-center sm:items-start lg:items-end justify-center">
            <div
              className="w-full max-w-[280px] sm:max-w-[320px] rounded-2xl overflow-hidden shadow-sm border border-[#00250F] bg-[#003114] p-1.5 group hover:shadow-md hover:scale-[1.02] transition-all cursor-default"
              title="TRINAYAA Apothecary & Procurement Origin: Erode, Tamil Nadu, India"
            >
              <img
                src="/images/erode_badge_clean.png"
                alt="Erode District, Tamil Nadu, India"
                className="w-full h-auto object-cover rounded-xl"
              />
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright */}
        <div className="border-t border-[#123D28]/20 mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#123D28]/80 gap-2">
          <span>© 2026 TRINAYAA ENTERPRISES. All rights reserved.</span>
          <span className="text-[10px] text-[#123D28]/60">
            Handcrafted Herbal Botanicals from Erode, Tamil Nadu
          </span>
        </div>
      </div>
    </footer>
  );
}
