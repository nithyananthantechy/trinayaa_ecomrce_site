import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import BrandMark from "@/components/BrandMark";
import AuthModal from "@/components/AuthModal";
import {
  RotateCcw,
  Repeat,
  User,
  MapPin,
  ShoppingBag,
  ShieldCheck,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Home as HomeIcon,
  Briefcase,
  Navigation,
  KeyRound,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Package,
  Calendar,
  AlertCircle,
  X,
  Heart,
  LifeBuoy,
  Star,
  Send,
  MessageSquare,
  Award,
  Gift,
  PackageSearch,
} from "lucide-react";

type AccountTab = "profile" | "addresses" | "orders" | "subscriptions" | "returns" | "wishlist" | "tickets" | "feedback" | "rewards" | "enquiries" | "security";

export default function CustomerAccountPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<AccountTab>("profile");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Profile edit state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Address modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrRecipient, setAddrRecipient] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrLandmark, setAddrLandmark] = useState("");
  const [addrCity, setAddrCity] = useState("Erode");
  const [addrDistrict, setAddrDistrict] = useState("");
  const [addrState, setAddrState] = useState("Tamil Nadu");
  const [addrPin, setAddrPin] = useState("638002");
  const [addrType, setAddrType] = useState<"Home" | "Work" | "Other">("Home");
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addrInstructions, setAddrInstructions] = useState("");

  // Change password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Data queries
  const { data: currentUser, isLoading: userLoading, refetch: refetchUser } = trpc.auth.me.useQuery();
  const { data: addresses = [], isLoading: addressesLoading, refetch: refetchAddresses } = trpc.addresses.list.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });
  const { data: orders = [], isLoading: ordersLoading } = trpc.orders.customerOrders.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });

  // Phase 7: Rewards Queries and Redemption State
  const { data: rewardsOverview, refetch: refetchRewardsOverview } = trpc.rewards.myOverview.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });
  const { data: rewardsTransactions = [], refetch: refetchRewardsTransactions } = trpc.rewards.myTransactions.useQuery(
    { limit: 30 },
    { enabled: Boolean(currentUser && activeTab === "rewards") }
  );
  const { data: rewardsRedemptions = [], refetch: refetchRewardsRedemptions } = trpc.rewards.myRedemptions.useQuery(
    { limit: 30 },
    { enabled: Boolean(currentUser && activeTab === "rewards") }
  );
  const { data: eligibleProducts = [] } = trpc.rewards.eligibleProducts.useQuery(undefined, {
    enabled: Boolean(activeTab === "rewards"),
  });

  const [redeemProductModalOpen, setRedeemProductModalOpen] = useState(false);
  const [selectedRedeemProduct, setSelectedRedeemProduct] = useState<any>(null);
  const [redemptionNotes, setRedemptionNotes] = useState("");

  const redeemMutation = trpc.rewards.redeemProduct.useMutation({
    onSuccess: () => {
      toast.success("Free product redemption requested! Our team will dispatch it soon.");
      setRedeemProductModalOpen(false);
      setSelectedRedeemProduct(null);
      setRedemptionNotes("");
      refetchRewardsOverview();
      refetchRewardsTransactions();
      refetchRewardsRedemptions();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to redeem free product");
    },
  });

  // Phase 6: Returns & RMA State
  const { data: myReturns = [], refetch: refetchMyReturns } = trpc.returns.myReturns.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState<any>(null);
  const [returnItemId, setReturnItemId] = useState("");
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnReason, setReturnReason] = useState("Damaged or Broken Seal");
  const [returnDescription, setReturnDescription] = useState("");
  const [pickupInstructions, setPickupInstructions] = useState("");

  const submitReturnMutation = trpc.returns.request.useMutation({
    onSuccess: (res: any) => {
      toast.success(`Return request submitted successfully! RMA: ${res.returnNumber}`);
      setReturnModalOpen(false);
      setReturnOrder(null);
      setReturnItemId("");
      setReturnQuantity(1);
      setReturnDescription("");
      setPickupInstructions("");
      refetchMyReturns();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit return request");
    },
  });

  // Phase 3: Wishlist, Tickets & Feedback state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [ticketCategory, setTicketCategory] = useState("Order issue");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketPriority, setTicketPriority] = useState<"Low" | "Normal" | "High" | "Urgent">("Normal");
  const [ticketOrderId, setTicketOrderId] = useState("");
  const [ticketReplyText, setTicketReplyText] = useState("");

  // Feedback form state
  const [feedbackCategory, setFeedbackCategory] = useState("Overall shopping experience");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackOrderId, setFeedbackOrderId] = useState("");

  // Phase 3 Data Queries
  const { data: wishlistItems = [], isLoading: wishlistLoading, refetch: refetchWishlist } = trpc.wishlist.list.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });
  const { data: myTickets = [], isLoading: ticketsLoading, refetch: refetchTickets } = trpc.tickets.myTickets.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });
  const { data: activeTicketDetail, isLoading: ticketDetailLoading, refetch: refetchActiveTicket } = trpc.tickets.getTicket.useQuery(
    { ticketId: selectedTicketId! },
    { enabled: Boolean(selectedTicketId) }
  );
  const { data: myFeedbackList = [], isLoading: feedbackLoading, refetch: refetchFeedback } = trpc.feedback.myFeedback.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });

  const { data: myEnquiries = [], isLoading: enquiriesLoading, refetch: refetchEnquiries } = trpc.productEnquiries.myEnquiries.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });

  // Phase 7: Subscriptions state & queries
  const [selectedSubForAction, setSelectedSubForAction] = useState<any>(null);
  const [subActionModal, setSubActionModal] = useState<"pause" | "skip" | "settings" | "cancel" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [editQty, setEditQty] = useState(1);
  const [editFreq, setEditFreq] = useState<"15_DAYS" | "30_DAYS" | "45_DAYS" | "60_DAYS" | "90_DAYS">("30_DAYS");

  const { data: subscriptions = [], isLoading: subscriptionsLoading, refetch: refetchSubscriptions } = trpc.subscriptions.mySubscriptions.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });

  const pauseSubMutation = trpc.subscriptions.pause.useMutation({
    onSuccess: () => {
      toast.success("Subscription paused");
      setSubActionModal(null);
      setSelectedSubForAction(null);
      refetchSubscriptions();
    },
    onError: (err) => toast.error(err.message || "Failed to pause subscription"),
  });

  const resumeSubMutation = trpc.subscriptions.resume.useMutation({
    onSuccess: () => {
      toast.success("Subscription resumed successfully");
      refetchSubscriptions();
    },
    onError: (err) => toast.error(err.message || "Failed to resume subscription"),
  });

  const skipSubMutation = trpc.subscriptions.skipNext.useMutation({
    onSuccess: () => {
      toast.success("Next scheduled delivery skipped");
      setSubActionModal(null);
      setSelectedSubForAction(null);
      refetchSubscriptions();
    },
    onError: (err) => toast.error(err.message || "Failed to skip delivery"),
  });

  const updateSubMutation = trpc.subscriptions.update.useMutation({
    onSuccess: () => {
      toast.success("Subscription preferences updated");
      setSubActionModal(null);
      setSelectedSubForAction(null);
      refetchSubscriptions();
    },
    onError: (err) => toast.error(err.message || "Failed to update preferences"),
  });

  const cancelSubMutation = trpc.subscriptions.cancel.useMutation({
    onSuccess: () => {
      toast.success("Subscription cancelled");
      setSubActionModal(null);
      setSelectedSubForAction(null);
      refetchSubscriptions();
    },
    onError: (err) => toast.error(err.message || "Failed to cancel subscription"),
  });

  // Check URL query tab parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["profile", "addresses", "orders", "wishlist", "tickets", "feedback", "rewards", "enquiries", "subscriptions", "security"].includes(tabParam)) {
      setActiveTab(tabParam as AccountTab);
    }
  }, []);

  // Phase 3 Mutations
  const moveToCartMutation = trpc.wishlist.moveToCart.useMutation({
    onSuccess: () => {
      toast.success("Item moved to cart");
      refetchWishlist();
    },
    onError: (err) => toast.error(err.message || "Failed to move to cart"),
  });

  const removeFromWishlistMutation = trpc.wishlist.remove.useMutation({
    onSuccess: () => {
      toast.success("Removed from wishlist");
      refetchWishlist();
    },
    onError: (err) => toast.error(err.message || "Failed to remove item"),
  });

  const createTicketMutation = trpc.tickets.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Support ticket ${data.ticket_number} created successfully`);
      setIsNewTicketModalOpen(false);
      setTicketSubject("");
      setTicketDescription("");
      refetchTickets();
    },
    onError: (err) => toast.error(err.message || "Failed to create support ticket"),
  });

  const replyTicketMutation = trpc.tickets.reply.useMutation({
    onSuccess: () => {
      toast.success("Reply sent to support team");
      setTicketReplyText("");
      refetchActiveTicket();
      refetchTickets();
    },
    onError: (err) => toast.error(err.message || "Failed to send reply"),
  });

  const submitFeedbackMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success("Thank you! Your feedback has been received.");
      setFeedbackTitle("");
      setFeedbackMessage("");
      refetchFeedback();
    },
    onError: (err) => toast.error(err.message || "Failed to submit feedback"),
  });


  // Sync profile state when user loads
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setPhone(currentUser.phone || "");
    }
  }, [currentUser]);

  // Mutations
  const updateProfileMutation = trpc.account.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile details updated successfully");
      setIsEditingProfile(false);
      refetchUser();
    },
    onError: (err) => toast.error(err.message || "Failed to update profile"),
  });

  const createAddressMutation = trpc.addresses.create.useMutation({
    onSuccess: () => {
      toast.success("Delivery address added");
      setIsAddressModalOpen(false);
      resetAddressForm();
      refetchAddresses();
    },
    onError: (err) => toast.error(err.message || "Failed to add address"),
  });

  const updateAddressMutation = trpc.addresses.update.useMutation({
    onSuccess: () => {
      toast.success("Delivery address updated");
      setIsAddressModalOpen(false);
      resetAddressForm();
      refetchAddresses();
    },
    onError: (err) => toast.error(err.message || "Failed to update address"),
  });

  const deleteAddressMutation = trpc.addresses.delete.useMutation({
    onSuccess: () => {
      toast.success("Address removed");
      refetchAddresses();
    },
    onError: (err) => toast.error(err.message || "Failed to remove address"),
  });

  const setDefaultAddressMutation = trpc.addresses.setDefault.useMutation({
    onSuccess: () => {
      toast.success("Default address updated");
      refetchAddresses();
    },
    onError: (err) => toast.error(err.message || "Failed to set default address"),
  });

  const changePasswordMutation = trpc.account.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Password updated successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err) => toast.error(err.message || "Failed to update password"),
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      try {
        sessionStorage.removeItem("manus-cookie");
        localStorage.removeItem("trinayaa_session_token");
      } catch (e) {}
      toast.success("Signed out successfully");
      refetchUser();
      setLocation("/");
    },
  });

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddrRecipient(currentUser?.name || "");
    setAddrPhone(currentUser?.phone || "");
    setAddrLine1("");
    setAddrLine2("");
    setAddrLandmark("");
    setAddrCity("Erode");
    setAddrDistrict("");
    setAddrState("Tamil Nadu");
    setAddrPin("638002");
    setAddrType("Home");
    setAddrIsDefault(addresses.length === 0);
    setAddrInstructions("");
  };

  const openAddAddressModal = () => {
    resetAddressForm();
    setIsAddressModalOpen(true);
  };

  const openEditAddressModal = (addr: any) => {
    setEditingAddressId(addr.id);
    setAddrRecipient(addr.recipientName || "");
    setAddrPhone(addr.phone || "");
    setAddrLine1(addr.addressLine1 || addr.street || "");
    setAddrLine2(addr.addressLine2 || "");
    setAddrLandmark(addr.landmark || "");
    setAddrCity(addr.city || "Erode");
    setAddrDistrict(addr.district || "");
    setAddrState(addr.state || "Tamil Nadu");
    setAddrPin(addr.pinCode || "638002");
    setAddrType(addr.addressType || "Home");
    setAddrIsDefault(Boolean(addr.isDefault));
    setAddrInstructions(addr.deliveryInstructions || "");
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = addrPhone.replace(/[\s\-\(\)\+]/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return;
    }
    const cleanPin = addrPin.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      toast.error("Please enter a valid 6-digit Indian PIN code");
      return;
    }

    if (editingAddressId) {
      updateAddressMutation.mutate({
        id: editingAddressId,
        recipientName: addrRecipient.trim(),
        phone: cleanPhone,
        addressLine1: addrLine1.trim(),
        addressLine2: addrLine2.trim() || undefined,
        landmark: addrLandmark.trim() || undefined,
        city: addrCity.trim(),
        district: addrDistrict.trim() || undefined,
        state: addrState.trim(),
        pinCode: cleanPin,
        addressType: addrType,
        isDefault: addrIsDefault,
        deliveryInstructions: addrInstructions.trim() || undefined,
      });
    } else {
      createAddressMutation.mutate({
        recipientName: addrRecipient.trim(),
        phone: cleanPhone,
        addressLine1: addrLine1.trim(),
        addressLine2: addrLine2.trim() || undefined,
        landmark: addrLandmark.trim() || undefined,
        city: addrCity.trim(),
        district: addrDistrict.trim() || undefined,
        state: addrState.trim(),
        pinCode: cleanPin,
        addressType: addrType,
        isDefault: addrIsDefault,
        deliveryInstructions: addrInstructions.trim() || undefined,
      });
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: oldPassword,
      newPassword,
    });
  };

  // If loading user state
  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7EB] flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-3 border-[#123D28] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#525B4E]">Loading your TRINAYAA account...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show prompt to sign in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FAF7EB] flex flex-col font-sans">
        <header className="border-b border-[#E2DBCB] bg-[#FCFBF7] py-3.5 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="inline-block">
              <BrandMark />
            </Link>
            <Link href="/products" className="text-xs sm:text-sm font-semibold text-[#123D28] hover:text-[#8C6D3F]">
              Browse Products
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#DEDFD5] p-8 max-w-md w-full text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#EAF2ED] text-[#123D28] flex items-center justify-center mx-auto">
              <User size={28} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-[#123D28]">Sign In to Your Account</h2>
            <p className="text-xs text-[#6C7167] leading-relaxed">
              Sign in with your registered email &amp; password or use mobile OTP to manage delivery addresses, track orders, and view purchases.
            </p>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => setAuthModalOpen(true)}
                className="w-full py-3 px-4 bg-[#123D28] hover:bg-[#1A4D33] text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                Sign In / Mobile OTP Login
              </button>
              <Link href="/" className="block py-2 text-xs font-semibold text-[#6C7167] hover:text-[#123D28]">
                Return to Storefront
              </Link>
            </div>
          </div>
        </main>

        
            {/* Phase 6: Customer Return Request Modal */}
      {returnModalOpen && returnOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#DEDFD5] max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE0]">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#123D28] flex items-center gap-1.5">
                  <RotateCcw size={16} className="text-[#8E5E28]" />
                  Request Return / Refund
                </h3>
                <span className="text-xs text-[#6C7167]">Order: {returnOrder.orderNumber}</span>
              </div>
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const matchedItem = returnOrder.items?.find((it: any) => it.id === returnItemId) || returnOrder.items?.[0];
                if (!matchedItem) {
                  toast.error("Please select an item to return");
                  return;
                }
                submitReturnMutation.mutate({
                  orderId: returnOrder.id,
                  orderNumber: returnOrder.orderNumber,
                  orderItemId: matchedItem.id,
                  productId: matchedItem.productId,
                  quantityRequested: Number(returnQuantity),
                  returnReason,
                  description: returnDescription,
                  pickupInstructions: pickupInstructions || undefined,
                });
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#123D28] mb-1">Select Item to Return</label>
                <select
                  value={returnItemId}
                  onChange={(e) => setReturnItemId(e.target.value)}
                  className="w-full p-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] text-[#123D28]"
                  required
                >
                  {returnOrder.items?.map((it: any) => (
                    <option key={it.id} value={it.id}>
                      {it.productNameEn} ({it.packSize}) – Qty: {it.quantity} (₹{it.price} each)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#123D28] mb-1">Quantity to Return</label>
                <input
                  type="number"
                  min={1}
                  max={returnOrder.items?.find((it: any) => it.id === returnItemId)?.quantity || 1}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(Number(e.target.value))}
                  className="w-full p-2 border border-[#DEDFD5] rounded-lg bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#123D28] mb-1">Reason for Return</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full p-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2]"
                  required
                >
                  <option value="Damaged or Broken Seal">Damaged or Broken Seal</option>
                  <option value="Wrong Item Delivered">Wrong Item Delivered</option>
                  <option value="Quality / Aroma Issue">Quality / Aroma Issue</option>
                  <option value="Expired or Near Expiry">Expired or Near Expiry</option>
                  <option value="Not as Described">Not as Described</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#123D28] mb-1">Detailed Description (Min 5 chars)</label>
                <textarea
                  rows={3}
                  minLength={5}
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  placeholder="Please describe the issue in detail..."
                  className="w-full p-2 border border-[#DEDFD5] rounded-lg bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#123D28] mb-1">Pickup Instructions (Optional)</label>
                <input
                  type="text"
                  value={pickupInstructions}
                  onChange={(e) => setPickupInstructions(e.target.value)}
                  placeholder="e.g. Available weekdays 10am to 2pm"
                  className="w-full p-2 border border-[#DEDFD5] rounded-lg bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="py-2 px-4 rounded-xl border border-[#DEDFD5] text-[#6C7167] font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitReturnMutation.isPending}
                  className="py-2 px-5 rounded-xl bg-[#123D28] hover:bg-[#1A4D33] text-white font-bold transition-colors cursor-pointer shadow-2xs"
                >
                  {submitReturnMutation.isPending ? "Submitting..." : "Submit Return Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => refetchUser()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7EB] text-[#1A261D] flex flex-col font-sans">
      {/* Top Announcement */}
      <div className="bg-[#123D28] text-white text-[11px] py-1.5 px-4 text-center font-medium tracking-wide">
        🌿 100% Pure Botanical Powders &amp; Herbs · Customer Wellness Portal
      </div>

      {/* Main Header */}
      <header className="border-b border-[#E2DBCB] bg-[#FCFBF7] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="inline-block">
            <BrandMark />
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/products" className="text-xs sm:text-sm font-semibold text-[#123D28] hover:text-[#8C6D3F] transition-colors">
              Shop Catalogue
            </Link>
            <button
              onClick={() => logoutMutation.mutate()}
              className="py-1.5 px-3 border border-[#DEDFD5] hover:bg-red-50 hover:border-red-200 text-red-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-[#6C7167] mb-4 flex items-center gap-1.5" aria-label="Breadcrumb">
          <Link href="/" className="hover:underline">Home</Link>
          <ChevronRight size={13} />
          <span className="font-bold text-[#123D28]">My Account</span>
        </nav>

        {/* User Welcome Card */}
        <div className="bg-white rounded-3xl border border-[#DEDFD5] p-6 sm:p-8 mb-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#123D28] text-[#FBF8F0] font-serif font-bold text-2xl flex items-center justify-center shadow-xs">
              {currentUser.name?.[0] || "U"}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#AE6A2B] block">
                {currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN" ? "Store Administrator" : "Verified Customer"}
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#123D28]">
                {currentUser.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#6C7167] mt-1">
                <span className="flex items-center gap-1"><Mail size={13} /> {currentUser.email}</span>
                {currentUser.phone && (
                  <span className="flex items-center gap-1"><Phone size={13} /> +91 {currentUser.phone}</span>
                )}
              </div>
            </div>
          </div>

          {currentUser.role === "ADMIN" && (
            <Link href="/admin" className="py-2.5 px-4 bg-[#E8BF83] hover:bg-[#D4AF37] text-[#123D28] font-bold text-xs rounded-xl transition-colors shadow-2xs self-start sm:self-auto flex items-center gap-1.5">
              <ShieldCheck size={15} />
              <span>Open Admin Portal &rarr;</span>
            </Link>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#DEDFD5] mb-6 overflow-x-auto scrollbar-none text-xs font-bold gap-2">
          {[
            { id: "profile" as AccountTab, label: "My Profile", icon: User },
            { id: "addresses" as AccountTab, label: `Saved Addresses (${addresses.length})`, icon: MapPin },
            { id: "orders" as AccountTab, label: `My Orders (${orders.length})`, icon: ShoppingBag },
            { id: "subscriptions" as AccountTab, label: `My Subscriptions (${subscriptions.length})`, icon: Repeat },
            { id: "returns" as AccountTab, label: `Returns & RMAs (${myReturns.length})`, icon: RotateCcw },
            { id: "wishlist" as AccountTab, label: `My Wishlist (${wishlistItems.length})`, icon: Heart },
            { id: "tickets" as AccountTab, label: `Support Helpdesk (${myTickets.length})`, icon: LifeBuoy },
            { id: "feedback" as AccountTab, label: "Feedback & Reviews", icon: Star },
            { id: "rewards" as AccountTab, label: `My Rewards (${rewardsOverview?.balance ?? 0} pts)`, icon: Award },
            { id: "enquiries" as AccountTab, label: `Product Enquiries (${myEnquiries.length})`, icon: PackageSearch },
            { id: "security" as AccountTab, label: "Login & Security", icon: KeyRound },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`pb-3 px-4 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === id
                  ? "border-b-2 border-[#123D28] text-[#123D28] font-bold"
                  : "text-[#6C7167] hover:text-[#123D28]"
              }`}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: PROFILE MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl border border-[#DEDFD5] p-6 sm:p-8 max-w-2xl shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFECE4]">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#123D28]">Personal Information</h2>
                <p className="text-xs text-[#6C7167] mt-0.5">Manage your contact name and registered mobile number.</p>
              </div>
              {!isEditingProfile && (
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(true)}
                  className="py-1.5 px-3 border border-[#DEDFD5] hover:bg-[#FAF8F2] rounded-lg text-xs font-semibold text-[#123D28] transition-colors flex items-center gap-1.5"
                >
                  <Edit2 size={13} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProfileMutation.mutate({ name, phone });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold mb-1 text-[#2B3527]">Full Name</label>
                <input
                  disabled={!isEditingProfile}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#DEDFD5] rounded-xl bg-[#FAF8F2] disabled:opacity-75 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#2B3527]">Email Address (Account Identifier)</label>
                <input
                  disabled
                  value={currentUser.email}
                  className="w-full px-3.5 py-2.5 border border-[#DEDFD5] rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-[#6C7167] mt-1 block">
                  Email address is linked to order invoices and cannot be changed directly.
                </span>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#2B3527]">Mobile Number (for OTP &amp; Delivery Updates)</label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-[#ECE5D4] border border-r-0 border-[#DEDFD5] rounded-l-xl font-bold text-[#123D28]">
                    +91
                  </span>
                  <input
                    disabled={!isEditingProfile}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 border border-[#DEDFD5] rounded-r-xl bg-[#FAF8F2] disabled:opacity-75 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>
              </div>

              {isEditingProfile && (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="py-2.5 px-6 bg-[#123D28] hover:bg-[#1A4D33] text-white font-bold rounded-xl transition-colors shadow-xs"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setName(currentUser.name || "");
                      setPhone(currentUser.phone || "");
                      setIsEditingProfile(false);
                    }}
                    className="py-2.5 px-4 border border-[#DEDFD5] hover:bg-[#FAF8F2] text-[#4A5546] font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: ADDRESS BOOK */}
        {/* ======================================================== */}
        {activeTab === "addresses" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#DEDFD5] shadow-xs">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#123D28]">Saved Delivery Addresses</h2>
                <p className="text-xs text-[#6C7167] mt-0.5">
                  Manage addresses for faster checkout. Orders are dispatched from Erode, Tamil Nadu.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddAddressModal}
                className="py-2 px-4 bg-[#123D28] hover:bg-[#1A4D33] text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>Add New Address</span>
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#DEDFD5] p-12 text-center space-y-3">
                <MapPin size={36} className="mx-auto text-slate-300" />
                <h3 className="font-serif text-lg font-bold text-[#123D28]">No saved addresses yet</h3>
                <p className="text-xs text-[#6C7167] max-w-sm mx-auto">
                  Add your home or workplace delivery address so you can complete future orders with a single tap.
                </p>
                <button
                  type="button"
                  onClick={openAddAddressModal}
                  className="py-2.5 px-5 bg-[#123D28] hover:bg-[#1A4D33] text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  Add First Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {addresses.map((addr: any) => (
                  <div
                    key={addr.id}
                    className={`bg-white rounded-2xl border p-5 flex flex-col justify-between shadow-2xs relative transition-all ${
                      addr.isDefault ? "border-[#123D28] ring-1 ring-[#123D28]" : "border-[#DEDFD5] hover:border-[#B5BBAF]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF5EB] text-[#8E5E28] border border-[#DECFB5]">
                          {addr.addressType === "Work" ? <Briefcase size={10} /> : <HomeIcon size={10} />}
                          <span>{addr.addressType || "Home"}</span>
                        </span>
                        {addr.isDefault ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={11} /> Default
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDefaultAddressMutation.mutate({ id: addr.id })}
                            className="text-[10px] text-[#AE6A2B] hover:underline font-semibold"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>

                      <strong className="text-sm text-[#123D28] block mb-1">{addr.recipientName}</strong>
                      <p className="text-xs text-[#4A5546] leading-relaxed">
                        {addr.addressLine1 || addr.street}
                        {addr.addressLine2 && <><br />{addr.addressLine2}</>}
                        {addr.landmark && <><br /><span className="text-[#6C7167]">Landmark: {addr.landmark}</span></>}
                        <br />
                        {addr.city}, {addr.state} – <span className="font-mono font-semibold">{addr.pinCode}</span>
                      </p>
                      <div className="mt-2 pt-2 border-t border-[#F2ECE0] text-[11px] text-[#6C7167] flex items-center gap-1">
                        <Phone size={12} className="text-[#AE6A2B]" />
                        <span>+91 {addr.phone}</span>
                      </div>
                      {addr.deliveryInstructions && (
                        <div className="mt-1 text-[10px] text-slate-500 italic">
                          Note: {addr.deliveryInstructions}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F2ECE0] flex items-center justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => openEditAddressModal(addr)}
                        className="p-1.5 text-[#123D28] hover:bg-[#FAF8F2] rounded-lg transition-colors flex items-center gap-1 font-semibold"
                        title="Edit address"
                      >
                        <Edit2 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete delivery address for ${addr.recipientName}?`)) {
                            deleteAddressMutation.mutate({ id: addr.id });
                          }
                        }}
                        className="p-1.5 text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                        title="Delete address"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3B: RETURNS & RMA MANAGEMENT (Phase 6) */}
        {/* ======================================================== */}
        
        {/* ======================================================== */}
        {/* TAB: SUBSCRIPTIONS & RECURRING DELIVERIES (PHASE 7) */}
        {/* ======================================================== */}
        {activeTab === "subscriptions" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFECE4] gap-2">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#123D28] flex items-center gap-2">
                  <Repeat size={20} className="text-[#AE6A2B]" /> My Botanical Subscriptions
                </h2>
                <p className="text-xs text-[#6C7167] mt-0.5">
                  Manage your automated wellness deliveries, pause or skip anytime with zero penalties.
                </p>
              </div>
              <Link
                href="/products"
                className="py-1.5 px-3 bg-[#123D28] hover:bg-[#0B2518] text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus size={13} /> Subscribe to a Product
              </Link>
            </div>

            {subscriptions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#DEDFD5] p-12 text-center max-w-lg mx-auto shadow-xs space-y-3">
                <div className="w-14 h-14 bg-[#FAF7EB] text-[#123D28] rounded-full flex items-center justify-center mx-auto">
                  <Repeat size={28} />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#123D28]">No active subscriptions yet</h3>
                <p className="text-xs text-[#6C7167]">
                  Never run out of pure herbal powders, natural seeds, and wellness botanicals. Enjoy scheduled deliveries right to your doorstep.
                </p>
                <Link
                  href="/products"
                  className="inline-block py-2.5 px-6 bg-[#123D28] hover:bg-[#0B2518] text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Explore Botanical Catalogue &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((sub: any) => {
                  const freqMap: Record<string, string> = {
                    "15_DAYS": "Every 15 Days",
                    "30_DAYS": "Every 30 Days (Monthly)",
                    "45_DAYS": "Every 45 Days",
                    "60_DAYS": "Every 60 Days",
                    "90_DAYS": "Every 90 Days",
                  };
                  const freqText = freqMap[sub.frequency] || sub.frequency;

                  const statusBadgeClass =
                    sub.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : sub.status === "PAUSED"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : sub.status === "PAYMENT_PENDING"
                      ? "bg-blue-100 text-blue-800 border-blue-300"
                      : sub.status === "CANCELLED"
                      ? "bg-gray-100 text-gray-700 border-gray-300"
                      : "bg-rose-100 text-rose-800 border-rose-300";

                  return (
                    <div
                      key={sub.id}
                      className="bg-white rounded-2xl border border-[#DEDFD5] p-5 shadow-xs transition-all hover:border-[#123D28]/30 space-y-4"
                    >
                      {/* Top Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#123D28]">{sub.subscriptionNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] border ${statusBadgeClass}`}>
                            {sub.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                          <span className="bg-[#FAF8F5] border border-gray-200 px-2.5 py-0.5 rounded-md font-semibold text-gray-700">
                            {freqText}
                          </span>
                          <span>Started: {sub.startDate?.slice(0, 10)}</span>
                        </div>
                      </div>

                      {/* Main Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Product details */}
                        <div className="flex items-center gap-3">
                          <img
                            src={sub.productSnapshot?.image || "/images/products/packaged/pouch_001.png"}
                            alt={sub.productName}
                            className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                            onError={(e: any) => { e.target.src = "/images/products/packaged/pouch_001.png"; }}
                          />
                          <div>
                            <div className="font-bold text-[#123D28] text-sm">{sub.productName}</div>
                            <div className="text-gray-500">Pack: {sub.variantLabel || "Standard"} · Qty: {sub.quantity}</div>
                            <div className="text-[11px] font-semibold text-[#AE6A2B] mt-0.5">
                              ₹{sub.unitPrice} each · Total/cycle: ₹{sub.totalPerCycle}
                            </div>
                          </div>
                        </div>

                        {/* Schedule & Delivery Info */}
                        <div className="bg-[#FAF7EB] p-3 rounded-xl space-y-1 text-gray-700">
                          <div className="font-bold text-[#123D28] flex items-center gap-1">
                            <Calendar size={13} /> Next Scheduled Delivery:
                          </div>
                          <div className="text-xs font-semibold text-gray-900">
                            {sub.status === "PAUSED" ? (
                              <span className="text-amber-800">Paused (Will resume upon request)</span>
                            ) : sub.status === "CANCELLED" ? (
                              <span className="text-gray-500">Subscription Terminated</span>
                            ) : (
                              <span>{sub.nextDeliveryDate?.slice(0, 10)}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-600">
                            Payment: {sub.paymentPreference === "COD" ? "Cash on Delivery" : "Online Renewal"}
                          </div>
                          {sub.failureReason && (
                            <div className="text-[11px] text-red-600 font-semibold">
                              Notice: {sub.failureReason}
                            </div>
                          )}
                        </div>

                        {/* Delivery Destination */}
                        <div className="p-3 bg-gray-50 rounded-xl space-y-1 text-gray-700">
                          <div className="font-bold text-[#123D28] flex items-center gap-1">
                            <MapPin size={13} /> Destination:
                          </div>
                          <div className="text-[11px] line-clamp-2">
                            {sub.deliveryAddress?.street || sub.deliveryAddress?.addressLine1},{" "}
                            {sub.deliveryAddress?.city}, {sub.deliveryAddress?.pinCode}
                          </div>
                          {sub.deliveryInstructions && (
                            <div className="text-[10px] text-gray-500 italic">
                              "{sub.deliveryInstructions}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Generated Orders History */}
                      {sub.orders && sub.orders.length > 0 && (
                        <div className="pt-2 border-t border-gray-100">
                          <div className="text-[11px] font-bold text-gray-700 mb-1.5">Associated Orders ({sub.orders.length}):</div>
                          <div className="flex flex-wrap gap-2">
                            {sub.orders.map((ord: any) => (
                              <div
                                key={ord.id}
                                className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[11px] flex items-center gap-1.5"
                              >
                                <span className="font-mono font-bold text-[#123D28]">{ord.orderNumber}</span>
                                <span className="text-gray-500">₹{ord.total}</span>
                                <span className="text-emerald-700 font-medium">({ord.orderStatus})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-[11px] text-gray-500">
                          Completed cycles: <strong>{sub.cycleCount}</strong>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {sub.status === "ACTIVE" && (
                            <>
                              <button
                                type="button"
                                className="py-1 px-3 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold transition-colors"
                                onClick={() => {
                                  setSelectedSubForAction(sub);
                                  setActionReason("");
                                  setSubActionModal("pause");
                                }}
                              >
                                Pause
                              </button>
                              <button
                                type="button"
                                className="py-1 px-3 border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg text-xs font-semibold transition-colors"
                                onClick={() => {
                                  setSelectedSubForAction(sub);
                                  setActionReason("");
                                  setSubActionModal("skip");
                                }}
                              >
                                Skip Next
                              </button>
                              <button
                                type="button"
                                className="py-1 px-3 border border-gray-300 hover:bg-gray-100 text-gray-800 rounded-lg text-xs font-semibold transition-colors"
                                onClick={() => {
                                  setSelectedSubForAction(sub);
                                  setEditQty(sub.quantity);
                                  setEditFreq(sub.frequency);
                                  setSubActionModal("settings");
                                }}
                              >
                                Settings
                              </button>
                              <button
                                type="button"
                                className="py-1 px-3 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition-colors"
                                onClick={() => {
                                  setSelectedSubForAction(sub);
                                  setActionReason("");
                                  setSubActionModal("cancel");
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {sub.status === "PAUSED" && (
                            <>
                              <button
                                type="button"
                                className="py-1 px-3 bg-[#123D28] hover:bg-[#0B2518] text-white rounded-lg text-xs font-bold transition-colors"
                                onClick={() => resumeSubMutation.mutate({ id: sub.id })}
                                disabled={resumeSubMutation.isPending}
                              >
                                {resumeSubMutation.isPending ? "Resuming..." : "Resume Subscription"}
                              </button>
                              <button
                                type="button"
                                className="py-1 px-3 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold transition-colors"
                                onClick={() => {
                                  setSelectedSubForAction(sub);
                                  setActionReason("");
                                  setSubActionModal("cancel");
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          )}

                          {sub.status === "CANCELLED" && (
                            <span className="text-[11px] text-gray-500 italic">
                              Subscription cancelled ({sub.cancellationReason || "Customer requested"})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Modals for Pause, Skip, Cancel, Settings */}
            {subActionModal && selectedSubForAction && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
                  {subActionModal === "pause" && (
                    <>
                      <h3 className="text-base font-bold text-[#123D28] font-serif">Pause Subscription</h3>
                      <p className="text-gray-600">
                        Pausing will hold upcoming deliveries for <strong>{selectedSubForAction.productName}</strong>. You can resume anytime.
                      </p>
                      <div>
                        <label className="block font-semibold mb-1">Reason for pausing (optional):</label>
                        <input
                          type="text"
                          value={actionReason}
                          onChange={(e) => setActionReason(e.target.value)}
                          placeholder="e.g. Travelling / Have enough stock"
                          className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          className="py-2 px-3 border rounded-lg text-gray-700"
                          onClick={() => setSubActionModal(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
                          onClick={() => pauseSubMutation.mutate({ id: selectedSubForAction.id, reason: actionReason })}
                          disabled={pauseSubMutation.isPending}
                        >
                          {pauseSubMutation.isPending ? "Pausing..." : "Confirm Pause"}
                        </button>
                      </div>
                    </>
                  )}

                  {subActionModal === "skip" && (
                    <>
                      <h3 className="text-base font-bold text-[#123D28] font-serif">Skip Next Delivery</h3>
                      <p className="text-gray-600">
                        Skip the delivery scheduled for <strong>{selectedSubForAction.nextDeliveryDate?.slice(0, 10)}</strong>.
                        Your schedule will automatically advance by one frequency interval without generating an order.
                      </p>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          className="py-2 px-3 border rounded-lg text-gray-700"
                          onClick={() => setSubActionModal(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="py-2 px-4 bg-[#123D28] text-white rounded-lg font-bold"
                          onClick={() => skipSubMutation.mutate({ id: selectedSubForAction.id, reason: "Customer skipped" })}
                          disabled={skipSubMutation.isPending}
                        >
                          {skipSubMutation.isPending ? "Skipping..." : "Confirm Skip"}
                        </button>
                      </div>
                    </>
                  )}

                  {subActionModal === "settings" && (
                    <>
                      <h3 className="text-base font-bold text-[#123D28] font-serif">Update Subscription Settings</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block font-semibold mb-1">Quantity per Delivery:</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={editQty}
                            onChange={(e) => setEditQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1">Frequency:</label>
                          <select
                            value={editFreq}
                            onChange={(e) => setEditFreq(e.target.value as any)}
                            className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                          >
                            <option value="15_DAYS">Every 15 Days</option>
                            <option value="30_DAYS">Every 30 Days (Monthly)</option>
                            <option value="45_DAYS">Every 45 Days</option>
                            <option value="60_DAYS">Every 60 Days</option>
                            <option value="90_DAYS">Every 90 Days</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          className="py-2 px-3 border rounded-lg text-gray-700"
                          onClick={() => setSubActionModal(null)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="py-2 px-4 bg-[#123D28] text-white rounded-lg font-bold"
                          onClick={() => updateSubMutation.mutate({ id: selectedSubForAction.id, quantity: editQty, frequency: editFreq as any })}
                          disabled={updateSubMutation.isPending}
                        >
                          {updateSubMutation.isPending ? "Saving..." : "Save Settings"}
                        </button>
                      </div>
                    </>
                  )}

                  {subActionModal === "cancel" && (
                    <>
                      <h3 className="text-base font-bold text-red-700 font-serif">Cancel Subscription</h3>
                      <p className="text-gray-600">
                        Are you sure you want to cancel your subscription for <strong>{selectedSubForAction.productName}</strong>? Future recurring deliveries will stop immediately.
                      </p>
                      <div>
                        <label className="block font-semibold mb-1 text-gray-700">Reason for cancellation *</label>
                        <input
                          type="text"
                          value={actionReason}
                          onChange={(e) => setActionReason(e.target.value)}
                          placeholder="e.g. Relocating / Switching products"
                          className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          className="py-2 px-3 border rounded-lg text-gray-700"
                          onClick={() => setSubActionModal(null)}
                        >
                          Keep Subscription
                        </button>
                        <button
                          type="button"
                          className="py-2 px-4 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold"
                          disabled={!actionReason.trim() || cancelSubMutation.isPending}
                          onClick={() => cancelSubMutation.mutate({ id: selectedSubForAction.id, reason: actionReason })}
                        >
                          {cancelSubMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "returns" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-[#DEDFD5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#123D28]">Customer Returns & RMA Requests</h2>
                <p className="text-xs text-[#6C7167] mt-0.5">
                  Track return requests, courier pickups, quality inspections, and refund status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("orders")}
                className="py-2 px-3.5 bg-[#123D28] text-white rounded-xl text-xs font-bold hover:bg-[#1A4D33] transition-colors self-start sm:self-auto flex items-center gap-1.5 shadow-2xs"
              >
                <ShoppingBag size={13} />
                <span>Select Order to Return</span>
              </button>
            </div>

            {myReturns.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#DEDFD5] p-12 text-center space-y-3">
                <RotateCcw size={36} className="mx-auto text-slate-300" />
                <h3 className="font-serif text-lg font-bold text-[#123D28]">No Return Requests</h3>
                <p className="text-xs text-[#6C7167] max-w-sm mx-auto">
                  You have not submitted any return requests. Returns can be initiated for delivered orders within eligible return windows.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myReturns.map((ret: any) => {
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
                    <div key={ret.id} className="bg-white rounded-2xl border border-[#DEDFD5] p-5 shadow-2xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F2ECE0]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm text-[#123D28]">{ret.returnNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(ret.status)}`}>
                            {ret.status.replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] text-[#6C7167]">
                            Order: <strong>{ret.orderNumber}</strong>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-[#6C7167] block">Refund Amount</span>
                          <strong className="text-sm font-serif text-[#123D28]">₹{ret.refundAmount}</strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FAF8F2] p-3 rounded-xl border border-[#EFECE4]">
                        <div>
                          <span className="text-[#6C7167] block text-[10px] uppercase font-bold tracking-wider">Item Details</span>
                          <strong className="text-[#123D28] block">{ret.productName}</strong>
                          <span className="text-[#6C7167]">Pack: {ret.packSize} · Qty to Return: {ret.quantityRequested}</span>
                        </div>
                        <div>
                          <span className="text-[#6C7167] block text-[10px] uppercase font-bold tracking-wider">Reason for Return</span>
                          <span className="font-semibold text-[#8E5E28] block">{ret.returnReason}</span>
                          <p className="text-[11px] text-[#6C7167] mt-0.5">"{ret.description}"</p>
                        </div>
                      </div>

                      {/* Refund & Stock Disposition info if processed */}
                      {(ret.status === "REFUNDED" || ret.refundReference) && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                          <div>
                            <span className="font-bold block">✓ Refund Processed: ₹{ret.refundAmount}</span>
                            <span className="text-[11px]">Method: {ret.refundMethod || "Payment Source / COD"} · Ref: {ret.refundReference}</span>
                          </div>
                          {ret.refundedAt && (
                            <span className="text-[10px] text-emerald-700">
                              {new Date(ret.refundedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}

                      {/* History timeline */}
                      {ret.history && ret.history.length > 0 && (
                        <div className="pt-2 border-t border-[#F2ECE0] text-[11px] text-[#6C7167] space-y-1">
                          <span className="font-bold text-[#123D28] block">Activity Log:</span>
                          {ret.history.map((h: any) => (
                            <div key={h.id} className="flex items-center justify-between">
                              <span>• {h.note || h.action}</span>
                              <span className="text-[10px] text-gray-400">{new Date(h.createdAt).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ORDER HISTORY */}
        {/* ======================================================== */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-[#DEDFD5] shadow-xs">
              <h2 className="font-serif text-lg font-bold text-[#123D28]">Previous Orders</h2>
              <p className="text-xs text-[#6C7167] mt-0.5">
                Review your order details, delivery tracking status, and dispatched items.
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#DEDFD5] p-12 text-center space-y-3">
                <ShoppingBag size={36} className="mx-auto text-slate-300" />
                <h3 className="font-serif text-lg font-bold text-[#123D28]">You haven’t placed any orders yet</h3>
                <p className="text-xs text-[#6C7167] max-w-sm mx-auto">
                  Explore our collection of 162 pure botanical seeds, raw herbal powders, and whole herbs.
                </p>
                <Link href="/products" className="inline-block py-2.5 px-5 bg-[#123D28] hover:bg-[#1A4D33] text-white font-bold rounded-xl text-xs transition-colors shadow-xs">
                  Explore Botanical Catalogue
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: any) => {
                  let parsedAddress: any = {};
                  try {
                    parsedAddress = typeof order.shippingAddress === "string"
                      ? JSON.parse(order.shippingAddress)
                      : order.shippingAddress || {};
                  } catch (e) {
                    parsedAddress = {};
                  }

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-[#DEDFD5] p-5 shadow-2xs space-y-4"
                    >
                      {/* Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F2ECE0]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#123D28]">
                              {order.orderNumber}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                order.orderStatus === "Delivered"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : order.orderStatus === "Shipped"
                                  ? "bg-blue-100 text-blue-800"
                                  : order.orderStatus === "Cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {order.orderStatus}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#6C7167]">
                            Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })} · Payment: <strong>{order.paymentMethod}</strong> ({order.paymentStatus})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link href={`/track-order?orderId=${order.orderNumber}`} className="py-1.5 px-3 bg-[#FAF5EB] hover:bg-[#F2E8D3] border border-[#DECFB5] text-[#8E5E28] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1">
                            <Navigation size={12} />
                            <span>Track Delivery</span>
                          </Link>
                          <div className="font-serif font-bold text-base text-[#123D28] pl-2">
                            ₹{order.total}
                          </div>
                        </div>
                      </div>

                      {/* Items List */}
                      <div className="text-xs">
                        <span className="text-[11px] font-bold text-[#6C7167] uppercase tracking-wider block mb-2">
                          Ordered Items
                        </span>
                        <div className="divide-y divide-[#F2ECE0] border border-[#F2ECE0] rounded-xl overflow-hidden bg-[#FAF8F2]/40">
                          {order.items?.map((it: any) => (
                            <div key={it.id} className="p-3 flex items-center justify-between">
                              <div>
                                <strong className="text-[#123D28] block">{it.productNameEn}</strong>
                                <span className="text-[11px] text-[#6C7167]">
                                  Pack: {it.packSize} · Qty: {it.quantity}
                                </span>
                              </div>
                              <span className="font-semibold text-[#123D28]">₹{it.price * it.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Phase 6: Gift Order Badge & Message */}
                      {Boolean(order.isGiftOrder) && (
                        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs flex items-start gap-2.5">
                          <Gift size={16} className="text-[#8E5E28] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[#8E5E28] block">🎁 Gift Delivery Order</span>
                            {order.giftMessage && (
                              <p className="text-[#6C7167] italic mt-0.5">"{order.giftMessage}"</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Phase 6: Distinct Ship To & Bill To Address Snapshots */}
                      <div className="bg-[#FAF8F2] p-3.5 rounded-xl border border-[#EFECE4] text-xs grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <span className="text-[#6C7167] block text-[10px] uppercase font-bold tracking-wider">
                            Ship To (Delivery Recipient):
                          </span>
                          <strong className="text-[#123D28] block">
                            {order.recipientName || parsedAddress.recipientName || order.customerName}
                          </strong>
                          <span className="text-[#2C382A]">
                            {parsedAddress.street || parsedAddress.addressLine1},{" "}
                            {parsedAddress.city}, {parsedAddress.state} – {parsedAddress.pinCode}
                          </span>
                          {order.recipientPhone && (
                            <span className="text-[11px] text-[#6C7167] block">Phone: {order.recipientPhone}</span>
                          )}
                        </div>

                        <div>
                          <span className="text-[#6C7167] block text-[10px] uppercase font-bold tracking-wider">
                            Bill To (Purchaser / Invoiced):
                          </span>
                          <strong className="text-[#123D28] block">
                            {order.billingName || order.customerName}
                          </strong>
                          <span className="text-[#2C382A]">
                            {order.isSameAddress
                              ? "Same as delivery address"
                              : typeof order.billingAddress === "string"
                              ? order.billingAddress
                              : `${order.billingAddress?.street || ""}, ${order.billingAddress?.city || ""}`}
                          </span>
                          {order.billingPhone && (
                            <span className="text-[11px] text-[#6C7167] block">Phone: {order.billingPhone}</span>
                          )}
                        </div>
                      </div>

                      {/* Phase 6: Actions - Return Request & Tracking */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F2ECE0]">
                        <div className="flex items-center gap-2">
                          {order.trackingNumber && (
                            <span className="text-[11px] text-[#123D28] font-mono font-bold bg-[#EAF2ED] px-2 py-0.5 rounded">
                              AWB: {order.trackingNumber} ({order.carrier || "Express Courier"})
                            </span>
                          )}
                        </div>

                        {(order.orderStatus === "Delivered" || order.orderStatus === "Completed") && (
                          <button
                            type="button"
                            onClick={() => {
                              setReturnOrder(order);
                              setReturnItemId(order.items?.[0]?.id || "");
                              setReturnQuantity(1);
                              setReturnModalOpen(true);
                            }}
                            className="py-1 px-3 bg-[#FBF8F0] hover:bg-[#F2ECE0] border border-[#DEDFD5] text-[#123D28] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <RotateCcw size={13} className="text-[#8E5E28]" />
                            <span>Request Return / Refund</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: LOGIN & SECURITY */}
        {/* ======================================================== */}
        
        {/* ========================================== */}
        {/* TAB 4: MY WISHLIST & SAVE FOR LATER        */}
        {/* ========================================== */}
        {activeTab === "wishlist" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDFD5]">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#123D28]">My Saved Botanicals</h2>
                <p className="text-xs text-[#6C7167]">Products you saved for later or wishlist</p>
              </div>
              <Link href="/products" className="py-2 px-3.5 bg-[#123D28] text-white rounded-xl text-xs font-bold hover:bg-[#1A4D33] transition-colors flex items-center gap-1.5 shadow-2xs">
                <Plus size={13} /> Browse Catalogue
              </Link>
            </div>

            {wishlistLoading ? (
              <div className="text-center py-12 text-[#6C7167] text-xs">Loading saved items...</div>
            ) : wishlistItems.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#DEDFD5] p-12 text-center max-w-lg mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                  <Heart size={24} />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#123D28]">Your Wishlist is Empty</h3>
                <p className="text-xs text-[#6C7167] leading-relaxed">
                  Save your preferred traditional botanical herbs, powders, and seeds while browsing to easily re-order or purchase later.
                </p>
                <Link href="/products" className="inline-block py-2.5 px-5 bg-[#123D28] text-white rounded-xl text-xs font-bold hover:bg-[#1A4D33] transition-colors">
                  Explore 162 Pure Botanicals
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlistItems.map((item: any) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-[#DEDFD5] p-4 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex gap-3">
                      <div className="w-20 h-20 rounded-xl bg-[#FAF7EB] border border-[#E2DBCB] overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={item.primaryImage || `/images/products/packaged/${item.sku.toLowerCase()}.jpg`}
                          alt={item.nameEn}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/images/products/placeholders/raw-powders.svg";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-[#AE6A2B] uppercase">{item.sku}</span>
                        <h4 className="font-bold text-sm text-[#123D28] truncate">{item.nameEn}</h4>
                        <div className="text-xs text-[#6C7167] truncate">{item.nameTa}</div>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="font-bold text-sm text-[#123D28]">₹{item.sellingPrice}</span>
                          <span className="text-xs text-slate-400 line-through">₹{item.mrp}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => moveToCartMutation.mutate({ productId: item.id })}
                        disabled={moveToCartMutation.isPending}
                        className="flex-1 py-2 px-3 bg-[#123D28] text-white rounded-lg text-xs font-bold hover:bg-[#1A4D33] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag size={13} /> Move to Cart
                      </button>
                      <button
                        onClick={() => removeFromWishlistMutation.mutate({ productId: item.id })}
                        disabled={removeFromWishlistMutation.isPending}
                        className="p-2 border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-lg transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 5: SUPPORT HELPDESK & TICKETS          */}
        {/* ========================================== */}
        {activeTab === "tickets" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#DEDFD5] gap-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#123D28]">Support Helpdesk</h2>
                <p className="text-xs text-[#6C7167]">Track issues, order questions, and communicate directly with TRINAYAA customer care</p>
              </div>
              <button
                onClick={() => setIsNewTicketModalOpen(true)}
                className="py-2.5 px-4 bg-[#123D28] text-white rounded-xl text-xs font-bold hover:bg-[#1A4D33] transition-colors flex items-center gap-1.5 self-start sm:self-auto shadow-2xs"
              >
                <Plus size={14} /> Raise Support Ticket
              </button>
            </div>

            {ticketsLoading ? (
              <div className="text-center py-12 text-[#6C7167] text-xs">Loading support tickets...</div>
            ) : myTickets.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#DEDFD5] p-12 text-center max-w-lg mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
                  <LifeBuoy size={24} />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#123D28]">No Open Support Tickets</h3>
                <p className="text-xs text-[#6C7167] leading-relaxed">
                  Have a question about a delivery, pure herbal usage, or need help with a payment? Raise a ticket anytime and our team will resolve it promptly.
                </p>
                <button
                  onClick={() => setIsNewTicketModalOpen(true)}
                  className="py-2.5 px-5 bg-[#123D28] text-white rounded-xl text-xs font-bold hover:bg-[#1A4D33] transition-colors"
                >
                  Create Your First Ticket
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myTickets.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className="bg-white rounded-2xl border border-[#DEDFD5] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-[#123D28] transition-all shadow-2xs"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#123D28] bg-[#FAF7EB] px-2 py-0.5 rounded border border-[#E2DBCB]">
                          {t.ticket_number}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {t.category}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            t.status === "Open"
                              ? "bg-emerald-100 text-emerald-800"
                              : t.status === "In Progress"
                              ? "bg-blue-100 text-blue-800"
                              : t.status === "Waiting for Customer"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {t.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#123D28] truncate">{t.subject}</h4>
                      <p className="text-xs text-[#6C7167] line-clamp-1">{t.description}</p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 text-xs text-[#6C7167] gap-2">
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      <button className="py-1 px-3 bg-[#123D28] text-white rounded-lg text-xs font-bold hover:bg-[#1A4D33] transition-colors">
                        View Thread &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 6: CUSTOMER FEEDBACK & REVIEWS         */}
        {/* ========================================== */}
        {activeTab === "feedback" && (
          <div className="space-y-8 animate-in fade-in-50 duration-200">
            {/* Feedback Submission Form */}
            <div className="bg-white rounded-3xl border border-[#DEDFD5] p-6 sm:p-8 shadow-xs">
              <h2 className="font-serif text-xl font-bold text-[#123D28] mb-1">Share Your Experience</h2>
              <p className="text-xs text-[#6C7167] mb-6">
                Your feedback helps us maintain the purest traditional herbal standards and improve your shopping experience.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!feedbackTitle.trim() || !feedbackMessage.trim()) return;
                  submitFeedbackMutation.mutate({
                    customerName: currentUser.name || "Customer",
                    customerEmail: currentUser.email,
                    customerPhone: currentUser.phone || undefined,
                    category: feedbackCategory,
                    rating: feedbackRating,
                    title: feedbackTitle.trim(),
                    message: feedbackMessage.trim(),
                    orderNumber: feedbackOrderId.trim() || undefined,
                  });
                }}
                className="space-y-4 max-w-2xl"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#123D28] mb-1">Feedback Category</label>
                    <select
                      value={feedbackCategory}
                      onChange={(e) => setFeedbackCategory(e.target.value)}
                      className="w-full p-2.5 text-xs border border-[#DEDFD5] rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                    >
                      <option value="Overall shopping experience">Overall shopping experience</option>
                      <option value="Product quality">Product quality & purity</option>
                      <option value="Website experience">Website experience</option>
                      <option value="Delivery experience">Delivery & packaging</option>
                      <option value="Customer service">Customer service</option>
                      <option value="Suggestions and complaints">Suggestions & complaints</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#123D28] mb-1">Star Rating (1–5)</label>
                    <div className="flex items-center gap-1.5 pt-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            size={22}
                            fill={star <= feedbackRating ? "#D4AF37" : "none"}
                            className={star <= feedbackRating ? "text-[#D4AF37]" : "text-slate-300"}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-[#123D28] ml-2">{feedbackRating} / 5 Stars</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#123D28] mb-1">Feedback Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief summary of your experience..."
                    value={feedbackTitle}
                    onChange={(e) => setFeedbackTitle(e.target.value)}
                    className="w-full p-2.5 text-xs border border-[#DEDFD5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#123D28] mb-1">Detailed Message</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Please share details about product freshness, packaging, or store service..."
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    className="w-full p-2.5 text-xs border border-[#DEDFD5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#123D28] mb-1">Related Order # (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. TRN-10482"
                    value={feedbackOrderId}
                    onChange={(e) => setFeedbackOrderId(e.target.value)}
                    className="w-full sm:w-64 p-2.5 text-xs border border-[#DEDFD5] rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitFeedbackMutation.isPending || !feedbackTitle.trim() || !feedbackMessage.trim()}
                  className="py-2.5 px-6 bg-[#123D28] text-white rounded-xl text-xs font-bold hover:bg-[#1A4D33] disabled:opacity-50 transition-colors shadow-2xs"
                >
                  {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
                </button>
              </form>
            </div>

            {/* Previous Submissions */}
            <div>
              <h3 className="font-serif text-lg font-bold text-[#123D28] mb-3">Your Previous Feedback &amp; Responses</h3>
              {feedbackLoading ? (
                <div className="text-center py-6 text-xs text-[#6C7167]">Loading your submissions...</div>
              ) : myFeedbackList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#DEDFD5] p-6 text-center text-xs text-[#6C7167]">
                  You have not submitted any feedback yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {myFeedbackList.map((f: any) => (
                    <div key={f.id} className="bg-white rounded-2xl border border-[#DEDFD5] p-5 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < f.rating ? "#D4AF37" : "none"}
                              className={i < f.rating ? "text-[#D4AF37]" : "text-slate-300"}
                            />
                          ))}
                          <span className="text-xs font-bold text-[#123D28] ml-1">{f.category}</span>
                        </div>
                        <span className="text-[11px] text-[#6C7167]">{new Date(f.created_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#123D28]">{f.title}</h4>
                      <p className="text-xs text-[#6C7167] leading-relaxed">{f.message}</p>
                      {f.admin_response && (
                        <div className="mt-3 p-3 rounded-xl bg-[#FAF7EB] border border-[#E2DBCB] text-xs text-[#123D28]">
                          <strong className="block font-semibold mb-0.5">TRINAYAA Care Team Response:</strong>
                          {f.admin_response}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-6 max-w-2xl">
            {/* Password Update Card */}
            <div className="bg-white rounded-3xl border border-[#DEDFD5] p-6 sm:p-8 shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#EFECE4]">
                <h2 className="font-serif text-lg font-bold text-[#123D28]">Change Account Password</h2>
                <p className="text-xs text-[#6C7167] mt-0.5">
                  Update your password to keep your TRINAYAA account secure.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">Current Password</label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-[#DEDFD5] rounded-xl bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">New Password (min. 6 characters)</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-[#DEDFD5] rounded-xl bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 border border-[#DEDFD5] rounded-xl bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="py-2.5 px-6 bg-[#123D28] hover:bg-[#1A4D33] text-white font-bold rounded-xl transition-colors shadow-xs mt-2"
                >
                  {changePasswordMutation.isPending ? "Updating Password..." : "Update Password"}
                </button>
              </form>
            </div>

            {/* Mobile OTP Status Card */}
            <div className="bg-white rounded-3xl border border-[#DEDFD5] p-6 sm:p-8 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-[#AE6A2B]" />
                <h3 className="font-serif text-base font-bold text-[#123D28]">Mobile OTP Authentication</h3>
              </div>
              <p className="text-[#525B4E] leading-relaxed">
                Mobile OTP authentication is active on TRINAYAA. You can log in anytime using your registered 10-digit mobile number ({currentUser.phone ? `+91 ${currentUser.phone}` : "add your number in My Profile"}).
              </p>
              <div className="p-3 bg-[#EAF2ED] border border-[#C5DCCB] rounded-xl flex items-center gap-2 text-xs text-[#123D28] font-medium">
                <CheckCircle2 size={16} className="text-[#123D28] shrink-0" />
                <span>SMS Gateway: Transactional 6-digit OTP with 5-minute expiry &amp; 60s cooldown protection.</span>
              </div>
            </div>

            {/* Logout Card */}
            <div className="bg-white rounded-3xl border border-red-100 p-6 shadow-xs flex items-center justify-between">
              <div>
                <strong className="text-xs text-red-900 block font-bold">Sign Out of Session</strong>
                <span className="text-[11px] text-[#6C7167]">Clear authentication cookie and end active session.</span>
              </div>
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                className="py-2 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 rounded-xl text-xs font-bold transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: MY REWARDS & LOYALTY (PHASE 7) */}
        {/* ======================================================== */}
        {activeTab === "rewards" && (
          <div className="space-y-6">
            {/* Hero Points Card */}
            <div className="bg-gradient-to-br from-[#123D28] via-[#1A4D33] to-[#0A2618] rounded-3xl p-6 sm:p-8 text-[#FBF9F5] shadow-lg relative overflow-hidden border border-[#256141]">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#E8BF83] border border-white/10 mb-3">
                    <Award size={14} />
                    <span>TRINAYAA Botanical Club</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">Your Reward Balance</h2>
                  <p className="text-xs text-[#D8E2D5] mt-1 max-w-md">
                    Earn 50 reward points for every approved feedback or review. Redeem 200 points for 100% free botanical wellness products!
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-center min-w-[200px]">
                  <div className="text-[11px] font-bold text-[#D8E2D5] uppercase tracking-wider">Available Balance</div>
                  <div className="font-serif text-4xl sm:text-5xl font-bold text-[#E8BF83] my-1">
                    {rewardsOverview?.balance ?? 0}
                  </div>
                  <div className="text-[11px] text-white/80 font-medium">TRINAYAA Points</div>
                </div>
              </div>

              {/* Progress to next free product */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-medium text-[#D8E2D5]">Progress to Free Botanical Product</span>
                  <span className="font-bold text-[#E8BF83]">
                    {rewardsOverview?.balance ?? 0} / {rewardsOverview?.freeProductRewardThreshold ?? 200} pts
                  </span>
                </div>
                <div className="w-full bg-white/15 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-[#AE6A2B] to-[#E8BF83] h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((rewardsOverview?.balance ?? 0) /
                            (rewardsOverview?.freeProductRewardThreshold ?? 200)) *
                            100
                        )
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-[11px] text-[#D8E2D5] mt-2">
                  {(rewardsOverview?.balance ?? 0) >= (rewardsOverview?.freeProductRewardThreshold ?? 200)
                    ? "🎉 Congratulations! You have enough points to claim a free product right now below!"
                    : `Only ${(rewardsOverview?.freeProductRewardThreshold ?? 200) - (rewardsOverview?.balance ?? 0)} more points needed to claim your next free botanical wellness product.`}
                </p>
              </div>

              {/* Total stats */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10 text-xs">
                <div>
                  <span className="text-[#D8E2D5]">Lifetime Earned:</span>
                  <span className="font-bold text-[#E8BF83] ml-2">+{rewardsOverview?.totalEarned ?? 0} pts</span>
                </div>
                <div>
                  <span className="text-[#D8E2D5]">Lifetime Redeemed:</span>
                  <span className="font-bold text-[#E8BF83] ml-2">-{rewardsOverview?.totalRedeemed ?? 0} pts</span>
                </div>
              </div>
            </div>

            {/* How It Works Banner */}
            <div className="bg-white rounded-3xl border border-[#DEDFD5] p-6 shadow-xs">
              <h3 className="font-serif text-base font-bold text-[#123D28] mb-4">How TRINAYAA Rewards Work</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#EFECE4]">
                  <div className="w-8 h-8 rounded-xl bg-[#123D28] text-white flex items-center justify-center font-bold mb-2">
                    1
                  </div>
                  <div className="font-bold text-[#123D28] text-sm">Experience Products</div>
                  <p className="text-[#6C7167] mt-1">
                    Order our single-origin, farmer-direct herbs, raw powders and seeds.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#EFECE4]">
                  <div className="w-8 h-8 rounded-xl bg-[#AE6A2B] text-white flex items-center justify-center font-bold mb-2">
                    2
                  </div>
                  <div className="font-bold text-[#123D28] text-sm">Review & Feedback</div>
                  <p className="text-[#6C7167] mt-1">
                    Submit a review or feedback. Each approved submission automatically earns 50 points.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#EFECE4]">
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold mb-2">
                    3
                  </div>
                  <div className="font-bold text-[#123D28] text-sm">Redeem Free Products</div>
                  <p className="text-[#6C7167] mt-1">
                    When you reach 200 points, pick any eligible botanical product and we ship it 100% free!
                  </p>
                </div>
              </div>
            </div>

            {/* Redeem Free Products Catalog */}
            <div className="bg-white rounded-3xl border border-[#DEDFD5] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFECE4]">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#123D28]">Redeem Free Botanical Products</h3>
                  <p className="text-xs text-[#6C7167] mt-0.5">
                    Choose any product below to redeem for {rewardsOverview?.freeProductRewardThreshold ?? 200} points.
                  </p>
                </div>
                <div className="text-xs font-bold text-[#AE6A2B] bg-[#F6EDE8] px-3 py-1 rounded-full">
                  Cost: {rewardsOverview?.freeProductRewardThreshold ?? 200} pts each
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {eligibleProducts.slice(0, 8).map((p: any) => {
                  const canAfford = (rewardsOverview?.balance ?? 0) >= (rewardsOverview?.freeProductRewardThreshold ?? 200);
                  return (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-[#DEDFD5] p-3 flex flex-col justify-between bg-[#FAF8F2] hover:bg-white transition-all shadow-2xs"
                    >
                      <div>
                        <div className="w-full aspect-square rounded-xl bg-white border border-[#EFECE4] overflow-hidden mb-2.5">
                          <img
                            src={p.image || p.primaryImage}
                            alt={p.nameEn}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="font-bold text-xs text-[#123D28] line-clamp-1">{p.nameEn}</div>
                        <div className="text-[10px] text-[#6C7167] mt-0.5 font-mono">{p.sku} · ₹{p.sellingPrice} value</div>
                        <div className="text-[10px] text-[#AE6A2B] font-semibold">{p.botanicalCategory || p.category}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!canAfford) {
                            toast.error(
                              `You need ${rewardsOverview?.freeProductRewardThreshold ?? 200} points to redeem this item. You currently have ${rewardsOverview?.balance ?? 0} points.`
                            );
                            return;
                          }
                          setSelectedRedeemProduct(p);
                          setRedeemProductModalOpen(true);
                        }}
                        disabled={!canAfford}
                        className={`w-full mt-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                          canAfford
                            ? "bg-[#123D28] hover:bg-[#1A4D33] text-white cursor-pointer"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                        }`}
                      >
                        <Gift size={13} />
                        <span>{canAfford ? "Redeem Free" : `Need ${rewardsOverview?.freeProductRewardThreshold ?? 200} pts`}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Redemption Requests History */}
            <div className="bg-white rounded-3xl border border-[#DEDFD5] p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#EFECE4]">
                <h3 className="font-serif text-lg font-bold text-[#123D28]">My Redemption Requests</h3>
                <p className="text-xs text-[#6C7167] mt-0.5">
                  Track the dispatch status of your claimed free reward products.
                </p>
              </div>

              {rewardsRedemptions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#6C7167] border border-dashed border-[#DEDFD5] rounded-2xl">
                  You haven't requested any free reward products yet. Earn points with feedback to claim yours!
                </div>
              ) : (
                <div className="divide-y divide-[#EFECE4] border border-[#DEDFD5] rounded-2xl overflow-hidden">
                  {rewardsRedemptions.map((r: any) => (
                    <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[#FAF8F2] hover:bg-white transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-[#DEDFD5] overflow-hidden shrink-0">
                          <img src={r.productImage || "/images/brand/emblem_crisp.png"} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-[#123D28] text-sm">{r.productName}</div>
                          <div className="text-[10px] text-[#6C7167] font-mono">
                            {r.productSku} · Requested {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                          {r.orderId && (
                            <div className="text-[11px] font-mono text-[#AE6A2B] font-bold mt-0.5">
                              Dispatch Reference: {r.orderId}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="font-bold text-[#AE6A2B] bg-[#F6EDE8] px-2.5 py-1 rounded text-xs">
                          {r.pointsSpent} pts
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Points Activity Ledger */}
            <div className="bg-white rounded-3xl border border-[#DEDFD5] p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#EFECE4]">
                <h3 className="font-serif text-lg font-bold text-[#123D28]">Points Activity History</h3>
                <p className="text-xs text-[#6C7167] mt-0.5">
                  Complete audit log of points earned and redeemed on your account.
                </p>
              </div>

              {rewardsTransactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#6C7167] border border-dashed border-[#DEDFD5] rounded-2xl">
                  No points activity recorded yet. Leave a product review to earn your first 50 points!
                </div>
              ) : (
                <div className="divide-y divide-[#EFECE4] border border-[#DEDFD5] rounded-2xl overflow-hidden">
                  {rewardsTransactions.map((tx: any) => (
                    <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-[#FAF8F2] transition-colors">
                      <div>
                        <div className="font-bold text-[#123D28]">{tx.description}</div>
                        <div className="text-[10px] text-[#6C7167] mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })} · {tx.transactionType}
                        </div>
                      </div>
                      <div
                        className={`font-serif text-sm font-bold ${
                          tx.points > 0 ? "text-emerald-700" : "text-[#AE6A2B]"
                        }`}
                      >
                        {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 8: PRODUCT ENQUIRIES */}
        {/* ======================================================== */}
        {activeTab === "enquiries" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-[#DEDFD5] p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFECE4] gap-3">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-[#123D28]">
                    New Product Enquiries &amp; Requests
                  </h2>
                  <p className="text-xs text-[#6C7167] mt-0.5">
                    View sourcing status of requested botanicals or submit a new custom product enquiry.
                  </p>
                </div>
                <Link href="/product-enquiry">
                  <a className="py-2.5 px-4 bg-[#123D28] hover:bg-[#1B4E35] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs self-start sm:self-auto flex items-center gap-1.5 shrink-0">
                    <PackageSearch size={14} />
                    <span>Request New Product &rarr;</span>
                  </a>
                </Link>
              </div>

              {/* Enquiries list */}
              <div className="pt-4">
                {enquiriesLoading ? (
                  <div className="py-8 text-center text-xs text-[#6C7167]">Loading your enquiries...</div>
                ) : myEnquiries.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#6C7167] border border-dashed border-[#DEDFD5] rounded-2xl bg-[#FAF8F2] p-6 space-y-3">
                    <PackageSearch size={36} className="mx-auto text-[#8C6D3F] opacity-70" />
                    <div>
                      <h4 className="font-bold text-sm text-[#123D28]">No Product Enquiries Yet</h4>
                      <p className="mt-1 text-[#6C7167] max-w-md mx-auto">
                        Need an herb, seed, leaf, or raw powder that is not currently listed in our store? Let our sourcing team in Tamil Nadu know what you need!
                      </p>
                    </div>
                    <Link href="/product-enquiry">
                      <a className="inline-flex items-center gap-1.5 py-2 px-4 bg-[#123D28] text-white rounded-xl font-bold text-xs hover:bg-[#1B4E35] transition-colors">
                        <span>Submit a Product Request</span>
                      </a>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-[#EFECE4] border border-[#DEDFD5] rounded-2xl overflow-hidden">
                    {myEnquiries.map((enq: any) => (
                      <div key={enq.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[#FAF8F2] hover:bg-white transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-[#8C6D3F] bg-white px-2 py-0.5 rounded border border-[#EFECE4]">
                              {enq.enquiryNumber}
                            </span>
                            <span className="font-bold text-[#123D28] text-sm">{enq.productName}</span>
                          </div>
                          <div className="text-[11px] text-[#6C7167]">
                            <span>Quantity: <strong>{enq.requestedQuantity}</strong></span>
                            {enq.preferredPackSize && <span> · Pack Size: <strong>{enq.preferredPackSize}</strong></span>}
                            <span> · Submitted {enq.createdAt ? new Date(enq.createdAt).toLocaleDateString("en-IN") : "Recent"}</span>
                          </div>
                          <p className="text-[11px] text-[#2B3527] italic bg-white/80 p-2 rounded-lg border border-[#EFECE4] mt-1">
                            "{enq.description}"
                          </p>
                        </div>
                        <div className="shrink-0 self-start sm:self-center">
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full ${
                            enq.status === "AVAILABLE"
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : enq.status === "SOURCING"
                              ? "bg-indigo-100 text-indigo-900 border border-indigo-200"
                              : enq.status === "UNDER_REVIEW"
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : enq.status === "UNABLE_TO_SOURCE"
                              ? "bg-slate-100 text-slate-700 border border-slate-300"
                              : enq.status === "CLOSED"
                              ? "bg-zinc-100 text-zinc-700 border border-zinc-200"
                              : "bg-sky-100 text-sky-800 border border-sky-200"
                          }`}>
                            {enq.status === "AVAILABLE" ? "Available in Store!" : enq.status === "SOURCING" ? "Sourcing" : enq.status === "UNDER_REVIEW" ? "Under Review" : enq.status === "UNABLE_TO_SOURCE" ? "Unable to Source" : enq.status === "CLOSED" ? "Closed" : "New Request"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Redeem Product Confirmation Modal */}
        {redeemProductModalOpen && selectedRedeemProduct && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DEDFD5] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFECE4]">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#AE6A2B] block">
                    Claim Free Product
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#123D28]">Confirm Reward Redemption</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRedeemProductModalOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 bg-[#FAF8F2] rounded-2xl border border-[#EFECE4] flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border border-[#DEDFD5] overflow-hidden bg-white shrink-0">
                  <img
                    src={selectedRedeemProduct.image || selectedRedeemProduct.primaryImage}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#123D28]">{selectedRedeemProduct.nameEn}</div>
                  <div className="text-xs text-[#6C7167] font-mono">{selectedRedeemProduct.sku}</div>
                  <div className="text-xs font-bold text-[#AE6A2B] mt-0.5">
                    Cost: {rewardsOverview?.freeProductRewardThreshold ?? 200} points
                  </div>
                </div>
              </div>

              <div className="text-xs text-[#6C7167] space-y-2">
                <p>
                  Your available points: <strong className="text-[#123D28]">{rewardsOverview?.balance ?? 0} pts</strong>.
                  Upon confirmation, {rewardsOverview?.freeProductRewardThreshold ?? 200} points will be deducted and our team will dispatch this product to your default address.
                </p>
                <div>
                  <label className="block font-semibold text-[#2B3527] mb-1">Optional delivery note or request:</label>
                  <textarea
                    rows={2}
                    value={redemptionNotes}
                    onChange={(e) => setRedemptionNotes(e.target.value)}
                    placeholder="e.g. Please deliver along with my upcoming order or contact before delivery"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded-xl bg-[#FAF8F2] text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EFECE4]">
                <button
                  type="button"
                  onClick={() => setRedeemProductModalOpen(false)}
                  className="py-2.5 px-4 border border-[#DEDFD5] text-[#6C7167] font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={redeemMutation.isPending}
                  onClick={() =>
                    redeemMutation.mutate({
                      productId: selectedRedeemProduct.id,
                      notes: redemptionNotes.trim() || undefined,
                    })
                  }
                  className="py-2.5 px-6 bg-[#123D28] hover:bg-[#1A4D33] text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  {redeemMutation.isPending ? "Redeeming..." : "Confirm & Claim Free Product"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* ADD / EDIT ADDRESS MODAL */}
      {/* ======================================================== */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#DEDFD5]">
            <div className="p-5 border-b border-[#EFECE4] flex items-center justify-between bg-[#FAF8F2]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#AE6A2B] block">
                  Delivery Destination
                </span>
                <h3 className="font-serif text-xl font-bold text-[#123D28]">
                  {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">Recipient Name *</label>
                  <input
                    required
                    value={addrRecipient}
                    onChange={(e) => setAddrRecipient(e.target.value)}
                    placeholder="e.g. Anand Kumar"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">10-Digit Mobile *</label>
                  <input
                    required
                    maxLength={10}
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#2B3527]">House / Building No &amp; Street *</label>
                <input
                  required
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  placeholder="e.g. 42, Kongu Nagar, 2nd Cross"
                  className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">Area / Locality</label>
                  <input
                    value={addrLine2}
                    onChange={(e) => setAddrLine2(e.target.value)}
                    placeholder="e.g. Near Bus Stand"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">Landmark (Optional)</label>
                  <input
                    value={addrLandmark}
                    onChange={(e) => setAddrLandmark(e.target.value)}
                    placeholder="e.g. Opp. Murugan Temple"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">City *</label>
                  <input
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="Erode"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">State *</label>
                  <input
                    required
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    placeholder="Tamil Nadu"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">PIN Code *</label>
                  <input
                    required
                    maxLength={6}
                    value={addrPin}
                    onChange={(e) => setAddrPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="638002"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#2B3527]">Address Label</label>
                <div className="flex gap-3">
                  {(["Home", "Work", "Other"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAddrType(t)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        addrType === t
                          ? "bg-[#123D28] text-white border-[#123D28]"
                          : "bg-[#FAF8F2] text-[#4A5546] border-[#DEDFD5]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#2B3527]">Delivery Instructions (Optional)</label>
                <input
                  value={addrInstructions}
                  onChange={(e) => setAddrInstructions(e.target.value)}
                  placeholder="e.g. Leave with security / Call before delivery"
                  className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#2B3527] font-semibold">
                  <input
                    type="checkbox"
                    checked={addrIsDefault}
                    onChange={(e) => setAddrIsDefault(e.target.checked)}
                    className="rounded accent-[#123D28]"
                  />
                  <span>Make this my default delivery address</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#EFECE4]">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="py-2.5 px-4 border border-[#DEDFD5] hover:bg-[#FAF8F2] text-[#4A5546] font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                  className="py-2.5 px-6 bg-[#123D28] hover:bg-[#1A4D33] text-white font-bold rounded-xl transition-colors shadow-xs"
                >
                  {createAddressMutation.isPending || updateAddressMutation.isPending
                    ? "Saving..."
                    : editingAddressId
                    ? "Update Address"
                    : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: RAISE SUPPORT TICKET              */}
      {/* ========================================== */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 sm:p-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b mb-4">
              <h3 className="font-serif font-bold text-[#123D28] text-lg">Raise Support Ticket</h3>
              <button
                onClick={() => setIsNewTicketModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!ticketSubject.trim() || !ticketDescription.trim()) return;
                createTicketMutation.mutate({
                  category: ticketCategory,
                  subject: ticketSubject.trim(),
                  description: ticketDescription.trim(),
                  priority: ticketPriority,
                  orderNumber: ticketOrderId.trim() || undefined,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#123D28] mb-1">Issue Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full p-2.5 text-xs border border-[#DEDFD5] rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                >
                  <option value="Order issue">Order issue</option>
                  <option value="Payment issue">Payment / Refund issue</option>
                  <option value="Delivery issue">Delivery / Courier delay</option>
                  <option value="Product quality">Product quality enquiry</option>
                  <option value="Missing or damaged product">Missing or damaged product</option>
                  <option value="Account/login problem">Account / Mobile OTP assistance</option>
                  <option value="General enquiry">General enquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#123D28] mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Summary of your issue..."
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full p-2.5 text-xs border border-[#DEDFD5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#123D28] mb-1">Priority</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="w-full p-2.5 text-xs border border-[#DEDFD5] rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#123D28] mb-1">Order # (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. TRN-10482"
                    value={ticketOrderId}
                    onChange={(e) => setTicketOrderId(e.target.value)}
                    className="w-full p-2.5 text-xs border border-[#DEDFD5] rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#123D28] mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Please describe the problem in detail so our care team can resolve it immediately..."
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  className="w-full p-2.5 text-xs border border-[#DEDFD5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTicketMutation.isPending || !ticketSubject.trim() || !ticketDescription.trim()}
                  className="px-5 py-2 text-xs font-bold bg-[#123D28] text-white rounded-xl hover:bg-[#1A4D33] disabled:opacity-50 transition-colors shadow-2xs"
                >
                  {createTicketMutation.isPending ? "Submitting..." : "Submit Support Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: TICKET CONVERSATION THREAD        */}
      {/* ========================================== */}
      {selectedTicketId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-[#FCFBF7]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#123D28] text-base">
                    {activeTicketDetail?.ticket.ticket_number}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-[#FAF7EB] text-[#123D28] border border-[#E2DBCB] font-medium">
                    {activeTicketDetail?.ticket.category}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                      activeTicketDetail?.ticket.status === "Open"
                        ? "bg-emerald-100 text-emerald-800"
                        : activeTicketDetail?.ticket.status === "Waiting for Customer"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {activeTicketDetail?.ticket.status}
                  </span>
                </div>
                <div className="font-bold text-sm text-[#123D28] mt-1">
                  {activeTicketDetail?.ticket.subject}
                </div>
              </div>
              <button
                onClick={() => setSelectedTicketId(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conversation Messages Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF7EB]/50">
              {ticketDetailLoading ? (
                <div className="text-center text-xs text-[#6C7167] py-10">Loading conversation...</div>
              ) : (
                activeTicketDetail?.messages.map((m: any) => {
                  const isCust = m.sender_type === "CUSTOMER";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isCust ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                        <span className="font-bold text-slate-600">{m.sender_name}</span>
                        <span>•</span>
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-2xs whitespace-pre-wrap leading-relaxed ${
                          isCust
                            ? "bg-[#123D28] text-white rounded-br-none"
                            : "bg-white text-[#123D28] border border-[#DEDFD5] rounded-bl-none"
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!ticketReplyText.trim() || !selectedTicketId) return;
                replyTicketMutation.mutate({
                  ticketId: selectedTicketId,
                  message: ticketReplyText.trim(),
                });
              }}
              className="p-3 bg-white border-t flex gap-2"
            >
              <textarea
                rows={2}
                placeholder="Type your message to TRINAYAA Support..."
                value={ticketReplyText}
                onChange={(e) => setTicketReplyText(e.target.value)}
                className="flex-1 p-2.5 text-xs border border-[#DEDFD5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#123D28] resize-none"
              />
              <button
                type="submit"
                disabled={replyTicketMutation.isPending || !ticketReplyText.trim()}
                className="px-4 bg-[#123D28] text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-[#1A4D33] disabled:opacity-50 transition-colors shadow-2xs"
              >
                <Send size={14} /> Send
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
