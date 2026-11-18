import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Store,
  Building,
  Plus,
  RefreshCw,
  Search,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  X,
  History,
  Printer,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  UserCheck,
  RotateCcw
} from "lucide-react";

export default function RetailOpsTab() {
  const [activeSubTab, setActiveSubTab] = useState<"branches" | "sales" | "adjustments">("branches");

  // Queries
  const { data: branches = [], refetch: refetchBranches, isLoading: branchesLoading } =
    trpc.admin.retail.branches.list.useQuery();

  const [salesSearch, setSalesSearch] = useState("");
  const [salesBranchFilter, setSalesBranchFilter] = useState("ALL");
  const { data: allSales = [], refetch: refetchSales, isLoading: salesLoading } =
    trpc.admin.retail.allSales.useQuery({
      branchId: salesBranchFilter === "ALL" ? undefined : salesBranchFilter,
      search: salesSearch,
      limit: 100,
    });

  const { data: adjustments = [], refetch: refetchAdjustments, isLoading: adjLoading } =
    trpc.admin.retail.allAdjustments.useQuery();

  // Create Branch Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Erode");
  const [state, setState] = useState("Tamil Nadu");
  const [pinCode, setPinCode] = useState("638011");
  const [phone, setPhone] = useState("+91 ");
  const [email, setEmail] = useState("");

  const createBranchMutation = trpc.admin.retail.branches.create.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Physical branch "${data.name}" created successfully`);
      setIsBranchModalOpen(false);
      setCode("");
      setName("");
      setAddress("");
      refetchBranches();
    },
    onError: (err: any) => toast.error(err.message || "Failed to create branch"),
  });

  // Review Adjustment Mutation
  const reviewAdjMutation = trpc.admin.retail.reviewAdjustment.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Adjustment ${data.adjustment_number} marked as ${data.status}`);
      refetchAdjustments();
      refetchBranches();
    },
    onError: (err: any) => toast.error(err.message || "Failed to update adjustment"),
  });

  // Cancel Sale Mutation
  const cancelSaleMutation = trpc.admin.retail.cancelSale.useMutation({
    onSuccess: (sale: any) => {
      toast.success(`Sale ${sale.invoice_number} cancelled and branch stock reversed`);
      refetchSales();
    },
    onError: (err: any) => toast.error(err.message || "Failed to cancel sale"),
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#AE6A2B] uppercase tracking-wider">Offline Retail &amp; POS</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Multi-Branch Architecture
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#123D28] mt-1 flex items-center gap-2">
            <Store size={26} className="text-[#123D28]" /> Retail Branches &amp; Offline Sales Oversight
          </h2>
          <p className="text-xs text-[#6C7167] mt-1 max-w-2xl">
            Super Administrator controls for physical retail branch outlets, offline point-of-sale invoices, staff branch
            assignments, and stock adjustment approvals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              refetchBranches();
              refetchSales();
              refetchAdjustments();
              toast.info("Refreshed retail operations data");
            }}
            className="px-3 py-2 rounded-lg bg-white border border-[#DEDFD5] text-[#123D28] text-xs font-bold hover:bg-[#FBF8F0] shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsBranchModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-[#123D28] text-white text-xs font-bold hover:bg-[#1E5638] shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus size={15} /> Add Retail Branch
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-[#E2E8F0] gap-4">
        <button
          onClick={() => setActiveSubTab("branches")}
          className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "branches"
              ? "border-b-2 border-[#123D28] text-[#123D28]"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Building size={14} /> Physical Branches ({branches.length})
        </button>
        <button
          onClick={() => setActiveSubTab("sales")}
          className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "sales"
              ? "border-b-2 border-[#123D28] text-[#123D28]"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <History size={14} /> All Retail Invoices ({allSales.length})
        </button>
        <button
          onClick={() => setActiveSubTab("adjustments")}
          className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === "adjustments"
              ? "border-b-2 border-[#123D28] text-[#123D28]"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Package size={14} /> Stock Adjustment Requests ({adjustments.filter((a: any) => a.status === "PENDING").length} pending)
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: PHYSICAL BRANCHES                             */}
      {/* ======================================================== */}
      {activeSubTab === "branches" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branchesLoading ? (
            <div className="col-span-full py-12 text-center text-xs text-[#94A3B8]">Loading physical branches...</div>
          ) : branches.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-[#94A3B8]">No branches configured.</div>
          ) : (
            branches.map((b: any) => (
              <div
                key={b.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {b.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        b.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {b.isActive ? "Active Outlet" : "Inactive"}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#123D28] mb-1">{b.name}</h3>
                  <p className="text-xs text-[#64748B] mb-3 flex items-start gap-1">
                    <MapPin size={13} className="shrink-0 mt-0.5 text-[#AE6A2B]" />
                    <span>
                      {b.address}, {b.city}, {b.state} - {b.pinCode}
                    </span>
                  </p>
                  <div className="text-xs text-[#475569] space-y-1 pt-2 border-t border-[#F1F5F9]">
                    <div>Phone: <span className="font-medium text-[#0F172A]">{b.phone}</span></div>
                    {b.email && <div>Email: <span className="font-medium text-[#0F172A]">{b.email}</span></div>}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#94A3B8]">Branch ID: {b.id}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: ALL RETAIL INVOICES & SALES                   */}
      {/* ======================================================== */}
      {activeSubTab === "sales" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-xs flex flex-col md:flex-row items-center gap-3 text-xs">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 text-[#94A3B8]" size={15} />
              <input
                type="text"
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                placeholder="Search across all retail sales by invoice # or customer..."
                className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28]"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="font-semibold text-[#64748B]">Branch:</span>
              <select
                value={salesBranchFilter}
                onChange={(e) => setSalesBranchFilter(e.target.value)}
                className="p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28]"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Handler</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {salesLoading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#94A3B8]">Loading invoices...</td>
                    </tr>
                  ) : allSales.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-[#94A3B8]">No retail sales recorded.</td>
                    </tr>
                  ) : (
                    allSales.map((s: any) => (
                      <tr key={s.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 px-4 font-mono font-bold text-[#123D28]">{s.invoice_number}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#0F172A]">{s.branchCode || s.branchName}</span>
                        </td>
                        <td className="py-3 px-4 text-[#64748B]">
                          {new Date(s.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4">{s.customer_name}</td>
                        <td className="py-3 px-4 text-[#64748B]">{s.handler_name}</td>
                        <td className="py-3 px-4 font-bold text-[#123D28]">₹{s.total.toFixed(2)}</td>
                        <td className="py-3 px-4">{s.payment_method}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.sale_status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {s.sale_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {s.sale_status === "COMPLETED" && (
                            <button
                              onClick={() => {
                                const reason = prompt(`Reason for cancelling invoice ${s.invoice_number}:`);
                                if (reason && reason.trim()) {
                                  cancelSaleMutation.mutate({ saleId: s.id, reason: reason.trim() });
                                }
                              }}
                              className="px-2 py-1 text-[11px] font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded border border-red-200 cursor-pointer"
                            >
                              Cancel &amp; Reverse Stock
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: STOCK ADJUSTMENT REQUESTS                     */}
      {/* ======================================================== */}
      {activeSubTab === "adjustments" && (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold">
                <tr>
                  <th className="py-3 px-4">Adjustment #</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Product / SKU</th>
                  <th className="py-3 px-4">Requested Delta</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Requested By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {adjLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#94A3B8]">Loading adjustment requests...</td>
                  </tr>
                ) : adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#94A3B8]">No stock adjustment requests.</td>
                  </tr>
                ) : (
                  adjustments.map((a: any) => (
                    <tr key={a.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3 px-4 font-mono font-bold text-[#123D28]">{a.adjustment_number}</td>
                      <td className="py-3 px-4 font-semibold">{a.branchName}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0F172A]">{a.productName || a.sku}</div>
                        <div className="text-[10px] text-[#64748B] font-mono">{a.sku}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-sm">
                        <span className={a.requested_delta > 0 ? "text-emerald-700" : "text-red-600"}>
                          {a.requested_delta > 0 ? `+${a.requested_delta}` : a.requested_delta}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">{a.reason}</td>
                      <td className="py-3 px-4 text-[#64748B]">{a.requested_by}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            a.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : a.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {a.status === "PENDING" ? (
                          <>
                            <button
                              onClick={() => {
                                reviewAdjMutation.mutate({ id: a.id, status: "APPROVED" });
                              }}
                              className="px-2.5 py-1 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const note = prompt("Reason for rejection:");
                                reviewAdjMutation.mutate({
                                  id: a.id,
                                  status: "REJECTED",
                                  adminNotes: note || undefined,
                                });
                              }}
                              className="px-2.5 py-1 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-[#94A3B8]">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE PHYSICAL BRANCH                            */}
      {/* ======================================================== */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative font-sans text-xs">
            <button
              onClick={() => setIsBranchModalOpen(false)}
              className="absolute right-4 top-4 text-[#94A3B8] hover:text-[#475569] p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-serif font-bold text-lg text-[#123D28] mb-1">Add New Physical Retail Branch</h3>
            <p className="text-[#64748B] mb-4">
              Register a new physical outlet. Branch inventory will automatically seed for all existing products.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!code || !name || !address || !city || !pinCode || !phone) {
                  toast.error("Please fill in all required branch details");
                  return;
                }
                createBranchMutation.mutate({
                  code: code.trim().toUpperCase(),
                  name: name.trim(),
                  address: address.trim(),
                  city: city.trim(),
                  state: state.trim(),
                  pinCode: pinCode.trim(),
                  phone: phone.trim(),
                  email: email.trim() || undefined,
                });
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold mb-1 text-[#0F172A]">Branch Code (e.g. SLM-01)</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="SLM-01"
                    className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md font-mono font-bold focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0F172A]">Branch Outlet Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="TRINAYAA Salem Retail Outlet"
                    className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#0F172A]">Physical Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street name, landmark..."
                  className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold mb-1 text-[#0F172A]">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0F172A]">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0F172A]">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold mb-1 text-[#0F172A]">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0F172A]">Branch Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="branch@trinayaa.in"
                    className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-[#CBD5E1] text-xs font-semibold hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBranchMutation.isPending}
                  className="px-4 py-2 rounded-md bg-[#123D28] hover:bg-[#1E5638] text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {createBranchMutation.isPending ? "Creating Branch..." : "Create Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
