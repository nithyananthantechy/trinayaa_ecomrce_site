import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Building2,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  X,
  FileSpreadsheet,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Calendar,
  AlertCircle,
  Eye,
  RefreshCw,
} from "lucide-react";

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  NEW: { label: "New", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  CONTACTED: { label: "Contacted", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  QUOTATION_SENT: { label: "Quotation Sent", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  NEGOTIATION: { label: "In Negotiation", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  CONVERTED: { label: "Converted / Won", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  CLOSED: { label: "Closed / Lost", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
};

const ALL_STATUSES = [
  "ALL",
  "NEW",
  "CONTACTED",
  "QUOTATION_SENT",
  "NEGOTIATION",
  "CONVERTED",
  "CLOSED",
] as const;

export default function EnquiriesTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);

  // Form state for editing enquiry
  const [editStatus, setEditStatus] = useState<string>("NEW");
  const [internalNotes, setInternalNotes] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState<string>("");

  // Query enquiries list
  const enquiriesQuery = trpc.admin.enquiries.list.useQuery({
    search: searchTerm.trim() || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    limit: 100,
  });

  // Query selected enquiry details
  const detailQuery = trpc.admin.enquiries.getById.useQuery(
    { id: selectedEnquiryId! },
    {
      enabled: Boolean(selectedEnquiryId),
    }
  );

  // Sync edit form when detail data loads
  React.useEffect(() => {
    if (detailQuery.data) {
      setEditStatus(detailQuery.data.status || "NEW");
      setInternalNotes(detailQuery.data.internalNotes || "");
      setAssignedTo(detailQuery.data.assignedTo || "");
    }
  }, [detailQuery.data]);

  // Status update mutation
  const updateMutation = trpc.admin.enquiries.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Enquiry status and notes updated");
      enquiriesQuery.refetch();
      detailQuery.refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update enquiry");
    },
  });

  // Export CSV query/trigger
  const exportCsvQuery = trpc.admin.enquiries.exportCsv.useQuery(undefined, {
    enabled: false,
  });

  const handleExportCsv = async () => {
    try {
      const result = await exportCsvQuery.refetch();
      if (!result.data) {
        toast.error("No enquiry data available to export");
        return;
      }
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `trinayaa_wholesale_enquiries_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Enquiries CSV downloaded successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to export enquiries CSV");
    }
  };

  const enquiries = enquiriesQuery.data?.enquiries || [];
  const totalCount = enquiriesQuery.data?.total || 0;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DEDFD5] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="text-[#123D28]" size={22} />
            <h2 className="font-serif text-xl font-bold text-[#123D28]">
              B2B Bulk & Wholesale Enquiries
            </h2>
          </div>
          <p className="text-xs text-[#6C7167] mt-1">
            Manage incoming quotations, commercial buyers, order requests, and follow-ups.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => enquiriesQuery.refetch()}
            className="p-2 border border-[#DEDFD5] hover:bg-[#FBF8F0] rounded-lg text-[#123D28] text-xs font-semibold transition-colors shadow-2xs"
            title="Refresh list"
          >
            <RefreshCw size={15} className={enquiriesQuery.isFetching ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 py-2 px-4 bg-[#FAF5EB] hover:bg-[#F2E8D3] border border-[#D7C9AF] text-[#6D471C] rounded-lg text-xs font-semibold transition-colors shadow-2xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-[#DEDFD5] space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Enquiry #, Company, Contact Name, Phone..."
              className="w-full pl-9 pr-4 py-2 border border-[#DEDFD5] rounded-lg text-xs bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-[#6C7167] uppercase tracking-wider mr-1">
            Status:
          </span>
          {ALL_STATUSES.map((st) => {
            const isSelected = statusFilter === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                  isSelected
                    ? "bg-[#123D28] text-white shadow-xs"
                    : "bg-[#F4EFE6] text-[#4A5546] hover:bg-[#EAE2D3]"
                }`}
              >
                {st === "ALL" ? "All Enquiries" : STATUS_CONFIG[st]?.label || st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="bg-white rounded-2xl border border-[#DEDFD5] overflow-hidden shadow-xs">
        {enquiriesQuery.isLoading ? (
          <div className="p-12 text-center text-xs text-[#6C7167]">
            <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-[#123D28]" />
            Loading enquiries...
          </div>
        ) : enquiries.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Building2 size={36} className="mx-auto text-slate-300" />
            <h4 className="font-serif text-base font-bold text-[#123D28]">
              No wholesale enquiries found
            </h4>
            <p className="text-xs text-[#6C7167] max-w-sm mx-auto">
              {searchTerm || statusFilter !== "ALL"
                ? "No enquiries match your current filters. Try resetting the search or status."
                : "When buyers submit quotation requests through the storefront or B2B portal, they will appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F2] text-[#6C7167] font-semibold border-b border-[#DEDFD5] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Enquiry #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Business &amp; Contact</th>
                  <th className="py-3 px-4">Contact Details</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Buyer Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE4]">
                {enquiries.map((enq: any) => {
                  const cfg = STATUS_CONFIG[enq.status] || STATUS_CONFIG.NEW;
                  const dateStr = enq.createdAt
                    ? new Date(enq.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr
                      key={enq.id}
                      className="hover:bg-[#FAF8F2]/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedEnquiryId(enq.id)}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#123D28]">
                        {enq.enquiryNumber}
                      </td>
                      <td className="py-3 px-4 text-[#6C7167] whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#123D28]">{enq.companyName}</div>
                        <div className="text-[11px] text-[#6C7167]">{enq.contactName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[#123D28] font-medium">{enq.phone}</div>
                        <div className="text-[11px] text-[#6C7167] truncate max-w-[160px]">
                          {enq.email}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#4A5546]">
                        {enq.deliveryCity}, {enq.deliveryState}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {enq.buyerType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEnquiryId(enq.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#123D28] hover:bg-[#1F5638] text-white rounded text-[11px] font-semibold transition-colors shadow-2xs"
                        >
                          <Eye size={12} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* ENQUIRY DETAIL MODAL / DRAWER */}
      {/* ========================================================= */}
      {selectedEnquiryId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#DEDFD5]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EFECE4] flex items-center justify-between bg-[#FAF8F2]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#AE6A2B] block">
                  Commercial Quotation Request
                </span>
                <div className="flex items-center gap-3 mt-0.5">
                  <h3 className="font-serif text-2xl font-bold text-[#123D28]">
                    {detailQuery.data?.enquiryNumber || "Enquiry Details"}
                  </h3>
                  {detailQuery.data?.status && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        STATUS_CONFIG[detailQuery.data.status]?.bg
                      } ${STATUS_CONFIG[detailQuery.data.status]?.text} ${
                        STATUS_CONFIG[detailQuery.data.status]?.border
                      }`}
                    >
                      {STATUS_CONFIG[detailQuery.data.status]?.label || detailQuery.data.status}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiryId(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {detailQuery.isLoading ? (
                <div className="p-8 text-center text-slate-500">
                  <RefreshCw size={24} className="mx-auto mb-2 animate-spin text-[#123D28]" />
                  Loading enquiry details...
                </div>
              ) : detailQuery.data ? (
                <>
                  {/* Buyer & Company Info Card */}
                  <div className="bg-[#FAF8F2] p-4 rounded-2xl border border-[#EBE4D5] grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[#6C7167] block text-[11px]">Company / Organization</span>
                      <strong className="text-sm text-[#123D28] block">
                        {detailQuery.data.companyName}
                      </strong>
                      <div className="mt-1 text-[#4A5546]">
                        <strong>Contact Person:</strong> {detailQuery.data.contactName}
                      </div>
                      <div className="text-[#4A5546]">
                        <strong>Buyer Type:</strong> {detailQuery.data.buyerType}
                      </div>
                      {detailQuery.data.gstNumber && (
                        <div className="text-[#4A5546] font-mono mt-1">
                          <strong>GSTIN:</strong> {detailQuery.data.gstNumber}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[#6C7167] block text-[11px]">Direct Contact</span>
                      <div className="flex items-center gap-1.5 text-[#123D28] font-semibold">
                        <Phone size={13} className="text-[#AE6A2B]" />
                        <a href={`tel:${detailQuery.data.phone}`} className="hover:underline">
                          {detailQuery.data.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#123D28]">
                        <Mail size={13} className="text-[#AE6A2B]" />
                        <a href={`mailto:${detailQuery.data.email}`} className="hover:underline">
                          {detailQuery.data.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#4A5546] pt-1">
                        <MapPin size={13} className="text-[#AE6A2B]" />
                        <span>
                          {detailQuery.data.deliveryCity}, {detailQuery.data.deliveryState}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#6C7167] pt-1">
                        Submitted:{" "}
                        {new Date(detailQuery.data.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Requirements / Remarks */}
                  {detailQuery.data.requirements && (
                    <div>
                      <span className="font-bold text-[#123D28] block mb-1">
                        Special Instructions / Requirements:
                      </span>
                      <div className="p-3 bg-white border border-[#EBE4D5] rounded-xl text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {detailQuery.data.requirements}
                      </div>
                    </div>
                  )}

                  {/* Requested Products Table */}
                  <div>
                    <span className="font-bold text-[#123D28] block mb-2">
                      Requested Botanical Items ({detailQuery.data.items?.length || 0}):
                    </span>
                    {detailQuery.data.items?.length ? (
                      <div className="border border-[#EBE4D5] rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FAF8F2] text-[#6C7167] font-semibold border-b border-[#EBE4D5] text-[11px]">
                            <tr>
                              <th className="py-2.5 px-3">SKU</th>
                              <th className="py-2.5 px-3">Botanical Product</th>
                              <th className="py-2.5 px-3">Quantity</th>
                              <th className="py-2.5 px-3">Unit</th>
                              <th className="py-2.5 px-3 text-right">Target Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EBE4D5]">
                            {detailQuery.data.items.map((it: any) => (
                              <tr key={it.id} className="hover:bg-[#FAF8F2]/40">
                                <td className="py-2.5 px-3 font-mono font-bold text-[#123D28]">
                                  {it.sku}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-slate-800">
                                  {it.productName}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-[#123D28]">
                                  {it.quantity}
                                </td>
                                <td className="py-2.5 px-3 text-[#6C7167]">
                                  {it.unit || "kg"}
                                </td>
                                <td className="py-2.5 px-3 text-right font-medium">
                                  {it.targetPrice ? `₹${it.targetPrice}` : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 italic">
                        No specific SKUs selected. Buyer provided general requirements.
                      </div>
                    )}
                  </div>

                  {/* Management & Status Update Controls */}
                  <div className="bg-[#FAF8F2] p-4 rounded-2xl border border-[#EBE4D5] space-y-4">
                    <h4 className="font-serif text-sm font-bold text-[#123D28]">
                      Sales Team Follow-Up &amp; Status
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#4A5546] mb-1">
                          Enquiry Status
                        </label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full py-2 px-3 border border-[#DEDFD5] rounded-lg text-xs bg-white font-semibold text-[#123D28]"
                        >
                          <option value="NEW">NEW — Unaddressed</option>
                          <option value="CONTACTED">CONTACTED — Reached out by phone/email</option>
                          <option value="QUOTATION_SENT">QUOTATION_SENT — Formal quotation dispatched</option>
                          <option value="NEGOTIATION">NEGOTIATION — Rates/terms under discussion</option>
                          <option value="CONVERTED">CONVERTED — Commercial invoice issued / Won</option>
                          <option value="CLOSED">CLOSED — Inactive / Declined</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#4A5546] mb-1">
                          Assigned Sales Representative
                        </label>
                        <input
                          type="text"
                          value={assignedTo}
                          onChange={(e) => setAssignedTo(e.target.value)}
                          placeholder="e.g. Sales Desk / Ramesh"
                          className="w-full py-2 px-3 border border-[#DEDFD5] rounded-lg text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#4A5546] mb-1">
                        Internal Follow-up Notes (Audit Trail)
                      </label>
                      <textarea
                        rows={3}
                        value={internalNotes}
                        onChange={(e) => setInternalNotes(e.target.value)}
                        placeholder="Add call records, rate negotiations, expected delivery schedule, or payment terms..."
                        className="w-full p-3 border border-[#DEDFD5] rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateMutation.mutate({
                            id: detailQuery.data.id,
                            status: editStatus as any,
                            internalNotes,
                            assignedTo,
                          })
                        }
                        disabled={updateMutation.isPending}
                        className="py-2.5 px-6 bg-[#123D28] hover:bg-[#1A4D33] text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        <span>{updateMutation.isPending ? "Saving..." : "Save Updates"}</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
