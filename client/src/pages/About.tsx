import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Leaf,
  ShieldCheck,
  Truck,
  Package,
  CheckCircle2,
  Menu,
  UserRound,
  ShoppingBag,
  Search,
  Instagram,
  Facebook,
  Award,
  HeartHandshake,
  Sprout,
  Sparkles,
  ArrowRight
} from "lucide-react";

import BrandMark from "@/components/BrandMark";
import StoreFooter from "@/components/StoreFooter";


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

export default function About() {
  const [, setLocation] = useLocation();
  const { data: currentUser } = trpc.auth.me.useQuery();

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
            <button onClick={() => setLocation("/about")} className="font-bold text-[#123D28] underline underline-offset-4">About</button>
            <button onClick={() => setLocation("/contact")}>Contact</button>
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

      {/* About Hero Banner */}
      <div className="bg-[#FAF3E5] border-b border-[#E5DECF] py-14 md:py-20">
        <div className="container-wide text-center max-w-3xl mx-auto px-4">
          <span className="eyebrow inline-block text-xs font-bold tracking-widest text-[#8E734B] uppercase mb-2">
            The TRINAYAA Heritage
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#123D28] tracking-tight mb-5 leading-tight">
            Rooted in Tradition.<br />Crafted for Modern Life.
          </h1>
          <p className="text-[#4B5046] text-base md:text-lg leading-relaxed font-serif">
            Born in the agricultural heartland of Erode, Tamil Nadu, TRINAYAA was founded with one clear conviction: genuine health starts with uncompromised, raw botanical ingredients.
          </p>
        </div>
      </div>

      <main className="container-wide py-14 md:py-20 px-4">
        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
          <div className="lg:col-span-6 space-y-5">
            <span className="eyebrow text-xs font-bold uppercase tracking-wider text-[#8E734B] block">Why We Exist</span>
            <h2 className="font-serif text-2xl md:text-4xl font-bold text-[#123D28] leading-tight">
              Pure Seeds. Raw Powders. True Herbs.
            </h2>
            <p className="text-sm md:text-base text-[#4B5046] leading-relaxed font-serif">
              In an era of mass-market wellness products diluted with starch fillers, artificial colorants, and synthetic additives, TRINAYAA stands firmly for single-ingredient integrity.
            </p>
            <p className="text-xs md:text-sm text-[#4B5046] leading-relaxed font-sans">
              We collaborate with generations-old farming communities across Western Tamil Nadu to source clean, potent botanicals. Our seeds are sun-dried, cleaned of chaff, and packed raw. Our herbal powders are milled slowly at low temperatures to protect the volatile aromatic oils and natural phytochemicals that make traditional herbs truly effective.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setLocation("/")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#123D28] text-white text-xs font-bold rounded-lg hover:bg-[#1A4D33] transition-colors uppercase tracking-wider"
              >
                Explore Catalogue <ArrowRight size={15} />
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-[#FAF3E5] p-8 md:p-10 rounded-3xl border border-[#E5DECF] relative overflow-hidden">
              <div className="absolute top-4 right-4 text-[#D5CBB5] opacity-20 pointer-events-none">
                <Leaf size={140} />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#123D28] mb-4">Our Three Sacred Principles</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-[#123D28] text-white flex items-center justify-center shrink-0 font-serif font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#123D28]">Pure Botanical Seeds</h4>
                    <p className="text-xs text-[#4B5046] leading-relaxed mt-0.5">
                      Intact, high-germination seeds packed fresh—from fenugreek and black seed (kalonji) to chia, flax, and basil seeds.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-[#123D28] text-white flex items-center justify-center shrink-0 font-serif font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#123D28]">Unadulterated Raw Powders</h4>
                    <p className="text-xs text-[#4B5046] leading-relaxed mt-0.5">
                      Micro-pulverized 100% pure botanical powders. No maltodextrin, no anti-caking chemicals, zero preservatives.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-[#123D28] text-white flex items-center justify-center shrink-0 font-serif font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#123D28]">Authentic True Herbs</h4>
                    <p className="text-xs text-[#4B5046] leading-relaxed mt-0.5">
                      Whole dried roots, barks, flowers, and leaves harvested at peak potency across Tamil Nadu’s Western Ghats buffer zones.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Core Commitments Grid */}
        <div className="mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="eyebrow text-xs font-bold uppercase tracking-widest text-[#8E734B] block mb-2">Our Standard</span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#123D28]">What Sets TRINAYAA Apart</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-7 rounded-2xl border border-[#E5DECF] shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#EAE3D2] text-[#123D28] flex items-center justify-center mb-5">
                <Sprout size={24} />
              </div>
              <h3 className="font-serif text-base font-bold text-[#123D28] mb-2">Farm Direct Sourcing</h3>
              <p className="text-xs text-[#4B5046] leading-relaxed">
                Direct partnerships with smallholder farmers eliminate middlemen, ensuring optimal freshness and fair compensation.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-[#E5DECF] shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#EAE3D2] text-[#123D28] flex items-center justify-center mb-5">
                <Award size={24} />
              </div>
              <h3 className="font-serif text-base font-bold text-[#123D28] mb-2">Lab Tested Purity</h3>
              <p className="text-xs text-[#4B5046] leading-relaxed">
                Every batch is evaluated for moisture, ash content, microbial safety, and absence of heavy metals or synthetic colors.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-[#E5DECF] shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#EAE3D2] text-[#123D28] flex items-center justify-center mb-5">
                <Package size={24} />
              </div>
              <h3 className="font-serif text-base font-bold text-[#123D28] mb-2">Airtight Protection</h3>
              <p className="text-xs text-[#4B5046] leading-relaxed">
                Packed in multi-layer food-grade resealable pouches that shield delicate herbal actives against humidity, UV, and oxidation.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-[#E5DECF] shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#EAE3D2] text-[#123D28] flex items-center justify-center mb-5">
                <Truck size={24} />
              </div>
              <h3 className="font-serif text-base font-bold text-[#123D28] mb-2">Pan-India Express</h3>
              <p className="text-xs text-[#4B5046] leading-relaxed">
                Reliable tracked express logistics delivering farm-fresh botanicals directly from Erode to every Indian doorstep.
              </p>
            </div>
          </div>
        </div>

        {/* Erode Facility Strip */}
        <div className="bg-[#FAF3E5] p-8 md:p-12 rounded-3xl border border-[#E5DECF] mb-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="eyebrow text-xs font-bold uppercase tracking-wider text-[#8E734B] block mb-2">
              Facility &amp; Operations
            </span>
            <h3 className="font-serif text-2xl font-bold text-[#123D28] mb-3">
              Packaged with Care in Erode, Tamil Nadu
            </h3>
            <p className="text-xs md:text-sm text-[#4B5046] leading-relaxed">
              Known globally as the Turmeric City of India, Erode is surrounded by ancient agricultural corridors where traditional herb cultivation has flourished for centuries. Our hygienic packaging facility adheres strictly to food-safety and traditional handling protocols.
            </p>
          </div>
          <button
            onClick={() => setLocation("/contact")}
            className="shrink-0 px-6 py-3.5 bg-[#123D28] text-white text-xs font-bold rounded-lg hover:bg-[#1A4D33] transition-colors uppercase tracking-wider shadow-sm"
          >
            Connect with Us &rarr;
          </button>
        </div>

        <TrustRow />
      </main>

      {/* Official Site Footer */}
      <StoreFooter />
    </div>
  );
}
