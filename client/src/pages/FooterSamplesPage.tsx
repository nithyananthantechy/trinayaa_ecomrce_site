import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import FooterVariation, { FooterVariantType } from "@/components/FooterVariation";
import BrandMark from "@/components/BrandMark";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Eye,
  Info,
  MapPin,
  Palette,
  Layers,
} from "lucide-react";

export default function FooterSamplesPage() {
  const [, setLocation] = useLocation();

  // Load client preview preference from localStorage
  const [selectedVariant, setSelectedVariant] = useState<FooterVariantType>("option1");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("trinayaa_preview_footer_theme") as FooterVariantType | null;
      if (saved && ["option1", "option2", "option3", "option4"].includes(saved)) {
        setSelectedVariant(saved);
      }
    } catch (e) {}
  }, []);

  const handleSelectOption = (variant: FooterVariantType) => {
    setSelectedVariant(variant);
    try {
      localStorage.setItem("trinayaa_preview_footer_theme", variant);
    } catch (e) {}
  };

  const scrollToOption = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F0] text-[#123D28]">
      {/* Top Banner Notice */}
      <div className="bg-[#123D28] text-white text-xs px-4 py-2.5 text-center font-medium flex items-center justify-center gap-2">
        <ShieldCheck size={15} className="text-[#E5C378]" />
        <span>
          <strong>Client Preview Mode:</strong> The current production footer remains 100% untouched until explicit client approval.
        </span>
      </div>

      {/* Preview Header & Controls */}
      <header className="border-b border-[#E5DECF] bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="p-2 rounded-lg hover:bg-[#F4EFE6] text-[#123D28] transition-colors"
              title="Return to Storefront Home"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <BrandMark />
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#EAE3D2] text-[#123D28]">
                  Phase 9
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#123D28] mt-1">
                Footer Design Variations &amp; Erode Location Integration
              </h1>
            </div>
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "option1", label: "Opt 1: Green & White" },
                { id: "option2", label: "Opt 2: White & Green" },
                { id: "option3", label: "Opt 3: Kraft & White" },
                { id: "option4", label: "Opt 4: Natural Olive" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => scrollToOption(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedVariant === opt.id
                    ? "bg-[#123D28] text-white shadow-xs"
                    : "bg-[#F4EFE6] hover:bg-[#EAE3D2] text-[#123D28]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-16">
        {/* Intro Context & Client Selection Status */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DECF] shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAE3D2] text-[#123D28]">
                <Layers size={14} /> Shared Split-Footer Architecture
              </div>
              <h2 className="text-2xl font-serif font-bold text-[#123D28]">
                Compare Four Client-Approved Botanical Footer Variations
              </h2>
              <p className="text-sm text-[#4B5563] leading-relaxed">
                All four themes maintain identical information hierarchy, proportions, and content placement:
                left branding panel with authentic TRINAYAA emblem, tagline, and dynamic social icons;
                right information section with Quick Links, Useful Policies, verified Erode facility address,
                official Erode district map silhouette, and one-tap WhatsApp customer care button.
              </p>
            </div>

            {/* Currently Selected Option Card */}
            <div className="p-5 rounded-xl bg-[#FBF8F0] border border-[#D5CBB5] sm:min-w-[280px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#718096] block mb-1">
                Your Current Preview Choice:
              </span>
              <p className="font-serif font-bold text-lg text-[#123D28] flex items-center gap-2">
                <Sparkles size={18} className="text-[#D97706]" />
                {selectedVariant === "option1" && "Option 1: Green & White"}
                {selectedVariant === "option2" && "Option 2: White & Green"}
                {selectedVariant === "option3" && "Option 3: Kraft & White"}
                {selectedVariant === "option4" && "Option 4: Natural Green & White"}
              </p>
              <span className="text-xs text-[#4B5563] block mt-1">
                Saved locally for review. Ready for client review &amp; sign-off.
              </span>
            </div>
          </div>
        </section>

        {/* ======================================================================
            OPTION 1: GREEN & WHITE
           ====================================================================== */}
        <section id="option1" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#123D28] text-white">
                Option 1 — Green &amp; White
              </span>
              <h3 className="text-xl font-serif font-bold text-[#123D28] mt-1.5">
                Deep Forest Green Left Branding Panel · Warm Ivory Right Information Area
              </h3>
              <p className="text-xs text-[#4B5563]">
                Emphasizes TRINAYAA's signature deep botanical green (`#123D28`) on the left with a bright, spacious information section.
              </p>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-[#718096]">Palette:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full border border-black/10 bg-[#123D28]" title="Forest Green #123D28" />
                <span className="w-5 h-5 rounded-full border border-black/10 bg-[#FFFFFF]" title="White #FFFFFF" />
                <span className="w-5 h-5 rounded-full border border-black/10 bg-[#FBF8F0]" title="Warm Ivory #FBF8F0" />
              </div>
            </div>
          </div>

          <FooterVariation
            variant="option1"
            isPreview
            isSelected={selectedVariant === "option1"}
            onSelectOption={handleSelectOption}
          />
        </section>

        {/* ======================================================================
            OPTION 2: WHITE & GREEN
           ====================================================================== */}
        <section id="option2" className="space-y-4 pt-6 border-t border-[#E5DECF]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-white text-[#123D28] border border-[#123D28]">
                Option 2 — White &amp; Green
              </span>
              <h3 className="text-xl font-serif font-bold text-[#123D28] mt-1.5">
                Clean White Branding Panel · Deep Forest Green Information Area with Warm Gold Headings
              </h3>
              <p className="text-xs text-[#4B5563]">
                Inverted balance with a crisp white emblem panel and rich forest green information columns highlighted with warm gold headings (`#E5C378`).
              </p>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-[#718096]">Palette:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full border border-black/10 bg-[#FFFFFF]" title="Crisp White #FFFFFF" />
                <span className="w-5 h-5 rounded-full border border-black/10 bg-[#123D28]" title="Forest Green #123D28" />
                <span className="w-5 h-5 rounded-full border border-black/10 bg-[#E5C378]" title="Warm Gold #E5C378" />
              </div>
            </div>
          </div>

          <FooterVariation
            variant="option2"
            isPreview
            isSelected={selectedVariant === "option2"}
            onSelectOption={handleSelectOption}
          />
        </section>

        {/* ======================================================================
            OPTION 3: KRAFT & WHITE
           ====================================================================== */}
        <section id="option3" className="space-y-4 pt-6 border-t border-[#E5DECF]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#C2A67E] text-[#123D28]">
                Option 3 — Kraft &amp; White
              </span>
              <h3 className="text-xl font-serif font-bold text-[#123D28] mt-1.5">
                Natural Earthen Kraft Packaging Panel · Warm Ivory Information Area
              </h3>
              <p className="text-xs text-[#4B5563]">
                Directly inspired by TRINAYAA's stand-up pouch packaging paper (`#C2A67E`), celebrating traditional apothecary raw materials.
              </p>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-[#718096]">Palette:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full border border-black/10 bg-[#C2A67E]" title="Earthen Kraft #C2A67E" />
                <span className="w-5 h-5 rounded-full border border-black/10 bg-[#123D28]" title="Botanical Green #123D28" />
                <span className="w-5 h-5 rounded-full border border-black/10 bg-[#FBF8F0]" title="Warm Ivory #FBF8F0" />
              </div>
            </div>
          </div>

          <FooterVariation
            variant="option3"
            isPreview
            isSelected={selectedVariant === "option3"}
            onSelectOption={handleSelectOption}
          />
        </section>

        {/* ======================================================================
            OPTION 4: NATURAL GREEN & WHITE
           ====================================================================== */}
        <section id="option4" className="space-y-4 pt-6 border-t border-[#E5DECF]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-[#3F5E4D] text-white">
                Option 4 — Natural Green &amp; White
              </span>
              <h3 className="text-xl font-serif font-bold text-[#123D28] mt-1.5">
                Muted Natural Olive Green Branding Panel · Crisp White Information Area
              </h3>
              <p className="text-xs text-[#4B5563]">
                Muted olive leaf tone (`#3F5E4D`) drawn from natural botanical herbs, paired with an airy white information area and olive Erode map silhouette.
              </p>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-[#718096]">Palette:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full border border-black/10 bg-[#3F5E4D]" title="Olive Green #3F5E4D" />
                <span className="w-5 h-5 rounded-full border border-black/10 bg-[#FFFFFF]" title="White #FFFFFF" />
                <span className="w-5 h-5 rounded-full border border-black/10 bg-[#123D28]" title="Botanical Green #123D28" />
              </div>
            </div>
          </div>

          <FooterVariation
            variant="option4"
            isPreview
            isSelected={selectedVariant === "option4"}
            onSelectOption={handleSelectOption}
          />
        </section>

        {/* Feature Matrix & Architecture Checklist */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E5DECF] shadow-xs space-y-6">
          <h3 className="text-lg font-serif font-bold text-[#123D28] flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-700" />
            Shared Layout Architecture &amp; Integrity Checklist
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#FBF8F0] border border-[#E5DECF] space-y-1.5">
              <span className="font-bold text-[#123D28] block">Left Branding Panel</span>
              <p className="text-[#4B5563]">
                Calibrated TRINAYAA emblem, tagline, botanical leaf decoration, and active social links (Instagram, Facebook, WhatsApp).
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#FBF8F0] border border-[#E5DECF] space-y-1.5">
              <span className="font-bold text-[#123D28] block">Right Information Section</span>
              <p className="text-[#4B5563]">
                3 balanced columns: Quick Links (Home, Products, B2B, About, Contact), Useful Policies (Privacy, Terms, Shipping, Returns), and Contact Us.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#FBF8F0] border border-[#E5DECF] space-y-1.5">
              <span className="font-bold text-[#123D28] block">Erode Location Badge</span>
              <p className="text-[#4B5563]">
                Official district silhouette traced from user reference, live pulsating Erode HQ pin marker, Indian flag (🇮🇳), and typography.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#FBF8F0] border border-[#E5DECF] space-y-1.5">
              <span className="font-bold text-[#123D28] block">Dynamic WhatsApp Button</span>
              <p className="text-[#4B5563]">
                Direct Click-to-Chat button connecting customers to TRINAYAA's verified helpline with prefilled greeting message.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#FBF8F0] border border-[#E5DECF] space-y-1.5">
              <span className="font-bold text-[#123D28] block">Policy CMS Integration</span>
              <p className="text-[#4B5563]">
                Full integration with Phase 8 Policy CMS and Social Link management; any admin edits reflect instantly across all footers.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#FBF8F0] border border-[#E5DECF] space-y-1.5">
              <span className="font-bold text-[#123D28] block">Production Safety Lock</span>
              <p className="text-[#4B5563]">
                The live storefront footer remains completely unchanged until client formally approves their preferred variation.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
