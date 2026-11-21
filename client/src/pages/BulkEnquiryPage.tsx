import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import BrandMark from "@/components/BrandMark";
import BulkEnquiryDialog from "@/components/BulkEnquiryDialog";
import StoreFooter from "@/components/StoreFooter";
import {
  Building2,
  Package,
  ShieldCheck,
  Truck,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";

export default function BulkEnquiryPage() {
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF7EB] text-[#1A261D] flex flex-col font-sans">
      {/* Top Banner */}
      <div className="bg-[#123D28] text-white text-[11px] py-2 px-4 text-center font-medium tracking-wide">
        🌿 Official TRINAYAA B2B Wholesale Portal · Direct Source from Erode, Tamil Nadu · Pan-India Dispatch
      </div>

      {/* Main Header */}
      <header className="border-b border-[#E2DBCB] bg-[#FCFBF7] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/">
            <a className="inline-block">
              <BrandMark />
            </a>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/products">
              <a className="text-xs sm:text-sm font-semibold text-[#123D28] hover:text-[#8C6D3F] transition-colors">
                Browse Retail Shop
              </a>
            </Link>
            <button
              onClick={() => setDialogOpen(true)}
              className="py-2 px-4 bg-[#123D28] hover:bg-[#1B4E35] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Building2 size={15} />
              <span>Request Quote Now</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative py-12 sm:py-16 px-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EAF2ED] border border-[#C5DCCB] text-[#123D28] text-xs font-bold rounded-full uppercase tracking-wider">
                <Sparkles size={13} />
                <span>B2B Supply & Institutional Orders</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#123D28] leading-tight">
                Bulk Botanical Sourcing for Wholesalers, Retailers & Clinics
              </h1>
              <p className="text-sm sm:text-base text-[#4E5649] leading-relaxed max-w-2xl">
                Source 100% authentic, pesticide-free Tamil botanical powders, whole seeds and herbs
                in commercial quantities. Cleanly packed in Erode, Tamil Nadu with complete batch traceability
                and direct-from-source wholesale rates.
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  onClick={() => setDialogOpen(true)}
                  className="py-3 px-6 bg-[#123D28] hover:bg-[#1B4E35] text-white text-sm font-semibold rounded-lg shadow transition-colors flex items-center gap-2"
                >
                  <Building2 size={16} />
                  <span>Open Wholesale Quotation Form</span>
                </button>
                <a
                  href="#how-it-works"
                  className="py-3 px-5 border border-[#C9C0AD] hover:bg-[#F2EDE2] text-[#2C382A] text-sm font-semibold rounded-lg transition-colors"
                >
                  How Wholesale Ordering Works
                </a>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#E5DECF]">
                <div className="flex flex-col">
                  <span className="font-serif text-xl font-bold text-[#123D28]">162+</span>
                  <span className="text-xs text-[#6C7167]">Botanical SKUs</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-xl font-bold text-[#123D28]">25kg - 500kg</span>
                  <span className="text-xs text-[#6C7167]">Flexible Packaging</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-xl font-bold text-[#123D28]">24 Hours</span>
                  <span className="text-xs text-[#6C7167]">Quote Turnaround</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-serif text-xl font-bold text-[#123D28]">Pan-India</span>
                  <span className="text-xs text-[#6C7167]">Road & Rail Cargo</span>
                </div>
              </div>
            </div>

            {/* Right Card */}
            <div className="lg:col-span-5 bg-white border border-[#DDD5C5] rounded-2xl p-6 shadow-md">
              <div className="flex items-center gap-3 border-b border-[#EAE3D5] pb-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#EAF2ED] text-[#123D28] flex items-center justify-center font-bold">
                  🌿
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#123D28]">Direct B2B Sales Desk</h3>
                  <p className="text-xs text-[#6C7167]">TRINAYAA Enterprises · Erode, TN</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-[#3E473A]">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#123D28] shrink-0 mt-0.5" />
                  <div>
                    <strong>Custom Packaging Available:</strong> 1kg vacuum foil bags, 25kg multi-wall
                    paper sacks, 50kg export HDPE bags.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#123D28] shrink-0 mt-0.5" />
                  <div>
                    <strong>Commercial Supply:</strong> Ayurvedic pharmacies, organic stores, herbal
                    cosmetic formulators, food seasoning producers.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#123D28] shrink-0 mt-0.5" />
                  <div>
                    <strong>Batch Testing & COA:</strong> Certified purity parameters, moisture levels
                    and microbial clearance for institutional buyers.
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#EAE3D5]">
                <button
                  onClick={() => setDialogOpen(true)}
                  className="w-full py-2.5 bg-[#8C6D3F] hover:bg-[#785B31] text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileSpreadsheet size={15} />
                  <span>Start Wholesale Request</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-[#F4EFE6] py-12 px-4 border-y border-[#E2DBCB]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs uppercase font-bold tracking-widest text-[#8C6D3F]">
                Streamlined Procurement
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#123D28] mt-1">
                How TRINAYAA Bulk Sourcing Works
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-[#DCD5C5] shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-[#EAF2ED] text-[#123D28] flex items-center justify-center font-bold text-sm mb-3">
                  01
                </div>
                <h3 className="font-bold text-sm text-[#123D28] mb-1">Submit Your Product List</h3>
                <p className="text-xs text-[#5C6556] leading-relaxed">
                  Choose from our 162 botanical powders, seeds and whole herbs. Specify desired
                  quantities (kg or bag count) and delivery destination.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-[#DCD5C5] shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-[#EAF2ED] text-[#123D28] flex items-center justify-center font-bold text-sm mb-3">
                  02
                </div>
                <h3 className="font-bold text-sm text-[#123D28] mb-1">Receive Tiered Quotation</h3>
                <p className="text-xs text-[#5C6556] leading-relaxed">
                  Our wholesale desk calculates volume pricing, freight estimates and dispatch
                  schedules within 24 hours via Email or WhatsApp.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-[#DCD5C5] shadow-sm">
                <div className="w-9 h-9 rounded-lg bg-[#EAF2ED] text-[#123D28] flex items-center justify-center font-bold text-sm mb-3">
                  03
                </div>
                <h3 className="font-bold text-sm text-[#123D28] mb-1">Direct Mill Dispatch</h3>
                <p className="text-xs text-[#5C6556] leading-relaxed">
                  Upon approval, orders are packed fresh in Erode and shipped via reliable logistics
                  partners with live cargo tracking.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Official Master Store Footer */}
      <StoreFooter />

      {/* Bulk Enquiry Dialog */}
      <BulkEnquiryDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
