import React from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
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
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-6">
        {/* Main 4-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 items-start">
          {/* Column 1: Brand & Identity (span 4) */}
          <div className="lg:col-span-4 flex flex-col justify-between pr-0 lg:pr-4">
            {/* Logo + Tagline */}
            <div
              onClick={() => setLocation("/")}
              className="cursor-pointer inline-flex items-center gap-3 group"
              title="TRINAYAA Home"
            >
              <img
                src="/images/brand/emblem_crisp.png"
                alt="TRINAYAA Lotus Emblem"
                className="h-10 sm:h-11 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col leading-none">
                <span
                  className="font-serif font-bold text-lg sm:text-[21px] tracking-[0.22em] text-[#123D28] uppercase"
                  style={{ fontFamily: "'Cinzel', Georgia, serif" }}
                >
                  T R I N A Y A A
                </span>
                <span
                  className="text-[7.5px] sm:text-[8px] font-bold tracking-[0.14em] text-[#123D28] uppercase mt-1"
                  style={{ fontFamily: "Montserrat, system-ui, sans-serif" }}
                >
                  PURE SEEDS • RAW POWDERS • HERBS &amp; MORE
                </span>
              </div>
            </div>

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
                className="w-7 h-7 rounded-full border border-[#123D28]/40 flex items-center justify-center text-[#123D28] hover:bg-[#123D28] hover:text-[#E2BA89] transition-all"
              >
                <Instagram size={14} />
              </a>

              {/* Facebook */}
              <a
                href={socialLinks?.facebook || "https://facebook.com"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Follow TRINAYAA on Facebook"
                className="w-7 h-7 rounded-full border border-[#123D28]/40 flex items-center justify-center text-[#123D28] hover:bg-[#123D28] hover:text-[#E2BA89] transition-all"
              >
                <Facebook size={14} />
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                title="TRINAYAA on YouTube"
                className="w-7 h-7 rounded-full border border-[#123D28]/40 flex items-center justify-center text-[#123D28] hover:bg-[#123D28] hover:text-[#E2BA89] transition-all"
              >
                <Youtube size={14} />
              </a>

              {/* WhatsApp (Near Instagram as requested) */}
              <a
                href={socialLinks?.whatsappUrl || "https://wa.me/919876543210"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="Chat with TRINAYAA on WhatsApp"
                className="w-7 h-7 rounded-full border border-[#123D28]/40 flex items-center justify-center text-[#123D28] hover:bg-[#123D28] hover:text-[#E2BA89] transition-all"
              >
                <MessageCircle size={14} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links (span 2) */}
          <div className="lg:col-span-2 lg:border-l lg:border-[#123D28]/25 lg:pl-6">
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

          {/* Column 3: Useful Policies (span 2) */}
          <div className="lg:col-span-2 lg:border-l lg:border-[#123D28]/25 lg:pl-6">
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

          {/* Column 4: Contact Us + Erode Map Badge (span 4) */}
          <div className="lg:col-span-4 lg:border-l lg:border-[#123D28]/25 lg:pl-6 flex flex-col sm:flex-row items-start justify-between gap-5">
            {/* Contact Details */}
            <div className="flex-1">
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
                    href={`tel:${(socialLinks?.whatsappPhone || "+919876543210").replace(/[^0-9+]/g, "")}`}
                    className="hover:text-[#123D28] hover:underline"
                  >
                    {socialLinks?.whatsappPhone || "+91 98765 43210"}
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

            {/* Erode District Map Badge (Replaces previous leaf illustration) */}
            <div className="shrink-0 flex items-center justify-center self-center sm:self-auto pt-2 sm:pt-0">
              <div
                className="relative rounded-xl overflow-hidden shadow-sm border border-[#00250F] bg-[#003114] p-0.5 group hover:shadow-md hover:scale-[1.02] transition-all cursor-default"
                title="TRINAYAA Apothecary & Procurement Origin: Erode, Tamil Nadu, India"
              >
                <img
                  src="/images/erode_badge_clean.png"
                  alt="Erode District, Tamil Nadu, India"
                  className="h-20 sm:h-22 w-auto object-contain rounded-lg"
                />
              </div>
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
