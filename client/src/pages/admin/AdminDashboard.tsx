import { useState, useMemo, useEffect } from "react";
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
  Archive,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  X,
  ArrowRight,
  Image as ImageIcon,
  Layers,
  FileText,
  Clock,
  Sparkles,
  Info
} from "lucide-react";

type AdminTab =
  | "overview"
  | "products"
  | "categories"
  | "inventory"
  | "orders"
  | "customers"
  | "offers"
  | "import"
  | "content"
  | "settings"
  | "telegram";

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();

  // Compute active tab from URL path
  const activeTab: AdminTab = useMemo(() => {
    if (location.startsWith("/admin/products")) return "products";
    if (location.startsWith("/admin/categories")) return "categories";
    if (location.startsWith("/admin/inventory")) return "inventory";
    if (location.startsWith("/admin/orders")) return "orders";
    if (location.startsWith("/admin/customers")) return "customers";
    if (location.startsWith("/admin/offers")) return "offers";
    if (location.startsWith("/admin/import")) return "import";
    if (location.startsWith("/admin/content")) return "content";
    if (location.startsWith("/admin/settings")) return "settings";
    if (location.startsWith("/admin/telegram")) return "telegram";
    return "overview";
  }, [location]);

  const navigateToTab = (tab: AdminTab) => {
    if (tab === "overview") {
      setLocation("/admin/dashboard");
    } else {
      setLocation(`/admin/${tab}`);
    }
  };

  // Authentication check
  const { data: currentUser, isLoading: userLoading } = trpc.auth.me.useQuery();
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
      limit: 300,
      offset: 0,
    },
    { enabled: Boolean(currentUser) }
  );

  const { data: categories = [], refetch: refetchCategories } = trpc.admin.categories.list.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });

  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryStockFilter, setInventoryStockFilter] = useState<"all" | "low_stock" | "out_of_stock">("all");
  const { data: inventoryData, refetch: refetchInventory } = trpc.admin.inventory.list.useQuery(
    {
      search: inventorySearch,
      status: inventoryStockFilter,
      limit: 300,
    },
    { enabled: Boolean(currentUser && activeTab === "inventory") }
  );

  const { data: auditLogs = [], refetch: refetchAuditLogs } = trpc.admin.auditLogs.list.useQuery(
    { limit: 50 },
    { enabled: Boolean(currentUser && (activeTab === "inventory" || activeTab === "overview")) }
  );

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
    enabled: Boolean(currentUser) }
  );

  const { data: campaigns = [], refetch: refetchCampaigns } = trpc.admin.campaigns.list.useQuery(undefined, {
    enabled: Boolean(currentUser) }
  );

  const { data: content = {}, refetch: refetchContent } = trpc.content.getAll.useQuery(undefined, {
    enabled: Boolean(currentUser) }
  );

  const { data: telegramAdmins = [], refetch: refetchTelegramAdmins } = trpc.admin.telegram.getAdmins.useQuery(undefined, {
    enabled: Boolean(currentUser) }
  );

  // Modals & UI States
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingCampaign, setIsAddingCampaign] = useState(false);
  const [galleryProduct, setGalleryProduct] = useState<any | null>(null);
  const [inventoryAdjustProduct, setInventoryAdjustProduct] = useState<any | null>(null);
  const [importSummary, setImportSummary] = useState<any | null>(null);

  // Auto-open Add Product modal if route is /admin/products/new
  useEffect(() => {
    if (location === "/admin/products/new") {
      setIsAddingProduct(true);
    }
  }, [location]);

  // Product Image query for gallery modal
  const { data: galleryImages = [], refetch: refetchGalleryImages } = trpc.admin.products.getImages.useQuery(
    { productId: galleryProduct?.id || "" },
    { enabled: Boolean(galleryProduct?.id) }
  );

  // Mutations
  const createProductMutation = trpc.admin.products.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully");
      setIsAddingProduct(false);
      refetchProducts();
      refetchStats();
      if (location === "/admin/products/new") {
        setLocation("/admin/products");
      }
    },
    onError: (err) => toast.error(err.message || "Failed to create product"),
  });

  const updateProductMutation = trpc.admin.products.update.useMutation({
    onSuccess: () => {
      toast.success("Product updated successfully");
      setEditingProduct(null);
      refetchProducts();
    },
    onError: (err) => toast.error(err.message || "Failed to update product"),
  });

  const archiveProductMutation = trpc.admin.products.archive.useMutation({
    onSuccess: () => {
      toast.success("Product archived successfully");
      refetchProducts();
      refetchStats();
    },
    onError: (err) => toast.error(err.message || "Failed to archive product"),
  });

  const deleteProductMutation = trpc.admin.products.delete.useMutation({
    onSuccess: (data) => {
      if (data?.archived) {
        toast.info("Product has order history, so it was archived instead of permanently deleted.");
      } else {
        toast.success("Product deleted successfully");
      }
      refetchProducts();
      refetchStats();
    },
    onError: (err) => toast.error(err.message || "Failed to delete product"),
  });

  const updatePriceMutation = trpc.admin.products.updatePrice.useMutation({
    onSuccess: () => {
      toast.success("Price updated");
      refetchProducts();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateStockMutation = trpc.admin.products.updateStock.useMutation({
    onSuccess: () => {
      toast.success("Stock updated");
      refetchProducts();
      refetchStats();
      refetchInventory();
    },
    onError: (err) => toast.error(err.message),
  });

  const inventoryStockMutation = trpc.admin.inventory.updateStock.useMutation({
    onSuccess: () => {
      toast.success("Inventory stock updated with audit entry");
      setInventoryAdjustProduct(null);
      refetchInventory();
      refetchProducts();
      refetchStats();
      refetchAuditLogs();
    },
    onError: (err) => toast.error(err.message),
  });

  const createCategoryMutation = trpc.admin.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Category created successfully");
      setIsAddingCategory(false);
      refetchCategories();
      refetchStats();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateCategoryMutation = trpc.admin.categories.update.useMutation({
    onSuccess: () => {
      toast.success("Category updated successfully");
      setEditingCategory(null);
      refetchCategories();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCategoryMutation = trpc.admin.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("Category deleted");
      refetchCategories();
      refetchStats();
    },
    onError: (err) => {
      toast.error(err.message || "Cannot delete category containing active products.");
    },
  });

  const createCampaignMutation = trpc.admin.campaigns.create.useMutation({
    onSuccess: () => {
      toast.success("Campaign created successfully");
      setIsAddingCampaign(false);
      refetchCampaigns();
      refetchStats();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleCampaignMutation = trpc.admin.campaigns.toggle.useMutation({
    onSuccess: () => {
      toast.success("Campaign status updated");
      refetchCampaigns();
      refetchStats();
    },
    onError: (err) => toast.error(err.message),
  });

  const addImageMutation = trpc.admin.products.addImage.useMutation({
    onSuccess: () => {
      toast.success("Image added to gallery");
      refetchGalleryImages();
      refetchProducts();
    },
    onError: (err) => toast.error(err.message),
  });

  const setPrimaryImageMutation = trpc.admin.products.setPrimaryImage.useMutation({
    onSuccess: () => {
      toast.success("Cover image set successfully");
      refetchGalleryImages();
      refetchProducts();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeImageMutation = trpc.admin.products.removeImage.useMutation({
    onSuccess: () => {
      toast.success("Image removed from gallery");
      refetchGalleryImages();
      refetchProducts();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateImageAltMutation = trpc.admin.products.updateImageAlt.useMutation({
    onSuccess: () => {
      toast.success("Alt text updated");
      refetchGalleryImages();
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkImportMutation = trpc.admin.products.bulkImport.useMutation({
    onSuccess: (res) => {
      setImportSummary(res);
      toast.success(`Import complete: ${res.successCount} of ${res.total} items processed`);
      refetchProducts();
      refetchStats();
    },
    onError: (err) => toast.error(err.message),
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
    onError: (err) => toast.error(err.message),
  });

  const saveContentMutation = trpc.admin.content.set.useMutation({
    onSuccess: () => {
      toast.success("Store content saved");
      refetchContent();
    },
    onError: (err) => toast.error(err.message),
  });

  const addTelegramAdminMutation = trpc.admin.telegram.addAdmin.useMutation({
    onSuccess: () => {
      toast.success("Telegram Admin added");
      refetchTelegramAdmins();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeTelegramAdminMutation = trpc.admin.telegram.removeAdmin.useMutation({
    onSuccess: () => {
      toast.success("Telegram Admin removed");
      refetchTelegramAdmins();
    },
    onError: (err) => toast.error(err.message),
  });

  // Redirect if not logged in as Admin
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
        <button onClick={() => setLocation("/admin/login")} className="dark-button">
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
      <aside className="w-64 bg-[#123D28] text-white flex flex-col justify-between shrink-0 hidden md:flex border-r border-[#1F5638]">
        <div>
          <div className="p-5 border-b border-[#1F5638] flex items-center justify-between">
            <div>
              <div className="font-serif text-xl font-bold tracking-wider text-[#FBF8F0]">TRINAYAA</div>
              <div className="text-[9px] uppercase tracking-widest text-[#E8BF83] font-semibold mt-0.5">
                Admin Console
              </div>
            </div>
            <a href="/" target="_blank" title="View Storefront" className="text-[#DFE7D7] hover:text-white p-1">
              <ExternalLink size={16} />
            </a>
          </div>

          <nav className="p-3 space-y-1 text-xs font-semibold">
            {[
              { id: "overview" as AdminTab, label: "Dashboard", icon: LayoutDashboard },
              { id: "products" as AdminTab, label: `Products (${products.length})`, icon: Package },
              { id: "categories" as AdminTab, label: "Categories", icon: FolderTree },
              { id: "inventory" as AdminTab, label: "Inventory & Stock", icon: Layers },
              { id: "orders" as AdminTab, label: "Orders", icon: ShoppingBag },
              { id: "customers" as AdminTab, label: "Customers", icon: Users },
              { id: "offers" as AdminTab, label: "Festival Offers", icon: Tag },
              { id: "import" as AdminTab, label: "Bulk Import / Export", icon: FileSpreadsheet },
              { id: "content" as AdminTab, label: "Store Content", icon: FileText },
              { id: "settings" as AdminTab, label: "Store Settings", icon: Settings },
              { id: "telegram" as AdminTab, label: "Telegram Bot", icon: Bot },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => navigateToTab(id)}
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
              {activeTab === "overview" ? "Dashboard Overview" : activeTab.replace("-", " ")}
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
                refetchCategories();
                refetchInventory();
                toast.success("Refreshed live data");
              }}
              className="p-2 border border-[#DEDFD5] rounded-md text-[#123D28] hover:bg-[#FBF8F0]"
              title="Refresh Live Data"
            >
              <RefreshCw size={15} />
            </button>
            <a href="/" target="_blank" className="dark-button text-xs py-1.5 px-3">
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
              {/* Primary 11 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-4 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between text-[#6C7167] mb-1.5 text-xs font-semibold">
                    <span>Total Products</span>
                    <Package size={16} className="text-[#123D28]" />
                  </div>
                  <div className="text-2xl font-bold font-serif text-[#123D28]">{stats.totalProducts}</div>
                  <div className="text-[11px] text-[#6C7167] mt-1">
                    <span className="text-[#1F5638] font-bold">{stats.activeProducts} published</span> · {stats.draftProducts} drafts
                  </div>
                </div>

                <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-4 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between text-[#6C7167] mb-1.5 text-xs font-semibold">
                    <span>Verified Revenue</span>
                    <DollarSign size={16} className="text-[#AE6A2B]" />
                  </div>
                  <div className="text-2xl font-bold font-serif text-[#123D28]">
                    ₹{stats.totalRevenue.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-[#6C7167] mt-1">From verified gateway payments</div>
                </div>

                <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-4 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between text-[#6C7167] mb-1.5 text-xs font-semibold">
                    <span>Total Orders</span>
                    <ShoppingBag size={16} className="text-[#123D28]" />
                  </div>
                  <div className="text-2xl font-bold font-serif text-[#123D28]">{stats.totalOrders}</div>
                  <div className="text-[11px] text-[#6C7167] mt-1">
                    <span className="text-amber-700 font-bold">{stats.pendingOrders} pending</span> · {stats.completedOrders} completed
                  </div>
                </div>

                <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-4 rounded-xl shadow-xs">
                  <div className="flex items-center justify-between text-[#6C7167] mb-1.5 text-xs font-semibold">
                    <span>Low Stock Alerts</span>
                    <AlertTriangle size={16} className="text-amber-600" />
                  </div>
                  <div className="text-2xl font-bold font-serif text-amber-700">{stats.lowStockProducts}</div>
                  <div className="text-[11px] text-[#6C7167] mt-1">Items with stock &lt; 10 units</div>
                </div>
              </div>

              {/* Secondary Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-4 rounded-xl shadow-xs">
                  <div className="text-[#6C7167] text-xs font-semibold mb-1">Botanical Categories</div>
                  <div className="text-xl font-bold font-serif text-[#123D28]">{stats.totalCategories}</div>
                  <div className="text-[11px] text-[#6C7167] mt-1">Tamil & English taxonomies</div>
                </div>
                <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-4 rounded-xl shadow-xs">
                  <div className="text-[#6C7167] text-xs font-semibold mb-1">Registered Customers</div>
                  <div className="text-xl font-bold font-serif text-[#123D28]">{stats.totalCustomers}</div>
                  <div className="text-[11px] text-[#6C7167] mt-1">Verified phone & email accounts</div>
                </div>
                <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-4 rounded-xl shadow-xs">
                  <div className="text-[#6C7167] text-xs font-semibold mb-1">Active Festival Campaigns</div>
                  <div className="text-xl font-bold font-serif text-[#123D28]">{stats.activeCampaigns}</div>
                  <div className="text-[11px] text-[#6C7167] mt-1">
                    {stats.activePromotionSummary?.[0]?.name || "No campaign active"}
                  </div>
                </div>
              </div>

              {/* Low Stock Alerts & Recently Updated Products */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Low Stock Card */}
                <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-serif text-base font-bold text-[#123D28] flex items-center gap-2">
                      <AlertTriangle size={16} className="text-amber-600" /> Low Stock Warning (&lt;10 Units)
                    </h3>
                    <button
                      onClick={() => navigateToTab("inventory")}
                      className="text-xs font-bold text-[#123D28] hover:text-[#AE6A2B]"
                    >
                      Manage Stock &rarr;
                    </button>
                  </div>
                  {(!stats.lowStockAlerts || stats.lowStockAlerts.length === 0) ? (
                    <p className="text-xs text-[#6C7167] py-4 text-center">All product stocks are healthy (&gt; 10 units).</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.lowStockAlerts.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2.5 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-[#123D28] mr-2">{item.sku}</span>
                            <span className="font-semibold text-[#123D28]">{item.nameEn}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded font-bold bg-amber-200 text-amber-900">
                            {item.stock} in stock
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recently Updated Products */}
                <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-serif text-base font-bold text-[#123D28] flex items-center gap-2">
                      <Clock size={16} className="text-[#123D28]" /> Recently Updated Botanicals
                    </h3>
                    <button
                      onClick={() => navigateToTab("products")}
                      className="text-xs font-bold text-[#123D28] hover:text-[#AE6A2B]"
                    >
                      View All &rarr;
                    </button>
                  </div>
                  {(!stats.recentlyUpdatedProducts || stats.recentlyUpdatedProducts.length === 0) ? (
                    <p className="text-xs text-[#6C7167] py-4 text-center">No recent product updates.</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.recentlyUpdatedProducts.map((p: any) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 bg-[#FBF8F0]/60 border border-[#DEDFD5] rounded-lg text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-[#123D28] mr-2">{p.sku}</span>
                            <span className="font-semibold">{p.nameEn}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-[#123D28]">₹{p.price}</span>
                            <span className="text-[#6C7167] text-[10px] ml-2">({p.stock} units)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Orders Section */}
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-lg font-bold text-[#123D28]">Recent Store Orders</h3>
                  <button
                    onClick={() => navigateToTab("orders")}
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
                    onClick={() => {
                      setIsAddingProduct(true);
                      setLocation("/admin/products/new");
                    }}
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
                            <button
                              onClick={() => setGalleryProduct(p)}
                              title="Click to view & manage image gallery"
                              className="relative group block"
                            >
                              <img
                                src={p.image}
                                alt={p.nameEn}
                                className="w-10 h-10 object-contain rounded border border-[#DEDFD5] bg-white p-0.5 group-hover:opacity-80"
                                onError={(e: any) => {
                                  e.target.src = "/images/products/packaged/pouch_001.png";
                                }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded text-[9px] font-bold">
                                Gallery
                              </span>
                            </button>
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
                                p.stock <= 0
                                  ? "border-red-400 bg-red-50 text-red-800"
                                  : p.stock < 10
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
                                  : p.status === "Archived"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setGalleryProduct(p)}
                                className="p-1 text-[#123D28] hover:bg-[#DFE7D7] rounded"
                                title="Manage Image Gallery"
                              >
                                <ImageIcon size={14} />
                              </button>
                              <button
                                onClick={() => setEditingProduct(p)}
                                className="p-1 text-[#123D28] hover:bg-[#FBF8F0] rounded"
                                title="Edit Product"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Archive product ${p.nameEn} (${p.sku})? It will be hidden from storefront but preserved in order history.`)) {
                                    archiveProductMutation.mutate({ id: p.id });
                                  }
                                }}
                                className="p-1 text-amber-700 hover:bg-amber-50 rounded"
                                title="Archive Product"
                              >
                                <Archive size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${p.nameEn}? If referenced in orders, it will be automatically archived instead.`)) {
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
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-4 rounded-xl flex items-center justify-between shadow-xs">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#123D28]">Botanical Category Taxonomies</h3>
                  <p className="text-xs text-[#6C7167]">
                    Manage root categories. Categories with active products are protected from accidental deletion.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="dark-button text-xs py-2 px-4"
                >
                  <Plus size={15} /> Add New Category
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map((cat: any) => {
                  const count = products.filter((p: any) => p.category === cat.name || p.categoryId === cat.id).length;
                  return (
                    <div key={cat.id} className="bg-[#FFFDF8] border border-[#DEDFD5] p-5 rounded-xl shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-serif text-lg font-bold text-[#123D28]">{cat.name}</h4>
                            {cat.tamilName && (
                              <div className="text-xs text-[#AE6A2B] font-serif">{cat.tamilName}</div>
                            )}
                          </div>
                          <span className="text-xs bg-[#DFE7D7] text-[#123D28] px-2 py-0.5 rounded font-bold">
                            {count} {count === 1 ? "product" : "products"}
                          </span>
                        </div>
                        <p className="text-xs text-[#6C7167] mb-3">
                          {cat.description || "Traditional botanical collection from Tamil Nadu."}
                        </p>
                        <div className="text-[11px] text-[#6C7167] font-mono mb-4">Slug: /{cat.slug}</div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DEDFD5]">
                        <button
                          onClick={() => setEditingCategory(cat)}
                          className="px-2.5 py-1 text-xs border border-[#DEDFD5] rounded text-[#123D28] hover:bg-[#FBF8F0] font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete category ${cat.name}? Note: Categories containing active products cannot be deleted.`)) {
                              deleteCategoryMutation.mutate({ id: cat.id });
                            }
                          }}
                          className="px-2.5 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 4. INVENTORY & STOCK MANAGEMENT */}
          {/* ========================================== */}
          {activeTab === "inventory" && (
            <div className="space-y-4">
              {/* Header & Filters */}
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-[#6C7167]" size={15} />
                    <input
                      type="text"
                      placeholder="Search inventory by SKU, product name..."
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-[#FBF8F0] border border-[#DEDFD5] rounded-md focus:outline-none focus:border-[#123D28]"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    {(["all", "low_stock", "out_of_stock"] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setInventoryStockFilter(filter)}
                        className={`text-xs px-3 py-2 rounded-md font-semibold transition-colors ${
                          inventoryStockFilter === filter
                            ? "bg-[#123D28] text-white"
                            : "bg-[#FBF8F0] border border-[#DEDFD5] text-[#123D28] hover:bg-white"
                        }`}
                      >
                        {filter === "all" ? "All Items" : filter === "low_stock" ? "Low Stock (<10)" : "Out of Stock (0)"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FBF8F0] border-b border-[#DEDFD5] text-[#6C7167] font-semibold">
                      <tr>
                        <th className="py-3 px-3">SKU</th>
                        <th className="py-3 px-3">Botanical Product</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3">Selling Price</th>
                        <th className="py-3 px-3">Stock Units</th>
                        <th className="py-3 px-3">Inventory Status</th>
                        <th className="py-3 px-3 text-right">Adjust Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DEDFD5]">
                      {(inventoryData || []).map((item: any) => (
                        <tr key={item.id} className="hover:bg-[#FBF8F0]/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#123D28]">{item.sku}</td>
                          <td className="py-2.5 px-3 font-bold text-[#123D28]">{item.nameEn}</td>
                          <td className="py-2.5 px-3 text-[#6C7167]">{item.category}</td>
                          <td className="py-2.5 px-3 font-semibold">₹{item.price}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-sm">{item.stock}</td>
                          <td className="py-2.5 px-3">
                            {item.stock <= 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                Out of Stock
                              </span>
                            ) : item.stock < 10 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Low Stock ({item.stock})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Healthy ({item.stock})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => setInventoryAdjustProduct(item)}
                              className="px-2.5 py-1 bg-[#123D28] text-white rounded text-[11px] font-semibold hover:bg-[#1F5638]"
                            >
                              Update Stock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Log Section */}
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl p-5 shadow-xs">
                <h3 className="font-serif text-base font-bold text-[#123D28] mb-3 flex items-center gap-2">
                  <Clock size={16} /> Stock & Inventory Change Audit Trail
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="border-b border-[#DEDFD5] text-[#6C7167]">
                      <tr>
                        <th className="py-2 px-2">Timestamp</th>
                        <th className="py-2 px-2">Admin User</th>
                        <th className="py-2 px-2">Action / Target</th>
                        <th className="py-2 px-2">Adjustment Reason / Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DEDFD5]">
                      {auditLogs.map((log: any) => (
                        <tr key={log.id}>
                          <td className="py-2 px-2 text-[#6C7167] whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-2 px-2 font-semibold text-[#123D28]">{log.adminEmail || log.userId}</td>
                          <td className="py-2 px-2 font-mono font-bold text-xs">{log.action}</td>
                          <td className="py-2 px-2 text-[#6C7167]">{log.details || log.reason || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 5. ORDERS MANAGEMENT */}
          {/* ========================================== */}
          {activeTab === "orders" && (
            <div className="space-y-4">
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
          {/* 6. CUSTOMERS */}
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
          {/* 7. FESTIVAL OFFERS & CAMPAIGNS */}
          {/* ========================================== */}
          {activeTab === "offers" && (
            <div className="space-y-4">
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-5 rounded-xl shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#123D28]">Festival Promotions & Coupons</h3>
                    <p className="text-xs text-[#6C7167]">Create coupon codes with percentage or fixed discounts and minimum cart caps.</p>
                  </div>
                  <button
                    onClick={() => setIsAddingCampaign(true)}
                    className="dark-button text-xs py-2 px-4"
                  >
                    <Plus size={15} /> Create Offer Campaign
                  </button>
                </div>

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
                        {camp.bannerText && (
                          <div className="text-[11px] text-[#AE6A2B] font-semibold mt-1">
                            Banner: "{camp.bannerText}"
                          </div>
                        )}
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
          {/* 8. BULK IMPORT / EXPORT */}
          {/* ========================================== */}
          {activeTab === "import" && (
            <div className="space-y-6">
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-6 rounded-xl shadow-xs space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#123D28]">Catalogue Bulk Import & Export</h3>
                <p className="text-xs text-[#6C7167]">
                  Export the verified botanical catalogue of 162 items as CSV, or bulk import updates with duplicate SKU checks.
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => {
                      const csvContent =
                        "data:text/csv;charset=utf-8," +
                        "SKU,Name (English),Name (Tamil),Category,Price,MRP,Stock,Status\n" +
                        products
                          .map(
                            (p: any) =>
                              `"${p.sku}","${p.nameEn}","${p.nameTa || ""}","${p.category}",${p.price},${p.compareAt || p.price},${p.stock},"${p.status}"`
                          )
                          .join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `trinayaa_catalogue_${Date.now()}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.success("Catalogue exported to CSV");
                    }}
                    className="dark-button text-xs"
                  >
                    <FileSpreadsheet size={15} /> Export Catalogue CSV (162 Items)
                  </button>
                </div>
              </div>

              {/* Bulk Import Form */}
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-6 rounded-xl shadow-xs space-y-4">
                <h4 className="font-serif text-base font-bold text-[#123D28]">Bulk CSV / JSON Product Importer</h4>
                <p className="text-xs text-[#6C7167]">
                  Upload a CSV file or paste CSV/JSON rows. Required columns: SKU, Name (English), Category, Price.
                </p>

                <form
                  onSubmit={(e: any) => {
                    e.preventDefault();
                    const text = e.target.csvText.value.trim();
                    if (!text) {
                      toast.error("Please enter CSV or JSON text");
                      return;
                    }

                    try {
                      let rows: any[] = [];
                      if (text.startsWith("[") && text.endsWith("]")) {
                        rows = JSON.parse(text);
                      } else {
                        // Simple CSV parser
                        const lines = text.split("\n").map((l: string) => l.trim()).filter(Boolean);
                        const headerLine = lines[0];
                        const headers = headerLine.split(",").map((h: string) => h.replace(/^["']|["']$/g, "").trim().toLowerCase());
                        
                        for (let i = 1; i < lines.length; i++) {
                          const parts = lines[i].split(",").map((p: string) => p.replace(/^["']|["']$/g, "").trim());
                          const row: any = {};
                          headers.forEach((h: string, idx: number) => {
                            if (h.includes("sku")) row.sku = parts[idx];
                            else if (h.includes("english") || h === "name") row.nameEn = parts[idx];
                            else if (h.includes("tamil")) row.nameTa = parts[idx];
                            else if (h.includes("category")) row.category = parts[idx];
                            else if (h.includes("price") && !h.includes("mrp")) row.sellingPrice = parseFloat(parts[idx]);
                            else if (h.includes("mrp") || h.includes("compare")) row.mrp = parseFloat(parts[idx]);
                            else if (h.includes("stock")) row.stock = parseInt(parts[idx], 10);
                          });
                          rows.push(row);
                        }
                      }

                      bulkImportMutation.mutate(rows);
                    } catch (err: any) {
                      toast.error(`Parser error: ${err.message}`);
                    }
                  }}
                  className="space-y-3"
                >
                  <textarea
                    name="csvText"
                    rows={6}
                    placeholder={`SKU,Name (English),Name (Tamil),Category,Price,MRP,Stock\nTRN-9001,"Organic Tulsi Powder","துளசி பொடி","Herbs",180,220,100`}
                    className="w-full p-3 font-mono text-xs border border-[#DEDFD5] rounded-md bg-[#FBF8F0]"
                  />
                  <div className="flex justify-end">
                    <button type="submit" className="dark-button text-xs py-2 px-4">
                      <Upload size={14} /> Validate & Process Import
                    </button>
                  </div>
                </form>

                {importSummary && (
                  <div className="p-4 bg-[#FBF8F0] border border-[#DEDFD5] rounded-lg text-xs space-y-2">
                    <div className="font-bold text-[#123D28]">Import Results:</div>
                    <div>Total items: {importSummary.total}</div>
                    <div className="text-emerald-700 font-semibold">Successfully processed: {importSummary.successCount}</div>
                    {importSummary.errors?.length > 0 && (
                      <div className="text-red-700 font-semibold">
                        Errors ({importSummary.errors.length}):
                        <ul className="list-disc pl-4 font-normal mt-1 text-[11px]">
                          {importSummary.errors.map((e: any, i: number) => (
                            <li key={i}>
                              Row {e.index + 1}: {e.sku ? `[${e.sku}] ` : ""}{e.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 9. STORE CONTENT & POLICIES */}
          {/* ========================================== */}
          {activeTab === "content" && (
            <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-6 rounded-xl shadow-xs space-y-6 max-w-3xl">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#123D28]">Website Content Management</h3>
                <p className="text-xs text-[#6C7167]">
                  Manage customer-facing announcements, brand heritage stories, policy pages, and contact information.
                </p>
              </div>

              {/* Banners */}
              <div className="space-y-3 border-b border-[#DEDFD5] pb-5">
                <h4 className="font-serif text-sm font-bold text-[#123D28]">Announcement Banners</h4>
                <div>
                  <label className="block text-xs font-semibold mb-1">Top Announcement Bar Text</label>
                  <input
                    type="text"
                    defaultValue={content.top_banner || "Pan India Delivery · Pure Herbs, Natural Seeds & Raw Powders"}
                    onBlur={(e) => saveContentMutation.mutate({ key: "top_banner", value: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Mid-Page Promotional Tagline</label>
                  <input
                    type="text"
                    defaultValue={content.promo_banner || "Free delivery on orders above ₹799 · Direct from Tamil Nadu"}
                    onBlur={(e) => saveContentMutation.mutate({ key: "promo_banner", value: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                  />
                </div>
              </div>

              {/* Story */}
              <div className="space-y-3 border-b border-[#DEDFD5] pb-5">
                <h4 className="font-serif text-sm font-bold text-[#123D28]">About TRINAYAA (Brand Heritage Story)</h4>
                <div>
                  <textarea
                    rows={4}
                    defaultValue={content.about_story || "TRINAYAA is dedicated to preserving ancient botanical wisdom from Tamil Nadu. We work directly with certified tribal gatherers and organic growers to provide authentic natural powders, raw seeds, and herbs."}
                    onBlur={(e) => saveContentMutation.mutate({ key: "about_story", value: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3 border-b border-[#DEDFD5] pb-5">
                <h4 className="font-serif text-sm font-bold text-[#123D28]">Store Contact Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Support Email</label>
                    <input
                      type="email"
                      defaultValue={content.contact_email || "support@trinayaa.in"}
                      onBlur={(e) => saveContentMutation.mutate({ key: "contact_email", value: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Customer Care Phone</label>
                    <input
                      type="text"
                      defaultValue={content.contact_phone || "+91 98765 43210"}
                      onBlur={(e) => saveContentMutation.mutate({ key: "contact_phone", value: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">WhatsApp Business</label>
                    <input
                      type="text"
                      defaultValue={content.contact_whatsapp || "+91 98765 43210"}
                      onBlur={(e) => saveContentMutation.mutate({ key: "contact_whatsapp", value: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Instagram URL</label>
                    <input
                      type="text"
                      defaultValue={content.social_instagram || "https://instagram.com/trinayaa_botanicals"}
                      onBlur={(e) => saveContentMutation.mutate({ key: "social_instagram", value: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                    />
                  </div>
                </div>
              </div>

              {/* Policies */}
              <div className="space-y-3">
                <h4 className="font-serif text-sm font-bold text-[#123D28]">Customer Policy Documents</h4>
                <div>
                  <label className="block text-xs font-semibold mb-1">Shipping & Delivery Policy</label>
                  <textarea
                    rows={2}
                    defaultValue={content.policy_shipping || "Orders dispatched within 24-48 hours. Express delivery across Tamil Nadu in 2-3 business days and Pan-India in 4-6 business days."}
                    onBlur={(e) => saveContentMutation.mutate({ key: "policy_shipping", value: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Returns & Refund Policy</label>
                  <textarea
                    rows={2}
                    defaultValue={content.policy_returns || "Due to the hygienic nature of botanical herbs and raw powders, returns are accepted within 7 days only for damaged or incorrect deliveries."}
                    onBlur={(e) => saveContentMutation.mutate({ key: "policy_returns", value: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 10. SETTINGS */}
          {/* ========================================== */}
          {activeTab === "settings" && (
            <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-6 rounded-xl shadow-xs space-y-4 max-w-xl">
              <h3 className="font-serif text-lg font-bold text-[#123D28]">Store Configuration Settings</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Store Currency</label>
                  <input
                    type="text"
                    disabled
                    value="INR (₹) · Indian Rupee"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-gray-100 text-[#6C7167]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Free Delivery Threshold (₹)</label>
                  <input
                    type="number"
                    defaultValue={799}
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Low-Stock Alert Trigger Threshold</label>
                  <input
                    type="number"
                    defaultValue={10}
                    disabled
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-gray-100 text-[#6C7167]"
                  />
                  <span className="text-[10px] text-[#6C7167]">Triggered whenever stock falls to 10 or below.</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 11. TELEGRAM BOT MANAGEMENT */}
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
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* 1. Order Detail Modal */}
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
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit / Add Product Modal */}
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
                const sellingPrice = parseFloat(form.sellingPrice.value);
                const mrp = parseFloat(form.mrp.value);

                if (mrp < sellingPrice) {
                  toast.error("MRP must be greater than or equal to Selling Price");
                  return;
                }

                const data = {
                  sku: form.sku.value.trim(),
                  nameEn: form.nameEn.value.trim(),
                  nameTa: form.nameTa.value.trim(),
                  category: form.category.value,
                  sellingPrice,
                  mrp,
                  stock: parseInt(form.stock.value, 10),
                  status: form.status.value,
                  shortDesc: form.shortDesc.value.trim(),
                  primaryImage: form.primaryImage.value.trim(),
                };

                if (editingProduct) {
                  updateProductMutation.mutate({ id: editingProduct.id, updates: data });
                } else {
                  createProductMutation.mutate(data);
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
                    defaultValue={editingProduct?.category || categories[0]?.name || "Herbs"}
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
                    step="0.01"
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
                    step="0.01"
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
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) {
                          toast.error("File exceeds 10MB limit");
                          return;
                        }
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

      {/* 3. Product Image Gallery Modal */}
      {galleryProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DEDFD5] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#AE6A2B]">Image Gallery</span>
                <h3 className="font-serif text-xl font-bold text-[#123D28]">{galleryProduct.nameEn} ({galleryProduct.sku})</h3>
              </div>
              <button onClick={() => setGalleryProduct(null)} className="text-[#6C7167] hover:text-[#123D28]">
                <X size={20} />
              </button>
            </div>

            {/* Existing Images */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {galleryImages.map((img: any) => (
                <div
                  key={img.id}
                  className={`border rounded-lg p-2 bg-white relative flex flex-col justify-between ${
                    img.isPrimary ? "border-[#123D28] ring-2 ring-[#123D28]/20" : "border-[#DEDFD5]"
                  }`}
                >
                  <div className="aspect-square bg-[#FBF8F0] rounded overflow-hidden mb-2 relative">
                    <img
                      src={img.url}
                      alt={img.altText || galleryProduct.nameEn}
                      className="w-full h-full object-contain"
                    />
                    {img.isPrimary ? (
                      <span className="absolute top-1 left-1 bg-[#123D28] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <input
                      type="text"
                      placeholder="Alt text..."
                      defaultValue={img.altText || ""}
                      onBlur={(e) => updateImageAltMutation.mutate({ imageId: img.id, altText: e.target.value })}
                      className="w-full text-[11px] px-1.5 py-0.5 border rounded bg-[#FBF8F0]"
                    />
                    <div className="flex items-center justify-between pt-1">
                      {!img.isPrimary ? (
                        <button
                          onClick={() => setPrimaryImageMutation.mutate({ imageId: img.id, productId: galleryProduct.id })}
                          className="text-[10px] font-bold text-[#123D28] hover:underline"
                        >
                          Set Cover
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#123D28] font-bold">Primary</span>
                      )}
                      <button
                        onClick={() => removeImageMutation.mutate({ productId: galleryProduct.id, imageId: img.id })}
                        className="text-[10px] text-red-600 hover:text-red-800 font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Image to Gallery */}
            <div className="pt-3 border-t border-[#DEDFD5]">
              <h4 className="font-serif text-sm font-bold text-[#123D28] mb-2">Upload Additional Gallery Image</h4>
              <label className="dark-button text-xs py-2 px-4 cursor-pointer inline-flex items-center gap-2">
                <Upload size={14} /> Upload Image (PNG, JPG, WebP)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error("File exceeds 10MB limit");
                      return;
                    }
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
                          addImageMutation.mutate({
                            productId: galleryProduct.id,
                            url: data.url,
                            altText: galleryProduct.nameEn,
                            isPrimary: galleryImages.length === 0,
                          });
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
        </div>
      )}

      {/* 4. Category Modal */}
      {(isAddingCategory || editingCategory) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DEDFD5] pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-[#123D28]">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : "Create New Category"}
              </h3>
              <button
                onClick={() => {
                  setIsAddingCategory(false);
                  setEditingCategory(null);
                }}
                className="text-[#6C7167] hover:text-[#123D28]"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e: any) => {
                e.preventDefault();
                const form = e.target;
                const name = form.name.value.trim();
                const tamilName = form.tamilName.value.trim();
                const slug = form.slug.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
                const description = form.description.value.trim();

                if (editingCategory) {
                  updateCategoryMutation.mutate({
                    id: editingCategory.id,
                    updates: {
                      name,
                      slug,
                      description,
                    },
                  });
                } else {
                  createCategoryMutation.mutate({
                    name,
                    slug,
                    description,
                  });
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold mb-1">Category Name (English)</label>
                <input
                  name="name"
                  required
                  defaultValue={editingCategory?.name || ""}
                  className="w-full px-3 py-2 border rounded bg-[#FBF8F0]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Category Name (Tamil)</label>
                <input
                  name="tamilName"
                  defaultValue={editingCategory?.tamilName || ""}
                  className="w-full px-3 py-2 border rounded bg-[#FBF8F0]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">URL Slug</label>
                <input
                  name="slug"
                  required
                  defaultValue={editingCategory?.slug || ""}
                  placeholder="e.g. wild-herbs"
                  className="w-full px-3 py-2 border rounded bg-[#FBF8F0]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingCategory?.description || ""}
                  className="w-full px-3 py-2 border rounded bg-[#FBF8F0]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setEditingCategory(null);
                  }}
                  className="px-3 py-1.5 border border-[#DEDFD5] rounded font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="dark-button py-1.5 px-4">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Inventory Adjust Dialog */}
      {inventoryAdjustProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DEDFD5] pb-3 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#AE6A2B]">Stock Adjustment</span>
                <h3 className="font-serif text-lg font-bold text-[#123D28]">
                  {inventoryAdjustProduct.nameEn} ({inventoryAdjustProduct.sku})
                </h3>
              </div>
              <button onClick={() => setInventoryAdjustProduct(null)} className="text-[#6C7167] hover:text-[#123D28]">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e: any) => {
                e.preventDefault();
                const form = e.target;
                const quantity = parseInt(form.quantity.value, 10);
                const changeType = form.changeType.value;
                const reason = form.reason.value.trim();
                const newStock =
                  changeType === "ADD"
                    ? inventoryAdjustProduct.stock + quantity
                    : changeType === "SUBTRACT"
                    ? Math.max(0, inventoryAdjustProduct.stock - quantity)
                    : quantity;

                inventoryStockMutation.mutate({
                  productId: inventoryAdjustProduct.id,
                  stock: newStock,
                  reason,
                });
              }}
              className="space-y-3 text-xs"
            >
              <div className="p-3 bg-[#FBF8F0] border border-[#DEDFD5] rounded-lg">
                <span className="text-[#6C7167]">Current On-Hand Stock: </span>
                <strong className="text-[#123D28] text-sm">{inventoryAdjustProduct.stock} units</strong>
              </div>

              <div>
                <label className="block font-semibold mb-1">Adjustment Action</label>
                <select name="changeType" defaultValue="SET" className="w-full px-3 py-2 border rounded bg-[#FBF8F0]">
                  <option value="SET">Set Absolute Stock Count</option>
                  <option value="ADD">Add / Restock Units</option>
                  <option value="SUBTRACT">Subtract / Shrinkage Units</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Quantity Value</label>
                <input
                  name="quantity"
                  type="number"
                  required
                  defaultValue={inventoryAdjustProduct.stock}
                  className="w-full px-3 py-2 border rounded bg-[#FBF8F0]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Reason for Adjustment (Required for Audit Trail)</label>
                <input
                  name="reason"
                  required
                  placeholder="e.g. Received fresh batch from Madurai / Damaged packet discarded"
                  className="w-full px-3 py-2 border rounded bg-[#FBF8F0]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInventoryAdjustProduct(null)}
                  className="px-3 py-1.5 border border-[#DEDFD5] rounded font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="dark-button py-1.5 px-4">
                  Confirm Stock Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Campaign Modal */}
      {isAddingCampaign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DEDFD5] pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-[#123D28]">Create Festival Offer Campaign</h3>
              <button onClick={() => setIsAddingCampaign(false)} className="text-[#6C7167] hover:text-[#123D28]">
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e: any) => {
                e.preventDefault();
                const form = e.target;
                createCampaignMutation.mutate({
                  name: form.name.value.trim(),
                  code: form.code.value.trim().toUpperCase(),
                  discountType: form.discountType.value,
                  discountValue: parseFloat(form.discountValue.value),
                  minOrderValue: parseFloat(form.minOrderValue.value || 0),
                  maxDiscount: parseFloat(form.maxDiscount.value || 500),
                  startDate: new Date(form.startDate.value).toISOString(),
                  endDate: new Date(form.endDate.value).toISOString(),
                  bannerText: form.bannerText.value.trim() || undefined,
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold mb-1">Campaign Name</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Pongal Harvest Festival Offer"
                  className="w-full px-3 py-2 border rounded bg-[#FBF8F0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Coupon Code</label>
                  <input
                    name="code"
                    required
                    placeholder="PONGAL20"
                    className="w-full px-3 py-2 border rounded bg-[#FBF8F0] uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Discount Type</label>
                  <select name="discountType" className="w-full px-3 py-2 border rounded bg-[#FBF8F0]">
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Cash (₹)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Discount Value</label>
                  <input
                    name="discountValue"
                    type="number"
                    required
                    defaultValue={15}
                    className="w-full px-3 py-2 border rounded bg-[#FBF8F0]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Min Order (₹)</label>
                  <input
                    name="minOrderValue"
                    type="number"
                    defaultValue={499}
                    className="w-full px-3 py-2 border rounded bg-[#FBF8F0]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Max Cap (₹)</label>
                  <input
                    name="maxDiscount"
                    type="number"
                    defaultValue={500}
                    className="w-full px-3 py-2 border rounded bg-[#FBF8F0]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Start Date</label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border rounded bg-[#FBF8F0]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">End Date</label>
                  <input
                    name="endDate"
                    type="date"
                    required
                    defaultValue={new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]}
                    className="w-full px-3 py-2 border rounded bg-[#FBF8F0]"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Applicable Category (Optional)</label>
                <select name="applicableCategory" className="w-full px-3 py-2 border rounded bg-[#FBF8F0]">
                  <option value="">All Categories</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Promotional Banner Text (Optional)</label>
                <input
                  name="bannerText"
                  placeholder="e.g. Use code PONGAL20 for 15% off herbal seeds"
                  className="w-full px-3 py-2 border rounded bg-[#FBF8F0]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCampaign(false)}
                  className="px-3 py-1.5 border border-[#DEDFD5] rounded font-semibold"
                >
                  Cancel
                </button>
                <button type="submit" className="dark-button py-1.5 px-4">
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
