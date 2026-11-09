import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import BrandMark from "@/components/BrandMark";
import AuthModal from "@/components/AuthModal";
import {
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
} from "lucide-react";

type AccountTab = "profile" | "addresses" | "orders" | "wishlist" | "tickets" | "feedback" | "rewards" | "security";

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

  // Check URL query tab parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["profile", "addresses", "orders", "wishlist", "tickets", "feedback", "security"].includes(tabParam)) {
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
            { id: "wishlist" as AccountTab, label: `My Wishlist (${wishlistItems.length})`, icon: Heart },
            { id: "tickets" as AccountTab, label: `Support Helpdesk (${myTickets.length})`, icon: LifeBuoy },
            { id: "feedback" as AccountTab, label: "Feedback & Reviews", icon: Star },
            { id: "rewards" as AccountTab, label: `My Rewards (${rewardsOverview?.balance ?? 0} pts)`, icon: Award },
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

                      {/* Delivery Address Snapshot */}
                      <div className="bg-[#FAF8F2] p-3 rounded-xl border border-[#EFECE4] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[#6C7167] block text-[10px] uppercase font-bold tracking-wider">
                            Delivered To:
                          </span>
                          <span className="text-[#2C382A]">
                            {parsedAddress.street || parsedAddress.addressLine1},{" "}
                            {parsedAddress.city}, {parsedAddress.state} – {parsedAddress.pinCode}
                          </span>
                        </div>
                        {order.trackingNumber && (
                          <div className="text-[11px] text-[#123D28] font-mono font-bold">
                            AWB: {order.trackingNumber} ({order.carrier || "Delivery Partner"})
                          </div>
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
