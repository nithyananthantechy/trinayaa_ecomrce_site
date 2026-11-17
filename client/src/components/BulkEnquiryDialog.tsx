import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  X,
  Building2,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
  ShieldCheck,
} from "lucide-react";

interface EnquiryItem {
  productId?: string;
  sku: string;
  productName: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
}

interface BulkEnquiryDialogProps {
  open: boolean;
  onClose: () => void;
  initialProduct?: {
    sku: string;
    name: string;
    productId?: string;
  };
}

const BUYER_TYPES = [
  "Retailer",
  "Wholesaler",
  "Distributor",
  "Manufacturer",
  "Ayurvedic Clinic",
  "Other",
] as const;

const QUANTITY_UNITS = ["kg", "25kg bags", "50kg sacks", "packs", "boxes"] as const;

export default function BulkEnquiryDialog({
  open,
  onClose,
  initialProduct,
}: BulkEnquiryDialogProps) {
  // Form state
  const [contactName, setContactName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [buyerType, setBuyerType] = useState<typeof BUYER_TYPES[number]>("Retailer");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryState, setDeliveryState] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [requirements, setRequirements] = useState("");
  const [items, setItems] = useState<EnquiryItem[]>([]);

  // Product selection state for adding items
  const [selectedSku, setSelectedSku] = useState("");
  const [addQty, setAddQty] = useState<number>(25);
  const [addUnit, setAddUnit] = useState<string>("kg");

  // Submission result state
  const [submittedEnquiryNumber, setSubmittedEnquiryNumber] = useState<string | null>(null);

  // Load product catalog for dropdown
  const { data: productOptions = [] } = trpc.enquiries.getProductOptions.useQuery(undefined, {
    enabled: open,
  });

  // When initialProduct is passed, add it automatically
  useEffect(() => {
    if (initialProduct && open) {
      setItems([
        {
          sku: initialProduct.sku,
          productName: initialProduct.name,
          productId: initialProduct.productId,
          quantity: 25,
          unit: "kg",
        },
      ]);
    } else if (open && items.length === 0 && productOptions.length > 0) {
      // Default to first product if none selected
      setSelectedSku(productOptions[0].sku);
    }
  }, [initialProduct, open, productOptions]);

  // Submission mutation
  const submitMutation = trpc.enquiries.submit.useMutation({
    onSuccess: (res) => {
      setSubmittedEnquiryNumber(res.enquiryNumber);
      toast.success(`Enquiry ${res.enquiryNumber} submitted successfully!`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit enquiry. Please check your details.");
    },
  });

  const handleAddItem = () => {
    if (!selectedSku) return;
    const found = productOptions.find((p) => p.sku === selectedSku);
    if (!found) return;

    // Check if already in list
    if (items.some((i) => i.sku === selectedSku)) {
      toast.info("Product already in enquiry list. You can adjust the quantity below.");
      return;
    }

    setItems([
      ...items,
      {
        sku: found.sku,
        productName: found.nameEn,
        productId: found.id,
        quantity: Math.max(1, Number(addQty) || 25),
        unit: addUnit,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    setItems(
      items.map((item, i) => (i === index ? { ...item, quantity: Math.max(0.1, newQty) } : item))
    );
  };

  const handleUpdateItemUnit = (index: number, newUnit: string) => {
    setItems(items.map((item, i) => (i === index ? { ...item, unit: newUnit } : item)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactName.trim() || !companyName.trim() || !email.trim() || !phone.trim() || !deliveryCity.trim() || !deliveryState.trim()) {
      toast.error("Please fill in all required contact and location fields.");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one product to your quotation request.");
      return;
    }

    submitMutation.mutate({
      contactName,
      companyName,
      email,
      phone,
      buyerType,
      deliveryCity,
      deliveryState,
      requirements,
      gstNumber: gstNumber.trim() ? gstNumber.trim() : undefined,
      items: items.map((i) => ({
        productId: i.productId,
        sku: i.sku,
        productName: i.productName,
        quantity: i.quantity,
        unit: i.unit,
      })),
    });
  };

  const handleReset = () => {
    setSubmittedEnquiryNumber(null);
    setContactName("");
    setCompanyName("");
    setEmail("");
    setPhone("");
    setDeliveryCity("");
    setDeliveryState("");
    setGstNumber("");
    setRequirements("");
    setItems([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#FCFBF7] border border-[#DCD5C5] rounded-2xl shadow-2xl p-5 sm:p-7 text-[#1A261D]">
        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 p-2 text-[#6C7167] hover:text-[#123D28] hover:bg-[#EBE5D8] rounded-full transition-colors"
          aria-label="Close bulk enquiry dialog"
        >
          <X size={20} />
        </button>

        {submittedEnquiryNumber ? (
          /* SUCCESS SCREEN */
          <div className="py-8 px-4 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#EAF2ED] text-[#123D28] flex items-center justify-center mb-4 ring-8 ring-[#EAF2ED]/50">
              <CheckCircle2 size={36} strokeWidth={2.2} />
            </div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#8C6D3F]">
              Enquiry Submitted Successfully
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#123D28] font-bold mt-1 mb-2">
              Quotation Request Received
            </h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F2EDE2] border border-[#D5C9B3] rounded-lg my-3 font-mono text-base font-bold text-[#123D28]">
              Reference: {submittedEnquiryNumber}
            </div>
            <p className="max-w-md text-sm text-[#4E5649] leading-relaxed my-2">
              Thank you for choosing <strong>TRINAYAA</strong> for your business. Our B2B sales team
              in Erode, Tamil Nadu will review your requested quantities and contact you within 24
              hours with our competitive wholesale pricing and shipping options.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full max-w-xs">
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-2.5 px-5 bg-[#123D28] hover:bg-[#1B4E35] text-white font-medium text-sm rounded-lg transition-colors shadow-sm"
              >
                Back to Catalogue
              </button>
            </div>
          </div>
        ) : (
          /* FORM SCREEN */
          <div>
            {/* Header */}
            <div className="border-b border-[#E8E1D3] pb-4 mb-5">
              <div className="flex items-center gap-2 text-[#8C6D3F] text-xs font-bold uppercase tracking-wider mb-1">
                <Building2 size={15} />
                <span>B2B & Wholesale Direct from Source</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#123D28]">
                Request a Bulk Wholesale Quotation
              </h2>
              <p className="text-xs sm:text-sm text-[#5C6556] mt-1">
                Direct wholesale supply of pure botanical herbs, raw powders & seeds for retailers,
                distributors, clinics and manufacturers.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* SECTION 1: BUSINESS & CONTACT DETAILS */}
              <div className="bg-[#F8F5EE] border border-[#E3DC handleReset] border-[#E3DC handleReset] border-[#E5DECF] rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#123D28] flex items-center gap-1.5 mb-3">
                  <User size={14} /> 1. Business & Buyer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#3B4437] mb-1">
                      Contact Person Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5CDBC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#123D28]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3B4437] mb-1">
                      Business / Company Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kongu Herbals & Wellness"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5CDBC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#123D28]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3B4437] mb-1">
                      Mobile / WhatsApp Number <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5CDBC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#123D28]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3B4437] mb-1">
                      Business Email Address <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. purchase@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5CDBC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#123D28]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3B4437] mb-1">
                      Buyer Category <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={buyerType}
                      onChange={(e) => setBuyerType(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5CDBC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#123D28]/30"
                    >
                      {BUYER_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3B4437] mb-1">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 33AAAAA0000A1Z5"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5CDBC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#123D28]/30 uppercase"
                    />
                    <span className="text-[10px] text-[#7C8575] mt-0.5 block">
                      Optional — verified B2B buyers receive priority invoicing.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3B4437] mb-1">
                      Delivery City <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Erode / Coimbatore / Chennai"
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5CDBC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#123D28]/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3B4437] mb-1">
                      Delivery State <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tamil Nadu"
                      value={deliveryState}
                      onChange={(e) => setDeliveryState(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#D5CDBC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#123D28]/30"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PRODUCTS OF INTEREST */}
              <div className="bg-[#F8F5EE] border border-[#E5DECF] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#123D28] flex items-center gap-1.5">
                    <Package size={14} /> 2. Requested Botanical Products & Quantities
                  </h3>
                  <span className="text-xs text-[#8C6D3F] font-semibold">
                    {items.length} item(s) selected
                  </span>
                </div>

                {/* Add product bar */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-3 bg-white p-2.5 rounded-lg border border-[#D5CDBC]">
                  <div className="sm:col-span-6">
                    <label className="block text-[10px] font-bold uppercase text-[#6C7167] mb-0.5">
                      Select Botanical Product
                    </label>
                    <select
                      value={selectedSku}
                      onChange={(e) => setSelectedSku(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-[#FCFBF7] border border-[#D5CDBC] rounded focus:outline-none"
                    >
                      {productOptions.map((p) => (
                        <option key={p.sku} value={p.sku}>
                          {p.sku} — {p.nameEn} ({p.nameTa})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold uppercase text-[#6C7167] mb-0.5">
                      Estimated Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={addQty}
                      onChange={(e) => setAddQty(Number(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 text-xs bg-[#FCFBF7] border border-[#D5CDBC] rounded focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-[#6C7167] mb-0.5">
                      Unit
                    </label>
                    <select
                      value={addUnit}
                      onChange={(e) => setAddUnit(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs bg-[#FCFBF7] border border-[#D5CDBC] rounded focus:outline-none"
                    >
                      {QUANTITY_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-1.5 bg-[#123D28] hover:bg-[#1B4E35] text-white rounded flex items-center justify-center transition-colors"
                      title="Add to quotation list"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Items list */}
                {items.length === 0 ? (
                  <div className="text-center py-6 text-xs text-[#7C8575] border border-dashed border-[#D5CDBC] rounded-lg">
                    No products added yet. Select a product above and click the (+) button.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div
                        key={item.sku}
                        className="flex items-center justify-between gap-3 p-2.5 bg-white border border-[#E0D9C8] rounded-lg text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#123D28] truncate">
                            {item.productName}
                          </div>
                          <div className="text-[10px] font-mono text-[#7C8575]">{item.sku}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItemQty(idx, Number(e.target.value) || 1)}
                            className="w-16 px-2 py-1 text-xs border border-[#D5CDBC] rounded text-center"
                          />
                          <select
                            value={item.unit}
                            onChange={(e) => handleUpdateItemUnit(idx, e.target.value)}
                            className="px-2 py-1 text-xs border border-[#D5CDBC] rounded bg-white"
                          >
                            {QUANTITY_UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Remove product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: ADDITIONAL REQUIREMENTS */}
              <div>
                <label className="block text-xs font-semibold text-[#3B4437] mb-1">
                  Additional Requirements / Custom Packaging Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Interested in custom 50kg bulk gunny bags or private label foil pouches. Need delivery by end of month."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FBF8F0] border border-[#D5CDBC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#123D28]/30"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-2 flex items-center justify-between">
                <div className="text-[11px] text-[#6C7167] flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#123D28]" />
                  <span>Your enquiry is sent directly to TRINAYAA Erode sales team.</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 border border-[#D5CDBC] text-[#3B4437] hover:bg-[#F2EDE2] text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitMutation.isPending}
                    className="px-6 py-2 bg-[#123D28] hover:bg-[#1B4E35] text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {submitMutation.isPending ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Submit Quotation Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

