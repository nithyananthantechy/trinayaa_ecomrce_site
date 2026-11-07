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
} from "lucide-react";

export default function CustomerFeedbackTab() {
  const [subTab, setSubTab] = useState<"feedback" | "reviews">("feedback");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");

  // Response modal state
  const [respondingFeedbackId, setRespondingFeedbackId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

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
        </div>

        <button
          onClick={() => {
            refetchFeedback();
            refetchReviews();
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
              placeholder="Search title, customer, message..."
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
            ) : (
              <>
                <option value="PENDING">Pending Moderation</option>
                <option value="APPROVED">Approved (Public)</option>
                <option value="REJECTED">Rejected</option>
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
    </div>
  );
}
