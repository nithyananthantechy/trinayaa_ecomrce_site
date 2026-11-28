import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Wallet,
  Calendar,
  Coins,
  Receipt,
  Plus,
  RefreshCw,
  Search,
  Store,
  MapPin,
  Edit2,
  X,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
} from "lucide-react";

export default function RetailFinanceTab() {
  const [financeMonthYear, setFinanceMonthYear] = useState(() => new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [financeBranchFilter, setFinanceBranchFilter] = useState("ALL");
  const [financePeriodFilter, setFinancePeriodFilter] = useState<"today" | "week" | "month" | "all">("month");
  const [financeCategoryFilter, setFinanceCategoryFilter] = useState("ALL");
  const [financeSearch, setFinanceSearch] = useState("");

  // Modal for Allocating Monthly Budget
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [allocateBranchId, setAllocateBranchId] = useState("");
  const [allocateMonthYear, setAllocateMonthYear] = useState(() => new Date().toISOString().slice(0, 7));
  const [allocateAmount, setAllocateAmount] = useState<number | "">("");
  const [allocateNotes, setAllocateNotes] = useState("");

  // Physical Branches Query
  const { data: branches = [] } = trpc.admin.retail.branches.list.useQuery();

  // Admin Finance Overview Query
  const {
    data: adminFinanceOverview,
    isLoading: financeOverviewLoading,
    refetch: refetchFinanceOverview,
  } = trpc.admin.retail.financeOverview.useQuery({ monthYear: financeMonthYear });

  // Admin Central Expenses Ledger Query
  const {
    data: adminExpenses = [],
    isLoading: adminExpensesLoading,
    refetch: refetchAdminExpenses,
  } = trpc.admin.retail.branchExpenses.useQuery({
    branchId: financeBranchFilter === "ALL" ? undefined : financeBranchFilter,
    period: financePeriodFilter,
    category: financeCategoryFilter === "ALL" ? undefined : financeCategoryFilter,
    search: financeSearch.trim() || undefined,
    monthYear: financeMonthYear,
    limit: 150,
  });

  // Set Monthly Allowance Mutation
  const setAllowanceMutation = trpc.admin.retail.setBranchAllowance.useMutation({
    onSuccess: (data: any) => {
      toast.success(
        `Successfully allocated ₹${Number(data.allocated_amount).toLocaleString("en-IN")} for ${data.month_year}`
      );
      setIsAllocateModalOpen(false);
      setAllocateAmount("");
      setAllocateNotes("");
      refetchFinanceOverview();
      refetchAdminExpenses();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to allocate monthly allowance");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header Controls & Filter Bar */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#123D28] text-white flex items-center justify-center shrink-0">
              <Wallet size={16} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#123D28]">
                Branch Finance, Quotas &amp; Cash Flow
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Allocate monthly budgets for retail branches and track daily, weekly, and monthly operational spend.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg px-2.5 py-1.5 text-xs">
            <Calendar size={13} className="text-[#64748B]" />
            <span className="font-semibold text-[#64748B]">Month:</span>
            <input
              type="month"
              value={financeMonthYear}
              onChange={(e) => setFinanceMonthYear(e.target.value)}
              className="bg-transparent font-bold text-[#0F172A] focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setAllocateBranchId(branches[0]?.id || "");
              setAllocateMonthYear(financeMonthYear);
              setAllocateAmount("");
              setAllocateNotes("");
              setIsAllocateModalOpen(true);
            }}
            className="py-2 px-3.5 bg-[#123D28] hover:bg-[#1E5638] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={14} /> Allocate Monthly Budget
          </button>

          <button
            type="button"
            onClick={() => {
              refetchFinanceOverview();
              refetchAdminExpenses();
            }}
            className="p-2 border border-[#CBD5E1] rounded-lg text-[#64748B] hover:text-[#123D28] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            title="Refresh Finance Data"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Executive Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Allocated Quota */}
        <div className="bg-white border border-[#E2E8F0] border-t-4 border-t-[#123D28] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] mb-2 text-xs font-semibold">
            <span>Total Allocated Quota</span>
            <div className="w-7 h-7 rounded-lg bg-[#123D28]/10 text-[#123D28] flex items-center justify-center">
              <Coins size={15} />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#123D28]">
            ₹{(adminFinanceOverview?.totalAllocatedQuota || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">
            For {financeMonthYear} across all branches
          </div>
        </div>

        {/* 2. Today's Spend */}
        <div className="bg-white border border-[#E2E8F0] border-t-4 border-t-[#AE6A2B] rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] mb-2 text-xs font-semibold">
            <span>Today's Total Spend</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#AE6A2B] flex items-center justify-center">
              <Calendar size={15} />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-[#AE6A2B]">
            ₹{(adminFinanceOverview?.todaySpend || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">
            Updated today across outlets
          </div>
        </div>

        {/* 3. This Week's Spend */}
        <div className="bg-white border border-[#E2E8F0] border-t-4 border-t-blue-600 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] mb-2 text-xs font-semibold">
            <span>Weekly Total Spend</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar size={15} />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-blue-700">
            ₹{(adminFinanceOverview?.weekSpend || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">
            Current week (Mon - Sun)
          </div>
        </div>

        {/* 4. Total Monthly Spend */}
        <div className="bg-white border border-[#E2E8F0] border-t-4 border-t-red-600 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-[#64748B] mb-2 text-xs font-semibold">
            <span>Total Monthly Spend</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Receipt size={15} />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif text-red-600">
            ₹{(adminFinanceOverview?.totalSpend || 0).toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1">
            {financeMonthYear} cumulative expenses
          </div>
        </div>

        {/* 5. Remaining Balance */}
        <div className="bg-gradient-to-br from-[#123D28] to-[#1E5638] text-white rounded-xl p-4 shadow-sm border border-emerald-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-emerald-200 mb-2 text-xs font-semibold">
              <span>Remaining Quota</span>
              <div className="w-7 h-7 rounded-lg bg-white/10 text-emerald-300 flex items-center justify-center border border-white/20">
                <Wallet size={15} />
              </div>
            </div>
            <div className="text-2xl font-bold font-serif text-white">
              ₹{(adminFinanceOverview?.remainingQuota || 0).toLocaleString("en-IN")}
            </div>
          </div>
          <div className="text-[11px] text-emerald-200/90 mt-1">
            Remaining petty cash pool
          </div>
        </div>
      </div>

      {/* Branch-Wise Allowance & Status Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-serif font-bold text-sm text-[#123D28] flex items-center gap-1.5">
            <Store size={15} /> Branch Allowances &amp; Quota Utilization ({financeMonthYear})
          </h4>
          <span className="text-xs text-[#64748B]">
            {adminFinanceOverview?.branchSummaries?.length || 0} active branches
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(adminFinanceOverview?.branchSummaries || []).map((bs: any) => {
            const percentUsed =
              bs.allocatedQuota > 0 ? Math.min(100, Math.round((bs.monthlySpend / bs.allocatedQuota) * 100)) : 0;
            const isOverBudget = bs.monthlySpend > bs.allocatedQuota;

            return (
              <div
                key={bs.branchId}
                className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-2xs hover:border-[#123D28]/40 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-[#0F172A]">{bs.branchName}</h5>
                    <div className="text-[11px] font-mono text-[#64748B] flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-[#AE6A2B]" /> {bs.city} ({bs.branchCode})
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOverBudget
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : percentUsed >= 80
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {percentUsed}% Used
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-[#F8FAFC] p-2.5 rounded-lg text-center text-xs">
                  <div>
                    <div className="text-[10px] text-[#64748B]">Allocated</div>
                    <div className="font-bold text-[#123D28]">₹{bs.allocatedQuota.toLocaleString("en-IN")}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#64748B]">Spent</div>
                    <div className="font-bold text-red-600">₹{bs.monthlySpend.toLocaleString("en-IN")}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#64748B]">Remaining</div>
                    <div className={`font-bold ${bs.remainingQuota < 0 ? "text-red-600" : "text-emerald-700"}`}>
                      ₹{bs.remainingQuota.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isOverBudget ? "bg-red-500" : percentUsed >= 80 ? "bg-amber-500" : "bg-[#123D28]"
                      }`}
                      style={{ width: `${Math.min(100, percentUsed)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#64748B] mt-1">
                    <span>Today: ₹{bs.todaySpend.toLocaleString("en-IN")}</span>
                    <span>This Week: ₹{bs.weekSpend.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[#94A3B8]">
                    {bs.allowanceDetails?.allocatedBy ? `Set by ${bs.allowanceDetails.allocatedBy}` : "Default quota"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setAllocateBranchId(bs.branchId);
                      setAllocateMonthYear(financeMonthYear);
                      setAllocateAmount(bs.allocatedQuota);
                      setAllocateNotes(bs.allowanceDetails?.notes || "");
                      setIsAllocateModalOpen(true);
                    }}
                    className="text-[#123D28] hover:text-[#1E5638] font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 size={12} /> Edit Allowance
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Centralized Branch Expense Ledger */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-2xs overflow-hidden space-y-3">
        <div className="bg-[#FAF8F2] px-5 py-3.5 border-b border-[#E2E8F0] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-[#123D28]" />
            <span className="font-serif font-bold text-sm text-[#123D28]">
              Central Branch Expense Ledger ({adminExpenses.length} entries)
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Branch Filter */}
            <select
              value={financeBranchFilter}
              onChange={(e) => setFinanceBranchFilter(e.target.value)}
              className="p-1.5 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28] font-medium"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>

            {/* Period Pills */}
            <div className="flex bg-[#F1F5F9] p-0.5 rounded-lg text-[11px] font-semibold text-[#64748B]">
              {(
                [
                  { key: "today", label: "Today" },
                  { key: "week", label: "This Week" },
                  { key: "month", label: "This Month" },
                  { key: "all", label: "All" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFinancePeriodFilter(tab.key)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    financePeriodFilter === tab.key
                      ? "bg-white text-[#123D28] font-bold shadow-2xs"
                      : "hover:text-[#0F172A]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <select
              value={financeCategoryFilter}
              onChange={(e) => setFinanceCategoryFilter(e.target.value)}
              className="p-1.5 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28] font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="Tea & Refreshments">Tea &amp; Refreshments</option>
              <option value="Furniture & Fixtures">Furniture &amp; Fixtures</option>
              <option value="Maintenance & Electrical">Maintenance &amp; Electrical</option>
              <option value="Stationery & Billing Rolls">Stationery &amp; Rolls</option>
              <option value="Local Transport & Delivery">Local Transport</option>
              <option value="Cleaning & Sanitation">Cleaning</option>
              <option value="Miscellaneous Work">Miscellaneous</option>
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 text-[#94A3B8]" size={13} />
              <input
                type="text"
                value={financeSearch}
                onChange={(e) => setFinanceSearch(e.target.value)}
                placeholder="Search ledger..."
                className="pl-7 pr-2.5 py-1.5 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28] w-28 sm:w-36"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#123D28]/5 border-b border-[#E2E8F0] text-[#123D28] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Branch</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Purpose / Description</th>
                <th className="py-2.5 px-4">Recorded By</th>
                <th className="py-2.5 px-4">Mode</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {adminExpensesLoading || financeOverviewLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#94A3B8]">
                    Loading central expense ledger...
                  </td>
                </tr>
              ) : adminExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#94A3B8]">
                    No branch expenses recorded for this period/filter.
                  </td>
                </tr>
              ) : (
                adminExpenses.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#0F172A] whitespace-nowrap">
                      {exp.expense_date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#123D28]/10 text-[#123D28] border border-[#123D28]/20 whitespace-nowrap">
                        {exp.branch_name || exp.branch_id}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#0F172A]">{exp.description}</div>
                    </td>
                    <td className="py-3 px-4 text-[#64748B] text-[11px] whitespace-nowrap">
                      {exp.recorded_by}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-bold text-[#475569]">{exp.payment_mode}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#123D28] text-xs whitespace-nowrap">
                      ₹{Number(exp.amount).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL: ALLOCATE MONTHLY BRANCH ALLOWANCE                 */}
      {/* ======================================================== */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative font-sans text-xs">
            <button
              onClick={() => setIsAllocateModalOpen(false)}
              className="absolute right-4 top-4 text-[#94A3B8] hover:text-[#475569] p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[#123D28] text-white flex items-center justify-center shrink-0">
                <Coins size={16} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#123D28]">Allocate Monthly Branch Budget</h3>
                <p className="text-[11px] text-[#64748B]">Approved petty cash quota for retail operations</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!allocateBranchId) {
                  toast.error("Please select a branch");
                  return;
                }
                if (!allocateMonthYear || allocateMonthYear.length < 7) {
                  toast.error("Please select a valid month");
                  return;
                }
                if (!allocateAmount || Number(allocateAmount) <= 0) {
                  toast.error("Please enter a valid allowance amount");
                  return;
                }

                setAllowanceMutation.mutate({
                  branchId: allocateBranchId,
                  monthYear: allocateMonthYear,
                  amount: Number(allocateAmount),
                  notes: allocateNotes.trim() || undefined,
                });
              }}
              className="space-y-3.5 mt-4"
            >
              <div>
                <label className="block font-bold text-[#0F172A] mb-1">Select Branch</label>
                <select
                  required
                  value={allocateBranchId}
                  onChange={(e) => setAllocateBranchId(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28] font-semibold"
                >
                  <option value="">Select Physical Branch...</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code}) - {b.city}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1">Budget Month (YYYY-MM)</label>
                <input
                  type="month"
                  required
                  value={allocateMonthYear}
                  onChange={(e) => setAllocateMonthYear(e.target.value)}
                  className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28] font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1">Allocated Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-[#94A3B8]">₹</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={allocateAmount}
                    onChange={(e) => setAllocateAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="e.g. 25000"
                    className="w-full pl-8 pr-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28] font-bold text-sm"
                  />
                </div>
                <span className="text-[10px] text-[#64748B] mt-0.5 block">
                  This allowance is directly visible in the branch's Finance &amp; Cash Flow portal.
                </span>
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] mb-1">Allocation Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={allocateNotes}
                  onChange={(e) => setAllocateNotes(e.target.value)}
                  placeholder="e.g. Standard monthly operational &amp; refreshments budget approved by Management"
                  className="w-full p-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-[#CBD5E1] text-xs font-semibold hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={setAllowanceMutation.isPending}
                  className="px-4 py-2 rounded-md bg-[#123D28] hover:bg-[#1E5638] text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {setAllowanceMutation.isPending ? "Allocating..." : "Save Budget Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
