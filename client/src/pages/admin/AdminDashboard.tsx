import BrandMark from "@/components/BrandMark";
import SupportHelpdeskTab from "./SupportHelpdeskTab";
import CustomerFeedbackTab from "./CustomerFeedbackTab";
import AiImageStudioTab from "./AiImageStudioTab";
import Customer360Tab from "./Customer360Tab";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  RotateCcw,
  Menu,
  ShieldCheck,
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
  Download,
  X,
  ArrowRight,
  Image as ImageIcon,
  Layers,
  FileText,
  Clock,
  Sparkles,
  Info,
  Eye,
  Printer,
  SlidersHorizontal,
  Building2,
  LifeBuoy,
  Star,
  Store,
  Wallet
} from "lucide-react";
import EnquiriesTab from "./EnquiriesTab";
import RewardsTab from "./RewardsTab";
import PolicyCmsTab from "./PolicyCmsTab";
import AdminUsersTab from "./AdminUsersTab";
import RetailOpsTab from "./RetailOpsTab";
import RetailFinanceTab from "./RetailFinanceTab";
import SubscriptionsAdminTab from "./SubscriptionsAdminTab";
import { Award, Repeat } from "lucide-react";

type AdminTab =
  | "overview"
  | "products"
  | "categories"
  | "inventory"
  | "orders"
  | "subscriptions"
  | "enquiries"
  | "helpdesk"
  | "feedback"
  | "customers"
  | "offers"
  | "import"
  | "rewards"
  | "policies"
  | "content"
  | "settings"
  | "admins"
  | "retail_ops"
  | "retail_finance"
  | "telegram"
  | "ai_image";

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Compute active tab from URL path
  const activeTab: AdminTab = useMemo(() => {
    if (location.startsWith("/admin/products")) return "products";
    if (location.startsWith("/admin/categories")) return "categories";
    if (location.startsWith("/admin/inventory")) return "inventory";
    if (location.startsWith("/admin/orders")) return "orders";
    if (location.startsWith("/admin/subscriptions")) return "subscriptions";
    if (location.startsWith("/admin/enquiries")) return "enquiries";
    if (location.startsWith("/admin/helpdesk")) return "helpdesk";
    if (location.startsWith("/admin/feedback")) return "feedback";
    if (location.startsWith("/admin/policies")) return "policies";
    if (location.startsWith("/admin/rewards")) return "rewards";
    if (location.startsWith("/admin/customers")) return "customers";
    if (location.startsWith("/admin/offers")) return "offers";
    if (location.startsWith("/admin/import")) return "import";
    if (location.startsWith("/admin/content")) return "content";
    if (location.startsWith("/admin/settings")) return "settings";
    if (location.startsWith("/admin/admins") || location.startsWith("/admin/users")) return "admins";
    if (location.startsWith("/admin/retail-finance") || location.startsWith("/admin/finance") || location.startsWith("/admin/retail_finance")) return "retail_finance";
    if (location.startsWith("/admin/retail") || location.startsWith("/admin/branches")) return "retail_ops";
    if (location.startsWith("/admin/telegram")) return "telegram";
    if (location.startsWith("/admin/ai_image") || location.startsWith("/admin/generate-image") || location.startsWith("/admin/ai-image")) return "ai_image";
    return "overview";
  }, [location]);

  const navigateToTab = (tab: AdminTab) => {
    if (tab === "overview") {
      setLocation("/admin/dashboard");
    } else if (tab === "retail_ops") {
      setLocation("/admin/retail");
    } else if (tab === "retail_finance") {
      setLocation("/admin/retail-finance");
    } else {
      setLocation(`/admin/${tab}`);
    }
  };

  // Authentication check
  const { data: currentUser, isLoading: userLoading } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      try {
        sessionStorage.removeItem("manus-cookie");
        sessionStorage.removeItem("trinayaa_session_token");
        localStorage.removeItem("trinayaa_session_token");
        localStorage.removeItem("manus-cookie");
      } catch (e) {}
      toast.success("Logged out successfully");
      window.location.href = "/admin/login";
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

  // Phase 6: Admin Returns & RMA State
  const [orderSubTab, setOrderSubTab] = useState<"orders" | "returns">("orders");
  const [returnSearch, setReturnSearch] = useState("");
  const [returnStatusFilter, setReturnStatusFilter] = useState("ALL");
  const { data: adminReturns = [], refetch: refetchAdminReturns } = trpc.admin.returns.list.useQuery(
    {
      search: returnSearch || undefined,
      status: returnStatusFilter === "ALL" ? undefined : returnStatusFilter,
      limit: 100,
    },
    { enabled: Boolean(currentUser && activeTab === "orders") }
  );

  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [returnActionModalOpen, setReturnActionModalOpen] = useState(false);
  const [actionStatus, setActionStatus] = useState("UNDER_REVIEW");
  const [actionNotes, setActionNotes] = useState("");
  const [actionDisposition, setActionDisposition] = useState<"NONE" | "RESTOCKED" | "DAMAGED_DISCARD" | "RETAINED_SAMPLE">("NONE");
  const [actionRestockQty, setActionRestockQty] = useState(0);
  const [actionRefundMethod, setActionRefundMethod] = useState("MANUAL_COD_RECORD");
  const [actionRefundRef, setActionRefundRef] = useState("");

  const updateReturnStatusMutation = trpc.admin.returns.updateStatus.useMutation({
    onSuccess: (res: any) => {
      toast.success(`Return ${res.returnNumber} updated to ${res.status}`);
      setReturnActionModalOpen(false);
      setSelectedReturn(null);
      refetchAdminReturns();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update return status");
    },
  });

  const { data: campaigns = [], refetch: refetchCampaigns } = trpc.admin.campaigns.list.useQuery(undefined, {
    enabled: Boolean(currentUser) }
  );

  const { data: content = {}, refetch: refetchContent } = trpc.content.getAll.useQuery(undefined, {
    enabled: Boolean(currentUser) }
  );

  const { data: telegramAdmins = [], refetch: refetchTelegramAdmins } = trpc.admin.telegram.getAdmins.useQuery(undefined, {
    enabled: Boolean(currentUser) }
  );

  const { data: stockRequests = [], refetch: refetchStockRequests } = trpc.admin.telegram.getStockRequests.useQuery(undefined, {
    enabled: Boolean(currentUser && activeTab === "telegram") }
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

  // Phase 5: Product COD and Store Settings Mutations
  const { data: storeSettings, refetch: refetchSettings } = trpc.admin.settings.getMinimumCod.useQuery(undefined, {
    enabled: Boolean(currentUser && activeTab === "settings"),
  });
  const [minCodValue, setMinCodValue] = useState("150");

  // Phase 6: Low Stock Threshold and Shipping Slip States
  const [shippingSlipOrderNumber, setShippingSlipOrderNumber] = useState<string | null>(null);
  const [productStockFilter, setProductStockFilter] = useState<"all" | "low_stock" | "out_of_stock" | "in_stock">("all");
  const { data: lowStockThresholdData, refetch: refetchLowStockThreshold } = trpc.admin.settings.getLowStockThreshold.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });
  const currentThreshold = lowStockThresholdData?.threshold ?? 10;
  const [thresholdInputVal, setThresholdInputVal] = useState("10");

  useEffect(() => {
    if (lowStockThresholdData?.threshold !== undefined) {
      setThresholdInputVal(String(lowStockThresholdData.threshold));
    }
  }, [lowStockThresholdData]);

  // Phase 7: Rewards Settings State
  const { data: rewardsSettingsData, refetch: refetchRewardsSettings } = trpc.admin.settings.getRewardsSettings.useQuery(undefined, {
    enabled: Boolean(currentUser && activeTab === "settings"),
  });
  const [feedbackPointsInput, setFeedbackPointsInput] = useState("50");
  const [thresholdPointsInput, setThresholdPointsInput] = useState("200");
  const [rewardsEnabledInput, setRewardsEnabledInput] = useState(true);

  useEffect(() => {
    if (rewardsSettingsData) {
      setFeedbackPointsInput(String(rewardsSettingsData.feedbackRewardPoints ?? 50));
      setThresholdPointsInput(String(rewardsSettingsData.freeProductRewardThreshold ?? 200));
      setRewardsEnabledInput(rewardsSettingsData.rewardsEnabled ?? true);
    }
  }, [rewardsSettingsData]);

  // Phase 8: Social Links State
  const { data: socialConfigData, refetch: refetchSocialConfig } = trpc.admin.social.getConfig.useQuery(undefined, {
    enabled: Boolean(currentUser && activeTab === "settings"),
  });
  const [instagramInput, setInstagramInput] = useState("");
  const [facebookInput, setFacebookInput] = useState("");
  const [whatsappPhoneInput, setWhatsappPhoneInput] = useState("");
  const [whatsappMsgInput, setWhatsappMsgInput] = useState("");

  useEffect(() => {
    if (socialConfigData) {
      setInstagramInput(socialConfigData.instagram || "");
      setFacebookInput(socialConfigData.facebook || "");
      setWhatsappPhoneInput(socialConfigData.whatsappPhone || "");
      setWhatsappMsgInput(socialConfigData.whatsappMessage || "");
    }
  }, [socialConfigData]);

  const updateSocialMutation = trpc.admin.social.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Social media and WhatsApp configuration saved!");
      refetchSocialConfig();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update social links");
    },
  });

  const setRewardsSettingsMutation = trpc.admin.settings.setRewardsSettings.useMutation({
    onSuccess: () => {
      toast.success("Rewards programme settings updated successfully");
      refetchRewardsSettings();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update rewards settings");
    },
  });

  const setLowStockThresholdMutation = trpc.admin.settings.setLowStockThreshold.useMutation({
    onSuccess: (res) => {
      toast.success(`Low-stock alert threshold updated to ${res.threshold} units`);
      refetchLowStockThreshold();
      refetchProducts();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update low-stock threshold");
    },
  });

  useEffect(() => {
    if (storeSettings?.minimumCodOrderValue !== undefined) {
      setMinCodValue(String(storeSettings.minimumCodOrderValue));
    }
  }, [storeSettings]);

  const setMinCodMutation = trpc.admin.settings.setMinimumCod.useMutation({
    onSuccess: (res) => {
      toast.success(`Minimum COD order value updated to ₹${res.minimumCodOrderValue}`);
      refetchSettings();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update minimum COD setting");
    },
  });

  const toggleCodMutation = trpc.admin.products.toggleCod.useMutation({
    onSuccess: (updated) => {
      toast.success(`COD for ${updated.nameEn} ${updated.isCodAvailable ? "enabled" : "disabled"}`);
      refetchProducts();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to toggle COD setting");
    },
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

  const refundOrderMutation = trpc.admin.orders.refund.useMutation({
    onSuccess: (data) => {
      toast.success(`Order ${data?.orderNumber} refunded and stock restored.`);
      refetchOrders();
      refetchStats();
      if (selectedOrder && data) {
        setSelectedOrder(data);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const utils = trpc.useUtils();
  const handleExportOrdersCsv = async () => {
    try {
      const csv = await utils.admin.orders.exportCsv.fetch();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `trinayaa_orders_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Orders exported to CSV");
    } catch (err: any) {
      toast.error("Failed to export orders: " + err.message);
    }
  };

  const saveContentMutation = trpc.admin.content.set.useMutation({
    onSuccess: () => {
      toast.success("Store content saved");
      refetchContent();
    },
    onError: (err) => toast.error(err.message),
  });

  const addTelegramAdminMutation = trpc.admin.telegram.addAdmin.useMutation({
    onSuccess: () => {
      toast.success("Telegram administrator authorized");
      refetchTelegramAdmins();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeTelegramAdminMutation = trpc.admin.telegram.removeAdmin.useMutation({
    onSuccess: () => {
      toast.success("Telegram administrator access revoked");
      refetchTelegramAdmins();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateTelegramRoleMutation = trpc.admin.telegram.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Administrator role updated");
      refetchTelegramAdmins();
    },
    onError: (err) => toast.error(err.message),
  });

  const approveStockRequestMutation = trpc.admin.telegram.approveStockRequest.useMutation({
    onSuccess: () => {
      toast.success("Stock maintenance request approved and inventory updated");
      refetchStockRequests();
      refetchProducts();
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectStockRequestMutation = trpc.admin.telegram.rejectStockRequest.useMutation({
    onSuccess: () => {
      toast.success("Stock request rejected");
      refetchStockRequests();
    },
    onError: (err) => toast.error(err.message),
  });

  // Filtered products for pagination (Phase 6: stock level filter support)
  const filteredProducts = useMemo(() => {
    return products.filter((p: any) => {
      if (productStockFilter === "low_stock") {
        return p.stock > 0 && p.stock <= currentThreshold;
      }
      if (productStockFilter === "out_of_stock") {
        return p.stock <= 0;
      }
      if (productStockFilter === "in_stock") {
        return p.stock > currentThreshold;
      }
      return true;
    });
  }, [products, productStockFilter, currentThreshold]);

  const pageSize = 15;
  const paginatedProducts = filteredProducts.slice(productPage * pageSize, (productPage + 1) * pageSize);
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;

  // Phase 10: Grouped navigation and context definition
  const navGroups = useMemo(() => [
    {
      groupTitle: "Overview",
      items: [
        { id: "overview" as AdminTab, label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      groupTitle: "Store Management",
      items: [
        { id: "products" as AdminTab, label: `Products (${products.length})`, icon: Package },
        { id: "categories" as AdminTab, label: "Categories", icon: FolderTree },
        { id: "inventory" as AdminTab, label: "Inventory & Stock", icon: Layers },
        { id: "orders" as AdminTab, label: "Orders", icon: ShoppingBag },
        { id: "subscriptions" as AdminTab, label: "Subscriptions", icon: Repeat },
        { id: "retail_finance" as AdminTab, label: "Branch Finance & Quotas", icon: Wallet, badge: "₹" },
        { id: "offers" as AdminTab, label: "Festival Offers", icon: Tag },
        { id: "import" as AdminTab, label: "Bulk Import / Export", icon: FileSpreadsheet },
      ],
    },
    {
      groupTitle: "Customer Management",
      items: [
        { id: "customers" as AdminTab, label: "Customer 360", icon: Users },
        { id: "enquiries" as AdminTab, label: "Bulk Enquiries (B2B)", icon: Building2 },
        { id: "helpdesk" as AdminTab, label: "Support Helpdesk", icon: LifeBuoy },
        { id: "feedback" as AdminTab, label: "Feedback & Reviews", icon: Star },
        { id: "rewards" as AdminTab, label: "Rewards & Loyalty", icon: Award },
      ],
    },
    {
      groupTitle: "Content & Settings",
      items: [
        { id: "policies" as AdminTab, label: "Website Policies CMS", icon: FileText },
        { id: "content" as AdminTab, label: "Store Content", icon: FileText },
        { id: "settings" as AdminTab, label: "Store Settings", icon: Settings },
        { id: "admins" as AdminTab, label: "Admin Users", icon: ShieldCheck },
      ],
    },
    {
      groupTitle: "Operations",
      items: [
        { id: "retail_ops" as AdminTab, label: "Retail & Branches", icon: Store, badge: "POS" },
        { id: "telegram" as AdminTab, label: "Telegram Bot", icon: Bot },
        { id: "ai_image" as AdminTab, label: "AI Product Studio", icon: Sparkles, badge: "AI" },
      ],
    },
  ], [products.length]);

  const tabContext = useMemo(() => {
    switch (activeTab) {
      case "overview":
        return { group: "Overview", title: "Dashboard Overview" };
      case "products":
        return { group: "Store Management", title: `Products Catalogue (${products.length})` };
      case "categories":
        return { group: "Store Management", title: "Product Categories" };
      case "inventory":
        return { group: "Store Management", title: "Inventory & Low-Stock Controls" };
      case "orders":
        return { group: "Store Management", title: "Customer Orders & Dispatch" };
      case "subscriptions":
        return { group: "Store Management", title: "Recurring Botanical Subscriptions" };
      case "retail_finance":
        return { group: "Store Management", title: "Branch Finance, Quotas & Cash Flow" };
      case "offers":
        return { group: "Store Management", title: "Festival Offers & Banners" };
      case "import":
        return { group: "Store Management", title: "Bulk Product Import / Export" };
      case "customers":
        return { group: "Customer Management", title: "Customer 360 Profiles" };
      case "enquiries":
        return { group: "Customer Management", title: "B2B Wholesale Enquiries" };
      case "helpdesk":
        return { group: "Customer Management", title: "Customer Support Helpdesk" };
      case "feedback":
        return { group: "Customer Management", title: "Product Reviews & Moderation" };
      case "rewards":
        return { group: "Customer Management", title: "Customer Rewards & Loyalty" };
      case "policies":
        return { group: "Content & Settings", title: "Website Policies CMS" };
      case "content":
        return { group: "Content & Settings", title: "Storefront Content" };
      case "settings":
        return { group: "Content & Settings", title: "Store Settings & Social Links" };
      case "admins":
        return { group: "Content & Settings", title: "Administrator Accounts & Staff Roles" };
      case "retail_ops":
        return { group: "Operations", title: "Retail Outlets & Branch Operations" };
      case "telegram":
        return { group: "Operations", title: "Telegram Administration Bot" };
      case "ai_image":
        return { group: "Operations", title: "AI Botanical Product Studio" };
      default:
        return { group: "Overview", title: "Admin Console" };
    }
  }, [activeTab, products.length]);

  // Redirect if not logged in as Admin
  if (!userLoading && (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN"))) {
    if (currentUser?.role === "RETAIL_SHOP_HANDLER") {
      setLocation("/retail");
      return null;
    }
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] bg-[#123D28] text-white flex flex-col justify-between shadow-2xl z-10 overflow-y-auto overflow-x-hidden">
            <div>
              <div className="p-3.5 border-b border-slate-200/90 bg-white flex items-center justify-between gap-2 shrink-0">
                <a
                  href="/admin/dashboard"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    navigateToTab("overview");
                  }}
                  className="flex items-center justify-center flex-1 hover:opacity-90 transition-opacity"
                  title="TRINAYAA Admin Console"
                >
                  <BrandMark compact={true} />
                </a>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                  aria-label="Close navigation"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grouped Mobile Navigation */}
              <nav className="p-3 space-y-4 text-xs">
                {navGroups.map((group) => (
                  <div key={group.groupTitle} className="space-y-1">
                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-[#E5C378]/90">
                      {group.groupTitle}
                    </div>
                    {group.items.map(({ id, label, icon: Icon, badge }) => (
                      <button
                        key={id}
                        onClick={() => {
                          navigateToTab(id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all relative outline-hidden focus-visible:ring-2 focus-visible:ring-[#E5C378] ${
                          activeTab === id
                            ? "bg-white/15 text-white font-bold shadow-xs border-l-4 border-[#E5C378]"
                            : "text-[#DFE7D7] hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon
                          size={17}
                          className={`shrink-0 transition-colors ${
                            activeTab === id ? "text-[#E5C378]" : "text-white/80"
                          }`}
                        />
                        <span className="truncate">{label}</span>
                        {badge && (
                          <span className="ml-auto text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#AE6A2B] text-white font-extrabold shadow-xs">
                            {badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
            </div>

            {/* Mobile Admin Profile / Logout */}
            <div className="p-4 border-t border-slate-200/90 bg-white text-xs shrink-0 shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#123D28] text-[#FFFDF8] flex items-center justify-center font-bold text-sm shadow-xs shrink-0 border border-[#1B5237]/30">
                  {currentUser?.name?.[0]?.toUpperCase() || "A"}
                </div>
                <div className="overflow-hidden min-w-0 flex-1">
                  <div className="truncate font-bold text-slate-800 text-[13px]">{currentUser?.name || "Administrator"}</div>
                  <div className="truncate text-[11px] text-slate-500 font-medium">{currentUser?.email}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logoutMutation.mutate();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-lg transition-colors font-semibold border border-red-200 text-xs shadow-2xs"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside className="w-72 bg-[#123D28] text-white flex flex-col justify-between shrink-0 hidden md:flex border-r border-[#1B5237] h-screen sticky top-0 z-10 overflow-hidden select-none">
        {/* Sidebar Brand Header */}
        <div className="py-3.5 px-4 border-b border-slate-200/90 bg-white flex items-center justify-between gap-2 shrink-0">
          <a
            href="/admin/dashboard"
            onClick={(e) => {
              e.preventDefault();
              navigateToTab("overview");
            }}
            className="flex items-center justify-center flex-1 hover:opacity-90 transition-opacity"
            title="TRINAYAA Admin Console"
          >
            <BrandMark compact={true} />
          </a>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="View Customer Storefront"
            className="text-slate-500 hover:text-[#123D28] p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          >
            <ExternalLink size={16} />
          </a>
        </div>

        {/* Grouped Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 text-xs font-medium [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-track]:bg-transparent">
          {navGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-[#E5C378]/90">
                {group.groupTitle}
              </div>
              {group.items.map(({ id, label, icon: Icon, badge }) => (
                <button
                  key={id}
                  onClick={() => navigateToTab(id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all relative outline-hidden focus-visible:ring-2 focus-visible:ring-[#E5C378] ${
                    activeTab === id
                      ? "bg-white/15 text-white font-bold shadow-xs border-l-4 border-[#E5C378]"
                      : "text-[#DFE7D7] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon
                    size={17}
                    className={`shrink-0 transition-colors ${
                      activeTab === id ? "text-[#E5C378]" : "text-white/80"
                    }`}
                  />
                  <span className="truncate">{label}</span>
                  {badge && (
                    <span className="ml-auto text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#AE6A2B] text-white font-extrabold shadow-xs">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar Admin Profile / Logout Footer */}
        <div className="p-4 border-t border-slate-200/90 bg-white text-xs shrink-0 shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#123D28] text-[#FFFDF8] flex items-center justify-center font-bold text-sm shadow-xs shrink-0 border border-[#1B5237]/30">
              {currentUser?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="overflow-hidden min-w-0 flex-1">
              <div className="truncate font-bold text-slate-800 text-[13px]">{currentUser?.name || "Administrator"}</div>
              <div className="truncate text-[11px] text-slate-500 font-medium">{currentUser?.email}</div>
            </div>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 rounded-lg transition-colors font-semibold border border-red-200 text-xs shadow-2xs"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 md:hidden transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                  {tabContext.group}
                </span>
                <span className="text-slate-300">/</span>
                <h1 className="font-serif text-lg sm:text-xl font-bold text-[#123D28] tracking-tight">
                  {tabContext.title}
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block mt-0.5">
                TRINAYAA Botanical Ecommerce Management System · Erode Dispatch HQ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => {
                refetchStats();
                refetchProducts();
                refetchOrders();
                refetchCategories();
                refetchInventory();
                toast.success("Refreshed live data");
              }}
              className="p-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-[#123D28] transition-colors"
              title="Refresh Live Data"
            >
              <RefreshCw size={15} />
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#123D28] hover:bg-[#1F5638] text-white font-bold text-xs py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl shadow-xs transition-all border border-[#123D28]"
              title="Open Customer Storefront"
            >
              <span className="text-white font-bold tracking-wide hidden sm:inline">Customer Storefront</span>
              <span className="sm:hidden text-white font-bold">Store</span>
              <ExternalLink size={13} className="text-[#E5C378]" />
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
                <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold">
                    <span>Total Products</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#123D28] flex items-center justify-center">
                      <Package size={16} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight text-slate-900">{stats.totalProducts}</div>
                  <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700">{stats.activeProducts} published</span>
                    <span>· {stats.draftProducts} drafts</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold">
                    <span>Verified Revenue</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight text-slate-900">
                    ₹{stats.totalRevenue.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-slate-500 mt-2">From verified gateway payments</div>
                </div>

                <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold">
                    <span>Total Orders</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                      <ShoppingBag size={16} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight text-slate-900">{stats.totalOrders}</div>
                  <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700">{stats.pendingOrders} pending</span>
                    <span>· {stats.completedOrders} completed</span>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-slate-500 mb-2 text-xs font-semibold">
                    <span>Low Stock Alerts</span>
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                      <AlertTriangle size={16} />
                    </div>
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight text-rose-700">{stats.lowStockProducts}</div>
                  <div className="text-xs text-slate-500 mt-2">Items with stock &lt; 10 units</div>
                </div>
              </div>

              {/* Secondary Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
                  <div className="text-slate-500 text-xs font-semibold mb-1">Botanical Categories</div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalCategories}</div>
                  <div className="text-xs text-slate-500 mt-1">Tamil & English taxonomies</div>
                </div>
                <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
                  <div className="text-slate-500 text-xs font-semibold mb-1">Registered Customers</div>
                  <div className="text-2xl font-bold text-slate-900">{stats.totalCustomers}</div>
                  <div className="text-xs text-slate-500 mt-1">Verified phone & email accounts</div>
                </div>
                <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-xs">
                  <div className="text-slate-500 text-xs font-semibold mb-1">Active Festival Campaigns</div>
                  <div className="text-2xl font-bold text-slate-900">{stats.activeCampaigns}</div>
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {stats.activePromotionSummary?.[0]?.name || "No campaign active"}
                  </div>
                </div>
              </div>

              {/* Low Stock Alerts & Recently Updated Products */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Low Stock Card */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
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
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
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
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
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

                  <select
                    value={productStockFilter}
                    onChange={(e) => {
                      setProductStockFilter(e.target.value as any);
                      setProductPage(0);
                    }}
                    className="text-xs py-2 px-3 bg-[#FBF8F0] border border-[#DEDFD5] rounded-md focus:outline-none focus:border-[#123D28] font-medium"
                  >
                    <option value="all">All Stock Levels</option>
                    <option value="low_stock">⚠️ Low Stock (≤ {currentThreshold})</option>
                    <option value="out_of_stock">❌ Out of Stock (0)</option>
                    <option value="in_stock">✅ In Stock (&gt; {currentThreshold})</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsAddingProduct(true);
                    }}
                    className="dark-button text-xs py-2 px-4"
                  >
                    <Plus size={15} /> Add New Product
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
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
                        <th className="py-3 px-3 text-center">COD</th>
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
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                defaultValue={p.stock}
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val) && val !== p.stock) {
                                    updateStockMutation.mutate({ id: p.id, stock: val });
                                  }
                                }}
                                className={`w-14 px-1.5 py-1 text-xs border rounded font-bold ${
                                  p.stock <= 0
                                    ? "border-red-400 bg-red-50 text-red-800"
                                    : p.stock <= currentThreshold
                                    ? "border-amber-400 bg-amber-50 text-amber-800"
                                    : "border-[#DEDFD5] bg-white"
                                }`}
                              />
                              {p.stock <= 0 ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 shrink-0">
                                  Out of Stock
                                </span>
                              ) : p.stock <= currentThreshold ? (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                                  ⚠️ Low
                                </span>
                              ) : (
                                <span className="px-1 py-0.5 rounded text-[10px] font-medium text-emerald-700 shrink-0">
                                  In Stock
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                toggleCodMutation.mutate({
                                  id: p.id,
                                  isCodAvailable: !p.isCodAvailable,
                                });
                              }}
                              disabled={toggleCodMutation.isPending}
                              title={p.isCodAvailable ? "Click to disable COD for this product" : "Click to enable COD for this product"}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                                p.isCodAvailable
                                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              }`}
                            >
                              {p.isCodAvailable ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                              {p.isCodAvailable ? "COD ON" : "COD OFF"}
                            </button>
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
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
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
                              type="button"
                              onClick={() => setInventoryAdjustProduct(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#123D28] hover:bg-[#1F5638] text-white rounded-lg text-xs font-semibold shadow-xs transition-all duration-150 hover:shadow-sm active:scale-95 cursor-pointer border border-[#0d2a1c]"
                              style={{ backgroundColor: "#123D28", color: "#ffffff", display: "inline-flex", alignItems: "center" }}
                            >
                              <SlidersHorizontal size={13} className="text-emerald-300" />
                              <span>Update Stock</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Log Section */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
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
          {/* 5. ORDERS MANAGEMENT (Phase 6: Orders & Returns) */}
          {/* ========================================== */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {/* Phase 6 Sub-Tab Bar: Orders vs Returns */}
              <div className="flex items-center gap-2 border-b border-[#DEDFD5] pb-2">
                <button
                  type="button"
                  onClick={() => setOrderSubTab("orders")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    orderSubTab === "orders"
                      ? "bg-[#123D28] text-white shadow-2xs"
                      : "bg-[#FBF8F0] text-[#6C7167] hover:text-[#123D28] border border-[#DEDFD5]"
                  }`}
                >
                  <ShoppingBag size={13} />
                  <span>Online Orders ({orders.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderSubTab("returns")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    orderSubTab === "returns"
                      ? "bg-[#123D28] text-white shadow-2xs"
                      : "bg-[#FBF8F0] text-[#6C7167] hover:text-[#123D28] border border-[#DEDFD5]"
                  }`}
                >
                  <RotateCcw size={13} />
                  <span>Customer Returns & RMAs ({adminReturns.length})</span>
                </button>
              </div>

              {orderSubTab === "returns" ? (
                /* Phase 6: Returns Management View */
                <div className="space-y-4">
                  <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-4 rounded-xl flex flex-wrap items-center gap-3 shadow-xs">
                    <div className="relative flex-1 min-w-[240px]">
                      <Search className="absolute left-3 top-2.5 text-[#6C7167]" size={15} />
                      <input
                        type="text"
                        placeholder="Search by RMA #, order #, customer, or product..."
                        value={returnSearch}
                        onChange={(e) => setReturnSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-[#FBF8F0] border border-[#DEDFD5] rounded-md focus:outline-none focus:border-[#123D28]"
                      />
                    </div>
                    <select
                      value={returnStatusFilter}
                      onChange={(e) => setReturnStatusFilter(e.target.value)}
                      className="text-xs py-2 px-3 bg-[#FBF8F0] border border-[#DEDFD5] rounded-md focus:outline-none focus:border-[#123D28]"
                    >
                      <option value="ALL">All Return Statuses ({adminReturns.length})</option>
                      <option value="REQUESTED">REQUESTED</option>
                      <option value="UNDER_REVIEW">UNDER REVIEW</option>
                      <option value="APPROVED">APPROVED</option>
                      <option value="REJECTED">REJECTED</option>
                      <option value="PICKUP_SCHEDULED">PICKUP SCHEDULED</option>
                      <option value="ITEM_RECEIVED">ITEM RECEIVED</option>
                      <option value="INSPECTED">INSPECTED</option>
                      <option value="REFUND_PENDING">REFUND PENDING</option>
                      <option value="REFUNDED">REFUNDED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#FBF8F0] border-b border-[#DEDFD5] text-[#6C7167] font-semibold">
                          <tr>
                            <th className="py-3 px-3">RMA Number</th>
                            <th className="py-3 px-3">Order #</th>
                            <th className="py-3 px-3">Customer</th>
                            <th className="py-3 px-3">Product & Pack</th>
                            <th className="py-3 px-3">Qty</th>
                            <th className="py-3 px-3">Refund Amt</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3">Disposition</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DEDFD5]">
                          {adminReturns.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="py-8 text-center text-[#6C7167] italic">
                                No return requests found.
                              </td>
                            </tr>
                          ) : (
                            adminReturns.map((ret: any) => {
                              const getStatusBadge = (st: string) => {
                                switch (st) {
                                  case "REQUESTED": return "bg-amber-100 text-amber-800";
                                  case "UNDER_REVIEW": return "bg-blue-100 text-blue-800";
                                  case "APPROVED": return "bg-purple-100 text-purple-800";
                                  case "REJECTED": return "bg-red-100 text-red-800";
                                  case "PICKUP_SCHEDULED": return "bg-indigo-100 text-indigo-800";
                                  case "ITEM_RECEIVED": return "bg-cyan-100 text-cyan-800";
                                  case "INSPECTED": return "bg-teal-100 text-teal-800";
                                  case "REFUND_PENDING": return "bg-yellow-100 text-yellow-800";
                                  case "REFUNDED": return "bg-emerald-100 text-emerald-800 font-bold";
                                  case "CLOSED": return "bg-gray-100 text-gray-800";
                                  default: return "bg-slate-100 text-slate-800";
                                }
                              };

                              return (
                                <tr key={ret.id} className="hover:bg-[#FBF8F0]/40">
                                  <td className="py-3 px-3 font-mono font-bold text-[#123D28]">{ret.returnNumber}</td>
                                  <td className="py-3 px-3 font-mono text-[#6C7167]">{ret.orderNumber}</td>
                                  <td className="py-3 px-3">
                                    <div className="font-semibold text-[#123D28]">{ret.customerName}</div>
                                    <div className="text-[10px] text-[#6C7167]">{ret.customerPhone}</div>
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="font-medium text-[#123D28]">{ret.productName}</span>
                                    <span className="text-[10px] text-[#6C7167] block">{ret.packSize}</span>
                                  </td>
                                  <td className="py-3 px-3 font-bold">{ret.quantityRequested}</td>
                                  <td className="py-3 px-3 font-bold text-[#123D28]">₹{ret.refundAmount}</td>
                                  <td className="py-3 px-3">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(ret.status)}`}>
                                      {ret.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className="text-[11px] font-mono font-semibold text-gray-700">
                                      {ret.stockDisposition || "NONE"}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedReturn(ret);
                                        setActionStatus(ret.status);
                                        setActionDisposition(ret.stockDisposition || "NONE");
                                        setActionRestockQty(ret.restockedQuantity || ret.quantityRequested);
                                        setActionRefundMethod(ret.refundMethod || "MANUAL_COD_RECORD");
                                        setActionRefundRef(ret.refundReference || "");
                                        setActionNotes(ret.adminNotes || "");
                                        setReturnActionModalOpen(true);
                                      }}
                                      className="py-1 px-2.5 bg-[#FAF8F2] hover:bg-[#EFECE4] border border-[#DEDFD5] text-[#123D28] font-semibold rounded-lg text-xs cursor-pointer shadow-2xs"
                                    >
                                      Review & Action
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
              ) : (
                /* Online Orders View */
                <>
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
                  <option value="Refunded">Refunded</option>
                </select>
                <button
                  onClick={handleExportOrdersCsv}
                  className="px-3 py-2 bg-[#FBF8F0] border border-[#DEDFD5] text-[#123D28] rounded-md text-xs font-semibold hover:bg-[#DEDFD5]/50 flex items-center gap-1.5 shrink-0"
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
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
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setShippingSlipOrderNumber(o.orderNumber)}
                                title="Order Fulfilment Documents & Print Studio (Slip, Invoice, Challan, Sticker)"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FBF8F0] hover:bg-[#E8BF83]/30 text-[#123D28] border border-[#DEDFD5] rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                              >
                                <Printer size={13} className="text-[#AE6A2B]" />
                                <span>Docs</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(o)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#123D28] hover:bg-[#1F5638] text-white rounded-lg text-xs font-semibold shadow-xs transition-all duration-150 hover:shadow-sm active:scale-95 cursor-pointer border border-[#0d2a1c]"
                                style={{ backgroundColor: "#123D28", color: "#ffffff", display: "inline-flex", alignItems: "center" }}
                              >
                                <Eye size={13} className="text-emerald-300" />
                                <span>View</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
                </>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* 6. CUSTOMERS (PHASE 4: CUSTOMER 360) */}
          {/* ========================================== */}
          {activeTab === "customers" && <Customer360Tab />}

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
                          type="button"
                          onClick={() => toggleCampaignMutation.mutate({ id: camp.id, isActive: !camp.isActive })}
                          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 shadow-xs active:scale-95 cursor-pointer border ${
                            camp.isActive
                              ? "bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-800"
                              : "bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300"
                          }`}
                          style={{
                            backgroundColor: camp.isActive ? "#047857" : "#e2e8f0",
                            color: camp.isActive ? "#ffffff" : "#334155",
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              camp.isActive ? "bg-emerald-300 animate-pulse" : "bg-slate-400"
                            }`}
                          />
                          <span>{camp.isActive ? "ACTIVE" : "DISABLED"}</span>
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

                <div className="p-3 bg-[#FBF8F0] border border-[#DEDFD5] rounded space-y-2">
                  <label className="block font-semibold text-[#123D28]">Minimum Cash on Delivery (COD) Order Value (₹)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={minCodValue}
                      onChange={(e) => setMinCodValue(e.target.value)}
                      placeholder="150"
                      className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-white font-bold text-[#123D28]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseFloat(minCodValue);
                        if (isNaN(val) || val < 0) {
                          toast.error("Please enter a valid non-negative number.");
                          return;
                        }
                        setMinCodMutation.mutate({ minimumCodOrderValue: val });
                      }}
                      disabled={setMinCodMutation.isPending}
                      className="dark-button text-xs py-2 px-4 shrink-0"
                    >
                      {setMinCodMutation.isPending ? "Saving..." : "Save Setting"}
                    </button>
                  </div>
                  <span className="text-[10px] text-[#6C7167] block">
                    Orders with merchandise value below this threshold will not be eligible for Cash on Delivery. (Default: ₹150).
                  </span>
                </div>
                <div className="p-3 bg-[#FBF8F0] border border-[#DEDFD5] rounded space-y-2">
                  <label className="block font-semibold text-[#123D28]">Low-Stock Telegram Alert Threshold (Units)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={thresholdInputVal}
                      onChange={(e) => setThresholdInputVal(e.target.value)}
                      placeholder="10"
                      className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-white font-bold text-[#123D28]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseInt(thresholdInputVal, 10);
                        if (isNaN(val) || val < 0) {
                          toast.error("Please enter a valid non-negative integer for stock threshold.");
                          return;
                        }
                        setLowStockThresholdMutation.mutate({ threshold: val });
                      }}
                      disabled={setLowStockThresholdMutation.isPending}
                      className="dark-button text-xs py-2 px-4 shrink-0"
                    >
                      {setLowStockThresholdMutation.isPending ? "Saving..." : "Save Setting"}
                    </button>
                  </div>
                  <span className="text-[10px] text-[#6C7167] block">
                    Automated Telegram notification is sent to authorized administrators whenever a product's available stock drops to or below this count (Default: 10 units).
                  </span>
                </div>

                <div className="p-4 bg-[#FBF8F0] border border-[#DEDFD5] rounded space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-semibold text-[#123D28]">Customer Rewards & Loyalty Programme</label>
                      <span className="text-[10px] text-[#6C7167]">Configure point awards for customer feedback and threshold for free product redemptions.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rewardsEnabledInput}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setRewardsEnabledInput(val);
                          setRewardsSettingsMutation.mutate({ rewardsEnabled: val });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#123D28]"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block font-semibold text-[11px] mb-1">Feedback Points per Approved Review</label>
                      <input
                        type="number"
                        min="0"
                        value={feedbackPointsInput}
                        onChange={(e) => setFeedbackPointsInput(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#DEDFD5] rounded bg-white text-xs font-bold text-[#123D28]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[11px] mb-1">Free Product Points Threshold</label>
                      <input
                        type="number"
                        min="1"
                        value={thresholdPointsInput}
                        onChange={(e) => setThresholdPointsInput(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#DEDFD5] rounded bg-white text-xs font-bold text-[#123D28]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const fb = parseInt(feedbackPointsInput, 10);
                      const th = parseInt(thresholdPointsInput, 10);
                      if (isNaN(fb) || fb < 0) {
                        toast.error("Feedback points must be a non-negative integer.");
                        return;
                      }
                      if (isNaN(th) || th <= 0) {
                        toast.error("Free product threshold must be at least 1 point.");
                        return;
                      }
                      setRewardsSettingsMutation.mutate({
                        rewardsEnabled: rewardsEnabledInput,
                        feedbackRewardPoints: fb,
                        freeProductRewardThreshold: th,
                      });
                    }}
                    disabled={setRewardsSettingsMutation.isPending}
                    className="dark-button text-xs py-1.5 px-4"
                  >
                    {setRewardsSettingsMutation.isPending ? "Saving..." : "Save Rewards Configuration"}
                  </button>
                </div>

                {/* Phase 8: Social Links & WhatsApp Configuration */}
                <div className="p-4 bg-[#FBF8F0] border border-[#DEDFD5] rounded space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-semibold text-[#123D28]">Social Media &amp; WhatsApp Links</label>
                      <span className="text-[10px] text-[#6C7167]">
                        Manage public storefront footer social links (Instagram, Facebook, and WhatsApp).
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Instagram URL</label>
                      <input
                        type="url"
                        value={instagramInput}
                        onChange={(e) => setInstagramInput(e.target.value)}
                        placeholder="https://www.instagram.com/trinayaa_botanicals"
                        className="w-full px-3 py-1.5 border border-[#DEDFD5] rounded bg-white text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Facebook URL</label>
                      <input
                        type="url"
                        value={facebookInput}
                        onChange={(e) => setFacebookInput(e.target.value)}
                        placeholder="https://www.facebook.com/trinayaa.enterprises"
                        className="w-full px-3 py-1.5 border border-[#DEDFD5] rounded bg-white text-xs font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">WhatsApp Business Phone</label>
                        <input
                          type="text"
                          value={whatsappPhoneInput}
                          onChange={(e) => setWhatsappPhoneInput(e.target.value)}
                          placeholder="+91 94422 18990"
                          className="w-full px-3 py-1.5 border border-[#DEDFD5] rounded bg-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Default Pre-filled Chat Message</label>
                        <input
                          type="text"
                          value={whatsappMsgInput}
                          onChange={(e) => setWhatsappMsgInput(e.target.value)}
                          placeholder="Hello TRINAYAA, I would like to inquire about..."
                          className="w-full px-3 py-1.5 border border-[#DEDFD5] rounded bg-white text-xs"
                        />
                      </div>
                    </div>

                    {socialConfigData?.whatsappUrl && (
                      <div className="p-2.5 bg-white rounded border border-[#EFECE4] text-[11px] font-mono text-[#123D28] flex items-center justify-between gap-2 overflow-hidden">
                        <span className="truncate">Live WhatsApp Link: {socialConfigData.whatsappUrl}</span>
                        <a
                          href={socialConfigData.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#AE6A2B] hover:underline font-bold shrink-0 flex items-center gap-1"
                        >
                          <span>Test</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        updateSocialMutation.mutate({
                          instagram: instagramInput.trim() || undefined,
                          facebook: facebookInput.trim() || undefined,
                          whatsappPhone: whatsappPhoneInput.trim() || undefined,
                          whatsappMessage: whatsappMsgInput.trim() || undefined,
                        });
                      }}
                      disabled={updateSocialMutation.isPending}
                      className="dark-button text-xs py-1.5 px-4"
                    >
                      {updateSocialMutation.isPending ? "Saving..." : "Save Social Links"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* ========================================== */}
          {/* 12. AI PRODUCT STUDIO (HUGGING FACE & FLUX) */}
          {/* ========================================== */}
          {activeTab === "ai_image" && <AiImageStudioTab />}

          {/* ========================================== */}
          {/* 11. TELEGRAM BOT MANAGEMENT */}
          {/* ========================================== */}
          {activeTab === "enquiries" && <EnquiriesTab />}
          {activeTab === "helpdesk" && <SupportHelpdeskTab />}
          {activeTab === "feedback" && <CustomerFeedbackTab />}
          {activeTab === "rewards" && <RewardsTab />}
          {activeTab === "policies" && <PolicyCmsTab />}
          {activeTab === "admins" && <AdminUsersTab />}
          {activeTab === "retail_ops" && <RetailOpsTab />}
          {activeTab === "retail_finance" && <RetailFinanceTab />}
          {activeTab === "subscriptions" && <SubscriptionsAdminTab />}

          {/* ========================================== */}
          {activeTab === "telegram" && (
            <div className="space-y-6">
              {/* Telegram Administrator Allowlist Card */}
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-5 rounded-xl shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#123D28] flex items-center gap-2">
                      <Bot size={20} className="text-[#123D28]" /> Telegram Administrator Allowlist
                    </h3>
                    <p className="text-xs text-[#6C7167]">
                      Only authorized Telegram user IDs listed below can interact with the TRINAYAA bot. Founder/Super Admin has full control; Stock Managers submit requests requiring approval.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      refetchTelegramAdmins();
                      refetchStockRequests();
                      toast.info("Refreshed Telegram allowlist and requests");
                    }}
                    className="inline-flex items-center gap-1 text-xs text-[#6C7167] hover:text-[#123D28] border border-[#DEDFD5] rounded-lg px-2.5 py-1.5 bg-white shadow-2xs self-start sm:self-auto"
                  >
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {telegramAdmins.map((adm: any) => (
                    <div
                      key={adm.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-[#DEDFD5] rounded-md bg-[#FBF8F0]/40 text-xs gap-3"
                    >
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-mono font-bold text-[#123D28]">ID: {adm.telegramId}</span>
                        <span className="font-semibold text-slate-800">{adm.name}</span>
                        {adm.role === "SUPER_ADMIN" ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                            SUPER ADMIN (FOUNDER)
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                            STOCK MANAGER
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={adm.role || "SUPER_ADMIN"}
                          disabled={updateTelegramRoleMutation.isPending}
                          onChange={(e) => updateTelegramRoleMutation.mutate({ telegramId: adm.telegramId, role: e.target.value as any })}
                          className="text-xs px-2.5 py-1 border border-[#DEDFD5] rounded bg-white text-[#123D28] font-medium"
                          title="Change Administrator Role"
                        >
                          <option value="SUPER_ADMIN">Super Admin (Founder)</option>
                          <option value="STOCK_MANAGER">Stock Manager (Warehouse)</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeTelegramAdminMutation.mutate({ telegramId: adm.telegramId })}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-red-200 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white text-xs font-semibold transition-all duration-150 shadow-2xs active:scale-95 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>Revoke</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e: any) => {
                    e.preventDefault();
                    const form = e.target;
                    const telegramId = form.telegramId.value.trim();
                    const name = form.name.value.trim();
                    const role = form.role.value;
                    if (telegramId && name) {
                      addTelegramAdminMutation.mutate({ telegramId, name, role });
                      form.reset();
                    }
                  }}
                  className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#DEDFD5]"
                >
                  <input
                    name="telegramId"
                    required
                    placeholder="Telegram User ID (e.g. 1979530961)"
                    className="text-xs px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0] flex-1 min-w-[160px]"
                  />
                  <input
                    name="name"
                    required
                    placeholder="Admin Name / Username"
                    className="text-xs px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0] flex-1 min-w-[160px]"
                  />
                  <select
                    name="role"
                    defaultValue="STOCK_MANAGER"
                    className="text-xs px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0] font-medium text-[#123D28]"
                  >
                    <option value="STOCK_MANAGER">Stock Manager (Warehouse Staff)</option>
                    <option value="SUPER_ADMIN">Super Admin (Founder / Executive)</option>
                  </select>
                  <button type="submit" className="dark-button text-xs py-2 px-4 shrink-0">
                    <Plus size={14} /> Authorize Admin
                  </button>
                </form>
              </div>

              {/* Stock Maintenance Requests & Warehouse Dispatches */}
              <div className="bg-[#FFFDF8] border border-[#DEDFD5] p-5 rounded-xl shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#123D28] flex items-center gap-2">
                      <Layers size={20} className="text-[#AE6A2B]" /> Recent Stock Maintenance Requests
                    </h3>
                    <p className="text-xs text-[#6C7167]">
                      Stock adjustments requested by warehouse Stock Managers via Telegram (/requeststock or physical warehouse photos) requiring founder approval.
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-[#FBF8F0] border border-[#DEDFD5] rounded text-[#123D28] self-start sm:self-auto">
                    {stockRequests.length} Total Requests
                  </span>
                </div>

                {stockRequests.length === 0 ? (
                  <div className="p-8 text-center bg-[#FBF8F0]/60 rounded-xl border border-dashed border-[#DEDFD5]">
                    <Layers size={32} className="mx-auto text-[#6C7167]/50 mb-2" />
                    <p className="text-sm font-semibold text-[#123D28]">No stock maintenance requests yet</p>
                    <p className="text-xs text-[#6C7167] mt-1 max-w-md mx-auto">
                      Warehouse Stock Managers can send stock adjustment requests via Telegram bot using <code className="bg-slate-200/80 px-1 py-0.5 rounded text-[11px]">/requeststock SKU +/-Qty [Notes]</code> or by uploading warehouse stock photos with SKU caption.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stockRequests.map((req: any) => {
                      const isPending = req.status === "PENDING";
                      const isApproved = req.status === "APPROVED";
                      const isRejected = req.status === "REJECTED";
                      const isPositive = req.quantityChange > 0;

                      return (
                        <div
                          key={req.id}
                          className={`p-4 border rounded-xl text-xs space-y-3 transition-colors ${
                            isPending
                              ? "bg-amber-50/40 border-amber-200"
                              : isApproved
                              ? "bg-emerald-50/20 border-emerald-200"
                              : "bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#DEDFD5]/60">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#123D28]">{req.requestNumber}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isPending
                                    ? "bg-amber-200 text-amber-900 border border-amber-300 animate-pulse"
                                    : isApproved
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    : "bg-rose-100 text-rose-800 border border-rose-300"
                                }`}
                              >
                                {req.status}
                              </span>
                              {req.photoFileId && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-200 px-1.5 py-0.2 rounded font-medium">
                                  📷 Photo Proof Attached
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#6C7167]">
                              {new Date(req.createdAt).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#6C7167] block">Product</span>
                              <div className="font-semibold text-[#123D28]">{req.productName}</div>
                              <div className="font-mono text-[11px] text-[#6C7167]">{req.productSku}</div>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#6C7167] block">Stock Adjustment</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-slate-600">Current: <strong>{req.currentStock}</strong></span>
                                <span className="text-slate-400">➔</span>
                                <span className="text-slate-900 font-bold">Target: {req.newStockTarget}</span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    isPositive
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-rose-100 text-rose-800"
                                  }`}
                                >
                                  {isPositive ? `+${req.quantityChange}` : req.quantityChange}
                                </span>
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#6C7167] block">Requested By</span>
                              <div className="font-medium text-slate-800">{req.managerName}</div>
                              <div className="font-mono text-[10px] text-slate-500">TG: {req.managerTelegramId}</div>
                            </div>
                          </div>

                          {req.notes && (
                            <div className="p-2 bg-white/80 rounded border border-[#DEDFD5] text-[11px] text-slate-700">
                              <span className="font-semibold text-[#123D28]">Notes: </span>
                              {req.notes}
                            </div>
                          )}

                          {isPending && (
                            <div className="flex items-center gap-2 pt-2 border-t border-[#DEDFD5]">
                              <button
                                type="button"
                                disabled={approveStockRequestMutation.isPending}
                                onClick={() => approveStockRequestMutation.mutate({ requestId: req.id })}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                              >
                                <CheckCircle2 size={13} /> Approve & Update Stock
                              </button>
                              <button
                                type="button"
                                disabled={rejectStockRequestMutation.isPending}
                                onClick={() => rejectStockRequestMutation.mutate({ requestId: req.id })}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                              >
                                <X size={13} /> Reject
                              </button>
                            </div>
                          )}

                          {!isPending && req.reviewedBy && (
                            <div className="text-[11px] text-slate-500 pt-1 border-t border-[#DEDFD5]/50 flex items-center justify-between">
                              <span>
                                {isApproved ? "Approved" : "Rejected"} by <strong className="text-slate-700">{req.reviewedBy}</strong>
                              </span>
                              {req.reviewedAt && (
                                <span>{new Date(req.reviewedAt).toLocaleString("en-IN")}</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Admin System Footer */}
        <footer className="mt-auto px-6 py-4 border-t border-slate-200/90 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">TRINAYAA Admin Operations Console</span>
            <span className="text-slate-300">·</span>
            <span>Erode Dispatch & Apothecary Facility</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-600" />
              System Status: <strong className="text-emerald-700 font-semibold">Operational</strong>
            </span>
            <span>·</span>
            <span>&copy; 2026 TRINAYAA ENTERPRISES · v1.0</span>
          </div>
        </footer>
      </div>

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* 1. Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DEDFD5] pb-3 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#AE6A2B]">Order Details</span>
                <h3 className="font-serif text-xl font-bold text-[#123D28]">{selectedOrder.orderNumber}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShippingSlipOrderNumber(selectedOrder.orderNumber)}
                  className="px-2.5 py-1.5 bg-[#FBF8F0] hover:bg-[#DEDFD5]/40 text-[#123D28] border border-[#DEDFD5] rounded-md text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer size={13} className="text-[#AE6A2B]" /> Fulfilment Docs & Print
                </button>
                <button onClick={() => setSelectedOrder(null)} className="text-[#6C7167] hover:text-[#123D28]">
                  <X size={20} />
                </button>
              </div>
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

              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FBF8F0] rounded-lg border border-[#DEDFD5]">
                <div className="flex items-center gap-2">
                  <span className="font-bold">Order Status:</span>
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
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
                {selectedOrder.paymentStatus === "PAID" && selectedOrder.orderStatus !== "Refunded" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to refund ${selectedOrder.orderNumber}? Product inventory will be automatically restored.`)) {
                        refundOrderMutation.mutate({ orderId: selectedOrder.id });
                      }
                    }}
                    className="px-3 py-1 bg-rose-50 border border-rose-200 text-rose-800 rounded font-semibold text-xs hover:bg-rose-100"
                  >
                    Issue Refund
                  </button>
                )}
              </div>

              {/* Tracking Information */}
              <div className="p-3 bg-white rounded-lg border border-[#DEDFD5] space-y-2">
                <span className="font-bold text-[#123D28] block">Shipment & Logistics:</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#6C7167] block">Courier Partner</label>
                    <input
                      type="text"
                      placeholder="e.g. DTDC, Delhivery"
                      defaultValue={selectedOrder.carrier || ""}
                      onBlur={(e) => {
                        if (e.target.value !== (selectedOrder.carrier || "")) {
                          updateOrderStatusMutation.mutate({
                            orderId: selectedOrder.id,
                            status: selectedOrder.orderStatus,
                            carrier: e.target.value,
                            note: `Updated carrier to ${e.target.value}`,
                          });
                        }
                      }}
                      className="w-full text-xs p-1.5 border rounded bg-[#FBF8F0]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#6C7167] block">AWB / Tracking Number</label>
                    <input
                      type="text"
                      placeholder="e.g. TRK987654321"
                      defaultValue={selectedOrder.trackingNumber || ""}
                      onBlur={(e) => {
                        if (e.target.value !== (selectedOrder.trackingNumber || "")) {
                          updateOrderStatusMutation.mutate({
                            orderId: selectedOrder.id,
                            status: selectedOrder.orderStatus,
                            trackingNumber: e.target.value,
                            note: `Updated tracking number to ${e.target.value}`,
                          });
                        }
                      }}
                      className="w-full text-xs p-1.5 border rounded bg-[#FBF8F0]"
                    />
                  </div>
                </div>
              </div>

              {/* Status History Timeline */}
              {selectedOrder.history && selectedOrder.history.length > 0 && (
                <div>
                  <span className="font-bold text-[#123D28] block mb-1">Status History:</span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto border border-[#DEDFD5] rounded-lg p-2.5 bg-[#FBF8F0]">
                    {selectedOrder.history.map((h: any, idx: number) => (
                      <div key={idx} className="text-[11px] flex items-start justify-between border-b border-[#DEDFD5]/50 pb-1 last:border-0">
                        <div>
                          <strong className="text-[#123D28]">{h.status}</strong>
                          <span className="text-[#6C7167] block text-[10px]">{h.note}</span>
                        </div>
                        <span className="text-[10px] text-[#6C7167] shrink-0">
                          {new Date(h.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit / Add Product Modal */}
      {(editingProduct || isAddingProduct) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
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
                  isCodAvailable: form.isCodAvailable.checked,
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

              <div className="flex items-center gap-2 p-2.5 bg-[#FBF8F0] border border-[#DEDFD5] rounded">
                <input
                  type="checkbox"
                  id="isCodAvailable"
                  name="isCodAvailable"
                  defaultChecked={editingProduct ? Boolean(editingProduct.isCodAvailable) : true}
                  className="rounded accent-[#123D28] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="isCodAvailable" className="font-semibold text-[#123D28] cursor-pointer">
                  Cash on Delivery (COD) Available
                </label>
                <span className="text-[10px] text-[#6C7167] ml-auto">
                  Uncheck to restrict this item to online payment only.
                </span>
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
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-4">
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
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-md w-full p-6 shadow-xl">
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
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-md w-full p-6 shadow-xl">
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
          <div className="bg-white border border-slate-200/90 rounded-2xl max-w-md w-full p-6 shadow-xl">
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

      {/* Printable Shipping Slip Modal (Phase 6) */}
      {shippingSlipOrderNumber && (
        <ShippingSlipModal
          orderNumber={shippingSlipOrderNumber}
          onClose={() => setShippingSlipOrderNumber(null)}
        />
      )}

      {/* Phase 6: Admin Return & RMA Review Modal */}
      {returnActionModalOpen && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#DEDFD5] max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE0]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#123D28] flex items-center gap-2">
                  <RotateCcw size={18} className="text-[#8E5E28]" />
                  Return Management: {selectedReturn.returnNumber}
                </h3>
                <span className="text-xs text-[#6C7167]">Order: {selectedReturn.orderNumber} · Customer: {selectedReturn.customerName}</span>
              </div>
              <button
                type="button"
                onClick={() => setReturnActionModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-[#FAF8F2] p-3 rounded-xl border border-[#EFECE4] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6C7167]">Product:</span>
                <strong className="text-[#123D28]">{selectedReturn.productName} ({selectedReturn.packSize})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6C7167]">Quantity / Price:</span>
                <span>{selectedReturn.quantityRequested} units @ ₹{selectedReturn.itemPrice} = <strong>₹{selectedReturn.refundAmount}</strong></span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6C7167]">Return Reason:</span>
                <span className="font-semibold text-[#8E5E28]">{selectedReturn.returnReason}</span>
              </div>
              <div>
                <span className="text-[#6C7167] block">Customer Description:</span>
                <p className="italic text-[#2C382A] mt-0.5">"{selectedReturn.description}"</p>
              </div>
              {selectedReturn.pickupInstructions && (
                <div>
                  <span className="text-[#6C7167] block">Pickup Instructions:</span>
                  <p className="text-[#2C382A]">{selectedReturn.pickupInstructions}</p>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateReturnStatusMutation.mutate({
                  id: selectedReturn.id,
                  status: actionStatus,
                  adminNotes: actionNotes,
                  stockDisposition: actionDisposition,
                  restockedQuantity: Number(actionRestockQty),
                  refundMethod: actionStatus === "REFUNDED" ? actionRefundMethod : undefined,
                  refundReference: actionStatus === "REFUNDED" ? actionRefundRef : undefined,
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#123D28] mb-1">Update Status</label>
                <select
                  value={actionStatus}
                  onChange={(e) => setActionStatus(e.target.value)}
                  className="w-full p-2 border border-[#DEDFD5] rounded-lg bg-white font-semibold text-[#123D28]"
                  required
                >
                  <option value="REQUESTED">REQUESTED</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="APPROVED">APPROVED (Pickup to be scheduled)</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="PICKUP_SCHEDULED">PICKUP SCHEDULED</option>
                  <option value="ITEM_RECEIVED">ITEM RECEIVED AT WAREHOUSE</option>
                  <option value="INSPECTED">INSPECTED (Quality check completed)</option>
                  <option value="REFUND_PENDING">REFUND PENDING</option>
                  <option value="REFUNDED">REFUNDED (Mark financial refund complete)</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              {/* Inspection Stock Disposition */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block font-semibold text-[#123D28]">Stock Disposition (After Quality Inspection)</label>
                <select
                  value={actionDisposition}
                  onChange={(e) => setActionDisposition(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="NONE">NONE (Pending Inspection / No inventory change)</option>
                  <option value="RESTOCKED">RESTOCKED (Item verified in good condition, restock to inventory)</option>
                  <option value="DAMAGED_DISCARD">DAMAGED DISCARD (Damaged/broken botanical pack, do not restock)</option>
                  <option value="RETAINED_SAMPLE">RETAINED SAMPLE (Lab/Quality sample retention)</option>
                </select>

                {actionDisposition === "RESTOCKED" && (
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-800">Quantity to Add Back to Warehouse Stock</label>
                    <input
                      type="number"
                      min={1}
                      max={selectedReturn.quantityRequested}
                      value={actionRestockQty}
                      onChange={(e) => setActionRestockQty(Number(e.target.value))}
                      className="w-full p-2 border border-emerald-300 rounded-lg bg-white mt-1"
                    />
                    <span className="text-[10px] text-emerald-700 block mt-0.5">
                      ✓ Will automatically increment available stock for product in inventory.
                    </span>
                  </div>
                )}
              </div>

              {/* Financial Refund Recording */}
              {actionStatus === "REFUNDED" && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                  <strong className="text-emerald-900 block">Record Financial Refund Details (₹{selectedReturn.refundAmount})</strong>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-800">Refund Method</label>
                      <select
                        value={actionRefundMethod}
                        onChange={(e) => setActionRefundMethod(e.target.value)}
                        className="w-full p-2 border border-emerald-300 rounded-lg bg-white mt-1 text-xs"
                      >
                        <option value="MANUAL_COD_RECORD">MANUAL COD (Cash / Handover)</option>
                        <option value="BANK_TRANSFER">BANK TRANSFER (NEFT / IMPS)</option>
                        <option value="UPI">UPI TRANSFER</option>
                        <option value="ONLINE_ORIGINAL">ORIGINAL PAYMENT GATEWAY</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-800">Refund Reference #</label>
                      <input
                        type="text"
                        value={actionRefundRef}
                        onChange={(e) => setActionRefundRef(e.target.value)}
                        placeholder="e.g. UTR123456 or CASH-VCH-01"
                        className="w-full p-2 border border-emerald-300 rounded-lg bg-white mt-1 text-xs"
                        required={actionStatus === "REFUNDED"}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#123D28] mb-1">Administrative Notes</label>
                <textarea
                  rows={2}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Internal notes regarding this return inspection or customer communication..."
                  className="w-full p-2 border border-[#DEDFD5] rounded-lg bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnActionModalOpen(false)}
                  className="py-2 px-4 rounded-xl border border-[#DEDFD5] text-[#6C7167] font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateReturnStatusMutation.isPending}
                  className="py-2 px-5 rounded-xl bg-[#123D28] hover:bg-[#1A4D33] text-white font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  {updateReturnStatusMutation.isPending ? "Updating..." : "Update Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}


// ==========================================
// ORDER FULFILMENT DOCUMENT STUDIO (PHASE 5)
// ==========================================
type FulfilmentDocTab = "slip" | "invoice" | "challan" | "sticker" | "all";

function OrderDocumentStudioModal({
  orderNumber,
  onClose,
}: {
  orderNumber: string;
  onClose: () => void;
}) {
  const [activeDocTab, setActiveDocTab] = useState<FulfilmentDocTab>("slip");
  const { data: bundle, isLoading, error } = trpc.admin.orders.getAllDocuments.useQuery({ orderNumber });

  const handlePrint = () => {
    window.print();
  };

  const slip = bundle?.shippingSlip;
  const invoice = bundle?.customerInvoice;
  const challan = bundle?.deliveryChallan;
  const sticker = bundle?.packingSticker;

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-studio-content, #print-studio-content * {
            visibility: visible !important;
          }
          #print-studio-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 16px !important;
            background: white !important;
            color: black !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 overflow-y-auto no-print">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden border border-slate-300">
          {/* Modal Header */}
          <div className="p-4 bg-[#FBF8F0] border-b border-[#DEDFD5] flex items-center justify-between no-print">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#123D28] text-white flex items-center justify-center">
                <Printer size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#AE6A2B] bg-[#E8BF83]/20 px-2 py-0.5 rounded">
                    Fulfilment Studio
                  </span>
                  <span className="text-sm font-serif font-bold text-[#123D28]">Order {orderNumber}</span>
                </div>
                <p className="text-[11px] text-[#6C7167]">Generate, inspect, and print dispatch & legal documents</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                disabled={isLoading || !bundle}
                className="dark-button text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
              >
                <Printer size={14} /> Print {activeDocTab === "all" ? "All Documents" : activeDocTab === "sticker" ? "Sticker (4x6)" : "Document"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Document Navigation Tabs */}
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-print text-xs">
            <button
              type="button"
              onClick={() => setActiveDocTab("slip")}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                activeDocTab === "slip"
                  ? "bg-[#123D28] text-white shadow-xs"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <FileText size={13} />
              <span>1. Shipping Slip</span>
              {slip && <span className="text-[9px] opacity-75 font-mono">({slip.documentNumber})</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveDocTab("invoice")}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                activeDocTab === "invoice"
                  ? "bg-[#123D28] text-white shadow-xs"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <FileText size={13} />
              <span>2. Customer Invoice</span>
              {invoice && <span className="text-[9px] opacity-75 font-mono">({invoice.invoiceNumber})</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveDocTab("challan")}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                activeDocTab === "challan"
                  ? "bg-[#123D28] text-white shadow-xs"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Layers size={13} />
              <span>3. Delivery Challan</span>
              {challan && <span className="text-[9px] opacity-75 font-mono">({challan.challanNumber})</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveDocTab("sticker")}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                activeDocTab === "sticker"
                  ? "bg-[#123D28] text-white shadow-xs"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              <Package size={13} />
              <span>4. Parcel Sticker (4x6)</span>
              {sticker && <span className="text-[9px] opacity-75 font-mono">({sticker.stickerNumber})</span>}
            </button>

            <button
              type="button"
              onClick={() => setActiveDocTab("all")}
              className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
                activeDocTab === "all"
                  ? "bg-[#AE6A2B] text-white shadow-xs"
                  : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200"
              }`}
            >
              <Printer size={13} />
              <span>Print All (Bundle)</span>
            </button>
          </div>

          {/* Printable / Viewable Document Area */}
          <div className="p-6 overflow-y-auto flex-1 bg-slate-100/60">
            {isLoading ? (
              <div className="py-20 text-center text-xs text-gray-500 font-medium">Generating fulfilment documents...</div>
            ) : error || !bundle ? (
              <div className="py-20 text-center text-xs text-rose-600 font-semibold">
                Failed to load fulfilment documents: {error?.message || "Order not found"}
              </div>
            ) : (
              <div id="print-studio-content">
                {/* TAB 1: SHIPPING SLIP */}
                {(activeDocTab === "slip" || activeDocTab === "all") && slip && (
                  <div className="bg-white border border-slate-300 p-6 rounded-xl shadow-xs max-w-[760px] mx-auto text-black font-sans leading-relaxed text-xs mb-8">
                    {/* Header */}
                    <div className="border-b-2 border-black pb-3 mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-black p-1 flex items-center justify-center shrink-0">
                          <img src="/images/brand/emblem_crisp.png" alt="TRINAYAA" className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <h1 className="text-xl font-bold font-serif tracking-wider text-black leading-tight">
                            TRINAYAA ENTERPRISES
                          </h1>
                          <p className="text-[10px] text-gray-700 uppercase tracking-wider font-semibold">
                            100% Pure Botanical Powders, Seeds & Herbal Wellness
                          </p>
                          <p className="text-[9px] text-gray-600 mt-0.5">
                            {slip.dispatchHq} | Phone: +91 94422 18990
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="inline-block border border-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1 bg-gray-50">
                          SHIPPING / DISPATCH SLIP
                        </div>
                        <div className="font-mono text-sm font-bold text-black">{slip.documentNumber}</div>
                        <div className="text-[10px] text-gray-700 font-mono">Order: {slip.orderNumber}</div>
                        <div className="text-[10px] text-gray-700">Date: {slip.orderDate}</div>
                      </div>
                    </div>

                    {/* Consignee & Dispatch Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4 border border-black p-3 bg-gray-50/50">
                      <div>
                        <h3 className="font-bold uppercase tracking-wider text-[10px] text-gray-700 border-b border-gray-300 pb-1 mb-1.5">
                          CONSIGNEE / DELIVERY ADDRESS
                        </h3>
                        <div className="text-sm font-bold text-black">{slip.customerName}</div>
                        <div className="text-[11px] font-semibold text-gray-800">Phone: {slip.customerPhone}</div>
                        {slip.customerEmail && <div className="text-[10px] text-gray-600">Email: {slip.customerEmail}</div>}
                        <div className="mt-1 text-[11px] text-gray-900 leading-snug">
                          {slip.formattedAddress}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold uppercase tracking-wider text-[10px] text-gray-700 border-b border-gray-300 pb-1 mb-1.5">
                          DISPATCH & PAYMENT OVERVIEW
                        </h3>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                          <span className="text-gray-600">Payment Mode:</span>
                          <strong className="text-black">{slip.paymentMethod}</strong>
                          <span className="text-gray-600">Payment Status:</span>
                          <strong className="text-black uppercase">{slip.paymentStatus}</strong>
                          <span className="text-gray-600">Fulfilment Status:</span>
                          <strong className="text-black">{slip.orderStatus}</strong>
                          <span className="text-gray-600">Carrier Partner:</span>
                          <strong className="text-black">{slip.carrier || "Standard Dispatch"}</strong>
                          <span className="text-gray-600">AWB / Tracking #:</span>
                          <strong className="text-black font-mono">{slip.trackingNumber || "Pending Dispatch"}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Ordered Items Packing Checklist */}
                    <table className="w-full text-left border-collapse border border-black mb-4">
                      <thead>
                        <tr className="bg-gray-100 border-b border-black text-[10px] font-bold uppercase">
                          <th className="p-2 border-r border-black w-8 text-center">#</th>
                          <th className="p-2 border-r border-black w-24">SKU</th>
                          <th className="p-2 border-r border-black">Botanical Description</th>
                          <th className="p-2 border-r border-black text-center w-16">Pack</th>
                          <th className="p-2 border-r border-black text-center w-12">Qty</th>
                          <th className="p-2 border-r border-black text-center w-12 no-print">Packed</th>
                          <th className="p-2 border-r border-black text-right w-16">Unit Rate</th>
                          <th className="p-2 text-right w-20">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300 text-[11px]">
                        {slip.items.map((it: any, idx: number) => (
                          <tr key={it.id || idx}>
                            <td className="p-2 border-r border-black text-center text-gray-600">{idx + 1}</td>
                            <td className="p-2 border-r border-black font-mono font-bold text-[10px]">{it.sku}</td>
                            <td className="p-2 border-r border-black font-semibold text-black">
                              {it.productNameEn}
                              {it.productNameTa && (
                                <span className="block text-[10px] font-normal text-gray-700">{it.productNameTa}</span>
                              )}
                            </td>
                            <td className="p-2 border-r border-black text-center">{it.packSize}</td>
                            <td className="p-2 border-r border-black text-center font-bold">{it.quantity}</td>
                            <td className="p-2 border-r border-black text-center no-print">
                              <input type="checkbox" className="rounded text-[#123D28]" defaultChecked />
                            </td>
                            <td className="p-2 border-r border-black text-right">₹{it.price}</td>
                            <td className="p-2 text-right font-bold">₹{it.subtotal}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals & Signatures */}
                    <div className="flex justify-between items-end mb-4">
                      <div className="text-[10px] text-gray-600">
                        <p className="font-semibold text-black">Packer & Dispatch Verification:</p>
                        <p>All items checked for batch freshness, intact botanical seal & packaging hygiene.</p>
                      </div>
                      <div className="w-64 border border-black p-2 bg-gray-50 space-y-1 text-[11px]">
                        <div className="flex justify-between text-gray-700">
                          <span>Items Subtotal:</span>
                          <span>₹{slip.subtotal}</span>
                        </div>
                        {slip.discountAmount > 0 && (
                          <div className="flex justify-between text-rose-700">
                            <span>Discount {slip.couponCode ? `(${slip.couponCode})` : ""}:</span>
                            <span>-₹{slip.discountAmount}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-700">
                          <span>Delivery Fee:</span>
                          <span>{slip.shippingFee === 0 ? "FREE" : `₹${slip.shippingFee}`}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-black pt-1 text-xs text-black">
                          <span>Net Payable:</span>
                          <span>₹{slip.total}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-gray-400 pt-3 text-[10px] text-gray-600 flex justify-between items-end">
                      <div>
                        <p className="font-semibold text-black">Origin Dispatch HQ:</p>
                        <p>{slip.dispatchHq}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-black">{slip.signatory}</p>
                        <div className="h-6"></div>
                        <p className="font-mono text-[9px] text-gray-700">DISPATCH VERIFIED</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeDocTab === "all" && <div className="page-break my-6 no-print border-b-2 border-dashed border-gray-400" />}

                {/* TAB 2: CUSTOMER TAX INVOICE */}
                {(activeDocTab === "invoice" || activeDocTab === "all") && invoice && (
                  <div className="bg-white border border-slate-300 p-6 rounded-xl shadow-xs max-w-[760px] mx-auto text-black font-sans leading-relaxed text-xs mb-8">
                    {/* Invoice Header */}
                    <div className="border-b-2 border-black pb-3 mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-black p-1 flex items-center justify-center shrink-0">
                          <img src="/images/brand/emblem_crisp.png" alt="TRINAYAA" className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <h1 className="text-xl font-bold font-serif tracking-wider text-black leading-tight">
                            {invoice.sellerDetails.companyName}
                          </h1>
                          <p className="text-[10px] text-gray-700 uppercase tracking-wider font-semibold">
                            {invoice.sellerDetails.tagline}
                          </p>
                          <p className="text-[9px] text-gray-600 mt-0.5">
                            {invoice.sellerDetails.registeredOffice}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="inline-block border-2 border-black px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider mb-1 bg-gray-100">
                          TAX INVOICE
                        </div>
                        <div className="font-mono text-sm font-bold text-black">{invoice.invoiceNumber}</div>
                        <div className="text-[10px] text-gray-700">Invoice Date: {invoice.invoiceDate}</div>
                        <div className="text-[10px] text-gray-700 font-mono">Order Ref: {invoice.orderNumber}</div>
                      </div>
                    </div>

                    {/* Tax & Business Identification */}
                    <div className="grid grid-cols-2 gap-4 mb-4 border border-black p-2.5 bg-gray-50/40 text-[10px]">
                      <div>
                        <span className="font-bold uppercase text-gray-700 block mb-1">SUPPLIER / TAX DETAILS</span>
                        <div><strong>GSTIN:</strong> {invoice.sellerDetails.gstin}</div>
                        <div><strong>PAN:</strong> {invoice.sellerDetails.pan}</div>
                        <div><strong>FSSAI Lic:</strong> {invoice.sellerDetails.fssaiNumber}</div>
                        <div><strong>State:</strong> {invoice.sellerDetails.state} (Code: {invoice.sellerDetails.stateCode})</div>
                      </div>
                      <div>
                        <span className="font-bold uppercase text-gray-700 block mb-1">BUYER / BILL TO & SHIP TO</span>
                        <div className="font-bold text-black text-[11px]">{invoice.buyerDetails.customerName}</div>
                        <div>Phone: {invoice.buyerDetails.customerPhone}</div>
                        {invoice.buyerDetails.customerEmail && <div>Email: {invoice.buyerDetails.customerEmail}</div>}
                        <div className="truncate">Address: {invoice.buyerDetails.formattedAddress}</div>
                        <div><strong>Place of Supply:</strong> {invoice.buyerDetails.placeOfSupply}</div>
                      </div>
                    </div>

                    {/* Line Items Table with GST Breakdown */}
                    <table className="w-full text-left border-collapse border border-black mb-4">
                      <thead>
                        <tr className="bg-gray-100 border-b border-black text-[9px] font-bold uppercase">
                          <th className="p-1.5 border-r border-black w-6 text-center">#</th>
                          <th className="p-1.5 border-r border-black">Item Description</th>
                          <th className="p-1.5 border-r border-black w-14 text-center">HSN</th>
                          <th className="p-1.5 border-r border-black w-12 text-center">Pack</th>
                          <th className="p-1.5 border-r border-black w-8 text-center">Qty</th>
                          <th className="p-1.5 border-r border-black w-14 text-right">Taxable</th>
                          <th className="p-1.5 border-r border-black w-12 text-right">CGST</th>
                          <th className="p-1.5 border-r border-black w-12 text-right">SGST</th>
                          <th className="p-1.5 text-right w-16">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300 text-[10px]">
                        {invoice.items.map((it: any) => (
                          <tr key={it.sNo}>
                            <td className="p-1.5 border-r border-black text-center text-gray-600">{it.sNo}</td>
                            <td className="p-1.5 border-r border-black font-semibold text-black">
                              {it.productNameEn}
                              {it.productNameTa && <span className="block text-[9px] font-normal text-gray-600">{it.productNameTa}</span>}
                              <span className="font-mono text-[8px] text-gray-500">SKU: {it.sku}</span>
                            </td>
                            <td className="p-1.5 border-r border-black text-center font-mono text-[9px]">{it.hsnCode}</td>
                            <td className="p-1.5 border-r border-black text-center">{it.packSize}</td>
                            <td className="p-1.5 border-r border-black text-center font-bold">{it.quantity}</td>
                            <td className="p-1.5 border-r border-black text-right">₹{it.taxableAmount}</td>
                            <td className="p-1.5 border-r border-black text-right text-[9px]">₹{it.cgstAmount}</td>
                            <td className="p-1.5 border-r border-black text-right text-[9px]">₹{it.sgstAmount}</td>
                            <td className="p-1.5 text-right font-bold">₹{it.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Financial Summary & Amount in Words */}
                    <div className="grid grid-cols-2 gap-4 mb-4 items-start">
                      <div className="border border-black p-2.5 bg-gray-50/50 space-y-1 text-[10px]">
                        <div className="font-bold uppercase text-gray-700 border-b border-gray-300 pb-1">Amount In Words</div>
                        <div className="font-semibold text-black text-[11px] italic">{invoice.totalInWords}</div>
                        <div className="pt-2 text-[9px] text-gray-600">
                          <strong>Payment Method:</strong> {invoice.paymentMethod} ({invoice.paymentStatus})<br />
                          <strong>Payment Reference:</strong> {invoice.paymentRef}
                        </div>
                      </div>
                      <div className="border border-black p-2.5 bg-white space-y-1 text-[10px]">
                        <div className="flex justify-between text-gray-700">
                          <span>Total Taxable Value:</span>
                          <span>₹{invoice.totalTaxable}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>CGST (2.5%):</span>
                          <span>₹{invoice.totalCgst}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span>SGST (2.5%):</span>
                          <span>₹{invoice.totalSgst}</span>
                        </div>
                        {invoice.discountAmount > 0 && (
                          <div className="flex justify-between text-rose-700">
                            <span>Promotional Discount:</span>
                            <span>-₹{invoice.discountAmount}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-700">
                          <span>Shipping / Delivery Charges:</span>
                          <span>{invoice.shippingFee === 0 ? "FREE" : `₹${invoice.shippingFee}`}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t-2 border-black pt-1 text-xs text-black">
                          <span>Invoice Total:</span>
                          <span>₹{invoice.total}</span>
                        </div>
                      </div>
                    </div>

                    {/* Terms & Authorized Signatory */}
                    <div className="border-t border-dashed border-gray-400 pt-3 text-[9px] text-gray-600 flex justify-between items-end">
                      <div className="max-w-[420px]">
                        <p className="font-bold text-black uppercase">Declaration & Terms:</p>
                        <p>{invoice.termsAndConditions.join(" ")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-black">{invoice.authorizedSignatory}</p>
                        <div className="h-6"></div>
                        <p className="font-mono text-[9px] text-gray-700">TRINAYAA ERODE HQ</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeDocTab === "all" && <div className="page-break my-6 no-print border-b-2 border-dashed border-gray-400" />}

                {/* TAB 3: DELIVERY CHALLAN (RULE 55) */}
                {(activeDocTab === "challan" || activeDocTab === "all") && challan && (
                  <div className="bg-white border border-slate-300 p-6 rounded-xl shadow-xs max-w-[760px] mx-auto text-black font-sans leading-relaxed text-xs mb-8">
                    {/* Challan Header */}
                    <div className="border-b-2 border-black pb-3 mb-4 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg border border-black p-1 flex items-center justify-center shrink-0">
                          <img src="/images/brand/emblem_crisp.png" alt="TRINAYAA" className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <h1 className="text-xl font-bold font-serif tracking-wider text-black leading-tight">
                            {challan.consignor.name}
                          </h1>
                          <p className="text-[10px] text-gray-700 uppercase tracking-wider font-semibold">
                            Delivery Challan (Rule 55, CGST Rules 2017)
                          </p>
                          <p className="text-[9px] text-gray-600 mt-0.5">
                            {challan.consignor.address}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="inline-block border-2 border-black px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider mb-1 bg-gray-100">
                          DELIVERY CHALLAN
                        </div>
                        <div className="font-mono text-sm font-bold text-black">{challan.challanNumber}</div>
                        <div className="text-[10px] text-gray-700">Challan Date: {challan.challanDate}</div>
                        <div className="text-[10px] text-gray-700 font-mono">Invoice: {challan.invoiceNumber}</div>
                      </div>
                    </div>

                    {/* Consignor / Consignee / Transport Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-4 border border-black p-3 bg-gray-50/50 text-[10px]">
                      <div>
                        <span className="font-bold uppercase text-gray-700 block mb-1">CONSIGNOR (FROM)</span>
                        <div className="font-bold text-black">{challan.consignor.name}</div>
                        <div>{challan.consignor.address}</div>
                        <div>GSTIN: {challan.consignor.gstin} | Phone: {challan.consignor.phone}</div>

                        <span className="font-bold uppercase text-gray-700 block mt-3 mb-1">CONSIGNEE (TO)</span>
                        <div className="font-bold text-black text-[11px]">{challan.consignee.name}</div>
                        <div>Phone: {challan.consignee.phone}</div>
                        <div>{challan.consignee.formattedAddress}</div>
                      </div>
                      <div>
                        <span className="font-bold uppercase text-gray-700 block mb-1">TRANSPORT & MOVEMENT PARTICULARS</span>
                        <div className="space-y-1">
                          <div><strong>Carrier / Logistics:</strong> {challan.transportDetails.carrier}</div>
                          <div><strong>Tracking / AWB No:</strong> {challan.transportDetails.trackingNumber}</div>
                          <div><strong>Mode of Transport:</strong> {challan.transportDetails.modeOfTransport}</div>
                          <div><strong>Place of Supply:</strong> {challan.transportDetails.placeOfSupply}</div>
                          <div className="pt-2 text-[9px] text-gray-600 italic">
                            <strong>Reason:</strong> {challan.reasonForTransport}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Goods Description Table */}
                    <table className="w-full text-left border-collapse border border-black mb-4">
                      <thead>
                        <tr className="bg-gray-100 border-b border-black text-[10px] font-bold uppercase">
                          <th className="p-2 border-r border-black w-8 text-center">#</th>
                          <th className="p-2 border-r border-black w-24">SKU</th>
                          <th className="p-2 border-r border-black">Description of Goods</th>
                          <th className="p-2 border-r border-black text-center w-16">HSN</th>
                          <th className="p-2 border-r border-black text-center w-16">Pack Size</th>
                          <th className="p-2 border-r border-black text-center w-12">Qty</th>
                          <th className="p-2 border-r border-black text-center w-12">UOM</th>
                          <th className="p-2 text-right w-20">Value (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300 text-[11px]">
                        {challan.items.map((it: any) => (
                          <tr key={it.sNo}>
                            <td className="p-2 border-r border-black text-center text-gray-600">{it.sNo}</td>
                            <td className="p-2 border-r border-black font-mono font-bold text-[10px]">{it.sku}</td>
                            <td className="p-2 border-r border-black font-semibold text-black">
                              {it.productNameEn}
                              {it.productNameTa && <span className="block text-[10px] font-normal text-gray-700">{it.productNameTa}</span>}
                            </td>
                            <td className="p-2 border-r border-black text-center font-mono text-[10px]">{it.hsnCode}</td>
                            <td className="p-2 border-r border-black text-center">{it.packSize}</td>
                            <td className="p-2 border-r border-black text-center font-bold">{it.quantity}</td>
                            <td className="p-2 border-r border-black text-center">{it.uom}</td>
                            <td className="p-2 text-right font-bold">₹{it.totalValue}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-100 font-bold border-t-2 border-black text-[11px]">
                          <td colSpan={5} className="p-2 text-right border-r border-black">Total Dispatched Quantity / Value:</td>
                          <td className="p-2 text-center border-r border-black">{challan.totalQuantity}</td>
                          <td className="p-2 text-center border-r border-black">Packs</td>
                          <td className="p-2 text-right">₹{challan.total}</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Declaration & Signatures */}
                    <div className="border border-black p-3 mb-4 bg-gray-50/50 text-[10px]">
                      <p className="font-semibold text-black">Statutory Declaration:</p>
                      <p>{challan.declaration}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-8 border-t border-dashed border-gray-400 pt-4 text-[10px]">
                      <div>
                        <p className="font-semibold text-black">Dispatched By (Warehouse Logistics):</p>
                        <div className="h-10 border-b border-gray-400 mb-1"></div>
                        <p className="text-gray-600">TRINAYAA Erode Fulfillment Centre</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-black">Consignee Acknowledgment / Receiver:</p>
                        <div className="h-10 border-b border-gray-400 mb-1"></div>
                        <p className="text-gray-600">Signature & Date of Receipt</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeDocTab === "all" && <div className="page-break my-6 no-print border-b-2 border-dashed border-gray-400" />}

                {/* TAB 4: PARCEL / PACKING STICKER (4x6 THERMAL LABEL FORMAT) */}
                {(activeDocTab === "sticker" || activeDocTab === "all") && sticker && (
                  <div className="flex flex-col items-center">
                    <div className="text-[11px] text-gray-500 mb-2 font-medium no-print">
                      Thermal Shipping Label (4" × 6" Format) • Barcode, Scannable QR & High-Visibility PIN
                    </div>
                    <div
                      className="bg-white border-2 border-black p-4 rounded shadow-md w-full max-w-[400px] text-black font-sans leading-tight text-xs print:border-black print:shadow-none mb-8"
                      style={{ minHeight: "580px" }}
                    >
                      {/* Thermal Label Header */}
                      <div className="border-b-2 border-black pb-2 mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src="/images/brand/emblem_crisp.png" alt="TRINAYAA" className="w-7 h-7 object-contain" />
                          <div>
                            <span className="font-serif font-bold text-sm tracking-wide block">TRINAYAA</span>
                            <span className="text-[8px] uppercase tracking-wider text-gray-700">Botanical Express</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-mono font-bold">{sticker.routing.originHub}</span>
                          <span className="block text-[8px] text-gray-600">{sticker.routing.carrier}</span>
                        </div>
                      </div>

                      {/* Payment Callout Badge */}
                      <div
                        className={`border-2 border-black p-2 text-center font-bold mb-2.5 ${
                          sticker.payment.isCod ? "bg-amber-100" : "bg-emerald-50"
                        }`}
                      >
                        <div className="text-sm tracking-wider uppercase font-black">
                          {sticker.payment.badgeText}
                        </div>
                        <div className="text-xs mt-0.5 tracking-tight font-black">
                          {sticker.payment.collectDisplay}
                        </div>
                      </div>

                      {/* Destination / Consignee Address */}
                      <div className="border border-black p-2.5 mb-2 bg-gray-50/50">
                        <div className="text-[9px] uppercase font-bold text-gray-700 border-b border-gray-300 pb-0.5 mb-1">
                          SHIP TO / CONSIGNEE:
                        </div>
                        <div className="text-base font-black tracking-tight text-black">{sticker.to.name}</div>
                        <div className="text-xs font-bold text-gray-900 mt-0.5">📞 {sticker.to.phone}</div>
                        <div className="text-[11px] text-gray-800 mt-1 leading-snug">
                          {sticker.to.formattedAddress}
                        </div>
                        {/* Prominent PIN CODE banner */}
                        <div className="mt-2 bg-black text-white px-2 py-1 text-center font-mono font-black text-sm tracking-widest rounded-xs">
                          PIN: {sticker.to.pinCode}
                        </div>
                      </div>

                      {/* Dual Code Section: Barcode & Scannable QR Code */}
                      <div className="border border-black p-2 mb-2 bg-white">
                        <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                          {/* Left: AWB & Linear Barcode */}
                          <div className="text-center border-r border-gray-300 pr-2">
                            <div className="text-[8px] text-gray-600 font-mono font-bold uppercase tracking-wider">
                              AWB / TRACKING NUMBER
                            </div>
                            <div className="font-mono text-xs font-black tracking-widest my-0.5">
                              {sticker.routing.trackingNumber}
                            </div>
                            <div className="font-mono text-base font-bold tracking-widest bg-gray-100 py-1 border border-dashed border-gray-400">
                              {sticker.barcodeData.orderNumberBarcode}
                            </div>
                            <div className="text-[8px] text-gray-500 font-mono mt-0.5">ORDER #{sticker.orderNumber}</div>
                          </div>

                          {/* Right: Scannable QR Code for Complete Order Info */}
                          <div className="flex flex-col items-center pl-1">
                            <div className="bg-white p-1 border border-black rounded-xs shadow-2xs">
                              <QRCodeDisplay
                                value={
                                  typeof window !== "undefined"
                                    ? `${window.location.origin}/track-order?orderId=${encodeURIComponent(sticker.orderNumber)}`
                                    : `https://trinayaa.in/track-order?orderId=${encodeURIComponent(sticker.orderNumber)}`
                                }
                                size={88}
                                quietZone={1}
                                title={`Scan Order ${sticker.orderNumber}`}
                              />
                            </div>
                            <div className="text-[7.5px] font-bold text-black uppercase tracking-tight text-center mt-1 leading-none">
                              SCAN FOR ORDER &<br />PRODUCT INFO
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Manifest Brief & Individual Products Summary */}
                      <div className="border border-black p-2 text-[9px] mb-2 space-y-1 bg-gray-50/40">
                        <div className="flex justify-between font-bold border-b border-gray-300 pb-0.5">
                          <span>CONTENTS: {sticker.packageSummary.totalPieces} Botanical Packs</span>
                          <span>Est. Weight: ~{sticker.packageSummary.weightGrams}g</span>
                        </div>
                        <div className="space-y-0.5 text-gray-800">
                          {sticker.packageSummary.itemManifest.map((m: any, mIdx: number) => (
                            <div key={mIdx} className="flex justify-between items-center text-[9px]">
                              <span className="font-semibold truncate max-w-[260px]">• {m.name} ({m.packSize})</span>
                              <span className="font-mono font-bold shrink-0 ml-1">Qty: {m.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipper Origin / Return Address */}
                      <div className="border-t border-black pt-1.5 text-[8px] text-gray-700 flex justify-between items-end">
                        <div>
                          <strong>RETURN / FROM:</strong><br />
                          {sticker.from.name}, Erode, TN - 638011<br />
                          Ph: +91 94422 18990
                        </div>
                        <div className="text-right font-mono font-bold text-[9px]">
                          {sticker.stickerNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Backward-compatible alias for existing callers
export const ShippingSlipModal = OrderDocumentStudioModal;
