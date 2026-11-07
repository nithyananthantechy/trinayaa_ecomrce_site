import React from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import BrandMark from "./BrandMark";
import { Instagram, Facebook, MapPin, Mail, Phone } from "lucide-react";

export default function StoreFooter() {
  const [, setLocation] = useLocation();
  const { data: socialLinks } = trpc.content.getSocialLinks.useQuery();

  return (
    <footer className="site-footer">
      <div className="footer-inner container-wide">
        <div className="footer-brand">
          <BrandMark inverse />
          <p>
            Pure seeds. Raw powders.<br />
            True herbs.
          </p>
          <div className="socials">
            {/* Instagram */}
            {socialLinks?.instagram && (
              <a
                href={socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Follow TRINAYAA on Instagram"
              >
                <Instagram size={16} />
              </a>
            )}

            {/* Facebook */}
            {socialLinks?.facebook && (
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Follow TRINAYAA on Facebook"
              >
                <Facebook size={16} />
              </a>
            )}

            {/* WhatsApp (Replaced YouTube per Phase 8 specification) */}
            {socialLinks?.whatsappUrl && (
              <a
                href={socialLinks.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="Chat with TRINAYAA Customer Care on WhatsApp"
                className="hover:text-[#25D366] transition-colors"
              >
                <svg
                  className="w-4 h-4 fill-current"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.584 1.961.949 2.8.949 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.772-5.766zm3.385 8.163c-.144.405-.837.774-1.17.824-.311.045-.698.071-2.227-.563-1.823-.759-2.997-2.618-3.088-2.739-.09-.12-1.002-1.332-1.002-2.54 0-1.208.634-1.802.859-2.048.225-.246.492-.308.656-.308.164 0 .328.002.472.009.153.007.359-.058.56.425.207.498.706 1.724.767 1.849.061.125.103.272.02.435-.082.163-.123.264-.246.408-.123.144-.258.322-.369.432-.123.123-.252.257-.108.503.144.246.638 1.053 1.368 1.704.94.839 1.733 1.098 1.979 1.221.246.123.39.103.534-.061.144-.164.614-.717.778-.963.164-.246.328-.205.553-.123.225.082 1.433.676 1.679.799.246.123.409.184.471.287.061.103.061.594-.083.999zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.434 5.176L2 22l4.957-1.399C8.414 21.498 10.15 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2c-1.614 0-3.13-.503-4.398-1.365l-.315-.216-2.946.832.836-2.871-.212-.338C6.037 14.938 5.5 13.518 5.5 12c0-3.584 2.916-6.5 6.5-6.5s6.5 2.916 6.5 6.5-2.916 6.5-6.5 6.5z" />
                </svg>
              </a>
            )}
          </div>
        </div>

        <div className="footer-column">
          <span className="footer-title">Quick links</span>
          <button
            onClick={() => setLocation("/")}
            className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1"
          >
            Home
          </button>
          <button
            onClick={() => setLocation("/products")}
            className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1"
          >
            Products
          </button>
          <button
            onClick={() => setLocation("/bulk-enquiry")}
            className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1"
          >
            Bulk / Wholesale
          </button>
          <button
            onClick={() => setLocation("/about")}
            className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1"
          >
            About
          </button>
          <button
            onClick={() => setLocation("/contact")}
            className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1"
          >
            Contact
          </button>
        </div>

        <div className="footer-column">
          <span className="footer-title">Customer care</span>
          <button onClick={() => setLocation("/about")}>About Us</button>
          <button onClick={() => setLocation("/contact")}>Contact</button>
          <button onClick={() => setLocation("/track-order")}>Track Order</button>
          <button onClick={() => setLocation("/admin/login")}>Admin Portal</button>
        </div>

        <div className="footer-column footer-contact">
          <span className="footer-title">Contact us</span>
          <span>
            <MapPin size={15} /> Erode, Tamil Nadu – 638002
          </span>
          <a href="mailto:support@trinayaa.in">
            <Mail size={15} /> support@trinayaa.in
          </a>
          {socialLinks?.whatsappPhone ? (
            <a href={`tel:${socialLinks.whatsappPhone.replace(/[^0-9+]/g, "")}`}>
              <Phone size={15} /> {socialLinks.whatsappPhone}
            </a>
          ) : (
            <a href="tel:+919876543210">
              <Phone size={15} /> +91 98765 43210
            </a>
          )}
        </div>
      </div>

      <div className="footer-bottom container-wide">
        <span>© 2026 TRINAYAA ENTERPRISES. All rights reserved.</span>
        <div className="footer-policies">
          <button
            onClick={() => setLocation("/policies/privacy")}
            className="hover:underline text-xs"
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setLocation("/policies/terms")}
            className="hover:underline text-xs"
          >
            Terms &amp; Conditions
          </button>
          <button
            onClick={() => setLocation("/policies/shipping")}
            className="hover:underline text-xs"
          >
            Shipping Policy
          </button>
          <button
            onClick={() => setLocation("/policies/returns")}
            className="hover:underline text-xs"
          >
            Return Policy
          </button>
        </div>
      </div>
    </footer>
  );
}
