import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Repeat,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Play,
  Pause,
  XCircle,
  SkipForward,
  User,
  MapPin,
  Package,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  X,
  CreditCard,
  Truck,
} from "lucide-react";

export default function SubscriptionsAdminTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("ALL");
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

  // Modals / action states
  const [actionType, setActionType] = useState<"pause" | "resume" | "skip" | "cancel" | null>(null);
  const [actionReason, setActionReason] = useState("");

  // Data queries
  const statsQuery = trpc.admin.subscriptions.getStats.useQuery();
  const stats = statsQuery.data || {
    total: 0,
    active: 0,
    paused: 0,
    upcoming7Days: 0,
    exceptions: 0,
    cancelled: 0,
  };

  const listQuery = trpc.admin.subscriptions.list.useQuery({
    status: statusFilter,
    frequency: frequencyFilter,
    search: searchTerm.trim() || undefined,
  });
  const { subscriptions = [], total = 0 } = listQuery.data || {};

  const detailQuery = trpc.admin.subscriptions.getById.useQuery(
    { id: selectedSubId! },
    { enabled: Boolean(selectedSubId) }
  );
  const selectedSub = detailQuery.data;

  // Mutations
  const processDueMutation = trpc.admin.subscriptions.processDueCycles.useMutation({
    onSuccess: (res: any) => {
      toast.success(
        `Cycle processing complete: ${res.succeeded} orders generated, ${res.failed} exceptions, ${res.skipped} skipped.`
      );
      listQuery.refetch();
      statsQuery.refetch();
      if (selectedSubId) detailQuery.refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to process recurring cycles");
    },
  });

  const pauseMutation = trpc.admin.subscriptions.pause.useMutation({
    onSuccess: () => {
      toast.success("Subscription paused.");
      listQuery.refetch();
      statsQuery.refetch();
      if (selectedSubId) detailQuery.refetch();
      setActionType(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resumeMutation = trpc.admin.subscriptions.resume.useMutation({
    onSuccess: () => {
      toast.success("Subscription resumed.");
      listQuery.refetch();
      statsQuery.refetch();
      if (selectedSubId) detailQuery.refetch();
      setActionType(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const skipMutation = trpc.admin.subscriptions.skipCycle.useMutation({
    onSuccess: () => {
      toast.success("Subscription cycle skipped.");
      listQuery.refetch();
      statsQuery.refetch();
      if (selectedSubId) detailQuery.refetch();
      setActionType(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const cancelMutation = trpc.admin.subscriptions.cancel.useMutation({
    onSuccess: () => {
      toast.success("Subscription cancelled.");
      listQuery.refetch();
      statsQuery.refetch();
      if (selectedSubId) detailQuery.refetch();
      setActionType(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleProcessDueCycles = () => {
    processDueMutation.mutate({});
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">ACTIVE</span>;
      case "PAUSED":
        return <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800 border border-amber-300">PAUSED</span>;
      case "PAYMENT_PENDING":
        return <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-100 text-blue-800 border border-blue-300">PAYMENT PENDING</span>;
      case "CANCELLED":
        return <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-gray-100 text-gray-700 border border-gray-300">CANCELLED</span>;
      case "FAILED":
        return <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-red-100 text-red-800 border border-red-300">FAILED / EXCEPTION</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-gray-100 text-gray-800 border border-gray-300">{status}</span>;
    }
  };

  const formatFrequency = (freq: string) => {
    switch (freq) {
      case "15_DAYS": return "Every 15 Days";
      case "30_DAYS": return "Every 30 Days (Monthly)";
      case "45_DAYS": return "Every 45 Days";
      case "60_DAYS": return "Every 60 Days (Bi-monthly)";
      case "90_DAYS": return "Every 90 Days (Quarterly)";
      default: return freq;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#123D28] flex items-center gap-2">
            <Repeat size={22} className="text-[#AE6A2B]" /> Product Subscriptions &amp; Recurring Deliveries
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Monitor subscriber schedules, automate periodic deliveries, and handle inventory or payment exceptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="py-2 px-4 bg-[#123D28] hover:bg-[#0B2518] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
            onClick={handleProcessDueCycles}
            disabled={processDueMutation.isPending}
          >
            <RefreshCw size={14} className={processDueMutation.isPending ? "animate-spin" : ""} />
            <span>{processDueMutation.isPending ? "Processing Due Cycles..." : "Process Due Cycles"}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Total Subscriptions</span>
          <div className="text-2xl font-bold font-serif text-[#123D28] mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Active</span>
          <div className="text-2xl font-bold font-serif text-emerald-800 mt-1">{stats.active}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Paused</span>
          <div className="text-2xl font-bold font-serif text-amber-800 mt-1">{stats.paused}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Due in 7 Days</span>
          <div className="text-2xl font-bold font-serif text-blue-800 mt-1">{stats.upcoming7Days}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Exceptions</span>
          <div className="text-2xl font-bold font-serif text-rose-800 mt-1">{stats.exceptions}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Cancelled</span>
          <div className="text-2xl font-bold font-serif text-gray-700 mt-1">{stats.cancelled}</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by subscription #, customer, product, email..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 border border-gray-300 rounded-xl bg-white text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="PAYMENT_PENDING">Payment Pending</option>
              <option value="FAILED">Exceptions / Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 font-semibold">Frequency:</span>
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className="py-1.5 px-2.5 border border-gray-300 rounded-xl bg-white text-xs"
            >
              <option value="ALL">All Frequencies</option>
              <option value="15_DAYS">Every 15 Days</option>
              <option value="30_DAYS">Every 30 Days</option>
              <option value="45_DAYS">Every 45 Days</option>
              <option value="60_DAYS">Every 60 Days</option>
              <option value="90_DAYS">Every 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7EB] border-b border-gray-200 text-[#123D28] font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Subscription #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product &amp; Variant</th>
                <th className="py-3 px-4">Qty &amp; Total</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Next Delivery</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500 italic">
                    No subscriptions match the selected criteria.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#123D28] whitespace-nowrap">
                      {sub.subscriptionNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{sub.customerName}</div>
                      <div className="text-[11px] text-gray-500">{sub.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#123D28]">{sub.productName}</div>
                      <div className="text-[11px] text-gray-500">{sub.variantLabel || "Standard"}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold">{sub.quantity}x</span> · <span className="font-bold text-[#123D28]">₹{sub.totalPerCycle}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-700">
                      {formatFrequency(sub.frequency)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-gray-900">
                      {sub.status === "PAUSED" ? (
                        <span className="text-amber-800">Paused</span>
                      ) : sub.status === "CANCELLED" ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span>{sub.nextDeliveryDate?.slice(0, 10)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[11px] font-semibold text-gray-700">
                        {sub.paymentPreference === "COD" ? "Cash on Delivery" : "Online Renewal"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedSubId(sub.id)}
                        className="py-1 px-3 border border-gray-300 hover:border-[#123D28] hover:text-[#123D28] rounded-lg font-semibold transition-colors"
                      >
                        Manage &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Detail & Action Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF7EB] w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-300 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-[#123D28] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#E5C378]">
                  <Repeat size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-bold text-white">{selectedSub.subscriptionNumber}</h3>
                    {getStatusBadge(selectedSub.status)}
                  </div>
                  <p className="text-xs text-white/70">Subscriber: {selectedSub.customerName} ({selectedSub.customerEmail})</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubId(null)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-800">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                  <div className="font-bold text-[#123D28] flex items-center gap-1">
                    <Package size={14} /> Product &amp; Variant
                  </div>
                  <div className="font-bold text-gray-900">{selectedSub.productName}</div>
                  <div className="text-gray-500">Pack: {selectedSub.variantLabel || "100g"} · SKU: {selectedSub.productSku}</div>
                  <div className="text-gray-700">Quantity: {selectedSub.quantity} unit(s)</div>
                  <div className="text-emerald-800 font-bold">Cycle Total: ₹{selectedSub.totalPerCycle}</div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                  <div className="font-bold text-[#123D28] flex items-center gap-1">
                    <Calendar size={14} /> Schedule &amp; Lifecycle
                  </div>
                  <div>Frequency: <strong>{formatFrequency(selectedSub.frequency)}</strong></div>
                  <div>Started: {selectedSub.startDate?.slice(0, 10)}</div>
                  <div>Next Delivery: <strong>{selectedSub.nextDeliveryDate?.slice(0, 10)}</strong></div>
                  <div>Completed Cycles: <strong>{selectedSub.cycleCount}</strong></div>
                  {selectedSub.failureReason && (
                    <div className="text-rose-700 font-bold mt-1">⚠️ Issue: {selectedSub.failureReason}</div>
                  )}
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1">
                  <div className="font-bold text-[#123D28] flex items-center gap-1">
                    <MapPin size={14} /> Shipping Destination
                  </div>
                  <div className="font-semibold text-gray-900">{selectedSub.deliveryAddress?.recipientName}</div>
                  <div className="text-gray-500">{selectedSub.deliveryAddress?.phone}</div>
                  <div className="text-gray-600 line-clamp-2">
                    {selectedSub.deliveryAddress?.street || selectedSub.deliveryAddress?.addressLine1},{" "}
                    {selectedSub.deliveryAddress?.city}, {selectedSub.deliveryAddress?.pinCode}
                  </div>
                  {selectedSub.deliveryInstructions && (
                    <div className="text-gray-500 italic text-[11px]">"{selectedSub.deliveryInstructions}"</div>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 flex flex-wrap items-center justify-between gap-3">
                <div className="font-bold text-[#123D28]">Administrative Actions:</div>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedSub.status === "ACTIVE" && (
                    <>
                      <button
                        type="button"
                        className="py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                        onClick={() => {
                          setActionType("pause");
                          setActionReason("");
                        }}
                      >
                        <Pause size={14} /> Pause
                      </button>
                      <button
                        type="button"
                        className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                        onClick={() => {
                          setActionType("skip");
                          setActionReason("");
                        }}
                      >
                        <SkipForward size={14} /> Skip Cycle
                      </button>
                      <button
                        type="button"
                        className="py-1.5 px-3 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold flex items-center gap-1.5"
                        onClick={() => {
                          setActionType("cancel");
                          setActionReason("");
                        }}
                      >
                        <XCircle size={14} /> Cancel
                      </button>
                    </>
                  )}

                  {selectedSub.status === "PAUSED" && (
                    <>
                      <button
                        type="button"
                        className="py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1.5"
                        onClick={() => resumeMutation.mutate({ id: selectedSub.id })}
                        disabled={resumeMutation.isPending}
                      >
                        <Play size={14} /> Resume
                      </button>
                      <button
                        type="button"
                        className="py-1.5 px-3 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold flex items-center gap-1.5"
                        onClick={() => {
                          setActionType("cancel");
                          setActionReason("");
                        }}
                      >
                        <XCircle size={14} /> Cancel
                      </button>
                    </>
                  )}

                  {selectedSub.status === "CANCELLED" && (
                    <span className="text-gray-500 italic">No further actions available for cancelled subscriptions.</span>
                  )}
                </div>
              </div>

              {/* Action Confirmation Panel */}
              {actionType && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-3">
                  <div className="font-bold text-amber-900 text-sm">
                    {actionType === "pause" && "Pause Subscription"}
                    {actionType === "skip" && "Skip Next Delivery Cycle"}
                    {actionType === "cancel" && "Terminate Subscription"}
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      {actionType === "cancel" ? "Reason for cancellation *" : "Audit Note / Reason (Optional):"}
                    </label>
                    <input
                      type="text"
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Enter administrative reason for this action..."
                      className="w-full p-2 border border-amber-300 rounded-xl bg-white text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="py-1.5 px-3 border border-gray-300 bg-white rounded-xl font-semibold text-gray-700"
                      onClick={() => setActionType(null)}
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      className="py-1.5 px-4 bg-[#123D28] text-white rounded-xl font-bold"
                      onClick={() => {
                        if (actionType === "pause") {
                          pauseMutation.mutate({ id: selectedSub.id, reason: actionReason });
                        } else if (actionType === "skip") {
                          skipMutation.mutate({ id: selectedSub.id, reason: actionReason });
                        } else if (actionType === "cancel") {
                          if (!actionReason.trim()) {
                            toast.error("Please enter a cancellation reason.");
                            return;
                          }
                          cancelMutation.mutate({ id: selectedSub.id, reason: actionReason });
                        }
                      }}
                    >
                      Confirm Action
                    </button>
                  </div>
                </div>
              )}

              {/* Associated Generated Orders */}
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-sm text-[#123D28] flex items-center gap-1.5">
                  <ShoppingBag size={15} /> Generated Orders ({selectedSub.orders?.length || 0})
                </h4>
                {selectedSub.orders && selectedSub.orders.length > 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600">
                        <tr>
                          <th className="py-2.5 px-3">Order Number</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Total Amount</th>
                          <th className="py-2.5 px-3">Order Status</th>
                          <th className="py-2.5 px-3">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedSub.orders.map((ord: any) => (
                          <tr key={ord.id}>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#123D28]">{ord.orderNumber}</td>
                            <td className="py-2.5 px-3">{ord.createdAt?.slice(0, 10)}</td>
                            <td className="py-2.5 px-3 font-semibold">₹{ord.total}</td>
                            <td className="py-2.5 px-3 font-bold text-emerald-700">{ord.orderStatus}</td>
                            <td className="py-2.5 px-3">{ord.paymentStatus} ({ord.paymentMethod})</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 italic p-3 bg-white rounded-xl border border-gray-200">
                    No recurring orders generated yet. Orders are created when scheduled cycles become due.
                  </p>
                )}
              </div>

              {/* Cycle History */}
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-sm text-[#123D28] flex items-center gap-1.5">
                  <Clock size={15} /> Delivery Cycles ({selectedSub.cycles?.length || 0})
                </h4>
                {selectedSub.cycles && selectedSub.cycles.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-600">
                        <tr>
                          <th className="py-2 px-3">Cycle Reference</th>
                          <th className="py-2 px-3">Scheduled Date</th>
                          <th className="py-2 px-3">Order Ref</th>
                          <th className="py-2 px-3">Amount</th>
                          <th className="py-2 px-3">Cycle Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedSub.cycles.map((cyc: any) => (
                          <tr key={cyc.id}>
                            <td className="py-2 px-3 font-mono font-bold text-[#123D28]">{cyc.cycleReference}</td>
                            <td className="py-2 px-3">{cyc.scheduledDate?.slice(0, 10)}</td>
                            <td className="py-2 px-3 font-mono">{cyc.orderNumber || "—"}</td>
                            <td className="py-2 px-3">₹{cyc.amount}</td>
                            <td className="py-2 px-3 font-semibold">{cyc.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Subscription History Audit Log */}
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-sm text-[#123D28]">Audit Trail &amp; Events</h4>
                <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                  {selectedSub.history && selectedSub.history.length > 0 ? (
                    selectedSub.history.map((h: any) => (
                      <div key={h.id} className="text-[11px] pb-2 border-b border-gray-100 last:border-0 last:pb-0 flex items-start justify-between">
                        <div>
                          <span className="font-bold text-[#123D28]">{h.action}</span> by{" "}
                          <span className="font-semibold text-gray-700">{h.actor}</span>: {h.note}
                        </div>
                        <span className="text-gray-400 whitespace-nowrap ml-2">{h.createdAt?.slice(0, 16).replace("T", " ")}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 italic">No historical events recorded.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
