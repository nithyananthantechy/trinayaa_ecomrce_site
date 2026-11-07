import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Award,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Package,
  Gift,
  RefreshCw,
  X,
  PlusCircle,
  MinusCircle,
  Truck,
  RotateCcw,
  Sliders,
  TrendingUp,
} from "lucide-react";

export default function RewardsTab() {
  const [activeSubTab, setActiveSubTab] = useState<"redemptions" | "customers" | "products">("redemptions");
  const [redemptionStatusFilter, setRedemptionStatusFilter] = useState<string>("ALL");
  const [redemptionSearch, setRedemptionSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  // Adjustment Modal state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [adjustPoints, setAdjustPoints] = useState<number>(50);
  const [adjustType, setAdjustType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [adjustReason, setAdjustReason] = useState("");

  // Fulfill Modal state
  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState<any>(null);
  const [fulfillOrderId, setFulfillOrderId] = useState("");
  const [fulfillNotes, setFulfillNotes] = useState("");

  // Customer Ledger Modal
  const [ledgerModalOpen, setLedgerModalOpen] = useState(false);
  const [ledgerCustomerId, setLedgerCustomerId] = useState<string | null>(null);

  // Queries
  const { data: overview, refetch: refetchOverview } = trpc.admin.rewards.overview.useQuery();
  const {
    data: redemptions = [],
    isLoading: redemptionsLoading,
    refetch: refetchRedemptions,
  } = trpc.admin.rewards.listRedemptions.useQuery({
    status: redemptionStatusFilter,
    search: redemptionSearch,
  });

  const {
    data: customers = [],
    isLoading: customersLoading,
    refetch: refetchCustomers,
  } = trpc.admin.rewards.listCustomers.useQuery({
    search: customerSearch,
  });

  const { data: customerDetails, isLoading: customerDetailsLoading } = trpc.admin.rewards.getCustomerDetails.useQuery(
    { customerId: ledgerCustomerId! },
    { enabled: Boolean(ledgerCustomerId) }
  );

  const { data: allProducts = [], refetch: refetchProducts } = trpc.admin.products.list.useQuery();

  // Mutations
  const moderateRedemptionMutation = trpc.admin.rewards.moderateRedemption.useMutation({
    onSuccess: (updated) => {
      toast.success(`Redemption ${updated?.id} marked as ${updated?.status}`);
      refetchRedemptions();
      refetchOverview();
      setFulfillModalOpen(false);
      setSelectedRedemption(null);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update redemption");
    },
  });

  const adjustPointsMutation = trpc.admin.rewards.adjustPoints.useMutation({
    onSuccess: () => {
      toast.success("Customer reward points adjusted successfully!");
      refetchCustomers();
      refetchOverview();
      setAdjustModalOpen(false);
      setSelectedCustomer(null);
      setAdjustReason("");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to adjust points");
    },
  });

  const toggleEligibilityMutation = trpc.admin.rewards.toggleProductEligibility.useMutation({
    onSuccess: (prod) => {
      toast.success(`Reward eligibility updated for ${prod?.nameEn || prod?.sku}`);
      refetchProducts();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update product eligibility");
    },
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!adjustReason.trim()) {
      toast.error("Please enter a mandatory audit reason.");
      return;
    }
    const pts = Math.abs(adjustPoints);
    if (pts <= 0) {
      toast.error("Points must be greater than zero.");
      return;
    }
    const finalPoints = adjustType === "CREDIT" ? pts : -pts;
    adjustPointsMutation.mutate({
      customerId: selectedCustomer.id,
      points: finalPoints,
      reason: adjustReason.trim(),
    });
  };

  const handleFulfillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRedemption) return;
    moderateRedemptionMutation.mutate({
      redemptionId: selectedRedemption.id,
      status: "FULFILLED",
      orderId: fulfillOrderId.trim() || undefined,
      adminNotes: fulfillNotes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DEDFD5] rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-[#6C7167] uppercase tracking-wider">Total Points Issued</div>
            <div className="text-2xl font-bold font-serif text-[#123D28] mt-1">
              {overview?.totalPointsIssued?.toLocaleString() || "0"}
            </div>
            <div className="text-[11px] text-[#6C7167] mt-0.5">Across verified reviews & feedback</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#EFECE4] flex items-center justify-center text-[#123D28]">
            <Award size={24} />
          </div>
        </div>

        <div className="bg-white border border-[#DEDFD5] rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-[#6C7167] uppercase tracking-wider">Points Redeemed</div>
            <div className="text-2xl font-bold font-serif text-[#A85C32] mt-1">
              {overview?.totalPointsRedeemed?.toLocaleString() || "0"}
            </div>
            <div className="text-[11px] text-[#6C7167] mt-0.5">Spent on free products</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#F6EDE8] flex items-center justify-center text-[#A85C32]">
            <Gift size={24} />
          </div>
        </div>

        <div className="bg-white border border-[#DEDFD5] rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-[#6C7167] uppercase tracking-wider">Pending Redemptions</div>
            <div className="text-2xl font-bold font-serif text-[#123D28] mt-1">
              {overview?.pendingRedemptions ?? 0}
            </div>
            <div className="text-[11px] text-[#6C7167] mt-0.5">Awaiting packing / fulfillment</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white border border-[#DEDFD5] rounded-xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-[#6C7167] uppercase tracking-wider">Loyalty Customers</div>
            <div className="text-2xl font-bold font-serif text-[#123D28] mt-1">
              {overview?.participatingCustomers ?? 0}
            </div>
            <div className="text-[11px] text-[#6C7167] mt-0.5">With active points ledger</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#EFECE4] flex items-center justify-center text-[#123D28]">
            <User size={24} />
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="bg-white border border-[#DEDFD5] rounded-xl shadow-xs overflow-hidden">
        <div className="border-b border-[#DEDFD5] flex items-center justify-between px-6 py-4 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            {[
              { id: "redemptions", label: `Redemption Requests (${redemptions.length})`, icon: Gift },
              { id: "customers", label: `Customer Loyalty Accounts (${customers.length})`, icon: User },
              { id: "products", label: "Reward Eligible Products", icon: Package },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSubTab(id as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${
                  activeSubTab === id
                    ? "bg-[#123D28] text-white"
                    : "text-[#6C7167] hover:bg-[#FBF8F0] hover:text-[#123D28]"
                }`}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              refetchOverview();
              refetchRedemptions();
              refetchCustomers();
              refetchProducts();
              toast.info("Refreshed rewards data");
            }}
            className="text-xs text-[#6C7167] hover:text-[#123D28] flex items-center gap-1.5 py-1.5 px-3 border border-[#DEDFD5] rounded-lg bg-white"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* SUBTAB 1: REDEMPTIONS */}
        {/* ======================================================== */}
        {activeSubTab === "redemptions" && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-[#6C7167]">Filter Status:</span>
                {["ALL", "REQUESTED", "APPROVED", "FULFILLED", "REJECTED", "CANCELLED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setRedemptionStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      redemptionStatusFilter === status
                        ? "bg-[#123D28] text-white border-[#123D28]"
                        : "bg-white text-[#6C7167] border-[#DEDFD5] hover:border-[#123D28]"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C7167]" />
                <input
                  type="text"
                  placeholder="Search customer, SKU or ID..."
                  value={redemptionSearch}
                  onChange={(e) => setRedemptionSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#DEDFD5] rounded-lg bg-[#FBF8F0] focus:bg-white focus:outline-none focus:border-[#123D28]"
                />
              </div>
            </div>

            {/* Redemptions Table */}
            {redemptionsLoading ? (
              <div className="py-12 text-center text-xs text-[#6C7167]">Loading redemptions...</div>
            ) : redemptions.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#6C7167] border border-dashed border-[#DEDFD5] rounded-xl">
                No reward redemption requests found matching the current filters.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#DEDFD5] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FBF8F0] text-[#123D28] font-bold border-b border-[#DEDFD5]">
                    <tr>
                      <th className="py-3 px-4">Request ID & Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Redeemed Free Product</th>
                      <th className="py-3 px-4 text-center">Points</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Dispatch / Notes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFECE4]">
                    {redemptions.map((r: any) => (
                      <tr key={r.id} className="hover:bg-[#FAF8F2] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-semibold text-[#123D28]">{r.id}</div>
                          <div className="text-[10px] text-[#6C7167] mt-0.5">
                            {new Date(r.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#123D28]">{r.customerName || "Customer"}</div>
                          <div className="text-[10px] text-[#6C7167]">{r.customerEmail}</div>
                          {r.customerPhone && <div className="text-[10px] text-[#6C7167]">{r.customerPhone}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg border border-[#DEDFD5] overflow-hidden bg-white shrink-0">
                              <img
                                src={r.productImage || "/images/brand/emblem_crisp.png"}
                                alt={r.productName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-[#123D28] line-clamp-1">{r.productName || "Product"}</div>
                              <div className="text-[10px] font-mono text-[#6C7167]">{r.productSku}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-[#A85C32] bg-[#F6EDE8] px-2 py-0.5 rounded text-[11px]">
                            {r.pointsSpent} pts
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === "FULFILLED"
                                ? "bg-emerald-100 text-emerald-800"
                                : r.status === "APPROVED"
                                ? "bg-blue-100 text-blue-800"
                                : r.status === "REQUESTED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-[200px]">
                          {r.orderId && (
                            <div className="text-[11px] font-mono font-bold text-[#123D28]">
                              Order / Track: {r.orderId}
                            </div>
                          )}
                          {r.notes && (
                            <div className="text-[11px] text-[#6C7167] italic truncate" title={r.notes}>
                              "{r.notes}"
                            </div>
                          )}
                          {r.adminNotes && (
                            <div className="text-[10px] text-[#A85C32] truncate" title={r.adminNotes}>
                              Admin: {r.adminNotes}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {r.status === "REQUESTED" && (
                              <>
                                <button
                                  onClick={() =>
                                    moderateRedemptionMutation.mutate({
                                      redemptionId: r.id,
                                      status: "APPROVED",
                                      adminNotes: "Approved for packing",
                                    })
                                  }
                                  className="px-2.5 py-1 bg-[#123D28] text-white rounded text-[10px] font-bold hover:bg-[#1F5638]"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRedemption(r);
                                    setFulfillModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-700 text-white rounded text-[10px] font-bold hover:bg-emerald-800"
                                >
                                  Fulfill
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt("Reason for rejecting this redemption (points will be restored):", "Temporarily out of stock");
                                    if (reason !== null) {
                                      moderateRedemptionMutation.mutate({
                                        redemptionId: r.id,
                                        status: "REJECTED",
                                        adminNotes: reason,
                                      });
                                    }
                                  }}
                                  className="px-2.5 py-1 border border-red-300 text-red-700 rounded text-[10px] font-bold hover:bg-red-50"
                                >
                                  Reject & Restore
                                </button>
                              </>
                            )}

                            {r.status === "APPROVED" && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedRedemption(r);
                                    setFulfillModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 bg-emerald-700 text-white rounded text-[10px] font-bold hover:bg-emerald-800"
                                >
                                  Fulfill Dispatch
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt("Reason for cancelling approved redemption (points will be restored):", "Customer requested cancellation");
                                    if (reason !== null) {
                                      moderateRedemptionMutation.mutate({
                                        redemptionId: r.id,
                                        status: "CANCELLED",
                                        adminNotes: reason,
                                      });
                                    }
                                  }}
                                  className="px-2.5 py-1 border border-red-300 text-red-700 rounded text-[10px] font-bold hover:bg-red-50"
                                >
                                  Cancel & Restore
                                </button>
                              </>
                            )}

                            {r.status === "FULFILLED" && (
                              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 size={13} /> Complete
                              </span>
                            )}

                            {(r.status === "REJECTED" || r.status === "CANCELLED") && (
                              <span className="text-[11px] text-[#6C7167] italic flex items-center gap-1">
                                <RotateCcw size={12} /> Points Restored
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBTAB 2: CUSTOMER LOYALTY ACCOUNTS */}
        {/* ======================================================== */}
        {activeSubTab === "customers" && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="text-xs text-[#6C7167]">
                Manage customer points balances, manual credits, debits, and inspect audit ledgers.
              </div>
              <div className="relative min-w-[240px]">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C7167]" />
                <input
                  type="text"
                  placeholder="Search customer name, email, phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#DEDFD5] rounded-lg bg-[#FBF8F0] focus:bg-white focus:outline-none focus:border-[#123D28]"
                />
              </div>
            </div>

            {customersLoading ? (
              <div className="py-12 text-center text-xs text-[#6C7167]">Loading customer accounts...</div>
            ) : customers.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#6C7167] border border-dashed border-[#DEDFD5] rounded-xl">
                No customer loyalty accounts found matching your query.
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#DEDFD5] rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FBF8F0] text-[#123D28] font-bold border-b border-[#DEDFD5]">
                    <tr>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4 text-center">Available Balance</th>
                      <th className="py-3 px-4 text-center">Total Earned</th>
                      <th className="py-3 px-4 text-center">Total Redeemed</th>
                      <th className="py-3 px-4 text-center">Activity Count</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFECE4]">
                    {customers.map((c: any) => (
                      <tr key={c.id} className="hover:bg-[#FAF8F2] transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-[#123D28]">
                          <div>{c.name}</div>
                          <div className="text-[10px] font-mono text-[#6C7167]">{c.id}</div>
                        </td>
                        <td className="py-3.5 px-4 text-[#6C7167]">
                          <div>{c.email}</div>
                          {c.phone && <div className="text-[10px]">{c.phone}</div>}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-[#123D28] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded text-xs">
                            {c.balance} pts
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-emerald-700 font-semibold">
                          +{c.totalEarned}
                        </td>
                        <td className="py-3.5 px-4 text-center text-[#A85C32] font-semibold">
                          -{c.totalRedeemed}
                        </td>
                        <td className="py-3.5 px-4 text-center text-[#6C7167]">
                          {c.transactionCount} transactions
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedCustomer(c);
                                setAdjustType("CREDIT");
                                setAdjustPoints(50);
                                setAdjustModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-[#123D28] text-white rounded text-[10px] font-bold hover:bg-[#1F5638]"
                            >
                              Adjust Points
                            </button>
                            <button
                              onClick={() => {
                                setLedgerCustomerId(c.id);
                                setLedgerModalOpen(true);
                              }}
                              className="px-2.5 py-1 border border-[#DEDFD5] text-[#123D28] bg-white rounded text-[10px] font-bold hover:bg-[#FBF8F0]"
                            >
                              View Ledger
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SUBTAB 3: REWARD ELIGIBLE PRODUCTS */}
        {/* ======================================================== */}
        {activeSubTab === "products" && (
          <div className="p-6 space-y-4">
            <div className="text-xs text-[#6C7167]">
              Configure which botanical catalogue products are available for customers to redeem with their loyalty points.
              (All published products are eligible by default; toggle off to restrict specific rare or reserve lines).
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allProducts.map((p: any) => {
                const isEligible = p.isRewardEligible !== false && p.isRewardEligible !== 0;
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      isEligible ? "bg-white border-[#DEDFD5]" : "bg-gray-50 border-gray-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg border border-[#DEDFD5] overflow-hidden bg-white shrink-0">
                        <img src={p.image || p.primaryImage} alt={p.nameEn} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#123D28] line-clamp-1">{p.nameEn}</div>
                        <div className="text-[10px] font-mono text-[#6C7167]">{p.sku} · ₹{p.sellingPrice}</div>
                        <div className="text-[10px] text-[#A85C32] font-semibold mt-0.5">{p.botanicalCategory || p.category}</div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        toggleEligibilityMutation.mutate({
                          productId: p.id,
                          isEligible: !isEligible,
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                        isEligible
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {isEligible ? "Eligible" : "Ineligible"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Adjust Points Modal */}
      {adjustModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DEDFD5] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFECE4]">
              <div>
                <h3 className="font-serif text-base font-bold text-[#123D28]">Adjust Reward Points</h3>
                <p className="text-xs text-[#6C7167]">Customer: {selectedCustomer.name} ({selectedCustomer.email})</p>
              </div>
              <button
                onClick={() => setAdjustModalOpen(false)}
                className="text-[#6C7167] hover:text-[#123D28] p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType("CREDIT")}
                  className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 border ${
                    adjustType === "CREDIT"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                      : "bg-white border-[#DEDFD5] text-[#6C7167]"
                  }`}
                >
                  <PlusCircle size={14} /> Credit Points
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType("DEBIT")}
                  className={`flex-1 py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 border ${
                    adjustType === "DEBIT"
                      ? "bg-red-50 border-red-500 text-red-800"
                      : "bg-white border-[#DEDFD5] text-[#6C7167]"
                  }`}
                >
                  <MinusCircle size={14} /> Debit Points
                </button>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Points Amount {adjustType === "DEBIT" && `(Current balance: ${selectedCustomer.balance} pts)`}
                </label>
                <input
                  type="number"
                  min="1"
                  max={adjustType === "DEBIT" ? selectedCustomer.balance : 10000}
                  value={adjustPoints}
                  onChange={(e) => setAdjustPoints(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0] font-bold text-sm text-[#123D28]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Mandatory Audit Reason</label>
                <textarea
                  rows={3}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Goodwill bonus for photo testimonial, correction of duplicate credit, etc."
                  className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EFECE4]">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 border border-[#DEDFD5] rounded text-[#6C7167] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustPointsMutation.isPending}
                  className="px-4 py-2 bg-[#123D28] text-white rounded font-bold hover:bg-[#1F5638]"
                >
                  {adjustPointsMutation.isPending ? "Applying..." : "Confirm Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fulfill Modal */}
      {fulfillModalOpen && selectedRedemption && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#DEDFD5] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFECE4]">
              <div>
                <h3 className="font-serif text-base font-bold text-[#123D28]">Fulfill Reward Dispatch</h3>
                <p className="text-xs text-[#6C7167]">Redemption: {selectedRedemption.id}</p>
              </div>
              <button onClick={() => setFulfillModalOpen(false)} className="text-[#6C7167] hover:text-[#123D28]">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFulfillSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-[#FBF8F0] rounded-lg border border-[#DEDFD5] flex items-center gap-3">
                <div className="w-10 h-10 rounded border border-[#DEDFD5] overflow-hidden bg-white shrink-0">
                  <img src={selectedRedemption.productImage} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-bold text-[#123D28]">{selectedRedemption.productName}</div>
                  <div className="text-[10px] font-mono text-[#6C7167]">Customer: {selectedRedemption.customerName}</div>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Dispatch Order ID / Courier Tracking Reference</label>
                <input
                  type="text"
                  value={fulfillOrderId}
                  onChange={(e) => setFulfillOrderId(e.target.value)}
                  placeholder="e.g. TRN-REW-1029 or ST-COURIER-98234"
                  className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0] font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Dispatch Notes</label>
                <textarea
                  rows={2}
                  value={fulfillNotes}
                  onChange={(e) => setFulfillNotes(e.target.value)}
                  placeholder="e.g. Packed in standard 100g zip pouch, dispatched via Erode local hub"
                  className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EFECE4]">
                <button
                  type="button"
                  onClick={() => setFulfillModalOpen(false)}
                  className="px-4 py-2 border border-[#DEDFD5] rounded text-[#6C7167] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={moderateRedemptionMutation.isPending}
                  className="px-4 py-2 bg-emerald-700 text-white rounded font-bold hover:bg-emerald-800"
                >
                  {moderateRedemptionMutation.isPending ? "Fulfilling..." : "Confirm Fulfillment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Ledger Modal */}
      {ledgerModalOpen && ledgerCustomerId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-[#DEDFD5] space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#EFECE4]">
              <div>
                <h3 className="font-serif text-base font-bold text-[#123D28]">Customer Rewards Activity Ledger</h3>
                <p className="text-xs text-[#6C7167]">Customer ID: {ledgerCustomerId}</p>
              </div>
              <button onClick={() => setLedgerModalOpen(false)} className="text-[#6C7167] hover:text-[#123D28]">
                <X size={18} />
              </button>
            </div>

            {customerDetailsLoading ? (
              <div className="py-12 text-center text-xs text-[#6C7167]">Loading customer ledger...</div>
            ) : (
              <div className="overflow-y-auto space-y-4 text-xs flex-1 pr-1">
                <div className="p-4 bg-[#FBF8F0] rounded-xl border border-[#DEDFD5] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#6C7167] uppercase tracking-wider">Current Balance:</span>
                    <span className="ml-2 font-serif font-bold text-lg text-[#123D28]">
                      {customerDetails?.balance?.balance ?? 0} pts
                    </span>
                  </div>
                  <div className="text-[11px] text-[#6C7167]">
                    Total Earned: <span className="font-bold text-emerald-700">+{customerDetails?.balance?.totalEarned}</span> · Total Redeemed: <span className="font-bold text-[#A85C32]">-{customerDetails?.balance?.totalRedeemed}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-[#123D28] mb-2">Ledger Transactions</h4>
                  <div className="border border-[#DEDFD5] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FBF8F0] text-[#123D28] font-bold border-b border-[#DEDFD5]">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3 text-right">Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EFECE4]">
                        {customerDetails?.transactions?.map((t: any) => (
                          <tr key={t.id} className="hover:bg-[#FAF8F2]">
                            <td className="py-2.5 px-3 text-[10px] text-[#6C7167]">
                              {new Date(t.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-2.5 px-3 font-semibold">{t.transactionType}</td>
                            <td className="py-2.5 px-3 text-[#6C7167]">{t.description}</td>
                            <td
                              className={`py-2.5 px-3 text-right font-bold ${
                                t.points > 0 ? "text-emerald-700" : "text-[#A85C32]"
                              }`}
                            >
                              {t.points > 0 ? `+${t.points}` : t.points}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
