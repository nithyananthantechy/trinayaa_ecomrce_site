import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Star,
  Search,
  CheckCircle2,
  XCircle,
  MessageSquare,
  ShieldCheck,
  Send,
  User,
  Package,
  Calendar,
  X,
  RefreshCw,
  PackageSearch,
  Eye,
  Clock,
  FileText,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";

export default function CustomerFeedbackTab() {
  const [subTab, setSubTab] = useState<"feedback" | "reviews" | "enquiries">("feedback");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");

  // Response modal state
  const [respondingFeedbackId, setRespondingFeedbackId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Enquiry modal state
  const [selectedEnquiry, setSelectedEnquiry] = useState<any | null>(null);
  const [enquiryNewStatus, setEnquiryNewStatus] = useState<string>("NEW");
  const [enquiryAdminNotes, setEnquiryAdminNotes] = useState<string>("");

  // Data queries
  const {
    data: feedbackList = [],
    isLoading: feedbackLoading,
    refetch: refetchFeedback,
  } = trpc.feedback.adminList.useQuery({
    status: statusFilter,
    rating: ratingFilter,
    search: searchTerm,
  });

  const {
    data: reviewsList = [],
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = trpc.reviews.adminList.useQuery({
    status: statusFilter,
    search: searchTerm,
  });

  const {
    data: enquiriesList = [],
    isLoading: enquiriesLoading,
    refetch: refetchEnquiries,
  } = trpc.productEnquiries.adminList.useQuery({
    status: statusFilter,
    search: searchTerm,
  });

  // Mutations
  const respondFeedbackMutation = trpc.feedback.adminRespond.useMutation({
    onSuccess: () => {
      toast.success("Feedback response recorded");
      setRespondingFeedbackId(null);
      setResponseText("");
      setInternalNotes("");
      refetchFeedback();
    },
    onError: (err) => toast.error(err.message || "Failed to record response"),
  });

  const updateEnquiryStatusMutation = trpc.productEnquiries.adminUpdateStatus.useMutation({
    onSuccess: () => {
      toast.success("Product enquiry updated successfully");
      setSelectedEnquiry(null);
      refetchEnquiries();
    },
    onError: (err) => toast.error(err.message || "Failed to update enquiry"),
  });

  const moderateReviewMutation = trpc.reviews.adminModerate.useMutation({
    onSuccess: (_, variables) => {
      toast.success(`Review ${variables.status.toLowerCase()} successfully`);
      refetchReviews();
    },
    onError: (err) => toast.error(err.message || "Failed to moderate review"),
  });

  const handleRespond = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingFeedbackId || !responseText.trim()) return;
    respondFeedbackMutation.mutate({
      id: respondingFeedbackId,
      response: responseText.trim(),
      notes: internalNotes.trim(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab("feedback")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              subTab === "feedback"
                ? "bg-emerald-800 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Customer Feedback & Suggestions ({feedbackList.length})
          </button>
          <button
            onClick={() => setSubTab("reviews")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              subTab === "reviews"
                ? "bg-emerald-800 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Product Reviews Moderation ({reviewsList.filter((r: any) => r.status === "PENDING").length} Pending)
          </button>
          <button
            onClick={() => setSubTab("enquiries")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              subTab === "enquiries"
                ? "bg-emerald-800 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            New Product Enquiries ({enquiriesList.length})
          </button>
        </div>

        <button
          onClick={() => {
            refetchFeedback();
            refetchReviews();
            refetchEnquiries();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-emerald-800 border rounded-md hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter Strip */}
      <div className="bg-white border rounded-lg p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={
                subTab === "enquiries"
                  ? "Search enquiry, customer, product..."
                  : "Search title, customer, message..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          >
            <option value="ALL">All Statuses</option>
            {subTab === "feedback" ? (
              <>
                <option value="NEW">New</option>
                <option value="REVIEWED">Reviewed</option>
              </>
            ) : subTab === "reviews" ? (
              <>
                <option value="PENDING">Pending Moderation</option>
                <option value="APPROVED">Approved (Public)</option>
                <option value="REJECTED">Rejected</option>
              </>
            ) : (
              <>
                <option value="NEW">New Requests</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="SOURCING">Sourcing in Progress</option>
                <option value="AVAILABLE">Available in Store</option>
                <option value="UNABLE_TO_SOURCE">Unable to Source</option>
                <option value="CLOSED">Closed</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* SUBTAB 1: CUSTOMER FEEDBACK LIST */}
      {subTab === "feedback" && (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Feedback Title & Message</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feedbackLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading feedback submissions...
                    </td>
                  </tr>
                ) : feedbackList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No feedback submissions found.
                    </td>
                  </tr>
                ) : (
                  feedbackList.map((f: any) => (
                    <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(f.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{f.customer_name}</div>
                        <div className="text-xs text-slate-400">{f.customer_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                          {f.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              fill={i < f.rating ? "currentColor" : "none"}
                              className={i < f.rating ? "text-amber-500" : "text-slate-300"}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="font-semibold text-slate-800">{f.title}</div>
                        <div className="text-xs text-slate-600 line-clamp-2 mt-0.5">{f.message}</div>
                        {f.admin_response && (
                          <div className="mt-1 text-xs text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-100">
                            <strong>Admin Response:</strong> {f.admin_response}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            f.status === "NEW"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setRespondingFeedbackId(f.id);
                            setResponseText(f.admin_response || "");
                            setInternalNotes(f.internal_notes || "");
                          }}
                          className="text-xs px-2.5 py-1 bg-emerald-800 text-white rounded hover:bg-emerald-900 transition-colors"
                        >
                          {f.admin_response ? "Edit Reply" : "Respond"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PRODUCT REVIEWS MODERATION QUEUE */}
      {subTab === "reviews" && (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Review Content</th>
                  <th className="py-3 px-4">Verified</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviewsLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Loading product reviews...
                    </td>
                  </tr>
                ) : reviewsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No reviews found matching filters.
                    </td>
                  </tr>
                ) : (
                  reviewsList.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-emerald-900">{r.productName || "Product"}</div>
                        <div className="text-xs text-slate-400 font-mono">{r.sku}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{r.customer_name}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              fill={i < r.rating ? "currentColor" : "none"}
                              className={i < r.rating ? "text-amber-500" : "text-slate-300"}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-semibold text-slate-800">{r.title}</div>
                        <div className="text-xs text-slate-600 line-clamp-2 mt-0.5">{r.review}</div>
                      </td>
                      <td className="py-3 px-4">
                        {r.is_verified_purchase === 1 ? (
                          <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-medium flex items-center gap-1 w-fit">
                            <ShieldCheck size={12} /> Verified
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Unverified</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            r.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.status !== "APPROVED" && (
                            <button
                              onClick={() =>
                                moderateReviewMutation.mutate({ id: r.id, status: "APPROVED" })
                              }
                              className="text-xs px-2.5 py-1 bg-emerald-700 text-white rounded hover:bg-emerald-800 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 size={12} /> Approve
                            </button>
                          )}
                          {r.status !== "REJECTED" && (
                            <button
                              onClick={() =>
                                moderateReviewMutation.mutate({ id: r.id, status: "REJECTED" })
                              }
                              className="text-xs px-2.5 py-1 bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors flex items-center gap-1"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: NEW PRODUCT ENQUIRIES QUEUE */}
      {subTab === "enquiries" && (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b">
                <tr>
                  <th className="py-3 px-4">Enquiry No &amp; Date</th>
                  <th className="py-3 px-4">Customer Details</th>
                  <th className="py-3 px-4">Requested Product</th>
                  <th className="py-3 px-4">Category &amp; Pack Size</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enquiriesLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      Loading product enquiries...
                    </td>
                  </tr>
                ) : enquiriesList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      <PackageSearch size={32} className="mx-auto mb-2 text-slate-300" />
                      No product enquiries match the selected filters.
                    </td>
                  </tr>
                ) : (
                  enquiriesList.map((enq: any) => (
                    <tr key={enq.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-xs text-slate-800">
                          {enq.enquiryNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={11} />
                          {enq.createdAt
                            ? new Date(enq.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{enq.customerName}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail size={11} />
                          {enq.customerEmail}
                        </div>
                        {enq.customerPhone && (
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone size={11} />
                            {enq.customerPhone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-emerald-900">{enq.productName}</div>
                        <p className="text-xs text-slate-500 italic line-clamp-1 max-w-xs mt-0.5">
                          "{enq.description}"
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-medium text-slate-700">
                          {enq.category || "General Botanical"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {enq.preferredPackSize || "Standard pack"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded text-xs">
                          {enq.requestedQuantity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            enq.status === "AVAILABLE"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : enq.status === "SOURCING"
                              ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                              : enq.status === "UNDER_REVIEW"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : enq.status === "UNABLE_TO_SOURCE"
                              ? "bg-slate-100 text-slate-700 border border-slate-300"
                              : enq.status === "CLOSED"
                              ? "bg-zinc-100 text-zinc-700 border border-zinc-200"
                              : "bg-sky-100 text-sky-800 border border-sky-200"
                          }`}
                        >
                          {enq.status === "AVAILABLE"
                            ? "Available in Store"
                            : enq.status === "SOURCING"
                            ? "Sourcing"
                            : enq.status === "UNDER_REVIEW"
                            ? "Under Review"
                            : enq.status === "UNABLE_TO_SOURCE"
                            ? "Unable to Source"
                            : enq.status === "CLOSED"
                            ? "Closed"
                            : "New Request"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedEnquiry(enq);
                            setEnquiryNewStatus(enq.status);
                            setEnquiryAdminNotes(enq.adminNotes || enq.admin_notes || "");
                          }}
                          className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded text-xs font-medium transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <Eye size={12} /> View &amp; Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {respondingFeedbackId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-semibold text-slate-800 text-base">Record Administrative Response</h3>
              <button
                onClick={() => setRespondingFeedbackId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRespond} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Public Response to Customer:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Thank you for your valuable feedback..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full p-2.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Internal Team Notes (Optional):
                </label>
                <input
                  type="text"
                  placeholder="Internal follow-up note..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full p-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRespondingFeedbackId(null)}
                  className="px-3 py-1.5 text-sm border rounded-md hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={respondFeedbackMutation.isPending || !responseText.trim()}
                  className="px-4 py-1.5 text-sm bg-emerald-800 text-white rounded-md hover:bg-emerald-900 disabled:opacity-50 transition-colors"
                >
                  Save & Publish Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Enquiry View & Manage Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-800">
                  {selectedEnquiry.enquiryNumber}
                </span>
                <h3 className="font-bold text-slate-800 text-base mt-0.5">
                  Manage Product Enquiry: {selectedEnquiry.productName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Customer Details Box */}
            <div className="bg-slate-50 rounded-lg p-3.5 border text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 block font-medium">Customer:</span>
                <span className="font-bold text-slate-800">{selectedEnquiry.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Email:</span>
                <span className="font-bold text-slate-800">{selectedEnquiry.customerEmail}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Phone:</span>
                <span className="font-bold text-slate-800">{selectedEnquiry.customerPhone || "Not provided"}</span>
              </div>
            </div>

            {/* Requirement Specifications */}
            <div className="space-y-3 text-xs border rounded-lg p-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block font-medium">Category:</span>
                  <span className="font-semibold text-slate-700">{selectedEnquiry.category || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Quantity:</span>
                  <span className="font-semibold text-slate-700">{selectedEnquiry.requestedQuantity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Preferred Pack Size:</span>
                  <span className="font-semibold text-slate-700">{selectedEnquiry.preferredPackSize || "Standard packaging"}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-medium mb-1">Customer Description &amp; Requirements:</span>
                <p className="p-3 bg-slate-50 rounded-md border text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
                  {selectedEnquiry.description}
                </p>
              </div>

              {selectedEnquiry.referenceImage && (
                <div>
                  <span className="text-slate-400 block font-medium mb-1">Reference Image Attached:</span>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedEnquiry.referenceImage}
                      alt="Reference"
                      className="w-24 h-24 object-cover rounded-md border"
                    />
                    <a
                      href={selectedEnquiry.referenceImage}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-800 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink size={12} /> View Full Image
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Sourcing Status & Admin Notes Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateEnquiryStatusMutation.mutate({
                  id: selectedEnquiry.id,
                  status: enquiryNewStatus as any,
                  adminNotes: enquiryAdminNotes.trim(),
                });
              }}
              className="space-y-4 pt-2 border-t"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sourcing Workflow Status:
                  </label>
                  <select
                    value={enquiryNewStatus}
                    onChange={(e) => setEnquiryNewStatus(e.target.value)}
                    className="w-full p-2 text-xs border rounded-md font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white"
                  >
                    <option value="NEW">NEW - Newly Received</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW - Herbal Team Checking</option>
                    <option value="SOURCING">SOURCING - Contacting Tamil Nadu Cultivators</option>
                    <option value="AVAILABLE">AVAILABLE - Procured / Ready for Storefront</option>
                    <option value="UNABLE_TO_SOURCE">UNABLE_TO_SOURCE - Not Available</option>
                    <option value="CLOSED">CLOSED - Completed / Archived</option>
                  </select>
                </div>

                {selectedEnquiry.reviewedBy && (
                  <div className="text-xs text-slate-500 flex flex-col justify-end">
                    <span>Last reviewed by: <strong>{selectedEnquiry.reviewedBy}</strong></span>
                    <span>
                      At:{" "}
                      {selectedEnquiry.reviewedAt
                        ? new Date(selectedEnquiry.reviewedAt).toLocaleString("en-IN")
                        : "N/A"}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Administrative Sourcing Notes:
                </label>
                <textarea
                  rows={3}
                  value={enquiryAdminNotes}
                  onChange={(e) => setEnquiryAdminNotes(e.target.value)}
                  placeholder="Record internal farmer contact, wholesale rate, batch availability, or reason if unable to source..."
                  className="w-full p-2.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="px-3.5 py-2 text-xs border rounded-md hover:bg-slate-50 text-slate-600 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateEnquiryStatusMutation.isPending}
                  className="px-4 py-2 text-xs bg-emerald-800 hover:bg-emerald-900 text-white rounded-md transition-colors font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {updateEnquiryStatusMutation.isPending ? "Saving..." : "Save Status & Notes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
