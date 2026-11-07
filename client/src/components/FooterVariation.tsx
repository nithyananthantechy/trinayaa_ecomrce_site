import React from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import BrandMark from "./BrandMark";
import ErodeMapGraphic from "./ErodeMapGraphic";
import {
  Instagram,
  Facebook,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  MessageCircle,
  Leaf,
} from "lucide-react";

export type FooterVariantType = "option1" | "option2" | "option3" | "option4";

interface FooterVariationProps {
  variant?: FooterVariantType;
  isPreview?: boolean;
  onSelectOption?: (variant: FooterVariantType) => void;
  isSelected?: boolean;
}

interface ThemeConfig {
  name: string;
  subtitle: string;
  // Left Panel
  leftBg: string;
  leftText: string;
  leftTagline: string;
  leftSocialIconBg: string;
  leftSocialIconColor: string;
  leftSocialHoverBg: string;
  leftDividerColor: string;
  inverseLogo: boolean;
  // Right Section
  rightBg: string;
  rightHeadingColor: string;
  rightTextColor: string;
  rightLinkHover: string;
  // Map Styling
  mapColor: string;
  mapBadgeBg: string;
  mapBadgeBorder: string;
  mapTextColor: string;
  mapPinColor: string;
  // WhatsApp Button
  whatsappBtnBg: string;
  whatsappBtnText: string;
  whatsappBtnHoverBg: string;
  // Bottom Bar
  bottomBorderColor: string;
  bottomTextColor: string;
  bottomBg: string;
}

const THEMES: Record<FooterVariantType, ThemeConfig> = {
  // Option 1 — Green & White
  option1: {
    name: "Option 1: Green & White",
    subtitle: "Deep forest green branding panel with clean warm-ivory information area.",
    leftBg: "#123D28",
    leftText: "#FFFFFF",
    leftTagline: "#E5DECF",
    leftSocialIconBg: "rgba(255, 255, 255, 0.12)",
    leftSocialIconColor: "#FFFFFF",
    leftSocialHoverBg: "#1F5638",
    leftDividerColor: "#0D2C1D",
    inverseLogo: true,

    rightBg: "#FBF8F0",
    rightHeadingColor: "#123D28",
    rightTextColor: "#374151",
    rightLinkHover: "#123D28",

    mapColor: "#123D28",
    mapBadgeBg: "#FFFFFF",
    mapBadgeBorder: "rgba(18, 61, 40, 0.15)",
    mapTextColor: "#123D28",
    mapPinColor: "#E11D48",

    whatsappBtnBg: "#123D28",
    whatsappBtnText: "#FFFFFF",
    whatsappBtnHoverBg: "#0D2C1D",

    bottomBorderColor: "rgba(18, 61, 40, 0.1)",
    bottomTextColor: "#4B5563",
    bottomBg: "#F4EFE6",
  },

  // Option 2 — White & Green
  option2: {
    name: "Option 2: White & Green",
    subtitle: "Warm-ivory branding panel with deep forest green right section and subtle gold headings.",
    leftBg: "#FFFFFF",
    leftText: "#123D28",
    leftTagline: "#4B5563",
    leftSocialIconBg: "#F4EFE6",
    leftSocialIconColor: "#123D28",
    leftSocialHoverBg: "#EAE3D2",
    leftDividerColor: "#E5DECF",
    inverseLogo: false,

    rightBg: "#123D28",
    rightHeadingColor: "#E5C378", // Warm Gold
    rightTextColor: "#DFE7D7",
    rightLinkHover: "#FFFFFF",

    mapColor: "#FFFFFF",
    mapBadgeBg: "rgba(255, 255, 255, 0.12)",
    mapBadgeBorder: "rgba(255, 255, 255, 0.2)",
    mapTextColor: "#FFFFFF",
    mapPinColor: "#F59E0B",

    whatsappBtnBg: "#E5C378",
    whatsappBtnText: "#123D28",
    whatsappBtnHoverBg: "#D4AF37",

    bottomBorderColor: "rgba(255, 255, 255, 0.12)",
    bottomTextColor: "#CBD5E1",
    bottomBg: "#0E3020",
  },

  // Option 3 — Kraft & White
  option3: {
    name: "Option 3: Kraft & White",
    subtitle: "Natural kraft packaging earthen tone inspired by TRINAYAA pouch packaging.",
    leftBg: "#C2A67E", // Earthen Kraft tone from packaging
    leftText: "#123D28",
    leftTagline: "#2D4434",
    leftSocialIconBg: "rgba(18, 61, 40, 0.12)",
    leftSocialIconColor: "#123D28",
    leftSocialHoverBg: "rgba(18, 61, 40, 0.22)",
    leftDividerColor: "#AD8F65",
    inverseLogo: false,

    rightBg: "#FBF8F0",
    rightHeadingColor: "#123D28",
    rightTextColor: "#374151",
    rightLinkHover: "#123D28",

    mapColor: "#8C6D46",
    mapBadgeBg: "#FFFFFF",
    mapBadgeBorder: "rgba(140, 109, 70, 0.25)",
    mapTextColor: "#123D28",
    mapPinColor: "#B91C1C",

    whatsappBtnBg: "#123D28",
    whatsappBtnText: "#FFFFFF",
    whatsappBtnHoverBg: "#0D2C1D",

    bottomBorderColor: "rgba(140, 109, 70, 0.2)",
    bottomTextColor: "#4B5563",
    bottomBg: "#F0E9DC",
  },

  // Option 4 — Natural Green & White
  option4: {
    name: "Option 4: Natural Green & White",
    subtitle: "Muted natural olive botanical green panel with crisp white information area.",
    leftBg: "#3F5E4D", // Muted Olive Botanical tone
    leftText: "#FFFFFF",
    leftTagline: "#E3ECE6",
    leftSocialIconBg: "rgba(255, 255, 255, 0.15)",
    leftSocialIconColor: "#FFFFFF",
    leftSocialHoverBg: "#2E4739",
    leftDividerColor: "#2E4739",
    inverseLogo: true,

    rightBg: "#FFFFFF",
    rightHeadingColor: "#123D28",
    rightTextColor: "#374151",
    rightLinkHover: "#123D28",

    mapColor: "#3F5E4D",
    mapBadgeBg: "#F4F7F5",
    mapBadgeBorder: "rgba(63, 94, 77, 0.2)",
    mapTextColor: "#123D28",
    mapPinColor: "#DC2626",

    whatsappBtnBg: "#3F5E4D",
    whatsappBtnText: "#FFFFFF",
    whatsappBtnHoverBg: "#2E4739",

    bottomBorderColor: "#E5E7EB",
    bottomTextColor: "#4B5563",
    bottomBg: "#F8FAF9",
  },
};

export default function FooterVariation({
  variant = "option1",
  isPreview = false,
  onSelectOption,
  isSelected = false,
}: FooterVariationProps) {
  const [, setLocation] = useLocation();
  const theme = THEMES[variant] || THEMES.option1;

  // Retrieve dynamic social links from Phase 8 CMS
  const { data: socialLinks } = trpc.content.getSocialLinks.useQuery();

  return (
    <div
      className={`footer-variation-container rounded-2xl overflow-hidden shadow-sm border transition-all ${
        isSelected ? "ring-4 ring-[#123D28] ring-offset-2" : "border-[#E5DECF]"
      }`}
    >
      {/* Optional Client Preview Header Header Bar */}
      {isPreview && (
        <div className="bg-[#123D28] text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-[#0D2C1D]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white">
                {variant.toUpperCase()}
              </span>
              <h3 className="font-serif font-bold text-sm sm:text-base">
                {theme.name}
              </h3>
            </div>
            <p className="text-xs text-[#E5DECF] mt-0.5">{theme.subtitle}</p>
          </div>

          {onSelectOption && (
            <button
              onClick={() => onSelectOption(variant)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isSelected
                  ? "bg-white text-[#123D28] shadow-sm"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              {isSelected ? "✓ Selected Option" : "Select this Theme"}
            </button>
          )}
        </div>
      )}

      {/* Main Split-Footer Body */}
      <footer className="w-full flex flex-col lg:flex-row overflow-hidden">
        {/* ============================================================
            LEFT BRANDING PANEL
            Includes: Brand Logo, Tagline, Social Icons, Botanical Leaf,
            and Curved Right-Side Divider
           ============================================================ */}
        <div
          className="lg:w-[32%] xl:w-[30%] p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden"
          style={{
            backgroundColor: theme.leftBg,
            color: theme.leftText,
          }}
        >
          {/* Subtle Decorative Botanical Leaf Watermark */}
          <div
            className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none"
            aria-hidden="true"
          >
            <Leaf size={160} style={{ color: theme.leftText }} />
          </div>

          {/* Logo & Tagline */}
          <div className="relative z-10">
            <div className="mb-4">
              <BrandMark inverse={theme.inverseLogo} />
            </div>
            <p
              className="text-sm font-serif italic tracking-wide mt-3 max-w-xs leading-relaxed"
              style={{ color: theme.leftTagline }}
            >
              Pure seeds. Raw powders.
              <br />
              True herbs.
            </p>
            <p
              className="text-xs tracking-wider uppercase mt-4 opacity-75 font-medium"
              style={{ color: theme.leftTagline }}
            >
              Traditional Tamil &amp; Ayurvedic Heritage
            </p>
          </div>

          {/* Social Media & WhatsApp Links (Dynamic from Phase 8) */}
          <div className="mt-8 relative z-10">
            <span
              className="text-[11px] font-semibold uppercase tracking-wider block mb-3 opacity-80"
              style={{ color: theme.leftTagline }}
            >
              Follow Our Botanical Journey
            </span>
            <div className="flex items-center gap-2.5">
              {/* Instagram */}
              {socialLinks?.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    backgroundColor: theme.leftSocialIconBg,
                    color: theme.leftSocialIconColor,
                  }}
                  aria-label="Follow TRINAYAA on Instagram"
                >
                  <Instagram size={17} />
                </a>
              )}

              {/* Facebook */}
              {socialLinks?.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    backgroundColor: theme.leftSocialIconBg,
                    color: theme.leftSocialIconColor,
                  }}
                  aria-label="Follow TRINAYAA on Facebook"
                >
                  <Facebook size={17} />
                </a>
              )}

              {/* WhatsApp Click-to-Chat */}
              {socialLinks?.whatsappUrl && (
                <a
                  href={socialLinks.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    backgroundColor: theme.leftSocialIconBg,
                    color: theme.leftSocialIconColor,
                  }}
                  aria-label="Chat with TRINAYAA Care Desk on WhatsApp"
                >
                  <MessageCircle size={17} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================
            RIGHT INFORMATION SECTION
            Column 1: Quick Links
            Column 2: Useful Policies
            Column 3: Contact Us + Erode Map Graphic + WhatsApp Action
           ============================================================ */}
        <div
          className="flex-1 p-8 sm:p-10 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10"
          style={{
            backgroundColor: theme.rightBg,
            color: theme.rightTextColor,
          }}
        >
          {/* COLUMN 1: QUICK LINKS */}
          <div className="footer-col">
            <h4
              className="text-xs font-bold uppercase tracking-[0.16em] mb-4 pb-1 border-b"
              style={{
                color: theme.rightHeadingColor,
                borderColor: theme.bottomBorderColor,
              }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <button
                  onClick={() => setLocation("/")}
                  className="hover:underline text-left transition-colors"
                  style={{ color: theme.rightTextColor }}
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/products")}
                  className="hover:underline text-left transition-colors"
                  style={{ color: theme.rightTextColor }}
                >
                  Products Catalogue
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/bulk-enquiry")}
                  className="hover:underline text-left transition-colors flex items-center gap-1.5"
                  style={{ color: theme.rightTextColor }}
                >
                  <span>Bulk &amp; Wholesale</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold uppercase">
                    B2B
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/about")}
                  className="hover:underline text-left transition-colors"
                  style={{ color: theme.rightTextColor }}
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/contact")}
                  className="hover:underline text-left transition-colors"
                  style={{ color: theme.rightTextColor }}
                >
                  Contact Care Desk
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 2: USEFUL POLICIES */}
          <div className="footer-col">
            <h4
              className="text-xs font-bold uppercase tracking-[0.16em] mb-4 pb-1 border-b"
              style={{
                color: theme.rightHeadingColor,
                borderColor: theme.bottomBorderColor,
              }}
            >
              Useful Policies
            </h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <button
                  onClick={() => setLocation("/policies/privacy")}
                  className="hover:underline text-left transition-colors"
                  style={{ color: theme.rightTextColor }}
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/policies/terms")}
                  className="hover:underline text-left transition-colors"
                  style={{ color: theme.rightTextColor }}
                >
                  Terms &amp; Conditions
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/policies/shipping")}
                  className="hover:underline text-left transition-colors"
                  style={{ color: theme.rightTextColor }}
                >
                  Shipping &amp; Delivery Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/policies/returns")}
                  className="hover:underline text-left transition-colors"
                  style={{ color: theme.rightTextColor }}
                >
                  Return &amp; Refund Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => setLocation("/track-order")}
                  className="hover:underline text-left transition-colors"
                  style={{ color: theme.rightTextColor }}
                >
                  Track Order
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: CONTACT US + ERODE DISTRICT MAP GRAPHIC */}
          <div className="footer-col flex flex-col justify-between">
            <div>
              <h4
                className="text-xs font-bold uppercase tracking-[0.16em] mb-4 pb-1 border-b"
                style={{
                  color: theme.rightHeadingColor,
                  borderColor: theme.bottomBorderColor,
                }}
              >
                Contact Us
              </h4>

              <div className="space-y-2.5 text-xs">
                <p className="font-semibold" style={{ color: theme.rightHeadingColor }}>
                  TRINAYAA ENTERPRISES
                </p>
                <p className="leading-relaxed opacity-90 flex items-start gap-1.5">
                  <MapPin size={14} className="shrink-0 mt-0.5 text-emerald-600" />
                  <span>
                    42, Kongu Nagar, Erode,
                    <br />
                    Tamil Nadu – 638002, India
                  </span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone size={14} className="shrink-0 text-emerald-600" />
                  <a
                    href="tel:+919442218990"
                    className="hover:underline"
                    style={{ color: theme.rightTextColor }}
                  >
                    +91 94422 18990
                  </a>
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail size={14} className="shrink-0 text-emerald-600" />
                  <a
                    href="mailto:support@trinayaa.in"
                    className="hover:underline"
                    style={{ color: theme.rightTextColor }}
                  >
                    support@trinayaa.in
                  </a>
                </p>
              </div>

              {/* Erode District Map Graphic placed beside Contact Information */}
              <div className="mt-4">
                <ErodeMapGraphic
                  mapColor={theme.mapColor}
                  textColor={theme.mapTextColor}
                  badgeBg={theme.mapBadgeBg}
                  badgeBorder={theme.mapBadgeBorder}
                  pinColor={theme.mapPinColor}
                />
              </div>
            </div>

            {/* WhatsApp Customer Care Button */}
            {socialLinks?.whatsappUrl && (
              <div className="mt-5 pt-3">
                <a
                  href={socialLinks.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs"
                  style={{
                    backgroundColor: theme.whatsappBtnBg,
                    color: theme.whatsappBtnText,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.whatsappBtnHoverBg;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.whatsappBtnBg;
                  }}
                >
                  <MessageCircle size={15} />
                  <span>WhatsApp Erode Care Team</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* ============================================================
          BOTTOM FOOTER BAR
          Copyright Notice and Fast Legal Links
         ============================================================ */}
      <div
        className="px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] border-t"
        style={{
          backgroundColor: theme.bottomBg,
          borderColor: theme.bottomBorderColor,
          color: theme.bottomTextColor,
        }}
      >
        <span>&copy; 2026 TRINAYAA ENTERPRISES. All rights reserved.</span>
        <div className="flex flex-wrap items-center gap-4 text-[11px]">
          <button
            onClick={() => setLocation("/policies/shipping")}
            className="hover:underline"
          >
            Shipping
          </button>
          <span>·</span>
          <button
            onClick={() => setLocation("/policies/returns")}
            className="hover:underline"
          >
            Returns
          </button>
          <span>·</span>
          <button
            onClick={() => setLocation("/policies/privacy")}
            className="hover:underline"
          >
            Privacy Policy
          </button>
          <span>·</span>
          <button
            onClick={() => setLocation("/policies/terms")}
            className="hover:underline"
          >
            Terms &amp; Conditions
          </button>
        </div>
      </div>
    </div>
  );
}
