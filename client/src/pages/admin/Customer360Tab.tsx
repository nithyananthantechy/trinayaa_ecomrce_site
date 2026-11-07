import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Users,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  ShoppingBag,
  MessageSquare,
  Star,
  LifeBuoy,
  Heart,
  History,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export default function Customer360Tab() {
  // Query Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [purchaseFilter, setPurchaseFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Selected Customer for 360 View
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<
    "overview" | "addresses" | "orders" | "feedback" | "reviews" | "tickets" | "wishlist" | "audit"
  >("overview");

  // Deactivate/Activate Confirmation Modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusReason, setStatusReason] = useState("");

  // Admin Notes State
  const [adminNotesText, setAdminNotesText] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);

  // Expanded Order in Order History Tab
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Queries
  const { data: metrics, refetch: refetchMetrics } = trpc.admin.customers.metrics.useQuery();

  const {
    data: listData,
    isLoading: listLoading,
    refetch: refetchList,
  } = trpc.admin.customers.list.useQuery({
    search: searchTerm,
    status: statusFilter,
    purchaseActivity: purchaseFilter,
    sortBy,
    sortOrder,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const {
    data: profileData,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = trpc.admin.customers.get360.useQuery(
    { customerId: selectedCustomerId! },
    {
      enabled: Boolean(selectedCustomerId),
    }
  );

  // Synchronize admin notes when profile loads
  React.useEffect(() => {
    if (profileData?.customer) {
      setAdminNotesText(profileData.customer.adminNotes || "");
      setNotesDirty(false);
    }
  }, [profileData]);

  // Mutations
  const updateStatusMutation = trpc.admin.customers.updateStatus.useMutation({
    onSuccess: (updated) => {
      toast.success(`Account status updated to ${updated.status}`);
      setStatusModalOpen(false);
      setStatusReason("");
      refetchProfile();
      refetchList();
      refetchMetrics();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update account status");
    },
  });

  const updateNotesMutation = trpc.admin.customers.updateNotes.useMutation({
    onSuccess: () => {
      toast.success("Admin internal notes saved");
      setNotesDirty(false);
      refetchProfile();
      refetchList();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save admin notes");
    },
  });

  const exportCsvQuery = trpc.admin.customers.exportCsv.useQuery(
    {
      search: searchTerm,
      status: statusFilter,
      purchaseActivity: purchaseFilter,
      sortBy,
      sortOrder,
    },
    { enabled: false }
  );

  const handleExportCsv = async () => {
    try {
      const res = await exportCsvQuery.refetch();
      if (!res.data) {
        toast.error("No customer records found to export");
        return;
      }
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TRINAYAA_Customers_360_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Customer 360 CSV report exported successfully");
    } catch {
      toast.error("Failed to export customer records");
    }
  };

  const handleOpen360 = (id: string) => {
    setSelectedCustomerId(id);
    setActiveProfileTab("overview");
  };

  const handleStatusChangeSubmit = () => {
    if (!profileData?.customer) return;
    const isCurrentlyActive = profileData.customer.status === "ACTIVE";
    const newStatus = isCurrentlyActive ? "INACTIVE" : "ACTIVE";
    updateStatusMutation.mutate({
      customerId: profileData.customer.id,
      status: newStatus as any,
      reason: statusReason.trim() || undefined,
    });
  };

  const handleSaveNotes = () => {
    if (!selectedCustomerId) return;
    updateNotesMutation.mutate({
      customerId: selectedCustomerId,
      adminNotes: adminNotesText,
    });
  };

  const customers = listData?.customers || [];
  const totalCount = listData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Metrics Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#123D28] flex items-center gap-2.5">
            <Users className="text-[#123D28]" size={26} />
            Admin Customer 360
          </h2>
          <p className="text-xs text-[#6C7167]">
            Complete customer profiles, purchase history, delivery addresses, product reviews, support tickets & administrative governance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={exportCsvQuery.isFetching}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-[#123D28] text-white rounded-lg hover:bg-[#123D28]/90 transition-all shadow-xs"
          >
            <Download size={14} />
            {exportCsvQuery.isFetching ? "Generating CSV..." : "Export Customer CSV"}
          </button>
        </div>
      </div>

      {/* Real-time Metric Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#DEDFD5] p-3.5 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-[#6C7167] uppercase tracking-wider mb-1">Total Customers</div>
          <div className="text-2xl font-bold text-[#123D28]">{metrics?.totalCustomers ?? "—"}</div>
          <div className="text-[11px] text-[#6C7167] mt-0.5">Registered accounts</div>
        </div>

        <div className="bg-white border border-[#DEDFD5] p-3.5 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">Active Accounts</div>
          <div className="text-2xl font-bold text-emerald-700">{metrics?.activeCustomers ?? "—"}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Permitted to login</div>
        </div>

        <div className="bg-white border border-[#DEDFD5] p-3.5 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider mb-1">Inactive / Deactivated</div>
          <div className="text-2xl font-bold text-rose-700">{metrics?.inactiveCustomers ?? "—"}</div>
          <div className="text-[11px] text-rose-600 mt-0.5">Access suspended</div>
        </div>

        <div className="bg-white border border-[#DEDFD5] p-3.5 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider mb-1">30-Day New</div>
          <div className="text-2xl font-bold text-blue-700">{metrics?.newCustomers30d ?? "—"}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Recent signups</div>
        </div>

        <div className="bg-white border border-[#DEDFD5] p-3.5 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-[#123D28] uppercase tracking-wider mb-1">With Orders</div>
          <div className="text-2xl font-bold text-[#123D28]">{metrics?.customersWithOrders ?? "—"}</div>
          <div className="text-[11px] text-[#6C7167] mt-0.5">Purchasing buyers</div>
        </div>

        <div className="bg-white border border-[#DEDFD5] p-3.5 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-1">Verified Revenue</div>
          <div className="text-2xl font-bold text-amber-800">₹{(metrics?.totalVerifiedRevenue ?? 0).toLocaleString()}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">{metrics?.totalCompletedOrders ?? 0} orders delivered</div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white border border-[#DEDFD5] p-4 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search by customer name, email, phone number, or ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#123D28] bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-[#123D28] font-medium focus:outline-none focus:ring-1 focus:ring-[#123D28]"
          >
            <option value="ALL">All Account Statuses</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="INACTIVE">Inactive / Deactivated</option>
            <option value="SUSPENDED">Suspended Accounts</option>
          </select>

          {/* Purchase Activity Filter */}
          <select
            value={purchaseFilter}
            onChange={(e) => {
              setPurchaseFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-[#123D28] font-medium focus:outline-none focus:ring-1 focus:ring-[#123D28]"
          >
            <option value="ALL">All Purchase Activity</option>
            <option value="WITH_ORDERS">Customers With Orders</option>
            <option value="NO_ORDERS">Customers Without Orders</option>
          </select>

          {/* Sort By Dropdown */}
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("_");
              setSortBy(sb);
              setSortOrder(so as any);
              setPage(1);
            }}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-[#123D28] font-medium focus:outline-none focus:ring-1 focus:ring-[#123D28]"
          >
            <option value="createdAt_desc">Newest Registered</option>
            <option value="createdAt_asc">Oldest Registered</option>
            <option value="name_asc">Name (A – Z)</option>
            <option value="totalOrders_desc">Most Orders</option>
            <option value="totalSpent_desc">Highest Total Spent</option>
          </select>
        </div>
      </div>

      {/* 3. Customers Table */}
      <div className="bg-white border border-[#DEDFD5] rounded-xl shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-[#DEDFD5] bg-[#FBF8F0] flex items-center justify-between">
          <div className="text-xs font-bold text-[#123D28]">
            Showing {customers.length} of {totalCount} customers
          </div>
          {listLoading && <span className="text-xs text-[#6C7167]">Refreshing records...</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FBF8F0] border-b border-[#DEDFD5] text-[#6C7167] font-semibold">
              <tr>
                <th className="py-3 px-3.5">Customer</th>
                <th className="py-3 px-3.5">Contact Details</th>
                <th className="py-3 px-3.5">Account Status</th>
                <th className="py-3 px-3.5 text-center">Orders</th>
                <th className="py-3 px-3.5 text-right">Verified Spent</th>
                <th className="py-3 px-3.5">Registered</th>
                <th className="py-3 px-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DEDFD5]">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#6C7167]">
                    No customer accounts match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c: any) => {
                  const isActive = c.status === "ACTIVE";
                  return (
                    <tr key={c.id} className="hover:bg-[#FBF8F0]/50 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-[#123D28] text-sm">{c.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{c.id}</div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3.5">
                        <div className="text-[#123D28] font-medium flex items-center gap-1.5">
                          <Mail size={12} className="text-slate-400" />
                          {c.email}
                        </div>
                        {c.phone && (
                          <div className="text-[#6C7167] text-[11px] flex items-center gap-1.5 mt-0.5">
                            <Phone size={11} className="text-slate-400" />
                            +91 {c.phone}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isActive ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                          {c.status}
                        </span>
                      </td>

                      {/* Total Orders */}
                      <td className="py-3 px-3.5 text-center">
                        <span className="font-bold text-[#123D28] text-sm">{c.totalOrders || 0}</span>
                        {c.completedOrders > 0 && (
                          <div className="text-[10px] text-emerald-600">{c.completedOrders} completed</div>
                        )}
                      </td>

                      {/* Verified Spent */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="font-bold text-[#123D28] text-sm">
                          ₹{Number(c.totalSpent || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#6C7167]">Paid & Delivered</div>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3 px-3.5 text-[#6C7167]">
                        {new Date(c.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3.5 text-center">
                        <button
                          onClick={() => handleOpen360(c.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#123D28] text-white rounded-lg text-xs font-semibold hover:bg-[#123D28]/90 transition-all shadow-xs"
                        >
                          <Eye size={13} />
                          View 360
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-[#DEDFD5] bg-white flex items-center justify-between text-xs text-[#6C7167]">
            <div>
              Page {page} of {totalPages} ({totalCount} total customers)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-semibold text-[#123D28] px-2">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Customer 360 Profile Modal / Drawer */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#DEDFD5] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#DEDFD5] bg-[#FBF8F0] flex items-start justify-between">
              {profileLoading ? (
                <div className="text-sm font-semibold text-[#123D28]">Loading Customer 360 Profile...</div>
              ) : profileData?.customer ? (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#123D28] text-white flex items-center justify-center font-bold text-lg font-serif">
                    {profileData.customer.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-serif text-xl font-bold text-[#123D28]">{profileData.customer.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          profileData.customer.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {profileData.customer.status === "ACTIVE" ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                        {profileData.customer.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6C7167] mt-1">
                      <span className="flex items-center gap-1 font-mono text-slate-500">
                        ID: {profileData.customer.id}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {profileData.customer.email}
                      </span>
                      {profileData.customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> +91 {profileData.customer.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> Registered:{" "}
                        {new Date(profileData.customer.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-rose-600">Customer profile not found</div>
              )}

              <div className="flex items-center gap-2">
                {profileData?.customer && (
                  <button
                    onClick={() => setStatusModalOpen(true)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      profileData.customer.status === "ACTIVE"
                        ? "border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100"
                        : "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    }`}
                  >
                    {profileData.customer.status === "ACTIVE" ? "Deactivate Account" : "Activate Account"}
                  </button>
                )}
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body with 360 Tabs */}
            {profileData && (
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Internal Admin Notes Card */}
                <div className="bg-[#FFFDF8] border border-amber-200/80 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase tracking-wide">
                      <FileText size={14} className="text-amber-700" />
                      Internal Administrator Notes (Private to Admin Staff)
                    </div>
                    {notesDirty && (
                      <span className="text-[11px] text-amber-700 font-medium">Unsaved changes</span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={adminNotesText}
                    onChange={(e) => {
                      setAdminNotesText(e.target.value);
                      setNotesDirty(true);
                    }}
                    placeholder="Add operational notes, customer preferences, VIP flags, or compliance records..."
                    className="w-full text-xs p-2.5 border border-amber-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700 bg-white"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleSaveNotes}
                      disabled={updateNotesMutation.isPending || !notesDirty}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#123D28] text-white rounded-lg hover:bg-[#123D28]/90 disabled:opacity-40"
                    >
                      <Save size={13} />
                      {updateNotesMutation.isPending ? "Saving..." : "Save Admin Notes"}
                    </button>
                  </div>
                </div>

                {/* 360 Navigation Tabs */}
                <div className="flex flex-wrap gap-1.5 border-b border-[#DEDFD5] pb-2 text-xs font-semibold">
                  {[
                    { id: "overview", label: "Purchase & Activity", icon: TrendingUp },
                    { id: "orders", label: `Orders (${profileData.orders?.length || 0})`, icon: ShoppingBag },
                    { id: "addresses", label: `Saved Addresses (${profileData.addresses?.length || 0})`, icon: MapPin },
                    { id: "feedback", label: `Feedback (${profileData.feedback?.length || 0})`, icon: MessageSquare },
                    { id: "reviews", label: `Reviews (${profileData.reviews?.length || 0})`, icon: Star },
                    { id: "tickets", label: `Support Tickets (${profileData.supportTickets?.length || 0})`, icon: LifeBuoy },
                    { id: "wishlist", label: `Wishlist (${profileData.wishlist?.length || 0})`, icon: Heart },
                    { id: "audit", label: `Audit Log (${profileData.auditLogs?.length || 0})`, icon: History },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeProfileTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveProfileTab(tab.id as any)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                          isActive
                            ? "bg-[#123D28] text-white"
                            : "text-[#6C7167] hover:bg-[#FBF8F0] hover:text-[#123D28]"
                        }`}
                      >
                        <Icon size={13} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* TAB 1: OVERVIEW & PURCHASE SUMMARY */}
                {activeProfileTab === "overview" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-[#FBF8F0] border border-[#DEDFD5] p-3.5 rounded-xl">
                        <div className="text-[11px] font-semibold text-[#6C7167] uppercase">Net Verified Revenue</div>
                        <div className="text-xl font-bold text-[#123D28] mt-1">
                          ₹{profileData.purchaseSummary.netRevenue.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#6C7167]">Paid orders only</div>
                      </div>

                      <div className="bg-[#FBF8F0] border border-[#DEDFD5] p-3.5 rounded-xl">
                        <div className="text-[11px] font-semibold text-[#6C7167] uppercase">Average Order Value (AOV)</div>
                        <div className="text-xl font-bold text-[#123D28] mt-1">
                          ₹{profileData.purchaseSummary.aov.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[#6C7167]">{profileData.purchaseSummary.paidOrdersCount} paid orders</div>
                      </div>

                      <div className="bg-[#FBF8F0] border border-[#DEDFD5] p-3.5 rounded-xl">
                        <div className="text-[11px] font-semibold text-[#6C7167] uppercase">Delivered Orders</div>
                        <div className="text-xl font-bold text-emerald-700 mt-1">
                          {profileData.purchaseSummary.completedOrders}
                        </div>
                        <div className="text-[10px] text-emerald-600">Successfully fulfilled</div>
                      </div>

                      <div className="bg-[#FBF8F0] border border-[#DEDFD5] p-3.5 rounded-xl">
                        <div className="text-[11px] font-semibold text-[#6C7167] uppercase">Cancelled / Refunded</div>
                        <div className="text-xl font-bold text-rose-700 mt-1">
                          {profileData.purchaseSummary.cancelledOrders + profileData.purchaseSummary.refundedOrders}
                        </div>
                        <div className="text-[10px] text-rose-600">
                          {profileData.purchaseSummary.cancelledOrders} cancelled, {profileData.purchaseSummary.refundedOrders} refunded
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-[#DEDFD5] rounded-xl p-4 text-xs space-y-2">
                      <div className="font-bold text-[#123D28]">Order Timeline & Engagement:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[#6C7167]">
                        <div>
                          <span className="font-medium text-[#123D28]">First Purchase: </span>
                          {profileData.purchaseSummary.firstOrderDate
                            ? new Date(profileData.purchaseSummary.firstOrderDate).toLocaleString()
                            : "No orders placed yet"}
                        </div>
                        <div>
                          <span className="font-medium text-[#123D28]">Most Recent Order: </span>
                          {profileData.purchaseSummary.lastOrderDate
                            ? new Date(profileData.purchaseSummary.lastOrderDate).toLocaleString()
                            : "No orders placed yet"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ORDERS WITH EXPANDABLE LINE ITEMS */}
                {activeProfileTab === "orders" && (
                  <div className="space-y-3">
                    {profileData.orders.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#6C7167] border border-dashed rounded-xl">
                        No orders recorded for this customer account.
                      </div>
                    ) : (
                      profileData.orders.map((ord: any) => {
                        const isExpanded = expandedOrderId === ord.id;
                        return (
                          <div key={ord.id} className="border border-[#DEDFD5] rounded-xl overflow-hidden bg-white text-xs">
                            <div
                              onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                              className="p-3.5 bg-[#FBF8F0] flex items-center justify-between cursor-pointer hover:bg-[#FBF8F0]/80 transition-colors"
                            >
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="font-bold text-[#123D28] font-mono">{ord.orderNumber}</span>
                                <span className="text-[#6C7167]">
                                  {new Date(ord.createdAt).toLocaleDateString()}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    ord.orderStatus === "Delivered"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : ord.orderStatus === "Cancelled"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {ord.orderStatus}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    ord.paymentStatus === "PAID"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  Payment: {ord.paymentStatus}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="font-bold text-[#123D28] text-sm">
                                  ₹{Number(ord.total).toLocaleString()}
                                </span>
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </div>
                            </div>

                            {/* Line items snapshot */}
                            {isExpanded && (
                              <div className="p-4 border-t border-[#DEDFD5] space-y-3 bg-white">
                                <div className="text-[11px] font-bold text-[#6C7167] uppercase tracking-wide">
                                  Order Line Items ({ord.items?.length || 0})
                                </div>
                                <div className="divide-y divide-slate-100">
                                  {ord.items?.map((it: any) => (
                                    <div key={it.id} className="py-2 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        {it.image && (
                                          <img
                                            src={it.image}
                                            alt={it.productNameEn}
                                            className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                                          />
                                        )}
                                        <div>
                                          <div className="font-bold text-[#123D28]">{it.productNameEn}</div>
                                          {it.productNameTa && (
                                            <div className="text-[10px] text-[#6C7167]">{it.productNameTa}</div>
                                          )}
                                          <div className="text-[10px] text-slate-400">Pack: {it.packSize}</div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-semibold text-[#123D28]">
                                          {it.quantity} × ₹{it.price} = ₹{it.subtotal}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="pt-2 border-t border-slate-100 flex justify-between text-[#6C7167] text-[11px]">
                                  <span>Payment Method: {ord.paymentMethod}</span>
                                  <span>Shipping: ₹{ord.shippingFee || 0} | Discount: ₹{ord.discountAmount || 0}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* TAB 3: SAVED DELIVERY ADDRESSES */}
                {activeProfileTab === "addresses" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {profileData.addresses.length === 0 ? (
                      <div className="col-span-2 p-8 text-center text-xs text-[#6C7167] border border-dashed rounded-xl">
                        No saved delivery addresses found for this customer.
                      </div>
                    ) : (
                      profileData.addresses.map((addr: any) => (
                        <div
                          key={addr.id}
                          className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                            addr.isDefault
                              ? "bg-[#FFFDF8] border-[#123D28]/40 shadow-xs"
                              : "bg-white border-[#DEDFD5]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#123D28] text-sm">{addr.recipientName}</span>
                            {addr.isDefault === 1 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#123D28] text-white">
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <div className="text-[#6C7167] flex items-center gap-1">
                            <Phone size={11} /> +91 {addr.phone}
                          </div>
                          <div className="text-[#123D28] pt-1">
                            {addr.street}, {addr.city}, {addr.state} — <span className="font-bold">{addr.pinCode}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 4: CUSTOMER FEEDBACK */}
                {activeProfileTab === "feedback" && (
                  <div className="space-y-3">
                    {profileData.feedback.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#6C7167] border border-dashed rounded-xl">
                        No customer feedback submitted yet.
                      </div>
                    ) : (
                      profileData.feedback.map((fb: any) => (
                        <div key={fb.id} className="p-4 border border-[#DEDFD5] rounded-xl bg-white text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#123D28]">{fb.title}</span>
                            <span className="text-[#6C7167]">{new Date(fb.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                            {"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)} ({fb.rating}/5)
                            <span className="text-slate-400 font-normal ml-2">Category: {fb.category}</span>
                          </div>
                          <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg">{fb.message}</p>
                          {fb.admin_response && (
                            <div className="bg-[#FBF8F0] border-l-2 border-[#123D28] p-2.5 rounded-r-lg text-emerald-900">
                              <span className="font-bold">Admin Response: </span>
                              {fb.admin_response}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 5: PRODUCT REVIEWS */}
                {activeProfileTab === "reviews" && (
                  <div className="space-y-3">
                    {profileData.reviews.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#6C7167] border border-dashed rounded-xl">
                        No product reviews written by this customer.
                      </div>
                    ) : (
                      profileData.reviews.map((rv: any) => (
                        <div key={rv.id} className="p-4 border border-[#DEDFD5] rounded-xl bg-white text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#123D28]">{rv.productNameEn || `Product ${rv.product_id}`}</span>
                            <span className="text-[#6C7167]">{new Date(rv.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                            {"★".repeat(rv.rating)}{"☆".repeat(5 - rv.rating)}
                            <span className="text-[#123D28] font-bold ml-2">{rv.title}</span>
                            {rv.is_verified_purchase === 1 && (
                              <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700">{rv.review}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 6: SUPPORT TICKETS */}
                {activeProfileTab === "tickets" && (
                  <div className="space-y-3">
                    {profileData.supportTickets.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#6C7167] border border-dashed rounded-xl">
                        No support tickets opened by this customer.
                      </div>
                    ) : (
                      profileData.supportTickets.map((tk: any) => (
                        <div key={tk.id} className="p-4 border border-[#DEDFD5] rounded-xl bg-white text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold font-mono text-[#123D28]">{tk.ticket_number}</span>
                            <span className="text-[#6C7167]">{new Date(tk.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="font-semibold text-slate-800">{tk.subject}</div>
                          <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg">{tk.description}</p>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                              {tk.status}
                            </span>
                            <span className="px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                              Priority: {tk.priority}
                            </span>
                            <span className="text-slate-400">Category: {tk.category}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 7: SAVED WISHLIST */}
                {activeProfileTab === "wishlist" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {profileData.wishlist.length === 0 ? (
                      <div className="col-span-full p-8 text-center text-xs text-[#6C7167] border border-dashed rounded-xl">
                        No products currently in customer's wishlist.
                      </div>
                    ) : (
                      profileData.wishlist.map((it: any) => (
                        <div key={it.id} className="p-3 border border-[#DEDFD5] rounded-xl bg-white flex items-center gap-3 text-xs">
                          {it.primaryImage && (
                            <img
                              src={it.primaryImage}
                              alt={it.nameEn}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[#123D28] truncate">{it.nameEn}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{it.sku}</div>
                            <div className="font-bold text-[#123D28] mt-1">₹{it.price}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TAB 8: AUDIT TRAIL */}
                {activeProfileTab === "audit" && (
                  <div className="space-y-2">
                    {profileData.auditLogs.length === 0 ? (
                      <div className="p-8 text-center text-xs text-[#6C7167] border border-dashed rounded-xl">
                        No administrative audit logs for this customer account.
                      </div>
                    ) : (
                      profileData.auditLogs.map((log: any) => (
                        <div key={log.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 text-xs flex items-center justify-between">
                          <div>
                            <div className="font-bold text-[#123D28] flex items-center gap-2">
                              <span>{log.action}</span>
                              <span className="text-[10px] text-slate-400 font-normal">by {log.performed_by}</span>
                            </div>
                            <div className="text-slate-600 mt-0.5">{log.details}</div>
                          </div>
                          <div className="text-[11px] text-[#6C7167]">
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Activate / Deactivate */}
      {statusModalOpen && profileData?.customer && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <h4 className="font-serif text-lg font-bold text-[#123D28]">
              {profileData.customer.status === "ACTIVE"
                ? "Deactivate Customer Account?"
                : "Activate Customer Account?"}
            </h4>
            <p className="text-xs text-slate-600">
              {profileData.customer.status === "ACTIVE"
                ? `Deactivating ${profileData.customer.name}'s account will prevent them from logging in via email password or mobile OTP. Existing orders and records are preserved.`
                : `Activating ${profileData.customer.name}'s account will restore their login access.`}
            </p>
            <div>
              <label className="block text-[11px] font-bold text-[#123D28] mb-1">
                Reason for Audit Log (Required)
              </label>
              <input
                type="text"
                placeholder="e.g. Requested by customer, suspicious activity, verified ID..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#123D28]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setStatusModalOpen(false);
                  setStatusReason("");
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChangeSubmit}
                disabled={updateStatusMutation.isPending}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg text-white ${
                  profileData.customer.status === "ACTIVE"
                    ? "bg-rose-700 hover:bg-rose-800"
                    : "bg-emerald-700 hover:bg-emerald-800"
                }`}
              >
                {updateStatusMutation.isPending
                  ? "Updating..."
                  : profileData.customer.status === "ACTIVE"
                  ? "Confirm Deactivate"
                  : "Confirm Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
