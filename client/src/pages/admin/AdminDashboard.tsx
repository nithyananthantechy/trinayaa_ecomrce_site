import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Tag,
  FileSpreadsheet,
  Settings,
  Bot,
  LogOut,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  X,
  ArrowRight,
  Image as ImageIcon
} from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<
    "overview" | "products" | "categories" | "orders" | "customers" | "offers" | "import" | "content" | "telegram"
  >("overview");

  // Authentication check
  const { data: currentUser, isLoading: userLoading, refetch: refetchUser } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      setLocation("/admin/login");
    },
  });

  // Queries
  const { data: stats, refetch: refetchStats } = trpc.admin.dashboardOverview.useQuery(undefined, {
    enabled: Boolean(currentUser && (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN")),
  });

  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("All");
  const [productPage, setProductPage] = useState(0);
  const { data: products = [], refetch: refetchProducts } = trpc.admin.products.list.useQuery(
    {
      search: productSearch,
      category: productCategory === "All" ? undefined : productCategory,
      limit: 200,
      offset: 0,
    },
    { enabled: Boolean(currentUser) }
  );

  const { data: categories = [], refetch: refetchCategories } = trpc.admin.categories.list.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const { data: orders = [], refetch: refetchOrders } = trpc.admin.orders.list.useQuery(
    {
      search: orderSearch,
      status: orderStatusFilter === "All" ? undefined : orderStatusFilter,
      limit: 100,
    },
    { enabled: Boolean(currentUser) }
  );

  const { data: customers = [], refetch: refetchCustomers } = trpc.admin.customers.list.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });

  const { data: campaigns = [], refetch: refetchCampaigns } = trpc.admin.campaigns.list.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });

  const { data: content = {}, refetch: refetchContent } = trpc.content.getAll.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });

  const { data: telegramAdmins = [], refetch: refetchTelegramAdmins } = trpc.admin.telegram.getAdmins.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });

  const { data: auditLogs = [], refetch: refetchAuditLogs } = trpc.admin.telegram.getAuditLogs.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });

  // Product Modals State
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Mutations
  const updateStockMutation = trpc.admin.products.updateStock.useMutation({
    onSuccess: () => {
      toast.success("Stock updated");
      refetchProducts();
      refetchStats();
    },
  });

  const updatePriceMutation = trpc.admin.products.updatePrice.useMutation({
    onSuccess: () => {
      toast.success("Price updated");
      refetchProducts();
    },
  });

  const deleteProductMutation = trpc.admin.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Product deleted");
      refetchProducts();
      refetchStats();
    },
  });

  const updateOrderStatusMutation = trpc.admin.orders.updateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`Order status updated to ${data?.orderStatus}`);
      refetchOrders();
      refetchStats();
      if (selectedOrder && data) {
        setSelectedOrder(data);
      }
    },
  });

  const toggleCampaignMutation = trpc.admin.campaigns.toggle.useMutation({
    onSuccess: () => {
      toast.success("Campaign status toggled");
      refetchCampaigns();
      refetchStats();
    },
  });

  const saveContentMutation = trpc.admin.content.set.useMutation({
    onSuccess: () => {
      toast.success("Store content saved");
      refetchContent();
    },
  });

  const addTelegramAdminMutation = trpc.admin.telegram.addAdmin.useMutation({
    onSuccess: () => {
      toast.success("Telegram Admin added");
      refetchTelegramAdmins();
    },
  });

  const removeTelegramAdminMutation = trpc.admin.telegram.removeAdmin.useMutation({
    onSuccess: () => {
      toast.success("Telegram Admin removed");
      refetchTelegramAdmins();
    },
  });

  // Redirect if not logged in
  if (!userLoading && (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN"))) {
    return (
      <div className="min-h-screen bg-[#FBF8F0] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#123D28] mb-2">Administrator Access Required</h2>
        <p className="text-sm text-[#6C7167] max-w-sm mb-6 font-sans">
          You must sign in with an authorized TRINAYAA administrator account to view the dashboard.
        </p>
        <button
          onClick={() => setLocation("/admin/login")}
          className="dark-button"
        >
          Go to Admin Login <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  // Filtered products for pagination
  const pageSize = 15;
  const paginatedProducts = products.slice(productPage * pageSize, (productPage + 1) * pageSize);
  const totalPages = Math.ceil(products.length / pageSize) || 1;

  return (
    <div className="min-h-screen bg-[#FBF8F0] text-[#1A2C20] flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#123D28] text-white flex flex-col justify-between shrink-0 hidden md:flex">
        <div>
          <div className="p-5 border-b border-[#1F5638] flex items-center justify-between">
            <div>
              <div className="font-serif text-xl font-bold tracking-wider text-[#FBF8F0]">TRINAYAA</div>
              <div className="text-[9px] uppercase tracking-widest text-[#E8BF83] font-semibold mt-0.5">Admin Console</div>
            </div>
            <a href="/" target="_blank" title="View Storefront" className="text-[#DFE7D7] hover:text-white p-1">
              <ExternalLink size={16} />
            </a>
          </div>

          <nav className="p-3 space-y-1 text-xs font-semibold">
            {[
              { id: "overview", label: "Dashboard", icon: LayoutDashboard },
              { id: "products", label: "Products (162)", icon: Package },
              { id: "categories", label: "Categories", icon: FolderTree },
              { id: "orders", label: "Orders", icon: ShoppingBag },
              { id: "customers", label: "Customers", icon: Users },
              { id: "offers", label: "Festival Offers", icon: Tag },
              { id: "import", label: "Bulk Import / Export", icon: FileSpreadsheet },
              { id: "content", label: "Store Content", icon: Settings },
              { id: "telegram", label: "Telegram Bot", icon: Bot },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors ${
                  activeTab === id
                    ? "bg-[#1F5638] text-[#FBF8F0] shadow-sm font-bold"
                    : "text-[#DFE7D7] hover:bg-[#123D28]/60 hover:text-white"
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-[#1F5638] text-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-[#1F5638] flex items-center justify-center font-bold text-[#FBF8F0]">
              {currentUser?.name?.[0] || "A"}
            </div>
            <div className="overflow-hidden">
              <div className="truncate font-semibold text-white">{currentUser?.name || "Admin"}</div>
              <div className="truncate text-[10px] text-[#DFE7D7]/70">{currentUser?.email}</div>
            </div>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-950/40 hover:bg-red-900/60 text-red-200 rounded-md transition-colors font-semibold"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-[#FFFDF8] border-b border-[#DEDFD5] px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h1 className="font-serif text-xl font-bold text-[#123D28] capitalize">
              {activeTab === "overview" ? "Dashboard Overview" : activeTab}
            </h1>
            <p className="text-[11px] text-[#6C7167]">
              TRINAYAA Botanical Ecommerce Management System · Pan India
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                refetchStats();
                refetchProducts();
                refetchOrders();
                toast.success("Refreshed live data");
              }}
              className="p-2 border border-[#DEDFD5] rounded-md text-[#123D28] hover:bg-[#FBF8F0]"
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
            <a
              href="/"
              target="_blank"
              className="dark-button text-xs py-1.5 px-3"
            >
              Customer Storefront <ExternalLink size={13} />
            </a>
          </div>
        </header>

        {/* Tab Content */}
        <main className="p-6">
          {/* ========================================== */}
          {/* 1. OVERVIEW DASHBOARD */}
          {/* ========================================== */}
          {activeTab === "overview" && stats && (
            <div className="space-y-6">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-5 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between text-[#6C7167] mb-2 text-xs font-semibold">
                    <span>Total Products</span>
                    <Package size={17} className="text-[#123D28]" />
                  </div>
                  <div className="text-2xl font-bold font-serif text-[#123D28]">{stats.totalProducts}</div>
                  <div className="text-[11px] text-[#6C7167] mt-1">
                    <span className="text-[#1F5638] font-bold">{stats.activeProducts} published</span> · Tamil & English
                  </div>
                </div>

                <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-5 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between text-[#6C7167] mb-2 text-xs font-semibold">
                    <span>Verified Revenue</span>
                    <DollarSign size={17} className="text-[#AE6A2B]" />
                  </div>
                  <div className="text-2xl font-bold font-serif text-[#123D28]">
                    ₹{stats.totalRevenue.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-[#6C7167] mt-1">From verified gateway payments</div>
                </div>

                <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-5 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between text-[#6C7167] mb-2 text-xs font-semibold">
                    <span>Total Orders</span>
                    <ShoppingBag size={17} className="text-[#123D28]" />
                  </div>
                  <div className="text-2xl font-bold font-serif text-[#123D28]">{stats.totalOrders}</div>
                  <div className="text-[11px] text-[#6C7167] mt-1">
                    <span className="text-amber-700 font-bold">{stats.pendingOrders} pending</span> · {stats.completedOrders} completed
                  </div>
                </div>

                <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-5 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between text-[#6C7167] mb-2 text-xs font-semibold">
                    <span>Low Stock Alerts</span>
                    <AlertTriangle size={17} className="text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold font-serif text-amber-700">{stats.lowStockProducts}</div>
                  <div className="text-[11px] text-[#6C7167] mt-1">Items with stock &lt; 10 units</div>
                </div>
              </div>

              {/* Recent Orders Section */}
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg font-bold text-[#123D28]">Recent Orders</h3>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-xs font-bold text-[#123D28] hover:text-[#AE6A2B] flex items-center gap-1"
                  >
                    View All Orders <ArrowRight size={13} />
                  </button>
                </div>

                {stats.recentOrders.length === 0 ? (
                  <p className="text-xs text-[#6C7167] py-6 text-center">No orders received yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#DEDFD5] text-[#6C7167] font-semibold">
                          <th className="py-2.5 px-3">Order Number</th>
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3">Items</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Payment</th>
                          <th className="py-2.5 px-3">Order Status</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DEDFD5]">
                        {stats.recentOrders.map((order: any) => (
                          <tr key={order.id} className="hover:bg-[#FBF8F0]/60">
                            <td className="py-2.5 px-3 font-bold text-[#123D28]">{order.orderNumber}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold">{order.customerName}</div>
                              <div className="text-[10px] text-[#6C7167]">{order.customerPhone}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              {order.items.length} {order.items.length === 1 ? "item" : "items"}
                            </td>
                            <td className="py-2.5 px-3 font-bold">₹{order.total}</td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  order.paymentStatus === "PAID"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {order.paymentStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#DFE7D7] text-[#123D28]">
                                {order.orderStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="px-2.5 py-1 bg-[#123D28] text-white rounded text-[11px] font-semibold hover:bg-[#1F5638]"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 2. PRODUCTS MANAGEMENT */}
          {/* ========================================== */}
          {activeTab === "products" && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-[#6C7167]" size={15} />
                    <input
                      type="text"
                      placeholder="Search by SKU, English or Tamil name..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setProductPage(0);
                      }}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#FBF8F0] border border-[#DEDFD5] rounded-md focus:outline-none focus:border-[#123D28]"
                    />
                  </div>
                  <select
                    value={productCategory}
                    onChange={(e) => {
                      setProductCategory(e.target.value);
                      setProductPage(0);
                    }}
                    className="text-xs py-2 px-3 bg-[#FBF8F0] border border-[#DEDFD5] rounded-md focus:outline-none focus:border-[#123D28]"
                  >
                    <option value="All">All Categories ({products.length})</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAddingProduct(true)}
                    className="dark-button text-xs py-2 px-4"
                  >
                    <Plus size={15} /> Add New Product
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FBF8F0] border-b border-[#DEDFD5] text-[#6C7167] font-semibold">
                      <tr>
                        <th className="py-3 px-3">Image</th>
                        <th className="py-3 px-3">SKU</th>
                        <th className="py-3 px-3">Product Name (EN / TA)</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3">Selling Price</th>
                        <th className="py-3 px-3">MRP</th>
                        <th className="py-3 px-3">Stock Level</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DEDFD5]">
                      {paginatedProducts.map((p: any) => (
                        <tr key={p.id} className="hover:bg-[#FBF8F0]/40">
                          <td className="py-2.5 px-3">
                            <img
                              src={p.image}
                              alt={p.nameEn}
                              className="w-10 h-10 object-contain rounded border border-[#DEDFD5] bg-white p-0.5"
                              onError={(e: any) => {
                                e.target.src = "/images/products/packaged/pouch_001.png";
                              }}
                            />
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#123D28]">{p.sku}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-[#123D28]">{p.nameEn}</div>
                            <div className="text-[11px] text-[#AE6A2B] font-serif">{p.nameTa}</div>
                          </td>
                          <td className="py-2.5 px-3 text-[#6C7167]">{p.category}</td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              defaultValue={p.price}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val !== p.price) {
                                  updatePriceMutation.mutate({ id: p.id, sellingPrice: val });
                                }
                              }}
                              className="w-16 px-1.5 py-1 text-xs border border-[#DEDFD5] rounded bg-white font-bold"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-[#6C7167]">₹{p.compareAt || p.mrp || p.price}</td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              defaultValue={p.stock}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val !== p.stock) {
                                  updateStockMutation.mutate({ id: p.id, stock: val });
                                }
                              }}
                              className={`w-16 px-1.5 py-1 text-xs border rounded font-bold ${
                                p.stock < 10
                                  ? "border-amber-400 bg-amber-50 text-amber-800"
                                  : "border-[#DEDFD5] bg-white"
                              }`}
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                p.status === "Published"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingProduct(p)}
                                className="p-1 text-[#123D28] hover:bg-[#FBF8F0] rounded"
                                title="Edit Product"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${p.nameEn}?`)) {
                                    deleteProductMutation.mutate({ id: p.id });
                                  }
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Delete Product"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-[#DEDFD5] flex items-center justify-between text-xs text-[#6C7167]">
                  <div>
                    Showing {productPage * pageSize + 1}–{Math.min((productPage + 1) * pageSize, products.length)} of {products.length} products
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setProductPage(Math.max(0, productPage - 1))}
                      disabled={productPage === 0}
                      className="px-2 py-1 border border-[#DEDFD5] rounded disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span>
                      Page {productPage + 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => setProductPage(Math.min(totalPages - 1, productPage + 1))}
                      disabled={productPage >= totalPages - 1}
                      className="px-2 py-1 border border-[#DEDFD5] rounded disabled:opacity-40"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 3. CATEGORIES MANAGEMENT */}
          {/* ========================================== */}
          {activeTab === "categories" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map((cat: any) => {
                  const count = products.filter((p: any) => p.category === cat.name || p.categoryId === cat.id).length;
                  return (
                    <div key={cat.id} className="bg-[#FFFDF8] border border-[#DEDFD5] p-5 rounded-xl shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-serif text-lg font-bold text-[#123D28]">{cat.name}</h3>
                        <span className="text-xs bg-[#DFE7D7] text-[#123D28] px-2 py-0.5 rounded font-bold">
                          {count} products
                        </span>
                      </div>
                      <p className="text-xs text-[#6C7167] mb-4">
                        {cat.description || "Traditional botanical collection from Tamil Nadu."}
                      </p>
                      <div className="text-[11px] text-[#6C7167] font-mono">Slug: {cat.slug}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 4. ORDERS MANAGEMENT */}
          {/* ========================================== */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {/* Filter */}
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-4 rounded-xl flex flex-wrap items-center gap-3 shadow-xs">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-2.5 text-[#6C7167]" size={15} />
                  <input
                    type="text"
                    placeholder="Search by order #, customer name, phone, or email..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#FBF8F0] border border-[#DEDFD5] rounded-md focus:outline-none focus:border-[#123D28]"
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="text-xs py-2 px-3 bg-[#FBF8F0] border border-[#DEDFD5] rounded-md focus:outline-none focus:border-[#123D28]"
                >
                  <option value="All">All Statuses ({orders.length})</option>
                  <option value="Pending Payment">Pending Payment</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Orders Table */}
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FBF8F0] border-b border-[#DEDFD5] text-[#6C7167] font-semibold">
                      <tr>
                        <th className="py-3 px-3">Order Number</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Customer Details</th>
                        <th className="py-3 px-3">Items</th>
                        <th className="py-3 px-3">Total Amount</th>
                        <th className="py-3 px-3">Payment</th>
                        <th className="py-3 px-3">Fulfilment Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DEDFD5]">
                      {orders.map((o: any) => (
                        <tr key={o.id} className="hover:bg-[#FBF8F0]/40">
                          <td className="py-3 px-3 font-mono font-bold text-[#123D28]">{o.orderNumber}</td>
                          <td className="py-3 px-3 text-[#6C7167]">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-[#123D28]">{o.customerName}</div>
                            <div className="text-[10px] text-[#6C7167]">{o.customerPhone}</div>
                          </td>
                          <td className="py-3 px-3">{o.items?.length || 0} items</td>
                          <td className="py-3 px-3 font-bold text-[#123D28]">₹{o.total}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                o.paymentStatus === "PAID"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {o.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <select
                              value={o.orderStatus}
                              onChange={(e) =>
                                updateOrderStatusMutation.mutate({
                                  orderId: o.id,
                                  status: e.target.value,
                                  note: `Status updated via Admin Table`,
                                })
                              }
                              className="text-[11px] font-bold py-1 px-2 rounded border border-[#DEDFD5] bg-white text-[#123D28]"
                            >
                              <option value="Pending Payment">Pending Payment</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Packed">Packed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="px-2.5 py-1 bg-[#123D28] text-white rounded text-[11px] font-semibold hover:bg-[#1F5638]"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 5. CUSTOMERS */}
          {/* ========================================== */}
          {activeTab === "customers" && (
            <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-[#DEDFD5]">
                <h3 className="font-serif text-lg font-bold text-[#123D28]">Registered Customer Accounts</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#FBF8F0] border-b border-[#DEDFD5] text-[#6C7167] font-semibold">
                    <tr>
                      <th className="py-3 px-3">Name</th>
                      <th className="py-3 px-3">Email</th>
                      <th className="py-3 px-3">Phone</th>
                      <th className="py-3 px-3">Total Orders</th>
                      <th className="py-3 px-3">Total Spent</th>
                      <th className="py-3 px-3">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DEDFD5]">
                    {customers.map((c: any) => (
                      <tr key={c.id} className="hover:bg-[#FBF8F0]/40">
                        <td className="py-2.5 px-3 font-bold text-[#123D28]">{c.name}</td>
                        <td className="py-2.5 px-3 text-[#6C7167]">{c.email}</td>
                        <td className="py-2.5 px-3 text-[#6C7167]">{c.phone || "—"}</td>
                        <td className="py-2.5 px-3 font-semibold">{c.totalOrders || 0}</td>
                        <td className="py-2.5 px-3 font-bold text-[#123D28]">₹{c.totalSpent || 0}</td>
                        <td className="py-2.5 px-3 text-[#6C7167]">{new Date(c.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 6. FESTIVAL OFFERS & CAMPAIGNS */}
          {/* ========================================== */}
          {activeTab === "offers" && (
            <div className="space-y-4">
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-5 rounded-xl shadow-xs">
                <h3 className="font-serif text-lg font-bold text-[#123D28] mb-4">Festival Promotions & Coupons</h3>
                <div className="space-y-3">
                  {campaigns.map((camp: any) => (
                    <div
                      key={camp.id}
                      className="border border-[#DEDFD5] p-4 rounded-lg flex flex-wrap items-center justify-between gap-3 bg-[#FBF8F0]/40"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm bg-[#123D28] text-white px-2 py-0.5 rounded">
                            {camp.code}
                          </span>
                          <span className="font-bold text-[#123D28]">{camp.name}</span>
                        </div>
                        <p className="text-xs text-[#6C7167] mt-1">
                          {camp.discountType === "PERCENTAGE" ? `${camp.discountValue}% OFF` : `₹${camp.discountValue} OFF`} on orders above ₹{camp.minOrderValue} (Max cap: ₹{camp.maxDiscount})
                        </p>
                        <div className="text-[10px] text-[#6C7167] mt-1">
                          Valid: {new Date(camp.startDate).toLocaleDateString()} to {new Date(camp.endDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleCampaignMutation.mutate({ id: camp.id, isActive: !camp.isActive })}
                          className={`px-3 py-1.5 rounded text-xs font-bold ${
                            camp.isActive
                              ? "bg-emerald-700 text-white hover:bg-emerald-800"
                              : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                          }`}
                        >
                          {camp.isActive ? "ACTIVE" : "DISABLED"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 7. BULK IMPORT / EXPORT */}
          {/* ========================================== */}
          {activeTab === "import" && (
            <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-6 rounded-xl shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#123D28]">Catalogue Bulk Import & Export</h3>
              <p className="text-xs text-[#6C7167]">
                Import actual product records from CSV/Excel or export the live 162-item botanical catalogue.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => {
                    const csvContent =
                      "data:text/csv;charset=utf-8," +
                      "SKU,Name (English),Name (Tamil),Category,Price,MRP,Stock\n" +
                      products.map((p: any) => `"${p.sku}","${p.nameEn}","${p.nameTa}","${p.category}",${p.price},${p.compareAt || p.price},${p.stock}`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `trinayaa_catalogue_${Date.now()}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast.success("Catalogue exported successfully");
                  }}
                  className="dark-button text-xs"
                >
                  <FileSpreadsheet size={15} /> Export Catalogue CSV
                </button>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 8. STORE CONTENT */}
          {/* ========================================== */}
          {activeTab === "content" && (
            <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-6 rounded-xl shadow-xs space-y-4 max-w-2xl">
              <h3 className="font-serif text-lg font-bold text-[#123D28]">Website Promotional Banners</h3>
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Top Announcement Banner</label>
                  <input
                    type="text"
                    defaultValue={content.top_banner || "Pan India Delivery · Pure Herbs, Natural Seeds & Raw Powders"}
                    onBlur={(e) => saveContentMutation.mutate({ key: "top_banner", value: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Mid-page Promotion Headline</label>
                  <input
                    type="text"
                    defaultValue={content.promo_banner || "Free delivery on orders above ₹799"}
                    onBlur={(e) => saveContentMutation.mutate({ key: "promo_banner", value: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 9. TELEGRAM BOT MANAGEMENT */}
          {/* ========================================== */}
          {activeTab === "telegram" && (
            <div className="space-y-6">
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-5 rounded-xl shadow-xs">
                <h3 className="font-serif text-lg font-bold text-[#123D28] mb-2 flex items-center gap-2">
                  <Bot size={20} className="text-[#123D28]" /> Telegram Administrator Allowlist
                </h3>
                <p className="text-xs text-[#6C7167] mb-4">
                  Only Telegram user IDs listed below can execute admin bot commands (e.g. `/stats`, `/order`, `/stock`, `/price`).
                </p>

                <div className="space-y-2 mb-4">
                  {telegramAdmins.map((adm: any) => (
                    <div
                      key={adm.id}
                      className="flex items-center justify-between p-3 border border-[#DEDFD5] rounded-md bg-[#FBF8F0]/40 text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-[#123D28] mr-2">ID: {adm.telegramId}</span>
                        <span className="font-semibold">{adm.name}</span>
                        <span className="ml-2 text-[10px] bg-[#DFE7D7] text-[#123D28] px-1.5 py-0.5 rounded font-bold">
                          {adm.role}
                        </span>
                      </div>
                      <button
                        onClick={() => removeTelegramAdminMutation.mutate({ telegramId: adm.telegramId })}
                        className="text-red-600 hover:text-red-800 text-[11px] font-semibold"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Telegram Admin Form */}
                <form
                  onSubmit={(e: any) => {
                    e.preventDefault();
                    const form = e.target;
                    const telegramId = form.telegramId.value.trim();
                    const name = form.name.value.trim();
                    if (telegramId && name) {
                      addTelegramAdminMutation.mutate({ telegramId, name });
                      form.reset();
                    }
                  }}
                  className="flex flex-wrap items-center gap-2 pt-2"
                >
                  <input
                    name="telegramId"
                    required
                    placeholder="Telegram User ID (e.g. 123456789)"
                    className="text-xs px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0] flex-1"
                  />
                  <input
                    name="name"
                    required
                    placeholder="Admin Name / Username"
                    className="text-xs px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0] flex-1"
                  />
                  <button type="submit" className="dark-button text-xs py-2 px-4">
                    <Plus size={14} /> Authorize Admin
                  </button>
                </form>
              </div>

              {/* Telegram Audit Logs */}
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-5 rounded-xl shadow-xs">
                <h3 className="font-serif text-lg font-bold text-[#123D28] mb-3">Audit Logs</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="border-b border-[#DEDFD5] text-[#6C7167]">
                      <tr>
                        <th className="py-2 px-2">Time</th>
                        <th className="py-2 px-2">Telegram User ID</th>
                        <th className="py-2 px-2">Action / Command</th>
                        <th className="py-2 px-2">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DEDFD5]">
                      {auditLogs.map((log: any) => (
                        <tr key={log.id}>
                          <td className="py-2 px-2 text-[#6C7167]">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="py-2 px-2 font-mono font-bold">{log.telegramUserId}</td>
                          <td className="py-2 px-2 font-semibold text-[#123D28]">{log.command}</td>
                          <td className="py-2 px-2 text-[#6C7167]">{log.details || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DEDFD5] pb-3 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#AE6A2B]">Order Details</span>
                <h3 className="font-serif text-xl font-bold text-[#123D28]">{selectedOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-[#6C7167] hover:text-[#123D28]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#FBF8F0] p-3 rounded-lg border border-[#DEDFD5]">
                <div>
                  <span className="text-[#6C7167] block">Customer</span>
                  <strong className="text-[#123D28] text-sm">{selectedOrder.customerName}</strong>
                  <div className="text-[#6C7167]">{selectedOrder.customerPhone}</div>
                  <div className="text-[#6C7167]">{selectedOrder.customerEmail}</div>
                </div>
                <div>
                  <span className="text-[#6C7167] block">Delivery Address</span>
                  <div className="font-semibold text-[#123D28]">
                    {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}
                  </div>
                  <div className="text-[#6C7167]">
                    {selectedOrder.shippingAddress?.state} – {selectedOrder.shippingAddress?.pinCode}
                  </div>
                </div>
              </div>

              <div>
                <span className="font-bold text-[#123D28] block mb-2">Ordered Botanicals:</span>
                <div className="divide-y divide-[#DEDFD5] border border-[#DEDFD5] rounded-lg overflow-hidden">
                  {selectedOrder.items?.map((it: any) => (
                    <div key={it.id} className="p-3 flex items-center justify-between bg-white">
                      <div>
                        <strong className="text-[#123D28]">{it.productNameEn}</strong>
                        <div className="text-[11px] text-[#6C7167]">
                          Pack: {it.packSize} · Quantity: {it.quantity}
                        </div>
                      </div>
                      <div className="font-bold">₹{it.subtotal}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#FBF8F0] rounded-lg border border-[#DEDFD5]">
                <span className="font-bold">Order Status</span>
                <select
                  value={selectedOrder.orderStatus}
                  onChange={(e) =>
                    updateOrderStatusMutation.mutate({
                      orderId: selectedOrder.id,
                      status: e.target.value,
                      note: `Updated in modal`,
                    })
                  }
                  className="font-bold py-1 px-2 border rounded bg-white text-[#123D28]"
                >
                  <option value="Pending Payment">Pending Payment</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Packed">Packed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <span className="font-bold text-[#123D28] block mb-2">Timestamped Lifecycle History:</span>
                <div className="space-y-1.5 border-l-2 border-[#123D28] pl-3 py-1">
                  {selectedOrder.history?.map((h: any) => (
                    <div key={h.id} className="text-[11px]">
                      <span className="font-bold text-[#123D28]">{h.status}</span>
                      <span className="text-[#6C7167] ml-2">({new Date(h.createdAt).toLocaleString()})</span>
                      <div className="text-[#6C7167] text-[10px]">{h.note} · by {h.updatedBy}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Product Modal */}
      {(editingProduct || isAddingProduct) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DEDFD5] pb-3 mb-4">
              <h3 className="font-serif text-xl font-bold text-[#123D28]">
                {editingProduct ? `Edit ${editingProduct.nameEn}` : "Add New Botanical Product"}
              </h3>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsAddingProduct(false);
                }}
                className="text-[#6C7167] hover:text-[#123D28]"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e: any) => {
                e.preventDefault();
                const form = e.target;
                const data = {
                  sku: form.sku.value,
                  nameEn: form.nameEn.value,
                  nameTa: form.nameTa.value,
                  category: form.category.value,
                  sellingPrice: parseFloat(form.sellingPrice.value),
                  mrp: parseFloat(form.mrp.value),
                  stock: parseInt(form.stock.value, 10),
                  status: form.status.value,
                  shortDesc: form.shortDesc.value,
                  primaryImage: form.primaryImage.value,
                };

                if (editingProduct) {
                  trpc.admin.products.update.useMutation().mutate(
                    { id: editingProduct.id, updates: data },
                    {
                      onSuccess: () => {
                        toast.success("Product updated");
                        setEditingProduct(null);
                        refetchProducts();
                      },
                    }
                  );
                } else {
                  trpc.admin.products.create.useMutation().mutate(data, {
                    onSuccess: () => {
                      toast.success("Product created");
                      setIsAddingProduct(false);
                      refetchProducts();
                    },
                  });
                }
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">SKU</label>
                  <input
                    name="sku"
                    required
                    defaultValue={editingProduct?.sku || `TRN-${Math.floor(1000 + Math.random() * 9000)}`}
                    className="w-full px-2.5 py-1.5 border rounded bg-[#FBF8F0]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    name="category"
                    defaultValue={editingProduct?.category || "Herbs"}
                    className="w-full px-2.5 py-1.5 border rounded bg-[#FBF8F0]"
                  >
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">English Product Name</label>
                <input
                  name="nameEn"
                  required
                  defaultValue={editingProduct?.nameEn || ""}
                  className="w-full px-2.5 py-1.5 border rounded bg-[#FBF8F0]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Tamil Product Name</label>
                <input
                  name="nameTa"
                  defaultValue={editingProduct?.nameTa || ""}
                  className="w-full px-2.5 py-1.5 border rounded bg-[#FBF8F0]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Selling Price (₹)</label>
                  <input
                    name="sellingPrice"
                    type="number"
                    required
                    defaultValue={editingProduct?.price || 150}
                    className="w-full px-2.5 py-1.5 border rounded bg-[#FBF8F0]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">MRP (₹)</label>
                  <input
                    name="mrp"
                    type="number"
                    required
                    defaultValue={editingProduct?.compareAt || editingProduct?.price || 180}
                    className="w-full px-2.5 py-1.5 border rounded bg-[#FBF8F0]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Stock</label>
                  <input
                    name="stock"
                    type="number"
                    required
                    defaultValue={editingProduct?.stock || 100}
                    className="w-full px-2.5 py-1.5 border rounded bg-[#FBF8F0]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Primary Image URL</label>
                <div className="flex gap-2">
                  <input
                    name="primaryImage"
                    defaultValue={editingProduct?.image || "/images/products/packaged/pouch_001.png"}
                    className="w-full px-2.5 py-1.5 border rounded bg-[#FBF8F0]"
                  />
                  <label className="dark-button px-3 py-1 cursor-pointer shrink-0">
                    <Upload size={14} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = async () => {
                          const base64 = reader.result as string;
                          try {
                            const res = await fetch("/api/upload", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                fileName: file.name,
                                fileData: base64,
                                mimeType: file.type,
                              }),
                            });
                            const data = await res.json();
                            if (data.url) {
                              toast.success("Image uploaded!");
                              (e.target.form as any).primaryImage.value = data.url;
                            }
                          } catch {
                            toast.error("Upload failed");
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={editingProduct?.status || "Published"}
                  className="w-full px-2.5 py-1.5 border rounded bg-[#FBF8F0]"
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  name="shortDesc"
                  rows={2}
                  defaultValue={editingProduct?.description || ""}
                  className="w-full px-2.5 py-1.5 border rounded bg-[#FBF8F0]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsAddingProduct(false);
                  }}
                  className="px-3 py-1.5 border border-[#DEDFD5] rounded font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="dark-button py-1.5 px-4">
                  Save Botanical Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

