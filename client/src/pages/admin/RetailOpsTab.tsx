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
  RotateCcw,
  Edit2,
  Trash2,
  ExternalLink,
  Users,
  Boxes,
  TrendingUp,
  ShoppingCart,
  Phone,
  Mail,
  SlidersHorizontal,
} from "lucide-react";

type SubTab = "branches" | "stock" | "sales" | "adjustments" | "staff";

export default function RetailOpsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("branches");

  // ========================================================
  // QUERIES
  // ========================================================
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

  // Stock overview query
  const [stockBranchId, setStockBranchId] = useState<string>("");
  const [stockSearch, setStockSearch] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");

  // Determine effective stock branch ID
  const effectiveBranchId = stockBranchId || (branches.length > 0 && branches[0] ? branches[0].id : "");

  const {
    data: branchStockData = [],
    refetch: refetchStock,
    isLoading: stockLoading,
  } = trpc.admin.retail.branchStockOverview.useQuery(
    {
      branchId: effectiveBranchId,
      search: stockSearch,
      status: stockStatusFilter,
    },
    {
      enabled: !!effectiveBranchId,
    }
  );

  // Staff handlers query
  const [staffBranchFilter, setStaffBranchFilter] = useState<string>("ALL");
  const [staffSearch, setStaffSearch] = useState("");
  const {
    data: retailHandlers = [],
    refetch: refetchStaff,
    isLoading: staffLoading,
  } = trpc.admin.retail.handlers.list.useQuery({
    branchId: staffBranchFilter === "ALL" ? undefined : staffBranchFilter,
  });

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    if (!staffSearch.trim()) return retailHandlers;
    const q = staffSearch.toLowerCase();
    return retailHandlers.filter(
      (h: any) =>
        h.name?.toLowerCase().includes(q) ||
        h.email?.toLowerCase().includes(q) ||
        h.phone?.toLowerCase().includes(q) ||
        h.branchName?.toLowerCase().includes(q) ||
        h.branchCode?.toLowerCase().includes(q)
    );
  }, [retailHandlers, staffSearch]);

  // ========================================================
  // EXECUTIVE KPI CALCULATIONS
  // ========================================================
  const activeBranchesCount = useMemo(() => branches.filter((b: any) => b.isActive).length, [branches]);

  const totalRetailRevenue = useMemo(() => {
    return allSales
      .filter((s: any) => s.sale_status === "COMPLETED")
      .reduce((sum: number, s: any) => sum + (Number(s.total) || 0), 0);
  }, [allSales]);

  const todaySalesCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return allSales.filter((s: any) => s.created_at && s.created_at.startsWith(today)).length;
  }, [allSales]);

  const pendingAdjCount = useMemo(() => {
    return adjustments.filter((a: any) => a.status === "PENDING").length;
  }, [adjustments]);

  // ========================================================
  // MODALS & MUTATIONS
  // ========================================================
  // 1. Create Branch Modal State
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

  // 2. Edit Branch Modal State
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editState, setEditState] = useState("");
  const [editPinCode, setEditPinCode] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editIsActive, setEditIsActive] = useState(1);

  const openEditModal = (b: any) => {
    setEditingBranch(b);
    setEditName(b.name || "");
    setEditAddress(b.address || "");
    setEditCity(b.city || "Erode");
    setEditState(b.state || "Tamil Nadu");
    setEditPinCode(b.pinCode || "");
    setEditPhone(b.phone || "");
    setEditEmail(b.email || "");
    setEditIsActive(b.isActive ? 1 : 0);
  };

  const updateBranchMutation = trpc.admin.retail.branches.update.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Branch "${data?.name || 'Outlet'}" updated successfully`);
      setEditingBranch(null);
      refetchBranches();
    },
    onError: (err: any) => toast.error(err.message || "Failed to update branch"),
  });

  // 3. Delete Branch Mutation
  const deleteBranchMutation = trpc.admin.retail.branches.delete.useMutation({
    onSuccess: (res: any) => {
      if (res.softDeleted) {
        toast.info(res.message);
      } else {
        toast.success(res.message);
      }
      refetchBranches();
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete branch"),
  });

  const handleDeleteBranch = (b: any) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete or deactivate branch "${b.name}" (${b.code})?\n\n` +
      `If this branch has historical sales records, it will be safely deactivated (marked inactive) to protect accounting integrity.`
    );
    if (confirmed) {
      deleteBranchMutation.mutate({ id: b.id });
    }
  };

  // 4. Stock Adjustment Request Mutation (from Admin)
  const [restockModalItem, setRestockModalItem] = useState<any | null>(null);
  const [adjDelta, setAdjDelta] = useState<number>(10);
  const [adjReason, setAdjReason] = useState<string>("Restock from Erode HQ Warehouse");

  const requestAdjMutation = trpc.retail.requestStockAdjustment.useMutation({
    onSuccess: () => {
      toast.success("Stock adjustment request submitted successfully");
      setRestockModalItem(null);
      refetchAdjustments();
      refetchStock();
    },
    onError: (err: any) => toast.error(err.message || "Failed to request stock adjustment"),
  });

  // 5. Review Adjustment Mutation
  const reviewAdjMutation = trpc.admin.retail.reviewAdjustment.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Adjustment ${data.adjustment_number} marked as ${data.status}`);
      refetchAdjustments();
      refetchBranches();
      refetchStock();
    },
    onError: (err: any) => toast.error(err.message || "Failed to update adjustment"),
  });

  // 6. Cancel Sale Mutation
  const cancelSaleMutation = trpc.admin.retail.cancelSale.useMutation({
    onSuccess: (sale: any) => {
      toast.success(`Sale ${sale.invoice_number} cancelled and branch stock reversed`);
      refetchSales();
      refetchStock();
    },
    onError: (err: any) => toast.error(err.message || "Failed to cancel sale"),
  });

  const refreshAll = () => {
    refetchBranches();
    refetchSales();
    refetchAdjustments();
    refetchStock();
    refetchStaff();
    toast.info("Refreshed all retail operations data");
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ======================================================== */}
      {/* TOP EXECUTIVE BANNER & ACTIONS                           */}
      {/* ======================================================== */}
      <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            Super Administrator controls for physical retail branch outlets, offline point-of-sale invoices, branch inventory stock,
            staff branch assignments, and stock adjustment approvals.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <a
            href="/retail"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Launch Offline Retail POS Cashier Terminal"
          >
            <ShoppingCart size={14} /> Open POS Terminal <ExternalLink size={12} />
          </a>
          <button
            type="button"
            onClick={refreshAll}
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

      {/* ======================================================== */}
      {/* EXECUTIVE KPI SUMMARY TILES                              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Physical Branches</span>
            <Building size={16} className="text-[#123D28]" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#123D28]">
            {activeBranchesCount} <span className="text-xs font-sans font-normal text-[#64748B]">/ {branches.length} Total</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            {activeBranchesCount} active botanical retail outlets
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Offline POS Revenue</span>
            <TrendingUp size={16} className="text-[#AE6A2B]" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#123D28]">
            ₹{totalRetailRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#64748B] font-medium mt-0.5">
            Across {allSales.length} retail invoices
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today's Invoices</span>
            <History size={16} className="text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#123D28]">
            {todaySalesCount}
          </div>
          <div className="text-[11px] text-[#64748B] font-medium mt-0.5">
            Billed today at POS counters
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#64748B] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending Stock Requests</span>
            <Package size={16} className="text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#123D28]">
            {pendingAdjCount}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-0.5">
            {pendingAdjCount > 0 ? "Requires Super Admin approval" : "All adjustments resolved"}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB NAVIGATION (EXPANDED FOR COMPREHENSIVE RETAIL)    */}
      {/* ======================================================== */}
      <div className="flex border-b border-[#E2E8F0] gap-2 sm:gap-6 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab("branches")}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeSubTab === "branches"
              ? "border-b-2 border-[#123D28] text-[#123D28]"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Building size={14} /> Physical Branches ({branches.length})
        </button>
        <button
          onClick={() => setActiveSubTab("stock")}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeSubTab === "stock"
              ? "border-b-2 border-[#123D28] text-[#123D28]"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Boxes size={14} /> Branch Inventory &amp; Stock Levels
        </button>
        <button
          onClick={() => setActiveSubTab("sales")}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeSubTab === "sales"
              ? "border-b-2 border-[#123D28] text-[#123D28]"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <History size={14} /> All Retail Invoices ({allSales.length})
        </button>
        <button
          onClick={() => setActiveSubTab("adjustments")}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeSubTab === "adjustments"
              ? "border-b-2 border-[#123D28] text-[#123D28]"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Package size={14} /> Stock Adjustment Requests ({pendingAdjCount} pending)
        </button>
        <button
          onClick={() => setActiveSubTab("staff")}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
            activeSubTab === "staff"
              ? "border-b-2 border-[#123D28] text-[#123D28]"
              : "text-[#64748B] hover:text-[#0F172A]"
          }`}
        >
          <Users size={14} /> Store Staff &amp; Cashiers ({retailHandlers.length})
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: PHYSICAL BRANCHES (WITH EDIT & DELETE)        */}
      {/* ======================================================== */}
      {activeSubTab === "branches" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchesLoading ? (
              <div className="col-span-full py-12 text-center text-xs text-[#94A3B8]">Loading physical branches...</div>
            ) : branches.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-[#94A3B8]">No physical retail branches configured.</div>
            ) : (
              branches.map((b: any) => (
                <div
                  key={b.id}
                  className="bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-xl p-5 shadow-xs flex flex-col justify-between transition-shadow hover:shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-[#059669] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                        {b.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {b.isActive ? "Active Outlet" : "Inactive"}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-[#123D28] mb-1">{b.name}</h3>
                    
                    <p className="text-xs text-[#64748B] mb-3 flex items-start gap-1.5">
                      <MapPin size={13} className="shrink-0 mt-0.5 text-[#AE6A2B]" />
                      <span>
                        {b.address}, {b.city}, {b.state} - {b.pinCode}
                      </span>
                    </p>

                    <div className="text-xs text-[#475569] space-y-1.5 pt-2.5 border-t border-[#F1F5F9]">
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-[#64748B]" />
                        <span>Phone: <span className="font-medium text-[#0F172A]">{b.phone}</span></span>
                      </div>
                      {b.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail size={12} className="text-[#64748B]" />
                          <span>Email: <span className="font-medium text-[#0F172A]">{b.email}</span></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Branch Action Buttons */}
                  <div className="mt-5 pt-3.5 border-t border-[#F1F5F9] space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                      <span>Branch ID: <span className="font-mono">{b.id}</span></span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(b)}
                        className="py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Edit Branch Outlet Details"
                      >
                        <Edit2 size={13} /> Edit Outlet
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteBranch(b)}
                        className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Delete or Deactivate Branch"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStockBranchId(b.id);
                          setActiveSubTab("stock");
                        }}
                        className="py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="View Branch Inventory"
                      >
                        <Package size={13} /> Stock Levels
                      </button>

                      <a
                        href="/retail"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2.5 bg-[#123D28] hover:bg-[#1E5638] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                        title="Launch POS Terminal for this outlet"
                      >
                        <Store size={13} /> POS App <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: BRANCH INVENTORY & STOCK LEVELS (NEW!)        */}
      {/* ======================================================== */}
      {activeSubTab === "stock" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Branch Selector */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="font-bold text-[#123D28] whitespace-nowrap flex items-center gap-1">
                <Store size={14} /> Branch Outlet:
              </span>
              <select
                value={effectiveBranchId}
                onChange={(e) => setStockBranchId(e.target.value)}
                className="p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg font-semibold text-[#0F172A] focus:outline-none focus:border-[#123D28] flex-1 md:w-64"
              >
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code}) {!b.isActive ? "- Inactive" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-2.5 text-[#94A3B8]" size={14} />
              <input
                type="text"
                value={stockSearch}
                onChange={(e) => setStockSearch(e.target.value)}
                placeholder="Search by botanical product name, SKU, or category..."
                className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28]"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {(
                [
                  { id: "all", label: "All Items" },
                  { id: "in_stock", label: "In Stock" },
                  { id: "low_stock", label: "Low Stock (<10)" },
                  { id: "out_of_stock", label: "Out of Stock" },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStockStatusFilter(f.id)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                    stockStatusFilter === f.id
                      ? "bg-[#123D28] text-white"
                      : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold">
                  <tr>
                    <th className="py-3 px-4">Botanical Product &amp; SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Selling Price / MRP</th>
                    <th className="py-3 px-4 text-center">Branch Stock Quantity</th>
                    <th className="py-3 px-4">Low-Stock Alert Level</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {stockLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#94A3B8]">Loading branch inventory...</td>
                    </tr>
                  ) : branchStockData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#94A3B8]">No stock records found matching filters.</td>
                    </tr>
                  ) : (
                    branchStockData.map((item: any) => {
                      const isOutOfStock = item.stockQuantity <= 0;
                      const isLowStock = !isOutOfStock && item.stockQuantity <= item.lowStockThreshold;

                      return (
                        <tr key={item.id} className="hover:bg-[#F8FAFC]">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {item.primaryImage ? (
                                <img
                                  src={item.primaryImage}
                                  alt={item.nameEn}
                                  className="w-10 h-10 rounded-lg object-cover border border-[#E2E8F0] shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                                  🌿
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-[#123D28] text-[13px]">{item.nameEn}</div>
                                {item.nameTa && <div className="text-[11px] text-[#64748B]">{item.nameTa}</div>}
                                <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5">SKU: {item.sku}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-[#64748B] font-medium">
                            {item.categoryName || "Botanicals"}
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-[#123D28]">₹{Number(item.sellingPrice || 0).toFixed(2)}</div>
                            {item.mrp && Number(item.mrp) > Number(item.sellingPrice) && (
                              <div className="text-[10px] text-[#94A3B8] line-through">₹{Number(item.mrp).toFixed(2)}</div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-full font-bold text-xs ${
                                isOutOfStock
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : isLowStock
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              {item.stockQuantity} units
                            </span>
                          </td>

                          <td className="py-3 px-4 text-[#64748B]">
                            Alert at &le; {item.lowStockThreshold} units
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isOutOfStock
                                  ? "bg-rose-100 text-rose-800"
                                  : isLowStock
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {isOutOfStock ? "Out of Stock" : isLowStock ? "Low Stock" : "In Stock"}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setRestockModalItem(item);
                                setAdjDelta(25);
                                setAdjReason(`Restock ${item.nameEn} from Central Erode HQ`);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 cursor-pointer inline-flex items-center gap-1"
                              title="Request restock or inventory adjustment"
                            >
                              <Plus size={12} /> Restock
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: ALL RETAIL INVOICES & SALES                   */}
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
                        <td className="py-3 px-4 font-bold text-[#123D28]">₹{Number(s.total || 0).toFixed(2)}</td>
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
      {/* SUB-TAB 4: STOCK ADJUSTMENT REQUESTS                     */}
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
      {/* SUB-TAB 5: STORE STAFF & CASHIERS (NEW!)                 */}
      {/* ======================================================== */}
      {activeSubTab === "staff" && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-2.5 text-[#94A3B8]" size={14} />
              <input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="Search staff by name, email, or assigned branch..."
                className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28]"
              />
            </div>

            {/* Branch Filter */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="font-semibold text-[#64748B]">Assigned Branch:</span>
              <select
                value={staffBranchFilter}
                onChange={(e) => setStaffBranchFilter(e.target.value)}
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
                    <th className="py-3 px-4">Staff Name &amp; Contact</th>
                    <th className="py-3 px-4">Assigned Retail Outlet</th>
                    <th className="py-3 px-4">System Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {staffLoading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#94A3B8]">Loading retail staff...</td>
                    </tr>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#94A3B8]">No retail handlers found matching criteria.</td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff: any) => (
                      <tr key={staff.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                              {staff.name?.[0]?.toUpperCase() || "H"}
                            </div>
                            <div>
                              <div className="font-bold text-[#0F172A]">{staff.name}</div>
                              <div className="text-[11px] text-[#64748B]">{staff.email}</div>
                              {staff.phone && <div className="text-[10px] text-[#94A3B8] font-mono">{staff.phone}</div>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {staff.branchName ? (
                            <div>
                              <div className="font-semibold text-[#123D28]">{staff.branchName}</div>
                              <div className="text-[10px] font-mono font-bold text-emerald-700">{staff.branchCode}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Unassigned (HQ Pool)</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            RETAIL_SHOP_HANDLER
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {staff.status || "ACTIVE"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-[#64748B]">
                          {staff.createdAt
                            ? new Date(staff.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
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
      {/* MODAL 1: CREATE PHYSICAL BRANCH                          */}
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

      {/* ======================================================== */}
      {/* MODAL 2: EDIT PHYSICAL BRANCH (NEW!)                     */}
      {/* ======================================================== */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative font-sans text-xs">
            <button
              onClick={() => setEditingBranch(null)}
              className="absolute right-4 top-4 text-[#94A3B8] hover:text-[#475569] p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {editingBranch.code}
              </span>
              <h3 className="font-serif font-bold text-lg text-[#123D28]">Edit Retail Branch Outlet</h3>
            </div>
            <p className="text-[#64748B] mb-4">
              Update physical location, contact details, or operational status for this branch.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editName || !editAddress || !editCity || !editPinCode || !editPhone) {
                  toast.error("Please fill in all required fields");
                  return;
                }
                updateBranchMutation.mutate({
                  id: editingBranch.id,
                  name: editName.trim(),
                  address: editAddress.trim(),
                  city: editCity.trim(),
                  state: editState.trim(),
                  pinCode: editPinCode.trim(),
                  phone: editPhone.trim(),
                  email: editEmail.trim() || undefined,
                  isActive: editIsActive,
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block font-semibold mb-1 text-[#0F172A]">Branch Outlet Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#0F172A]">Physical Address</label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold mb-1 text-[#0F172A]">City</label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0F172A]">State</label>
                  <input
                    type="text"
                    required
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0F172A]">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={editPinCode}
                    onChange={(e) => setEditPinCode(e.target.value)}
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
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0F172A]">Branch Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block font-semibold mb-1 text-[#0F172A]">Branch Operational Status</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={editIsActive === 1}
                      onChange={() => setEditIsActive(1)}
                      className="text-[#123D28] focus:ring-[#123D28]"
                    />
                    <span className="font-semibold text-emerald-800">Active (Accepting POS Sales)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={editIsActive === 0}
                      onChange={() => setEditIsActive(0)}
                      className="text-[#123D28] focus:ring-[#123D28]"
                    />
                    <span className="font-semibold text-slate-600">Inactive (Suspended)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 rounded-md border border-[#CBD5E1] text-xs font-semibold hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateBranchMutation.isPending}
                  className="px-4 py-2 rounded-md bg-[#123D28] hover:bg-[#1E5638] text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {updateBranchMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: REQUEST RESTOCK / STOCK ADJUSTMENT              */}
      {/* ======================================================== */}
      {restockModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative font-sans text-xs">
            <button
              onClick={() => setRestockModalItem(null)}
              className="absolute right-4 top-4 text-[#94A3B8] hover:text-[#475569] p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-serif font-bold text-lg text-[#123D28] mb-1">Request Stock Restock / Transfer</h3>
            <p className="text-[#64748B] mb-4">
              Submit an inventory adjustment request for this branch. Will be queued for Super Admin audit and instant stock balance update.
            </p>

            <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] mb-4">
              <div className="font-bold text-[#123D28]">{restockModalItem.nameEn}</div>
              <div className="text-[11px] text-[#64748B] font-mono">SKU: {restockModalItem.sku}</div>
              <div className="text-[11px] text-[#64748B] mt-1">
                Current Branch Stock: <span className="font-bold text-[#0F172A]">{restockModalItem.stockQuantity} units</span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!adjDelta || adjDelta === 0) {
                  toast.error("Please enter a valid stock quantity adjustment");
                  return;
                }
                requestAdjMutation.mutate({
                  productId: restockModalItem.productId,
                  sku: restockModalItem.sku,
                  requestedDelta: adjDelta,
                  reason: adjReason.trim() || "Stock adjustment requested",
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block font-semibold mb-1 text-[#0F172A]">
                  Quantity to Add / Adjust (Units)
                </label>
                <input
                  type="number"
                  required
                  value={adjDelta}
                  onChange={(e) => setAdjDelta(parseInt(e.target.value) || 0)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md font-bold text-sm focus:bg-white focus:outline-none focus:border-[#123D28]"
                />
                <span className="text-[10px] text-[#64748B] mt-0.5 block">
                  Positive number adds stock from HQ; negative number records breakage or waste.
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#0F172A]">Reason / Reference</label>
                <input
                  type="text"
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Restock from Central Erode HQ, Delivery Challan #..."
                  className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setRestockModalItem(null)}
                  className="px-4 py-2 rounded-md border border-[#CBD5E1] text-xs font-semibold hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestAdjMutation.isPending}
                  className="px-4 py-2 rounded-md bg-[#123D28] hover:bg-[#1E5638] text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {requestAdjMutation.isPending ? "Submitting..." : "Submit Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
