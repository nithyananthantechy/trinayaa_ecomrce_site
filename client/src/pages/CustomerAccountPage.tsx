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
} from "lucide-react";

type AccountTab = "profile" | "addresses" | "orders" | "security";

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
            <Link href="/">
              <a className="inline-block"><BrandMark /></a>
            </Link>
            <Link href="/products">
              <a className="text-xs sm:text-sm font-semibold text-[#123D28] hover:text-[#8C6D3F]">
                Browse Products
              </a>
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
              <Link href="/">
                <a className="block py-2 text-xs font-semibold text-[#6C7167] hover:text-[#123D28]">
                  Return to Storefront
                </a>
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
          <Link href="/">
            <a className="inline-block"><BrandMark /></a>
          </Link>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/products">
              <a className="text-xs sm:text-sm font-semibold text-[#123D28] hover:text-[#8C6D3F] transition-colors">
                Shop Catalogue
              </a>
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
          <Link href="/"><a className="hover:underline">Home</a></Link>
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
            <Link href="/admin">
              <a className="py-2.5 px-4 bg-[#E8BF83] hover:bg-[#D4AF37] text-[#123D28] font-bold text-xs rounded-xl transition-colors shadow-2xs self-start sm:self-auto flex items-center gap-1.5">
                <ShieldCheck size={15} />
                <span>Open Admin Portal &rarr;</span>
              </a>
            </Link>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#DEDFD5] mb-6 overflow-x-auto scrollbar-none text-xs font-bold gap-2">
          {[
            { id: "profile" as AccountTab, label: "My Profile", icon: User },
            { id: "addresses" as AccountTab, label: `Saved Addresses (${addresses.length})`, icon: MapPin },
            { id: "orders" as AccountTab, label: `My Orders (${orders.length})`, icon: ShoppingBag },
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
                <Link href="/products">
                  <a className="inline-block py-2.5 px-5 bg-[#123D28] hover:bg-[#1A4D33] text-white font-bold rounded-xl text-xs transition-colors shadow-xs">
                    Explore Botanical Catalogue
                  </a>
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
                          <Link href={`/track-order?orderId=${order.orderNumber}`}>
                            <a className="py-1.5 px-3 bg-[#FAF5EB] hover:bg-[#F2E8D3] border border-[#DECFB5] text-[#8E5E28] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1">
                              <Navigation size={12} />
                              <span>Track Delivery</span>
                            </a>
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
    </div>
  );
}
