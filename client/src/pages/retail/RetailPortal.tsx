import React, { useState, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Store,
  ShoppingCart,
  Package,
  History,
  Layers,
  User,
  LogOut,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Banknote,
  QrCode,
  MapPin,
  RefreshCw,
  X,
  FileText,
  DollarSign,
  ArrowRight,
  Send,
  Eye,
  Calendar,
  Phone,
  Tag,
  Building,
  Check
} from "lucide-react";
import { COOKIE_NAME } from "@shared/const";
import RetailLogin from "./RetailLogin";

type RetailNavTab = "billing" | "stock" | "history" | "dashboard" | "account";

export default function RetailPortal() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<RetailNavTab>("billing");

  // Authentication query
  const { data: currentUser, isLoading: userLoading, refetch: refetchUser } = trpc.auth.me.useQuery();

  // Branch info query
  const { data: myBranch, isLoading: branchLoading } = trpc.retail.myBranch.useQuery(undefined, {
    enabled: Boolean(currentUser && (currentUser.role === "RETAIL_SHOP_HANDLER" || currentUser.role === "SUPER_ADMIN")),
  });

  // Dashboard metrics query
  const { data: metrics, refetch: refetchMetrics } = trpc.retail.dashboardMetrics.useQuery(undefined, {
    enabled: Boolean(currentUser && (currentUser.role === "RETAIL_SHOP_HANDLER" || currentUser.role === "SUPER_ADMIN")),
  });

  // Logout mutation
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      try {
        sessionStorage.removeItem("manus-cookie");
        sessionStorage.removeItem("trinayaa_session_token");
        localStorage.removeItem("trinayaa_session_token");
        localStorage.removeItem("manus-cookie");
      } catch (e) {}
      toast.success("Signed out from Retail POS");
      setLocation("/retail/login");
    },
  });

  // ==========================================
  // POS BILLING STATE & MUTATIONS
  // ==========================================
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState<
    Array<{
      productId: string;
      sku: string;
      nameEn: string;
      nameTa: string;
      packSize: string;
      unitPrice: number;
      quantity: number;
      availableStock: number;
    }>
  >([]);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [saleNotes, setSaleNotes] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Live product search query for POS
  const { data: searchResults = [], isLoading: searchLoading } = trpc.retail.searchProducts.useQuery(
    { query: productSearch },
    { enabled: productSearch.trim().length >= 1 }
  );

  // Complete Sale Mutation
  const createSaleMutation = trpc.retail.createSale.useMutation({
    onSuccess: (sale) => {
      toast.success(`Sale completed successfully! Invoice #${sale.invoice_number}`);
      // Open invoice modal for immediate print
      setSelectedInvoice(sale);
      setIsInvoiceModalOpen(true);
      // Reset cart and customer info
      setCart([]);
      setCustomerName("Walk-in Customer");
      setCustomerPhone("");
      setCustomerEmail("");
      setDiscountAmount(0);
      setDiscountReason("");
      setSaleNotes("");
      setProductSearch("");
      refetchMetrics();
      refetchStock();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to complete retail sale");
    },
  });

  const handleAddToCart = (product: any) => {
    if (product.stockQuantity <= 0) {
      toast.error(`"${product.nameEn}" is currently Out of Stock in this branch.`);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.productId);
      if (existingIndex >= 0) {
        const item = prev[existingIndex];
        if (item.quantity + 1 > product.stockQuantity) {
          toast.warning(`Cannot add more. Branch only has ${product.stockQuantity} units available.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = { ...item, quantity: item.quantity + 1 };
        toast.info(`Updated quantity for ${product.nameEn}`);
        return updated;
      } else {
        toast.success(`Added ${product.nameEn} to cart`);
        return [
          ...prev,
          {
            productId: product.productId,
            sku: product.sku,
            nameEn: product.nameEn,
            nameTa: product.nameTa,
            packSize: product.productType || "Standard Pack",
            unitPrice: product.sellingPrice,
            quantity: 1,
            availableStock: product.stockQuantity,
          },
        ];
      }
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty > item.availableStock) {
              toast.warning(`Cannot exceed available stock (${item.availableStock} units)`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - (discountAmount || 0));
  }, [subtotal, discountAmount]);

  const handleProcessSale = () => {
    if (cart.length === 0) {
      toast.error("Please add at least one item to the cart");
      return;
    }
    createSaleMutation.mutate({
      customerName: customerName.trim() || "Walk-in Customer",
      customerPhone: customerPhone.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      discountAmount: Number(discountAmount) || 0,
      discountReason: discountReason.trim() || undefined,
      paymentMethod,
      notes: saleNotes.trim() || undefined,
      items: cart.map((item) => ({
        productId: item.productId,
        sku: item.sku,
        packSize: item.packSize,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
    });
  };

  // ==========================================
  // BRANCH STOCK STATE & QUERIES
  // ==========================================
  const [stockSearch, setStockSearch] = useState("");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const {
    data: branchStockList = [],
    isLoading: stockLoading,
    refetch: refetchStock,
  } = trpc.retail.branchStock.useQuery({
    search: stockSearch,
    status: stockStatusFilter,
    limit: 250,
  });

  // Stock Adjustment Request State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<any | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState("");

  const requestAdjustmentMutation = trpc.retail.requestStockAdjustment.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Adjustment request ${data.adjustment_number} submitted to Super Admin.`);
      setIsAdjustModalOpen(false);
      setAdjustProduct(null);
      setAdjustDelta(1);
      setAdjustReason("");
      refetchAdjustments();
    },
    onError: (err) => toast.error(err.message || "Failed to submit adjustment request"),
  });

  const { data: myAdjustments = [], refetch: refetchAdjustments } = trpc.retail.myAdjustments.useQuery();

  // ==========================================
  // SALES HISTORY STATE & QUERIES
  // ==========================================
  const [historySearch, setHistorySearch] = useState("");
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState("ALL");
  const {
    data: salesHistory = [],
    isLoading: historyLoading,
    refetch: refetchHistory,
  } = trpc.retail.salesHistory.useQuery({
    search: historySearch,
    paymentMethod: historyPaymentFilter,
    limit: 100,
  });

  // Recent stock movements query
  const { data: stockMovements = [] } = trpc.retail.stockMovements.useQuery({ limit: 40 });

  // Account Password Update State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const updatePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Staff password updated successfully");
      setOldPassword("");
      setNewPassword("");
    },
    onError: (err) => toast.error(err.message || "Failed to update password"),
  });

  // Authentication protection
  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#FBF8F0] flex items-center justify-center p-6 text-[#123D28] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#123D28] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold">Loading TRINAYAA Retail POS...</p>
        </div>
      </div>
    );
  }

  const role = (currentUser?.role || "").toUpperCase();
  if (!currentUser || (role !== "RETAIL_SHOP_HANDLER" && role !== "SUPER_ADMIN")) {
    return <RetailLogin />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      {/* Top Application Bar */}
      <header className="bg-[#123D28] text-[#FBF8F0] px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FBF8F0] p-1 flex items-center justify-center shadow-xs shrink-0">
              <img src="/images/brand/emblem_crisp.png" alt="TRINAYAA" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base tracking-tight text-[#FBF8F0]">
                  TRINAYAA RETAIL POS
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-100 border border-emerald-700">
                  {myBranch?.code || "ERODE-HQ"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 flex items-center gap-1">
                <MapPin size={11} /> {myBranch?.name || "TRINAYAA Erode Flagship Branch"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-[#FBF8F0]">{currentUser.name}</span>
              <span className="text-[10px] text-emerald-300 capitalize">{role.toLowerCase().replace(/_/g, " ")}</span>
            </div>

            <button
              onClick={() => logoutMutation.mutate()}
              title="Sign Out"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-900/80 hover:bg-emerald-900 text-emerald-100 hover:text-white text-xs font-semibold border border-emerald-700/60 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Sub-header */}
      <nav className="bg-white border-b border-[#E2E8F0] px-4 sticky top-[57px] z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab("billing")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "billing"
                ? "bg-[#123D28] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#123D28] hover:bg-[#F1F5F9]"
            }`}
          >
            <ShoppingCart size={15} />
            <span>New Sale / Billing</span>
            {cart.length > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-[#AE6A2B] text-white text-[10px] flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("stock");
              refetchStock();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "stock"
                ? "bg-[#123D28] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#123D28] hover:bg-[#F1F5F9]"
            }`}
          >
            <Package size={15} />
            <span>Branch Stock</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("history");
              refetchHistory();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "history"
                ? "bg-[#123D28] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#123D28] hover:bg-[#F1F5F9]"
            }`}
          >
            <History size={15} />
            <span>Sales History</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("dashboard");
              refetchMetrics();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-[#123D28] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#123D28] hover:bg-[#F1F5F9]"
            }`}
          >
            <Layers size={15} />
            <span>Retail Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("account")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTab === "account"
                ? "bg-[#123D28] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#123D28] hover:bg-[#F1F5F9]"
            }`}
          >
            <User size={15} />
            <span>My Account</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* ======================================================== */}
        {/* TAB 1: POS BILLING & NEW SALE                             */}
        {/* ======================================================== */}
        {activeTab === "billing" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Product Search & Quick Catalog */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
                <label className="block text-xs font-bold text-[#123D28] mb-1.5 flex items-center justify-between">
                  <span>Search Products to Add</span>
                  <span className="text-[11px] text-[#64748B] font-normal">Search by Name or SKU</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-[#94A3B8]" size={16} />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Type botanical name (e.g. Moringa, Ashwagandha) or SKU..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28] focus:bg-white transition-all"
                  />
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch("")}
                      className="absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#475569]"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Auto-suggest dropdown or live results */}
                {productSearch.trim().length >= 1 && (
                  <div className="mt-3 border border-[#E2E8F0] rounded-lg overflow-hidden divide-y divide-[#F1F5F9] max-h-72 overflow-y-auto">
                    {searchLoading ? (
                      <div className="p-4 text-center text-xs text-[#64748B]">Searching branch catalogue...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#64748B]">
                        No botanical products matching "{productSearch}" found in this branch.
                      </div>
                    ) : (
                      searchResults.map((prod: any) => (
                        <div
                          key={prod.id}
                          className="p-2.5 hover:bg-[#F8FAFC] flex items-center justify-between gap-3 transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-md bg-[#F1F5F9] flex items-center justify-center overflow-hidden shrink-0 border border-[#E2E8F0]">
                              {prod.primaryImage ? (
                                <img src={prod.primaryImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package size={18} className="text-[#94A3B8]" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-[#0F172A]">{prod.nameEn}</div>
                              <div className="text-[11px] text-[#64748B]">
                                <span className="font-mono text-[#059669] font-bold">{prod.sku}</span> · {prod.nameTa}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-bold text-[#123D28]">₹{prod.sellingPrice}</div>
                              <div className="text-[10px]">
                                {prod.stockQuantity > 0 ? (
                                  <span className="text-emerald-700 font-semibold">{prod.stockQuantity} in stock</span>
                                ) : (
                                  <span className="text-red-600 font-bold">Out of Stock</span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddToCart(prod)}
                              disabled={prod.stockQuantity <= 0}
                              className="px-3 py-1.5 rounded bg-[#123D28] hover:bg-[#1E5638] text-white font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                              <Plus size={13} /> Add
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Quick Botanical Catalog Grid for Fast Tapping */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif font-bold text-sm text-[#123D28] flex items-center gap-2">
                    <Tag size={16} /> Quick-Select Fast Selling Products
                  </h3>
                  <button
                    onClick={() => {
                      setActiveTab("stock");
                      refetchStock();
                    }}
                    className="text-xs font-bold text-[#123D28] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View All Products <ArrowRight size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
                  {branchStockList.slice(0, 12).map((item: any) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddToCart(item)}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        item.stockQuantity <= 0
                          ? "border-red-200 bg-red-50/40 opacity-60"
                          : "border-[#E2E8F0] hover:border-[#123D28] hover:shadow-xs bg-[#FFFDF8]"
                      }`}
                    >
                      <div>
                        <div className="font-mono text-[10px] text-[#64748B]">{item.sku}</div>
                        <div className="font-bold text-xs text-[#0F172A] line-clamp-1">{item.nameEn}</div>
                        <div className="text-[10px] text-[#64748B] line-clamp-1">{item.nameTa}</div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between">
                        <span className="font-bold text-xs text-[#123D28]">₹{item.sellingPrice}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.stockQuantity > item.lowStockThreshold
                              ? "bg-emerald-100 text-emerald-800"
                              : item.stockQuantity > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.stockQuantity} left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: POS Cart & Checkout Summary */}
            <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-[#123D28]" />
                  <h3 className="font-serif font-bold text-base text-[#123D28]">Retail Cart</h3>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Cart Line Items */}
              {cart.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#94A3B8]">
                  <ShoppingCart size={32} className="mx-auto text-[#CBD5E1] mb-2" />
                  <p>Cart is currently empty.</p>
                  <p className="text-[11px] mt-1">Search or click products on the left to add items.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.productId}
                      className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#0F172A] truncate">{item.nameEn}</div>
                        <div className="text-[11px] text-[#64748B]">
                          ₹{item.unitPrice} × {item.quantity} ={" "}
                          <span className="font-bold text-[#123D28]">₹{item.unitPrice * item.quantity}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => updateCartQty(item.productId, -1)}
                          className="w-6 h-6 rounded bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] flex items-center justify-center font-bold cursor-pointer"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.productId, 1)}
                          className="w-6 h-6 rounded bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] flex items-center justify-center font-bold cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                        <button
                          onClick={() => removeCartItem(item.productId)}
                          className="w-6 h-6 rounded bg-white border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center ml-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer Info (Optional) */}
              <div className="pt-3 border-t border-[#F1F5F9] space-y-2 text-xs">
                <div className="font-bold text-[#123D28] text-[11px] uppercase tracking-wide">
                  Customer Information (Optional)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer Name"
                    className="p-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Mobile (+91...)"
                    className="p-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                </div>
              </div>

              {/* Discount / Deductions */}
              <div className="pt-3 border-t border-[#F1F5F9] space-y-2 text-xs">
                <div className="font-bold text-[#123D28] text-[11px] uppercase tracking-wide">
                  Authorized Discount / Offer
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-[#94A3B8]">₹</span>
                    <input
                      type="number"
                      min={0}
                      value={discountAmount || ""}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      placeholder="0"
                      className="w-full pl-6 pr-2 py-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                    />
                  </div>
                  <input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="Reason (e.g. Festival / Staff)"
                    className="p-1.5 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-3 border-t border-[#F1F5F9] space-y-2 text-xs">
                <div className="font-bold text-[#123D28] text-[11px] uppercase tracking-wide">Offline Payment Mode</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    className={`py-2 px-3 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      paymentMethod === "CASH"
                        ? "bg-[#123D28] text-white border-[#123D28] shadow-xs"
                        : "bg-[#F8FAFC] text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    <Banknote size={14} /> Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("UPI")}
                    className={`py-2 px-3 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      paymentMethod === "UPI"
                        ? "bg-[#123D28] text-white border-[#123D28] shadow-xs"
                        : "bg-[#F8FAFC] text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    <QrCode size={14} /> UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CARD")}
                    className={`py-2 px-3 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      paymentMethod === "CARD"
                        ? "bg-[#123D28] text-white border-[#123D28] shadow-xs"
                        : "bg-[#F8FAFC] text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    <CreditCard size={14} /> Card
                  </button>
                </div>
              </div>

              {/* Financial Calculation Summary */}
              <div className="pt-3 border-t border-[#F1F5F9] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#64748B]">
                  <span>Subtotal:</span>
                  <span className="font-medium text-[#0F172A]">₹{subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-semibold">- ₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-[#E2E8F0] font-bold text-base text-[#123D28]">
                  <span>Total Payable:</span>
                  <span className="font-serif text-xl">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Action */}
              <button
                type="button"
                onClick={handleProcessSale}
                disabled={cart.length === 0 || createSaleMutation.isPending}
                className="w-full py-3 px-4 rounded-lg bg-[#123D28] hover:bg-[#1E5638] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createSaleMutation.isPending ? (
                  "Processing Sale & Deducting Stock..."
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Confirm Sale &amp; Print Invoice (₹{grandTotal.toFixed(2)})
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: BRANCH STOCK & ADJUSTMENTS                         */}
        {/* ======================================================== */}
        {activeTab === "stock" && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif font-bold text-lg text-[#123D28] flex items-center gap-2">
                  <Package size={20} /> Branch Inventory &amp; Stock Levels
                </h2>
                <p className="text-xs text-[#64748B]">
                  Live physical inventory assigned to <span className="font-bold text-[#123D28]">{myBranch?.name}</span> ({myBranch?.code})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetchStock()}
                  className="px-3 py-1.5 rounded-md border border-[#CBD5E1] bg-white text-xs font-semibold hover:bg-[#F8FAFC] flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={13} /> Refresh Stock
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-xs flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 text-[#94A3B8]" size={15} />
                <input
                  type="text"
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  placeholder="Filter stock by product name or SKU..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28]"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs font-semibold text-[#64748B]">Status:</span>
                <select
                  value={stockStatusFilter}
                  onChange={(e: any) => setStockStatusFilter(e.target.value)}
                  className="p-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28]"
                >
                  <option value="all">All Products</option>
                  <option value="in_stock">In Stock (&gt;10 units)</option>
                  <option value="low_stock">Low Stock (≤10 units)</option>
                  <option value="out_of_stock">Out of Stock (0 units)</option>
                </select>
              </div>
            </div>

            {/* Stock Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold">
                    <tr>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Selling Price</th>
                      <th className="py-3 px-4">Available Stock</th>
                      <th className="py-3 px-4">Stock Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {stockLoading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#94A3B8]">
                          Loading branch stock levels...
                        </td>
                      </tr>
                    ) : branchStockList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#94A3B8]">
                          No products found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      branchStockList.map((item: any) => (
                        <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#059669]">{item.sku}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#0F172A]">{item.nameEn}</div>
                            <div className="text-[11px] text-[#64748B]">{item.nameTa}</div>
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">{item.categoryName || "General"}</td>
                          <td className="py-3 px-4 font-bold text-[#123D28]">₹{item.sellingPrice}</td>
                          <td className="py-3 px-4 font-bold text-sm">
                            <span
                              className={
                                item.stockQuantity <= 0
                                  ? "text-red-600"
                                  : item.stockQuantity <= item.lowStockThreshold
                                  ? "text-amber-600"
                                  : "text-emerald-700"
                              }
                            >
                              {item.stockQuantity}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.stockQuantity > item.lowStockThreshold
                                  ? "bg-emerald-100 text-emerald-800"
                                  : item.stockQuantity > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.stockStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setAdjustProduct(item);
                                setAdjustDelta(1);
                                setAdjustReason("");
                                setIsAdjustModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#123D28] transition-colors cursor-pointer"
                            >
                              Request Adjustment
                            </button>
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
        {/* TAB 3: SALES HISTORY & INVOICE REPRINT                   */}
        {/* ======================================================== */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif font-bold text-lg text-[#123D28] flex items-center gap-2">
                  <History size={20} /> Branch Sales History &amp; Invoices
                </h2>
                <p className="text-xs text-[#64748B]">
                  View past offline receipts, check totals, and reprint retail invoices for{" "}
                  <span className="font-bold text-[#123D28]">{myBranch?.name}</span>
                </p>
              </div>

              <button
                onClick={() => refetchHistory()}
                className="px-3 py-1.5 rounded-md border border-[#CBD5E1] bg-white text-xs font-semibold hover:bg-[#F8FAFC] flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={13} /> Refresh List
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-xs flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 text-[#94A3B8]" size={15} />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search by invoice number (TRN-RET-...), customer name or phone..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28]"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs font-semibold text-[#64748B]">Payment:</span>
                <select
                  value={historyPaymentFilter}
                  onChange={(e) => setHistoryPaymentFilter(e.target.value)}
                  className="p-2 text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#123D28]"
                >
                  <option value="ALL">All Payment Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#475569] font-bold">
                    <tr>
                      <th className="py-3 px-4">Invoice #</th>
                      <th className="py-3 px-4">Date &amp; Time</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items Count</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {historyLoading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#94A3B8]">
                          Loading sales records...
                        </td>
                      </tr>
                    ) : salesHistory.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#94A3B8]">
                          No sales recorded matching criteria.
                        </td>
                      </tr>
                    ) : (
                      salesHistory.map((sale: any) => (
                        <tr key={sale.id} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#123D28]">{sale.invoice_number}</td>
                          <td className="py-3 px-4 text-[#64748B]">
                            {new Date(sale.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#0F172A]">{sale.customer_name}</div>
                            {sale.customer_phone && (
                              <div className="text-[11px] text-[#64748B]">{sale.customer_phone}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[#64748B]">{sale.itemCount || 1} items</td>
                          <td className="py-3 px-4 font-bold text-[#123D28]">₹{sale.total.toFixed(2)}</td>
                          <td className="py-3 px-4 font-semibold text-[#475569]">{sale.payment_method}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sale.sale_status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {sale.sale_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedInvoice(sale);
                                setIsInvoiceModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-[#123D28] hover:bg-[#1E5638] text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Printer size={12} /> View / Print
                            </button>
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
        {/* TAB 4: RETAIL DASHBOARD & METRICS                         */}
        {/* ======================================================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-[#64748B] mb-2 text-xs font-semibold">
                  <span>Today's Offline Sales</span>
                  <ShoppingCart size={16} className="text-[#123D28]" />
                </div>
                <div className="text-2xl font-bold font-serif text-[#123D28]">{metrics?.todayCount || 0}</div>
                <div className="text-[11px] text-[#64748B] mt-1">Orders billed today</div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-[#64748B] mb-2 text-xs font-semibold">
                  <span>Today's Verified Revenue</span>
                  <DollarSign size={16} className="text-emerald-700" />
                </div>
                <div className="text-2xl font-bold font-serif text-emerald-700">
                  ₹{(metrics?.todayRevenue || 0).toLocaleString("en-IN")}
                </div>
                <div className="text-[11px] text-[#64748B] mt-1">Cash / UPI / Card collected</div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-[#64748B] mb-2 text-xs font-semibold">
                  <span>Branch Products</span>
                  <Package size={16} className="text-[#AE6A2B]" />
                </div>
                <div className="text-2xl font-bold font-serif text-[#AE6A2B]">{metrics?.totalProducts || 0}</div>
                <div className="text-[11px] text-[#64748B] mt-1">Active items allocated</div>
              </div>

              <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-[#64748B] mb-2 text-xs font-semibold">
                  <span>Low-Stock Alerts</span>
                  <AlertTriangle size={16} className="text-amber-600" />
                </div>
                <div className="text-2xl font-bold font-serif text-amber-600">{metrics?.lowStockCount || 0}</div>
                <div className="text-[11px] text-[#64748B] mt-1">Items at or below threshold (10)</div>
              </div>
            </div>

            {/* Branch Details Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Building size={18} className="text-[#123D28]" />
                <h3 className="font-serif font-bold text-base text-[#123D28]">Physical Branch Profile</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B] block text-[11px]">Branch Name:</span>
                  <span className="font-bold text-[#0F172A]">{myBranch?.name}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Branch Code:</span>
                  <span className="font-mono font-bold text-[#059669]">{myBranch?.code}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Contact Phone:</span>
                  <span className="font-medium text-[#0F172A]">{myBranch?.phone}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-[#64748B] block text-[11px]">Address:</span>
                  <span className="text-[#0F172A]">
                    {myBranch?.address}, {myBranch?.city}, {myBranch?.state} - {myBranch?.pinCode}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[11px]">Branch Email:</span>
                  <span className="text-[#0F172A]">{myBranch?.email || "erode@trinayaa.com"}</span>
                </div>
              </div>
            </div>

            {/* Recent Movements Log */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif font-bold text-base text-[#123D28] flex items-center gap-2">
                  <Layers size={18} /> Recent Branch Stock Movements &amp; Deductions
                </h3>
                <span className="text-[11px] text-[#64748B]">Audited server logs</span>
              </div>
              <div className="divide-y divide-[#F1F5F9] max-h-72 overflow-y-auto text-xs">
                {stockMovements.length === 0 ? (
                  <div className="py-6 text-center text-[#94A3B8]">No movements recorded yet today.</div>
                ) : (
                  stockMovements.map((m: any) => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-[#0F172A]">
                          {m.productName || m.sku}{" "}
                          <span
                            className={`font-mono font-bold text-xs ${
                              m.delta > 0 ? "text-emerald-700" : "text-red-600"
                            }`}
                          >
                            ({m.delta > 0 ? `+${m.delta}` : m.delta})
                          </span>
                        </div>
                        <div className="text-[11px] text-[#64748B]">
                          {m.change_type} · Ref: {m.reference_id || "Manual"} · By: {m.performed_by}
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-[#64748B]">
                        <div>
                          {m.previous_stock} → <span className="font-bold text-[#0F172A]">{m.new_stock}</span>
                        </div>
                        <div>{new Date(m.created_at).toLocaleTimeString("en-IN")}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: MY ACCOUNT                                         */}
        {/* ======================================================== */}
        {activeTab === "account" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs">
              <h2 className="font-serif font-bold text-xl text-[#123D28] mb-1 flex items-center gap-2">
                <User size={22} /> Retail Staff Account Details
              </h2>
              <p className="text-xs text-[#64748B] mb-5">
                Authorized credentials and branch assignment information.
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex justify-between">
                  <span className="text-[#64748B]">Staff Name:</span>
                  <span className="font-bold text-[#0F172A]">{currentUser.name}</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex justify-between">
                  <span className="text-[#64748B]">Staff Email:</span>
                  <span className="font-medium text-[#0F172A]">{currentUser.email}</span>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex justify-between">
                  <span className="text-[#64748B]">Assigned Branch:</span>
                  <span className="font-bold text-[#123D28]">
                    {myBranch?.name} ({myBranch?.code})
                  </span>
                </div>
                <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex justify-between">
                  <span className="text-[#64748B]">Role / Permissions:</span>
                  <span className="font-bold text-[#059669]">{currentUser.role}</span>
                </div>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-xs">
              <h3 className="font-serif font-bold text-base text-[#123D28] mb-1">Update Staff Password</h3>
              <p className="text-xs text-[#64748B] mb-4">
                Update your staff password for security. Must be at least 8 characters.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!oldPassword || !newPassword) {
                    toast.error("Please enter both current and new passwords");
                    return;
                  }
                  updatePasswordMutation.mutate({ oldPassword, newPassword });
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block font-semibold mb-1 text-[#0F172A]">Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#0F172A]">New Password (min 8 chars)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={updatePasswordMutation.isPending}
                  className="px-4 py-2.5 rounded-md bg-[#123D28] hover:bg-[#1E5638] text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: PRINTABLE RETAIL INVOICE MODAL                   */}
      {/* ======================================================== */}
      {isInvoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative font-sans">
            <button
              onClick={() => setIsInvoiceModalOpen(false)}
              className="absolute right-4 top-4 text-[#94A3B8] hover:text-[#475569] p-1 cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Printable Container */}
            <div id="retail-invoice-print-area" className="p-4 border border-[#E2E8F0] rounded-xl bg-white space-y-4">
              {/* Header */}
              <div className="text-center border-b border-[#E2E8F0] pb-4">
                <div className="font-serif font-bold text-xl text-[#123D28] tracking-tight">
                  TRINAYAA ENTERPRISES
                </div>
                <div className="text-[11px] text-[#64748B] mt-0.5">
                  Pure Seeds · Raw Powders · True Herbs
                </div>
                <div className="text-[10px] text-[#475569] mt-1">
                  {selectedInvoice.branchName || myBranch?.name} · {selectedInvoice.branchAddress || myBranch?.address}
                  <br />
                  Ph: {selectedInvoice.branchPhone || myBranch?.phone} · GST Exempted Handcrafted Botanicals
                </div>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-b border-[#F1F5F9]">
                <div>
                  <span className="text-[#64748B] block text-[10px]">RETAIL INVOICE NO:</span>
                  <span className="font-mono font-bold text-sm text-[#123D28]">
                    {selectedInvoice.invoice_number}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#64748B] block text-[10px]">DATE &amp; TIME:</span>
                  <span className="font-medium text-[#0F172A]">
                    {new Date(selectedInvoice.created_at).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">CUSTOMER:</span>
                  <span className="font-bold text-[#0F172A]">{selectedInvoice.customer_name}</span>
                  {selectedInvoice.customer_phone && (
                    <span className="text-[11px] text-[#64748B] block">{selectedInvoice.customer_phone}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[#64748B] block text-[10px]">CASHIER / HANDLER:</span>
                  <span className="font-bold text-[#0F172A]">{selectedInvoice.handler_name}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] border-y border-[#E2E8F0] text-[#475569]">
                    <tr>
                      <th className="py-2 px-2">Item</th>
                      <th className="py-2 px-2">Pack</th>
                      <th className="py-2 px-2 text-right">Qty</th>
                      <th className="py-2 px-2 text-right">Price</th>
                      <th className="py-2 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {(selectedInvoice.items || []).map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="py-2 px-2 font-medium text-[#0F172A]">
                          {item.product_name || item.nameEn}
                        </td>
                        <td className="py-2 px-2 text-[#64748B]">{item.pack_size || "Standard"}</td>
                        <td className="py-2 px-2 text-right font-bold">{item.quantity}</td>
                        <td className="py-2 px-2 text-right">₹{item.unit_price}</td>
                        <td className="py-2 px-2 text-right font-bold text-[#123D28]">
                          ₹{(item.total_price || item.unit_price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t border-[#E2E8F0] pt-3 space-y-1.5 text-xs text-right">
                <div className="flex justify-between text-[#64748B]">
                  <span>Subtotal:</span>
                  <span className="font-medium text-[#0F172A]">₹{selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                {selectedInvoice.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount {selectedInvoice.discount_reason ? `(${selectedInvoice.discount_reason})` : ""}:</span>
                    <span className="font-semibold">- ₹{selectedInvoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-[#E2E8F0] font-bold text-base text-[#123D28]">
                  <span>Total Amount Paid:</span>
                  <span className="font-serif text-xl">₹{selectedInvoice.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#64748B] pt-1">
                  <span>Payment Mode:</span>
                  <span className="font-bold text-[#0F172A]">{selectedInvoice.payment_method} · PAID</span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-3 border-t border-[#E2E8F0] text-[10px] text-[#64748B]">
                Thank you for choosing TRINAYAA Natural Botanicals!
                <br />
                Direct from Erode, Tamil Nadu · For enquiries: support@trinayaa.in
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsInvoiceModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#CBD5E1] text-xs font-semibold hover:bg-[#F8FAFC] cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-lg bg-[#123D28] hover:bg-[#1E5638] text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={15} /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: REQUEST STOCK ADJUSTMENT MODAL                   */}
      {/* ======================================================== */}
      {isAdjustModalOpen && adjustProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative font-sans">
            <button
              onClick={() => setIsAdjustModalOpen(false)}
              className="absolute right-4 top-4 text-[#94A3B8] hover:text-[#475569] p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="font-serif font-bold text-lg text-[#123D28] mb-1">
              Request Stock Adjustment
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              Submit an inventory adjustment request for <span className="font-bold text-[#0F172A]">{adjustProduct.nameEn}</span>.
              Super Admin approval is required.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!adjustDelta || adjustDelta === 0) {
                  toast.error("Adjustment quantity cannot be 0");
                  return;
                }
                if (!adjustReason.trim()) {
                  toast.error("Please provide a reason for the adjustment");
                  return;
                }
                requestAdjustmentMutation.mutate({
                  productId: adjustProduct.productId,
                  sku: adjustProduct.sku,
                  requestedDelta: Number(adjustDelta),
                  reason: adjustReason.trim(),
                });
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">SKU:</span>
                  <span className="font-mono font-bold text-[#059669]">{adjustProduct.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Current Branch Stock:</span>
                  <span className="font-bold text-[#0F172A]">{adjustProduct.stockQuantity} units</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#0F172A]">
                  Adjustment Delta (Positive for restock, Negative for damage/spoilage)
                </label>
                <input
                  type="number"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Number(e.target.value))}
                  placeholder="e.g. +25 or -5"
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#0F172A]">Reason for Adjustment</label>
                <textarea
                  required
                  rows={3}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Received new mill delivery batch #TRN-2026, or damaged packaging..."
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-md focus:bg-white focus:outline-none focus:border-[#123D28]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-md border border-[#CBD5E1] text-xs font-semibold hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestAdjustmentMutation.isPending}
                  className="px-4 py-2 rounded-md bg-[#123D28] hover:bg-[#1E5638] text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {requestAdjustmentMutation.isPending ? "Submitting..." : "Submit for Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
