import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import BrandMark from "@/components/BrandMark";
import StoreFooter from "@/components/StoreFooter";
import AuthModal from "@/components/AuthModal";
import {
  PackageSearch,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Image as ImageIcon,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";

const CATEGORY_OPTIONS = [
  "Raw Herbal Powders",
  "True Single Herbs",
  "Pure Natural Seeds",
  "Botanical Roots & Barks",
  "Traditional Flower Powders",
  "Cold Pressed Oils",
  "Custom Herbal Formulation",
  "Other / Unlisted",
];

const PACK_SIZE_OPTIONS = [
  "50g / 100g Trial Pack",
  "250g Household Pack",
  "500g Pouch",
  "1 kg Standard Pack",
  "5 kg Commercial / Bulk",
  "10+ kg Wholesale",
];

export default function ProductEnquiryPage() {
  const [, setLocation] = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Form states
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [requestedQuantity, setRequestedQuantity] = useState("");
  const [preferredPackSize, setPreferredPackSize] = useState("");
  const [description, setDescription] = useState("");
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Submission result modal/banner
  const [lastSubmittedEnquiry, setLastSubmittedEnquiry] = useState<{
    enquiryNumber: string;
    productName: string;
    requestedQuantity: string;
  } | null>(null);

  // User auth state
  const { data: currentUser, isLoading: userLoading } = trpc.auth.me.useQuery();

  // Enquiry history query
  const {
    data: myEnquiries = [],
    isLoading: enquiriesLoading,
    refetch: refetchEnquiries,
  } = trpc.productEnquiries.myEnquiries.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });

  // Submit mutation
  const submitEnquiryMutation = trpc.productEnquiries.submit.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Product enquiry ${data.enquiryNumber} submitted successfully!`);
      setLastSubmittedEnquiry({
        enquiryNumber: data.enquiryNumber,
        productName: data.productName,
        requestedQuantity: data.requestedQuantity,
      });
      // Reset form
      setProductName("");
      setCategory("");
      setRequestedQuantity("");
      setPreferredPackSize("");
      setDescription("");
      setReferenceImageUrl(null);
      refetchEnquiries();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit product enquiry. Please try again.");
    },
  });

  // Handle image upload via existing /api/upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpe?g|webp)$/i)) {
      toast.error("Please select a valid image (PNG, JPEG, WEBP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size exceeds the 10 MB limit.");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              fileData: reader.result,
              mimeType: file.type,
            }),
          });
          const json = await res.json();
          if (res.ok && json.url) {
            setReferenceImageUrl(json.url);
            toast.success("Reference image uploaded successfully");
          } else {
            toast.error(json.error || "Image upload failed");
          }
        } catch (uploadErr) {
          toast.error("Image upload failed. Please try again.");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
      toast.error("Unable to process image file.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    if (!productName.trim() || productName.trim().length < 2) {
      toast.error("Please enter a valid product name (minimum 2 characters).");
      return;
    }

    if (!requestedQuantity.trim()) {
      toast.error("Please enter your preferred quantity (e.g. 500g, 1 kg, 5 packs).");
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error("Please provide a short description or requirement of at least 10 characters.");
      return;
    }

    submitEnquiryMutation.mutate({
      productName: productName.trim(),
      category: category.trim() || undefined,
      requestedQuantity: requestedQuantity.trim(),
      preferredPackSize: preferredPackSize.trim() || undefined,
      description: description.trim(),
      referenceImage: referenceImageUrl || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NEW":
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-sky-100 text-sky-800 border border-sky-200">New Request</span>;
      case "UNDER_REVIEW":
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-200">Under Review</span>;
      case "SOURCING":
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">Sourcing in Progress</span>;
      case "AVAILABLE":
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">Available in Store!</span>;
      case "UNABLE_TO_SOURCE":
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300">Unable to Source</span>;
      case "CLOSED":
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">Closed</span>;
      default:
        return <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-stone-100 text-stone-700">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7EB] text-[#1A261D] flex flex-col font-sans">
      {/* Top Banner */}
      <div className="bg-[#123D28] text-white text-[11px] py-2 px-4 text-center font-medium tracking-wide">
        🌿 100% Pure Botanical Sourcing · Direct from Erode &amp; Kongu Farms, Tamil Nadu
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
                Catalogue
              </a>
            </Link>
            <Link href="/bulk-enquiry">
              <a className="text-xs sm:text-sm font-semibold text-[#123D28] hover:text-[#8C6D3F] transition-colors hidden sm:inline">
                Wholesale Quote
              </a>
            </Link>
            {currentUser ? (
              <Link href="/account">
                <a className="py-2 px-3.5 bg-[#123D28]/10 hover:bg-[#123D28]/15 text-[#123D28] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5">
                  <User size={14} />
                  <span>My Account</span>
                </a>
              </Link>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="py-2 px-4 bg-[#123D28] hover:bg-[#1B4E35] text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-5 pb-2 text-xs text-[#6C7167] flex items-center gap-1.5">
        <Link href="/">
          <a className="hover:text-[#123D28] transition-colors">Home</a>
        </Link>
        <span>/</span>
        <Link href="/account">
          <a className="hover:text-[#123D28] transition-colors">Account</a>
        </Link>
        <span>/</span>
        <span className="text-[#123D28] font-semibold">Request a Product</span>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-10">
        {/* Page Hero Header */}
        <div className="bg-gradient-to-r from-[#123D28] to-[#1F5438] text-white rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="max-w-2xl relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium text-[#E5DECF] border border-white/15">
              <Sparkles size={13} className="text-[#E8BF83]" />
              <span>Bespoke Sourcing Service</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-[#FAF7EB]">
              Request a Product
            </h1>
            <p className="text-sm sm:text-base text-[#D3DFCE] leading-relaxed">
              Looking for a botanical product that is not currently available in our store? Tell us what you need, and our team will review your request.
            </p>
          </div>
          <div className="absolute right-6 -bottom-6 opacity-10 pointer-events-none hidden md:block">
            <PackageSearch size={240} />
          </div>
        </div>

        {/* Success confirmation modal / banner */}
        {lastSubmittedEnquiry && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={24} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-emerald-900">
                  Enquiry Registered: <span className="font-mono text-emerald-800">{lastSubmittedEnquiry.enquiryNumber}</span>
                </h4>
                <p className="text-xs text-emerald-800 mt-1">
                  Thank you! We have received your request for <strong>{lastSubmittedEnquiry.productName}</strong> ({lastSubmittedEnquiry.requestedQuantity}). Our herbal sourcing team in Tamil Nadu will inspect farm availability and update your enquiry status shortly.
                </p>
              </div>
            </div>
            <button
              onClick={() => setLastSubmittedEnquiry(null)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: The Enquiry Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#DEDFD5] p-6 sm:p-8 shadow-xs">
            <div className="pb-5 mb-6 border-b border-[#EFECE4]">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#123D28]">
                Submit Product Requirement
              </h2>
              <p className="text-xs text-[#6C7167] mt-1">
                Share details of the single herb, seed, leaf, or raw powder you are seeking.
              </p>
            </div>

            {/* Authenticated user indicator or guest sign-in banner */}
            {currentUser ? (
              <div className="mb-6 p-3.5 bg-[#FAF8F2] rounded-xl border border-[#EFECE4] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#2B3527]">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  <span>
                    Submitting as <strong>{currentUser.name}</strong> ({currentUser.email || currentUser.phone})
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                  Verified Account
                </span>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-700 shrink-0" />
                  <span>Please sign in so we can link this enquiry to your customer account and track updates.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg text-xs shrink-0"
                >
                  Sign In
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-[#123D28] mb-1.5">
                  Product Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Hibiscus Petal Flakes, Blue Pea Flower, Senna Pods..."
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#DEDFD5] focus:border-[#123D28] focus:ring-1 focus:ring-[#123D28] outline-hidden bg-[#FCFBF7]"
                  disabled={submitEnquiryMutation.isPending}
                />
              </div>

              {/* Category & Preferred Quantity (2 columns) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#123D28] mb-1.5">
                    Product Category <span className="text-[#8C6D3F] font-normal">(Optional)</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#DEDFD5] focus:border-[#123D28] focus:ring-1 focus:ring-[#123D28] outline-hidden bg-[#FCFBF7]"
                    disabled={submitEnquiryMutation.isPending}
                  >
                    <option value="">Select category...</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#123D28] mb-1.5">
                    Preferred Quantity <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={requestedQuantity}
                    onChange={(e) => setRequestedQuantity(e.target.value)}
                    placeholder="e.g. 500g, 1 kg, 5 packs, 25 kg"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-[#DEDFD5] focus:border-[#123D28] focus:ring-1 focus:ring-[#123D28] outline-hidden bg-[#FCFBF7]"
                    disabled={submitEnquiryMutation.isPending}
                  />
                </div>
              </div>

              {/* Preferred Pack Size */}
              <div>
                <label className="block text-xs font-bold text-[#123D28] mb-1.5">
                  Preferred Pack Size <span className="text-[#8C6D3F] font-normal">(Optional)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PACK_SIZE_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => setPreferredPackSize(opt)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                        preferredPackSize === opt
                          ? "bg-[#123D28] text-white border-[#123D28] font-bold"
                          : "bg-[#FAF8F2] text-[#2B3527] border-[#DEDFD5] hover:border-[#123D28]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={preferredPackSize}
                  onChange={(e) => setPreferredPackSize(e.target.value)}
                  placeholder="Or enter custom packaging requirement (e.g. 200g glass jar)"
                  className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-[#DEDFD5] focus:border-[#123D28] focus:ring-1 focus:ring-[#123D28] outline-hidden bg-[#FCFBF7]"
                  disabled={submitEnquiryMutation.isPending}
                />
              </div>

              {/* Requirement / Description */}
              <div>
                <label className="block text-xs font-bold text-[#123D28] mb-1.5">
                  Short Description or Requirement <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your requirement: intended use, specific herb species / grade, whether raw sun-dried or finely sifted powder, certified organic preference, or any other notes..."
                  className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-[#DEDFD5] focus:border-[#123D28] focus:ring-1 focus:ring-[#123D28] outline-hidden bg-[#FCFBF7]"
                  disabled={submitEnquiryMutation.isPending}
                />
                <span className="text-[10px] text-[#8C6D3F] mt-1 block">
                  Minimum 10 characters. Please be as descriptive as possible.
                </span>
              </div>

              {/* Optional Reference Image Upload */}
              <div>
                <label className="block text-xs font-bold text-[#123D28] mb-1.5">
                  Reference Image or Photo <span className="text-[#8C6D3F] font-normal">(Optional)</span>
                </label>

                {referenceImageUrl ? (
                  <div className="relative inline-block border border-[#DEDFD5] rounded-xl overflow-hidden bg-white p-2">
                    <img
                      src={referenceImageUrl}
                      alt="Reference product"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setReferenceImageUrl(null)}
                      className="absolute top-3 right-3 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-sm"
                      title="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#DEDFD5] hover:border-[#123D28] rounded-2xl p-4 sm:p-6 text-center transition-colors bg-[#FCFBF7]">
                    <input
                      type="file"
                      id="enquiry-image-input"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleImageFileChange}
                      className="hidden"
                      disabled={isUploading || submitEnquiryMutation.isPending}
                    />
                    <label
                      htmlFor="enquiry-image-input"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      {isUploading ? (
                        <Loader2 size={24} className="text-[#123D28] animate-spin" />
                      ) : (
                        <Upload size={24} className="text-[#8C6D3F]" />
                      )}
                      <span className="text-xs font-bold text-[#123D28]">
                        {isUploading ? "Uploading image..." : "Upload photo or reference packaging"}
                      </span>
                      <span className="text-[11px] text-[#6C7167]">
                        PNG, JPEG, WEBP up to 10 MB
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitEnquiryMutation.isPending || isUploading}
                  className="w-full py-3.5 px-6 bg-[#123D28] hover:bg-[#1B4E35] text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitEnquiryMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Submitting Enquiry...</span>
                    </>
                  ) : (
                    <>
                      <PackageSearch size={16} />
                      <span>Submit Product Enquiry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Customer Enquiry History */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl border border-[#DEDFD5] p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#EFECE4]">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#123D28]">
                    Your Submitted Enquiries
                  </h3>
                  <p className="text-xs text-[#6C7167] mt-0.5">
                    Track the sourcing status of your requests
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => refetchEnquiries()}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-bold"
                >
                  Refresh
                </button>
              </div>

              <div className="pt-4">
                {!currentUser ? (
                  <div className="text-center py-8 text-xs text-[#6C7167]">
                    <Clock size={28} className="mx-auto text-amber-600 mb-2" />
                    <p className="font-semibold text-[#123D28]">Sign In to View History</p>
                    <p className="mt-1">Log in to view all your previous product enquiries and updates.</p>
                  </div>
                ) : enquiriesLoading ? (
                  <div className="py-8 text-center text-xs text-[#6C7167] flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin text-[#123D28]" />
                    <span>Loading your enquiries...</span>
                  </div>
                ) : myEnquiries.length === 0 ? (
                  <div className="text-center py-8 text-xs text-[#6C7167] bg-[#FAF8F2] rounded-2xl p-4">
                    <PackageSearch size={32} className="mx-auto text-[#8C6D3F] mb-2 opacity-60" />
                    <p className="font-bold text-[#123D28]">No enquiries submitted yet</p>
                    <p className="mt-1 leading-relaxed">
                      If there is a botanical seed, leaf, or pure powder you need that is not in our store, fill out the form to request it!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                    {myEnquiries.map((enq: any) => (
                      <div
                        key={enq.id}
                        className="p-4 rounded-2xl border border-[#EFECE4] bg-[#FAF8F2] hover:bg-white transition-all space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-[#8C6D3F] block">
                              {enq.enquiryNumber}
                            </span>
                            <h4 className="font-bold text-[#123D28] text-sm mt-0.5">
                              {enq.productName}
                            </h4>
                          </div>
                          <div>{getStatusBadge(enq.status)}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6C7167] pt-1 border-t border-[#EFECE4]">
                          <div>
                            <span className="text-[#8C6D3F] font-medium">Quantity: </span>
                            <span className="font-semibold text-[#2B3527]">{enq.requestedQuantity}</span>
                          </div>
                          <div>
                            <span className="text-[#8C6D3F] font-medium">Date: </span>
                            <span className="font-semibold text-[#2B3527]">
                              {enq.createdAt ? new Date(enq.createdAt).toLocaleDateString("en-IN") : "Recent"}
                            </span>
                          </div>
                        </div>

                        {enq.category && (
                          <div className="text-[11px] text-[#6C7167]">
                            <span className="text-[#8C6D3F] font-medium">Category: </span>
                            <span>{enq.category}</span>
                          </div>
                        )}

                        <p className="text-[11px] text-[#2B3527] italic bg-white p-2 rounded-lg border border-[#EFECE4] line-clamp-2">
                          "{enq.description}"
                        </p>

                        {enq.status === "AVAILABLE" && (
                          <div className="p-2 bg-emerald-100/70 border border-emerald-300 rounded-lg text-emerald-900 text-[11px] font-bold flex items-center justify-between">
                            <span>🌿 This item is now available in our store!</span>
                            <Link href="/products">
                              <a className="underline hover:text-emerald-950 inline-flex items-center gap-0.5">
                                Browse Shop &rarr;
                              </a>
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sourcing Guarantee Card */}
            <div className="bg-[#FAF8F2] rounded-3xl border border-[#DEDFD5] p-6 text-xs text-[#2B3527] space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[#123D28]">
                <ShieldCheck size={18} className="text-emerald-700" />
                <span>Our Tamil Nadu Botanical Promise</span>
              </div>
              <p className="leading-relaxed text-[#6C7167]">
                We personally inspect farm sources across Kongu Nadu, Western Ghats foothills, and certified cultivators. If you need rare traditional single herbs (like Tirunelveli Senna, Sirukurinjan, or Karisalankanni), we source them hygienically with zero fillers.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <StoreFooter />

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />
    </div>
  );
}
