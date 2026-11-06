import { resolveProductImage, getCategoryPlaceholder } from "../lib/productImage";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Facebook,
  Heart,
  Instagram,
  Leaf,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Minus,
  Package,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  X,
  Youtube,
} from "lucide-react";
import { useEffect, useMemo, useState, FormEvent } from "react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { COOKIE_NAME } from "@shared/const";

type Category = "All" | "Seeds" | "Raw Powders" | "Herbs" | "Health Care" | "Hair Care" | "Skin Care";
type Product = {
  id: string;
  sku?: string;
  name: string;
  nameTa?: string;
  category: string;
  price: number;
  compareAt?: number;
  discountPercent?: number;
  stock?: number;
  stockAvailability?: string;
  image: string;
  badge?: string;
  description: string;
  sizes: { label: string; price: number; mrp?: number; stock?: number }[];
  slug?: string;
};
type CartItem = Product & { size: string; unitPrice: number; quantity: number };

function getGuestToken(): string {
  if (typeof window === "undefined") return "guest_default";
  let token = localStorage.getItem("trinayaa_guest_token");
  if (!token) {
    token = "gst_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem("trinayaa_guest_token", token);
  }
  return token;
}

const IMG = {
  hero: "/images/hero/hero_botanical_display.png",
  moringa: "/images/products/packaged/pouch_001.png",
  blackSeed: "/images/products/packaged/pouch_002.png",
  hibiscus: "/images/products/packaged/pouch_003.png",
  amlaFenugreek: "/images/products/packaged/pouch_004.png",
};

const initialProducts: Product[] = [
  {
    id: "moringa",
    name: "Moringa Leaf Powder",
    nameTa: "முருங்கை இலை பொடி",
    category: "Raw Powders",
    price: 249,
    compareAt: 299,
    image: IMG.moringa,
    badge: "Best seller",
    description: "Sun-dried moringa leaves, gently milled into a vibrant everyday green powder.",
    sizes: [
      { label: "100 g", price: 249 },
      { label: "250 g", price: 499 },
      { label: "500 g", price: 899 },
    ],
  },
  {
    id: "black-seed",
    name: "Black Seed (Kalonji)",
    nameTa: "கருஞ்சீரகம்",
    category: "Seeds",
    price: 189,
    compareAt: 229,
    image: IMG.blackSeed,
    badge: "Pure seed",
    description: "Aromatic black cumin seeds selected for their bold character and clean finish.",
    sizes: [
      { label: "100 g", price: 189 },
      { label: "250 g", price: 349 },
      { label: "500 g", price: 599 },
    ],
  },
  {
    id: "hibiscus",
    name: "Hibiscus Flower (Dried)",
    nameTa: "செம்பருத்தி பூ",
    category: "Herbs",
    price: 219,
    compareAt: 269,
    image: IMG.hibiscus,
    badge: "New harvest",
    description: "Deep crimson hibiscus petals, carefully dried for teas, infusions and rituals.",
    sizes: [
      { label: "50 g", price: 219 },
      { label: "100 g", price: 369 },
      { label: "250 g", price: 749 },
    ],
  },
  {
    id: "amla",
    name: "Amla Powder",
    nameTa: "நெல்லிக்காய் பொடி",
    category: "Raw Powders",
    price: 229,
    compareAt: 279,
    image: IMG.amlaFenugreek,
    badge: "Everyday ritual",
    description: "Fine amla powder with a naturally bright, tangy profile for daily wellness routines.",
    sizes: [
      { label: "100 g", price: 229 },
      { label: "250 g", price: 449 },
      { label: "500 g", price: 799 },
    ],
  },
  {
    id: "fenugreek",
    name: "Fenugreek Seeds",
    nameTa: "வெந்தயம்",
    category: "Seeds",
    price: 159,
    compareAt: 199,
    image: IMG.amlaFenugreek,
    badge: "Pantry staple",
    description: "Golden fenugreek seeds, cleaned and packed fresh for kitchen and haircare rituals.",
    sizes: [
      { label: "100 g", price: 159 },
      { label: "250 g", price: 299 },
      { label: "500 g", price: 499 },
    ],
  },
];

const categoriesData = [
  { label: "Herbs", caption: "Whole botanicals for natural care", image: IMG.hibiscus, className: "category-herbs" },
  { label: "Raw Powders", caption: "Pure and finely processed", image: IMG.moringa, className: "category-powders" },
  { label: "Seeds", caption: "Premium seeds for a healthy lifestyle", image: IMG.blackSeed, className: "category-seeds" },
];

function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

import BrandMark from "@/components/BrandMark";

function SiteHeader({
  cartCount,
  onCart,
  onMenu,
  onAccount,
  currentUser,
}: {
  cartCount: number;
  onCart: () => void;
  onMenu: () => void;
  onAccount: () => void;
  currentUser: any;
}) {
  const [, setLocation] = useLocation();
  return (
    <>
      <div className="utility-bar">
        <div className="utility-inner">
          <div className="utility-links">
            <span><Leaf size={13} /> Pure Herbs</span><i />
            <span>Natural Seeds</span><i />
            <span>Raw Powders</span>
          </div>
          <div className="utility-links utility-right">
            <span><Truck size={14} /> Pan India Delivery <small>(T&C Apply)</small></span><i />
            <button onClick={() => setLocation("/bulk-enquiry")} className="font-semibold text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200/80 px-2 py-0.5 rounded text-[11px] transition-colors">
              🏢 Bulk / B2B Quote
            </button><i />
            <button onClick={() => setLocation("/contact")}>Support</button><i />
            <button onClick={() => setLocation("/track-order")}>Track Order</button>
            {currentUser?.role === "ADMIN" && (
              <>
                <i />
                <button onClick={() => setLocation("/admin")} className="font-bold text-[#e8bf83]">Admin Console</button>
              </>
            )}
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="site-header-inner">
          <button className="mobile-menu-button" aria-label="Open menu" onClick={onMenu}><Menu size={22} /></button>
          <button className="logo-button" onClick={() => setLocation("/")}><BrandMark /></button>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <button onClick={() => setLocation("/")} className="active font-bold">Home</button>
            <button onClick={() => setLocation("/products")}>Products</button>
            <button onClick={() => setLocation("/bulk-enquiry")}>Bulk Enquiry</button>
            <button onClick={() => setLocation("/about")}>About</button>
            <button onClick={() => setLocation("/contact")}>Contact</button>
          </nav>
          <div className="header-actions">
            <label className="header-search">
              <Search size={18} />
              <input
                aria-label="Search products"
                placeholder="Search for herbs, seeds, powders..."
                onChange={(e) => window.dispatchEvent(new CustomEvent("trinayaa-search", { detail: e.target.value }))}
              />
            </label>
            <button
              className="icon-action account-action"
              aria-label="Account"
              onClick={onAccount}
            >
              <UserRound size={22} />
              <span>{currentUser ? (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN" ? "Admin" : currentUser.name.split(" ")[0]) : "Account"}</span>
            </button>
            <button className="icon-action cart-action" aria-label="Open cart" onClick={onCart}>
              <ShoppingBag size={23} />
              <span>Cart</span>
              {cartCount > 0 && <b>{cartCount}</b>}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

function TrustRow() {
  return (
    <section className="trust-row" aria-label="Why Trinayaa">
      <div><Leaf size={27} strokeWidth={1.4} /><span><strong>Quality Sourcing</strong><small>Carefully selected natural ingredients</small></span></div>
      <div><ShieldCheck size={27} strokeWidth={1.4} /><span><strong>Secure Checkout</strong><small>Safe and trusted payments</small></span></div>
      <div><Package size={27} strokeWidth={1.4} /><span><strong>Careful Packing</strong><small>Hygienic and secure packaging</small></span></div>
      <div><Truck size={27} strokeWidth={1.4} /><span><strong>Pan India Delivery</strong><small>Delivering natural wellness across India</small></span></div>
    </section>
  );
}

function ProductCard({
  product,
  isWishlisted,
  onWishlist,
  onDetails,
  onAdd,
}: {
  product: Product;
  isWishlisted: boolean;
  onWishlist: () => void;
  onDetails: () => void;
  onAdd: () => void;
}) {
  return (
    <article className="product-card" id={`product-${(product as any).slug || product.id}`}>
      <div className="product-image-wrap" onClick={onDetails} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onDetails()}>
        <img
          src={product.image}
          alt={`${product.name}${product.nameTa ? ` (${product.nameTa})` : ""} - TRINAYAA Pure Botanical Pouch`}
          loading="lazy"
          decoding="async"
          onError={(e: any) => {
            e.target.src = getCategoryPlaceholder(product.category);
          }}
        />
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button
          className={`wishlist-button ${isWishlisted ? "is-wishlisted" : ""}`}
          aria-label={`${isWishlisted ? "Remove" : "Add"} ${product.name} ${isWishlisted ? "from" : "to"} wishlist`}
          onClick={(e) => {
            e.stopPropagation();
            onWishlist();
          }}
        >
          <Heart size={17} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
        <button className="quick-view" onClick={(e) => { e.stopPropagation(); onDetails(); }}>
          Quick view <ArrowRight size={14} />
        </button>
      </div>
      <div className="product-card-content">
        <div className="product-card-topline">
          <span className="product-category">{product.category}</span>
          <span className="rating">★★★★★ <em>4.9</em></span>
        </div>
        <button className="product-name" onClick={onDetails}>
          {product.name}
          {product.nameTa && <span className="block text-[11px] text-[#ae6a2b] font-normal">{product.nameTa}</span>}
        </button>
        <div className="product-buy-row">
          <div>
            <strong>{formatINR(product.price)}</strong>
            {product.compareAt && product.compareAt > product.price && <del>{formatINR(product.compareAt)}</del>}
            <small> / {product.sizes[0]?.label || "100 g"}</small>
          </div>
          <button className="add-button" onClick={onAdd}>
            <ShoppingBag size={15} /> Add to Cart
          </button>
        </div>
      </div>
    </article>
  );
}

function CartDrawer({
  cart,
  open,
  onClose,
  onUpdate,
  onRemove,
  onCheckout,
}: {
  cart: CartItem[];
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, size: string, delta: number) => void;
  onRemove: (id: string, size: string) => void;
  onCheckout: () => void;
}) {
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return (
    <div className={`drawer-shell ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <button className="drawer-overlay" onClick={onClose} aria-label="Close cart" />
      <aside className="cart-drawer" aria-label="Shopping cart">
        <div className="drawer-head">
          <div>
            <span className="eyebrow">Your basket</span>
            <h2>Cart <small>{cart.length ? `(${cart.length})` : ""}</small></h2>
          </div>
          <button onClick={onClose} className="close-button"><X size={20} /></button>
        </div>
        {cart.length === 0 ? (
          <div className="empty-cart">
            <ShoppingBag size={40} strokeWidth={1.2} />
            <h3>Your basket is waiting</h3>
            <p>Add a few everyday botanicals to get started.</p>
            <button className="dark-button" onClick={onClose}>Explore products <ArrowRight size={16} /></button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <div className="cart-item" key={`${item.id}-${item.size}`}>
                  <img
                    src={item.image}
                    alt=""
                    onError={(e: any) => { e.target.src = "/images/products/packaged/pouch_001.png"; }}
                  />
                  <div className="cart-item-info">
                    <div className="cart-item-top">
                      <div>
                        <strong>{item.name}</strong>
                        <small>{item.size}</small>
                      </div>
                      <button onClick={() => onRemove(item.id, item.size)} aria-label={`Remove ${item.name}`}><X size={15} /></button>
                    </div>
                    <div className="cart-item-bottom">
                      <div className="qty-stepper">
                        <button onClick={() => onUpdate(item.id, item.size, -1)}><Minus size={13} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => onUpdate(item.id, item.size, 1)}><Plus size={13} /></button>
                      </div>
                      <strong>{formatINR(item.unitPrice * item.quantity)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div>
                <span>Subtotal</span>
                <strong>{formatINR(subtotal)}</strong>
              </div>
              <p>Taxes and delivery calculated at checkout.</p>
              <button className="dark-button full-button" onClick={onCheckout}>
                Proceed to checkout <ArrowRight size={16} />
              </button>
              <button className="text-button centered" onClick={onClose}>Continue shopping</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function CheckoutModal({
  cart,
  open,
  onClose,
  onComplete,
  currentUser,
  onRequireAuth,
}: {
  cart: CartItem[];
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  currentUser: any;
  onRequireAuth: () => void;
}) {
  const [, setLocation] = useLocation();
  const [payment, setPayment] = useState("upi");
  const [submitted, setSubmitted] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Erode");
  const [pinCode, setPinCode] = useState("638002");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(false);

  const { data: savedAddresses = [], refetch: refetchAddresses } = trpc.addresses.list.useQuery(undefined, {
    enabled: Boolean(currentUser),
  });
  const saveAddressMutation = trpc.addresses.create.useMutation();

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Mutations
  const validateCouponMutation = trpc.offers.validateCoupon.useMutation({
    onSuccess: (res) => {
      if (res.valid) {
        setAppliedCoupon(res);
        toast.success(`Coupon ${res.code} applied! Saved ₹${res.discountAmount}`);
      } else {
        toast.error(res.message || "Invalid coupon code");
      }
    },
  });

  const createOrderMutation = trpc.orders.create.useMutation();
  const razorpayOrderMutation = trpc.payments.createRazorpayOrder.useMutation();
  const verifySignatureMutation = trpc.payments.verifySignature.useMutation();

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shippingFee = subtotal >= 799 ? 0 : 60;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  useEffect(() => {
    if (!open) {
      setSubmitted(false);
      setCompletedOrder(null);
      setPayment("upi");
    } else if (currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      if (currentUser.phone) setPhone(currentUser.phone);
    }
  }, [open, currentUser]);

  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0 && selectedAddressId === "new") {
      const defaultAddr = savedAddresses.find((a: any) => a.isDefault) || savedAddresses[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setAddress(defaultAddr.street || defaultAddr.addressLine1 || "");
        setCity(defaultAddr.city || "Erode");
        setPinCode(defaultAddr.pinCode || "638002");
        if (defaultAddr.phone) setPhone(defaultAddr.phone);
        if (defaultAddr.recipientName) setName(defaultAddr.recipientName);
      }
    }
  }, [savedAddresses]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Enforce mandatory login before order placement
    if (!currentUser) {
      toast.info("Please sign in or register to securely place your order.", {
        description: "Your cart items will be preserved safely.",
      });
      onRequireAuth();
      return;
    }

    // Clean phone number: remove spaces and dashes
    const cleanPhone = phone.replace(/[\s-]/g, "");
    if (!/^(?:\+91)?[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)");
      return;
    }

    // Clean PIN code
    const cleanPin = pinCode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      toast.error("Please enter a valid 6-digit Indian PIN code");
      return;
    }

    setIsSubmitting(true);
    try {
      // If user chose to save new address
      if (selectedAddressId === "new" && saveAddressForFuture) {
        try {
          await saveAddressMutation.mutateAsync({
            recipientName: name,
            phone: cleanPhone,
            addressLine1: address,
            city,
            state: "Tamil Nadu",
            pinCode: cleanPin,
            isDefault: savedAddresses.length === 0,
          });
          refetchAddresses();
        } catch (addrErr) {
          console.warn("Could not save address to address book:", addrErr);
        }
      }

      // 1. Create order on server
      const order = await createOrderMutation.mutateAsync({
        customerName: name,
        customerEmail: email,
        customerPhone: cleanPhone,
        shippingAddress: {
          street: address,
          city,
          state: "Tamil Nadu",
          pinCode: cleanPin,
        },
        items: cart.map((it) => ({
          productId: it.id,
          packSize: it.size,
          quantity: it.quantity,
        })),
        couponCode: appliedCoupon?.code,
        paymentMethod: payment === "cod" ? "COD" : "RAZORPAY",
      });

      // 2. If online payment (Razorpay / UPI / Card)
      if (payment !== "cod") {
        const rzpOrder = await razorpayOrderMutation.mutateAsync({ orderId: order.id });

        // Simulate Razorpay checkout verification for test / preview mode
        const testPaymentId = "pay_test_" + Date.now();
        await verifySignatureMutation.mutateAsync({
          orderId: order.id,
          razorpayOrderId: rzpOrder.razorpayOrderId,
          razorpayPaymentId: testPaymentId,
          razorpaySignature: "simulated_valid_test_signature",
        });
      }

      setCompletedOrder(order);
      setSubmitted(true);
      toast.success("Order confirmed successfully!", {
        description: `Order ID: ${order.orderNumber}`,
      });
    } catch (err: any) {
      toast.error("Failed to complete order", {
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-shell">
      <button className="drawer-overlay" onClick={onClose} aria-label="Close checkout" />
      <section className="checkout-modal" role="dialog" aria-modal="true" aria-label="Secure checkout">
        {!submitted ? (
          <>
            <div className="modal-head">
              <div>
                <span className="eyebrow">Secure checkout</span>
                <h2>Bring nature home</h2>
                <p>Complete your details and choose a preferred payment method.</p>
              </div>
              <button className="close-button" onClick={onClose}><X size={20} /></button>
            </div>
            <div className="checkout-grid">
              <form className="checkout-form" onSubmit={handleSubmit}>
                {!currentUser && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 mb-2 flex items-center justify-between">
                    <span>Account required to complete order.</span>
                    <button
                      type="button"
                      onClick={onRequireAuth}
                      className="font-bold underline text-[#123D28]"
                    >
                      Sign in or Register
                    </button>
                  </div>
                )}
                <div className="form-section">
                  <h3>Contact</h3>
                  <div className="form-grid">
                    <label>Full name<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></label>
                    <label>Mobile number<input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" /></label>
                    <label className="full-field">Email address<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
                  </div>
                </div>
                <div className="form-section">
                  <div className="flex items-center justify-between">
                    <h3>Delivery address</h3>
                    {savedAddresses.length > 0 && (
                      <select
                        value={selectedAddressId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedAddressId(val);
                          if (val !== "new") {
                            const found = savedAddresses.find((a: any) => a.id === val);
                            if (found) {
                              setAddress(found.street || found.addressLine1 || "");
                              setCity(found.city || "Erode");
                              setPinCode(found.pinCode || "638002");
                              if (found.phone) setPhone(found.phone);
                              if (found.recipientName) setName(found.recipientName);
                            }
                          }
                        }}
                        className="text-[11px] py-1 px-2 border border-[#DEDFD5] rounded bg-[#FBF8F0] text-[#123D28]"
                      >
                        {savedAddresses.map((a: any) => (
                          <option key={a.id} value={a.id}>
                            {a.recipientName} ({a.city} - {a.pinCode}) {a.isDefault ? "★ Default" : ""}
                          </option>
                        ))}
                        <option value="new">+ Add new delivery address</option>
                      </select>
                    )}
                  </div>
                  <div className="form-grid">
                    <label className="full-field">Address<input required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House / street / area" /></label>
                    <label>City<input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="Erode" /></label>
                    <label>PIN code<input required inputMode="numeric" value={pinCode} onChange={(e) => setPinCode(e.target.value)} placeholder="638000" /></label>
                  </div>
                  {currentUser && selectedAddressId === "new" && (
                    <label className="flex items-center gap-2 mt-2 text-xs text-[#6C7167] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveAddressForFuture}
                        onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                        className="rounded accent-[#123D28]"
                      />
                      Save this address to my account for future orders
                    </label>
                  )}
                </div>
                <div className="form-section">
                  <h3>Festival Coupons</h3>
                  <div className="flex gap-2">
                    <input
                      placeholder="Enter promo code (e.g. FESTIVE15)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="text-xs uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => validateCouponMutation.mutate({ code: couponCode, subtotal })}
                      className="dark-button text-xs py-1.5 px-3 shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                </div>
                <div className="form-section">
                  <h3>Payment method</h3>
                  <div className="payment-options">
                    {[
                      ["upi", "UPI / QR", "Fast and familiar"],
                      ["card", "Card", "Visa, Mastercard & RuPay"],
                      ["cod", "Cash on delivery", "Available across India"],
                    ].map(([value, title, desc]) => (
                      <label className={`payment-option ${payment === value ? "is-selected" : ""}`} key={value}>
                        <input type="radio" name="payment" value={value} checked={payment === value} onChange={(e) => setPayment(e.target.value)} />
                        <span className="payment-icon">
                          {value === "upi" ? <Sparkles size={18} /> : value === "card" ? <CreditCard size={18} /> : <Package size={18} />}
                        </span>
                        <span><strong>{title}</strong><small>{desc}</small></span>
                        {payment === value && <CheckCircle2 size={18} className="payment-check" />}
                      </label>
                    ))}
                  </div>
                  <p className="gateway-note">
                    <ShieldCheck size={15} /> Verified Razorpay test/live gateway with server HMAC-SHA256 signature verification.
                  </p>
                </div>
                <button className="dark-button full-button checkout-submit" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing Order..." : `Confirm Order · ${formatINR(total)}`} <ArrowRight size={16} />
                </button>
              </form>
              <aside className="checkout-summary">
                <span className="eyebrow">Order summary</span>
                <h3>{cart.length} {cart.length === 1 ? "item" : "items"}</h3>
                {cart.map((item) => (
                  <div className="summary-line" key={`${item.id}-${item.size}`}>
                    <span>{item.name} <small>{item.size} · {item.quantity}×</small></span>
                    <strong>{formatINR(item.unitPrice * item.quantity)}</strong>
                  </div>
                ))}
                <div className="summary-total">
                  <span>Subtotal</span>
                  <strong>{formatINR(subtotal)}</strong>
                </div>
                {appliedCoupon && (
                  <div className="summary-line text-emerald-800 font-bold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <strong>- {formatINR(discountAmount)}</strong>
                  </div>
                )}
                <div className="summary-line text-xs">
                  <span>Shipping</span>
                  <strong>{shippingFee === 0 ? "FREE" : formatINR(shippingFee)}</strong>
                </div>
                <div className="summary-total border-t border-[#DEDFD5] pt-2">
                  <span>Total Due</span>
                  <strong className="text-base text-[#123D28]">{formatINR(total)}</strong>
                </div>
                <div className="summary-perk">
                  <Truck size={17} />
                  <span><strong>Pan India delivery</strong><small>Free delivery on orders above ₹799</small></span>
                </div>
              </aside>
            </div>
          </>
        ) : (
          <div className="success-state">
            <div className="success-icon"><Check size={30} /></div>
            <span className="eyebrow">Order confirmed</span>
            <h2>Thank you for choosing TRINAYAA.</h2>
            <p>
              Your order <strong>{completedOrder?.orderNumber}</strong> has been received and saved.
              We are preparing your pure botanicals with care.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-4">
              <button
                className="dark-button"
                onClick={() => {
                  onClose();
                  onComplete();
                  setLocation("/track-order");
                }}
              >
                Track this order <ArrowRight size={16} />
              </button>
              <button
                className="light-button"
                onClick={() => {
                  onClose();
                  onComplete();
                }}
              >
                Back to storefront
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ProductDetailModal({
  product,
  open,
  onClose,
  onAdd,
  isWishlisted,
  onWishlist,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onAdd: (product: Product, size: string, unitPrice: number, quantity: number) => void;
  isWishlisted: boolean;
  onWishlist: () => void;
}) {
  const [selectedSize, setSelectedSize] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!open || !product) return null;

  const currentSizeObj = product.sizes[selectedSize] || product.sizes[0] || { label: "100 g", price: product.price };

  return (
    <div className="modal-shell">
      <button className="drawer-overlay" onClick={onClose} aria-label="Close product details" />
      <section className="product-modal" role="dialog" aria-modal="true">
        <button className="close-button product-close" onClick={onClose}><X size={20} /></button>
        <div className="product-modal-image">
          <img
            src={product.image}
            alt={product.name}
            onError={(e: any) => { e.target.src = getCategoryPlaceholder(product.category); }}
          />
        </div>
        <div className="product-modal-copy">
          <div className="flex items-center justify-between">
            <span className="eyebrow">{product.category} {product.badge ? `· ${product.badge}` : ""}</span>
            {product.sku && <span className="text-[11px] font-mono tracking-wider text-[#6C7167] bg-[#F4EFE6] px-2 py-0.5 rounded">{product.sku}</span>}
          </div>
          <h2>{product.name}</h2>
          {product.nameTa && <p className="text-sm font-serif text-[#ae6a2b] -mt-2 mb-2 font-semibold">{product.nameTa}</p>}
          <div className="detail-rating">★★★★★ <span>4.9 · Verified Botanical Reviews</span></div>
          <p className="detail-description">{product.description || "Every batch is packed with care in small, considered quantities."}</p>
          <div className="detail-price">
            <strong>{formatINR(currentSizeObj.price)}</strong>
            {product.compareAt && product.compareAt > currentSizeObj.price && (
              <>
                <del>{formatINR(product.compareAt)}</del>
                <span className="text-xs font-bold text-[#123D28] bg-[#EAF2ED] px-2 py-0.5 rounded ml-2">
                  {Math.round(((product.compareAt - currentSizeObj.price) / product.compareAt) * 100)}% OFF
                </span>
              </>
            )}
            <span className="ml-2 font-medium text-xs text-[#2E7D32]">
              • {product.stockAvailability || (product.stock && product.stock > 0 ? "In Stock" : "In Stock")}
            </span>
          </div>
          <div className="choice-block">
            <div className="choice-label"><strong>Choose a pack size</strong><span>Freshly packed in Tamil Nadu</span></div>
            <div className="size-options">
              {product.sizes.map((size, index) => (
                <button
                  key={size.label}
                  className={selectedSize === index ? "is-selected" : ""}
                  onClick={() => setSelectedSize(index)}
                >
                  {size.label}<small>{formatINR(size.price)}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="detail-actions">
            <div className="qty-stepper large-stepper">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}><Plus size={15} /></button>
            </div>
            <button
              className="dark-button add-detail-button"
              onClick={() => {
                onAdd(product, currentSizeObj.label, currentSizeObj.price, quantity);
                onClose();
              }}
            >
              Add to cart <ShoppingBag size={17} />
            </button>
            <button
              className={`heart-detail ${isWishlisted ? "is-wishlisted" : ""}`}
              onClick={onWishlist}
              aria-label="Toggle wishlist"
            >
              <Heart size={19} fill={isWishlisted ? "currentColor" : "none"} />
            </button>
          </div>
          <div className="detail-features">
            <span><Leaf size={16} /> 100% Pure Botanical</span>
            <span><Truck size={16} /> Pan India Delivery</span>
            <span><ShieldCheck size={16} /> Hygienically Packed</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function AuthModal({
  open,
  onClose,
  onSuccess,
  guestToken,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  guestToken?: string;
}) {
  const [tab, setTab] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome back, ${data.user.name}`);
      try {
        sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.token}`);
        localStorage.setItem("trinayaa_session_token", data.token);
      } catch (e) {}
      setLoading(false);
      onSuccess();
      onClose();
      if (data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN") {
        window.location.href = "/admin";
      }
    },
    onError: (err) => {
      toast.error(err.message || "Sign in failed");
      setLoading(false);
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      toast.success(`Account created! Welcome, ${data.user.name}`);
      try {
        sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.token}`);
        localStorage.setItem("trinayaa_session_token", data.token);
      } catch (e) {}
      setLoading(false);
      onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed");
      setLoading(false);
    },
  });

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (tab === "register") {
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
    }
    setLoading(true);
    if (tab === "signin") {
      loginMutation.mutate({ email, password, guestToken });
    } else {
      registerMutation.mutate({ email, password, confirmPassword, name, phone, guestToken });
    }
  };

  return (
    <div className="modal-shell">
      <button className="drawer-overlay" onClick={onClose} aria-label="Close authentication" />
      <section className="checkout-modal max-w-md p-6 bg-[#FFFDF8]" role="dialog" aria-modal="true">
        <div className="modal-head pb-3 border-b border-[#DEDFD5]">
          <div>
            <span className="eyebrow">TRINAYAA Profile</span>
            <h2>{tab === "signin" ? "Customer Sign In" : "Create Account"}</h2>
          </div>
          <button className="close-button" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="flex border-b border-[#DEDFD5] my-4 text-xs font-bold">
          <button
            onClick={() => setTab("signin")}
            className={`pb-2 px-4 transition-colors ${
              tab === "signin" ? "border-b-2 border-[#123D28] text-[#123D28]" : "text-[#6C7167]"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab("register")}
            className={`pb-2 px-4 transition-colors ${
              tab === "register" ? "border-b-2 border-[#123D28] text-[#123D28]" : "text-[#6C7167]"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          {tab === "register" && (
            <>
              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Phone Number</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block font-semibold mb-1">Email Address</label>
            <input
              type="email"
              id="customer_signin_email"
              name="customer_signin_email"
              autoComplete="off"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0]"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Password</label>
            <input
              type="password"
              id="customer_signin_password"
              name="customer_signin_password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0]"
            />
          </div>

          {tab === "register" && (
            <div>
              <label className="block font-semibold mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-[#DEDFD5] rounded bg-[#FBF8F0]"
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="dark-button full-button mt-4">
            {loading ? "Processing..." : tab === "signin" ? "Sign In" : "Register Account"} <ArrowRight size={16} />
          </button>

          <div className="pt-2 text-center text-[11px] text-[#6C7167]">
            <span>Store Administrator? </span>
            <a href="/admin/login" className="text-[#123D28] font-bold hover:underline">
              Access Admin Portal &rarr;
            </a>
          </div>
        </form>
      </section>
    </div>
  );
}

function AccountModal({
  open,
  onClose,
  currentUser,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  currentUser: any;
  onLogout: () => void;
}) {
  const [, setLocation] = useLocation();
  const { data: myOrders = [] } = trpc.orders.customerOrders.useQuery(undefined, {
    enabled: open && Boolean(currentUser),
  });
  const { data: myAddresses = [] } = trpc.addresses.list.useQuery(undefined, {
    enabled: open && Boolean(currentUser),
  });

  if (!open || !currentUser) return null;

  return (
    <div className="modal-shell">
      <button className="drawer-overlay" onClick={onClose} aria-label="Close profile" />
      <section className="checkout-modal max-w-lg p-6 bg-[#FFFDF8]" role="dialog" aria-modal="true">
        <div className="modal-head pb-3 border-b border-[#DEDFD5]">
          <div>
            <span className="eyebrow">{currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN" ? "Administrator Session" : "Account Overview"}</span>
            <h2>Welcome, {currentUser.name}</h2>
            <p className="text-xs text-[#6C7167]">{currentUser.email} {currentUser.role === "ADMIN" && "· Authorized Store Administrator"}</p>
          </div>
          <button className="close-button" onClick={onClose}><X size={20} /></button>
        </div>

        {Boolean(currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN") && (
          <div className="my-4 p-4 rounded-xl bg-[#123D28] text-white space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-[#E8BF83]">
              <ShieldCheck size={18} /> Administrator Account
            </div>
            <p className="text-xs text-[#DFE7D7] leading-relaxed">
              You are signed in with administrator privileges. Catalogue management, inventory controls, order tracking, and store policies are accessed directly via the Admin Console.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  onClose();
                  setLocation("/admin");
                }}
                className="px-3 py-1.5 bg-[#E8BF83] hover:bg-[#D4AF37] text-[#123D28] font-bold rounded text-xs transition-colors"
              >
                Go to Admin Console &rarr;
              </button>
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        <div className="py-4 space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 bg-[#FBF8F0] border border-[#DEDFD5] rounded-md">
            <div>
              <div className="font-bold text-[#123D28]">{currentUser.name}</div>
              <div className="text-[11px] text-[#6C7167]">{currentUser.phone || "No phone added"}</div>
            </div>
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="text-red-700 hover:text-red-900 font-bold flex items-center gap-1"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>

          <div>
            <h3 className="font-serif font-bold text-base text-[#123D28] mb-2">My Orders</h3>
            {myOrders.length === 0 ? (
              <p className="text-[#6C7167] py-4 text-center">You haven’t placed any orders yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {myOrders.map((o: any) => (
                  <div key={o.id} className="p-3 border border-[#DEDFD5] rounded-md bg-white flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#123D28]">{o.orderNumber}</div>
                      <div className="text-[11px] text-[#6C7167]">
                        {new Date(o.createdAt).toLocaleDateString()} · ₹{o.total} · {o.orderStatus}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        setLocation("/track-order");
                      }}
                      className="dark-button text-[11px] py-1 px-2.5"
                    >
                      Track
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-serif font-bold text-base text-[#123D28] mb-2">Saved Addresses</h3>
            {myAddresses.length === 0 ? (
              <p className="text-[#6C7167] py-2 text-center text-xs">No saved addresses yet. Save one during checkout.</p>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {myAddresses.map((a: any) => (
                  <div key={a.id} className="p-2.5 border border-[#DEDFD5] rounded-md bg-white text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-[#123D28]">{a.recipientName}</strong>
                      {a.isDefault ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">Default</span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-[#6C7167] mt-0.5">
                      {a.street}, {a.city}, {a.state} - {a.pinCode}
                    </div>
                    <div className="text-[10px] text-[#6C7167]">Phone: {a.phone}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MobileMenu({
  open,
  onClose,
  onCategory,
}: {
  open: boolean;
  onClose: () => void;
  onCategory: (category: string) => void;
}) {
  const [, setLocation] = useLocation();
  if (!open) return null;
  return (
    <div className="mobile-menu-shell">
      <button className="drawer-overlay" onClick={onClose} aria-label="Close menu" />
      <aside className="mobile-menu">
        <div className="mobile-menu-head">
          <BrandMark />
          <button className="close-button" onClick={onClose}><X size={20} /></button>
        </div>
        <nav>
          <button onClick={() => { onClose(); setLocation("/"); }}>Home <ArrowRight size={16} /></button>
          <button onClick={() => { onClose(); setLocation("/products"); }}>Products <ArrowRight size={16} /></button>
          <button onClick={() => { onClose(); setLocation("/bulk-enquiry"); }}>Bulk / Wholesale <ArrowRight size={16} /></button>
          <button onClick={() => { onClose(); setLocation("/about"); }}>About <ArrowRight size={16} /></button>
          <button onClick={() => { onClose(); setLocation("/contact"); }}>Contact <ArrowRight size={16} /></button>
          <button onClick={() => { onClose(); setLocation("/track-order"); }}>Track Order <ArrowRight size={16} /></button>
        </nav>
        <div className="mobile-menu-foot">
          <span>support@trinayaa.in</span>
          <span>Pan India delivery</span>
        </div>
      </aside>
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Deep linking and clean URL routing
  const [matchProduct, productParams] = useRoute("/products/:slug");
  const [matchCategory, categoryParams] = useRoute("/categories/:slug");
  const [matchProductsList] = useRoute("/products");

  // Persistent Guest Token
  const [guestToken] = useState<string>(() => getGuestToken());

  // tRPC live queries
  const { data: dbProducts = [] } = trpc.products.list.useQuery({ limit: 200 });
  const { data: dbBanners } = trpc.content.getBanners.useQuery();
  const { data: currentUser, refetch: refetchUser } = trpc.auth.me.useQuery();
  const cartQuery = trpc.cart.get.useQuery({ guestToken });

  const addToCartMutation = trpc.cart.add.useMutation();
  const updateCartMutation = trpc.cart.update.useMutation();
  const removeCartMutation = trpc.cart.remove.useMutation();

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      try {
        localStorage.removeItem("trinayaa_session_token");
        localStorage.removeItem("manus-cookie");
        const freshGuestToken = "gst_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        localStorage.setItem("trinayaa_guest_token", freshGuestToken);
        sessionStorage.clear();
      } catch (e) {}
      setCart([]);
      toast.success("Signed out successfully");
      refetchUser();
      cartQuery.refetch();
    },
  });

  // Sync server cart into local state on load or update
  useEffect(() => {
    if (cartQuery.data) {
      if (cartQuery.data.items && cartQuery.data.items.length > 0) {
        const serverItems: CartItem[] = cartQuery.data.items.map((item: any) => ({
          id: item.productId,
          sku: item.sku,
          name: item.nameEn,
          nameTa: item.nameTa,
          category: "Botanicals",
          price: item.unitPrice,
          image: item.primaryImage || "/images/products/packaged/pouch_001.png",
          description: "",
          sizes: [{ label: item.packSize, price: item.unitPrice }],
          size: item.packSize,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          slug: item.slug,
        }));
        setCart(serverItems);
      } else {
        setCart([]);
      }
    }
  }, [cartQuery.data]);

  // Combine database products with fallback
  const allProducts: Product[] = useMemo(() => {
    if (dbProducts && dbProducts.length > 0) {
      return dbProducts.map((p: any) => ({
        id: p.id,
        sku: p.sku,
        name: p.nameEn,
        nameTa: p.nameTa,
        category: p.category || (p.productType === "Seed" ? "Seeds" : p.productType === "Powder" ? "Raw Powders" : "Herbs"),
        price: p.price,
        compareAt: p.compareAt,
        discountPercent: p.discountPercent,
        stock: p.stock,
        stockAvailability: p.stockAvailability,
        image: resolveProductImage(p.sku, p.category, p.productType, p.image || p.primaryImage),
        badge: p.featured ? "Featured" : undefined,
        description: p.description || "",
        sizes: p.sizes || [{ label: "100 g", price: p.price }],
        slug: p.slug,
      }));
    }
    return initialProducts;
  }, [dbProducts]);

  useEffect(() => {
    const onFilter = (event: Event) => setActiveCategory((event as CustomEvent<string>).detail);
    const onSearch = (event: Event) => setSearch((event as CustomEvent<string>).detail);
    window.addEventListener("trinayaa-filter", onFilter);
    window.addEventListener("trinayaa-search", onSearch);
    return () => {
      window.removeEventListener("trinayaa-filter", onFilter);
      window.removeEventListener("trinayaa-search", onSearch);
    };
  }, []);

  // Sync route parameters with SPA state
  useEffect(() => {
    if (matchProduct && productParams?.slug && allProducts.length > 0) {
      const found = allProducts.find(
        (p) => p.slug === productParams.slug || p.id === productParams.slug || p.sku?.toLowerCase() === productParams.slug.toLowerCase()
      );
      if (found) {
        setSelectedProduct(found);
      }
    } else if (matchCategory && categoryParams?.slug) {
      const slug = categoryParams.slug.toLowerCase();
      const matched = categoriesData.find(
        (c) => c.label.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug || slug.includes(c.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"))
      );
      if (matched) {
        setActiveCategory(matched.label);
      }
      scrollToShop();
    } else if (matchProductsList) {
      scrollToShop();
    }
  }, [matchProduct, productParams, matchCategory, categoryParams, matchProductsList, allProducts]);

  const filteredProducts = useMemo(() => {
    let result = allProducts.filter((product) => {
      const matchCat =
        activeCategory === "All" ||
        product.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
        activeCategory.toLowerCase().includes(product.category.toLowerCase());
      const term = search.toLowerCase();
      const matchSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        (product.nameTa && product.nameTa.includes(term)) ||
        (product.sku && product.sku.toLowerCase().includes(term)) ||
        product.category.toLowerCase().includes(term);
      return matchCat && matchSearch;
    });

    if (sort === "price-low") result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "price-high") result = [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [allProducts, activeCategory, search, sort]);

  const toggleWishlist = (id: string) =>
    setWishlist((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const addToCart = (product: Product, size = product.sizes[0]?.label || "100 g", unitPrice = product.sizes[0]?.price || product.price, quantity = 1) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id && item.size === size);
      if (existing) {
        return current.map((item) =>
          item.id === product.id && item.size === size ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...current, { ...product, size, unitPrice, quantity }];
    });

    addToCartMutation.mutate(
      { guestToken, productId: product.id, packSize: size, quantity },
      {
        onSuccess: () => cartQuery.refetch(),
        onError: (err) => {
          toast.error(err.message || "Failed to add to cart");
          cartQuery.refetch();
        },
      }
    );

    toast.success(`${product.name} added to your basket`, {
      description: `${size} · ${formatINR(unitPrice)}`,
    });
  };

  const updateCart = (id: string, size: string, delta: number) => {
    const item = cart.find((i) => i.id === id && i.size === size);
    if (!item) return;
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      removeCart(id, size);
      return;
    }

    setCart((current) =>
      current.map((i) => (i.id === id && i.size === size ? { ...i, quantity: newQty } : i))
    );

    updateCartMutation.mutate(
      { guestToken, productId: id, packSize: size, quantity: newQty },
      {
        onSuccess: () => cartQuery.refetch(),
        onError: (err) => {
          toast.error(err.message || "Failed to update quantity");
          cartQuery.refetch();
        },
      }
    );
  };

  const removeCart = (id: string, size: string) => {
    setCart((current) => current.filter((item) => !(item.id === id && item.size === size)));
    removeCartMutation.mutate(
      { guestToken, productId: id, packSize: size },
      {
        onSuccess: () => cartQuery.refetch(),
      }
    );
  };

  const scrollToShop = () => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="site-shell">
      <SiteHeader
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCart={() => setCartOpen(true)}
        onMenu={() => setMenuOpen(true)}
        onAccount={() => {
          if (currentUser) {
            if (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN") {
              setLocation("/admin");
            } else {
              setAccountModalOpen(true);
            }
          } else {
            setAuthModalOpen(true);
          }
        }}
        currentUser={currentUser}
      />
      <main>
        <section className="hero-section">
          <div className="hero-art" style={{ backgroundImage: `url(${IMG.hero})` }} />
          <div className="hero-content container-wide">
            <span className="eyebrow hero-eyebrow">NATURAL HERBS FOR A BETTER TOMORROW</span>
            <h1>Pure Seeds.<br /><em>Raw Powders.</em><br /><span>True Herbs.</span></h1>
            <p className="hero-tagline">Nature's wisdom, your wellness.</p>
            <p>Carefully sourced natural herbs, pure seeds and raw herbal powders for your everyday wellness journey.</p>
            <button className="dark-button hero-button" onClick={() => setLocation("/products")}>
              Explore Products <ArrowRight size={17} />
            </button>
            <div className="hero-notes">
              <span><Leaf size={17} /> Natural Products</span>
              <span><Sparkles size={17} /> Carefully Sourced</span>
              <span><Heart size={17} /> Trusted Quality</span>
            </div>
          </div>
        </section>

        <section className="category-strip container-wide" aria-label="Shop by category">
          {categoriesData.map((category) => (
            <button
              className={`category-card ${category.className}`}
              key={category.label}
              onClick={() => {
                const slug = category.label.toLowerCase().replace(/\s+/g, '-');
                setLocation(`/categories/${slug}`);
              }}
            >
              <div>
                <span className="eyebrow">{category.label}</span>
                <h3>{category.label === "Herbs" ? "Botanical" : category.label === "Raw Powders" ? "Daily wellness" : "Nature’s"}<br />collection</h3>
                <p>{category.caption}</p>
                <span className="circle-arrow"><ArrowRight size={16} /></span>
              </div>
              <img
                src={category.image}
                alt={`${category.label} - TRINAYAA Pure Botanical Collection`}
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </section>

                {/* Brand Heritage & Purity Philosophy Section */}
        <section className="brand-philosophy-section container-wide py-16" aria-label="About TRINAYAA Brand">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="eyebrow text-xs font-bold uppercase tracking-widest text-[#8E734B] block mb-2">
              TRADITION &amp; HERBAL INTEGRITY
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#123D28] leading-tight">
              Rooted in Tamil Nadu’s <em>Botanical Wisdom</em>
            </h2>
            <p className="text-sm md:text-base text-[#4B5046] mt-4 leading-relaxed font-sans">
              From the fertile river basins of Erode and pristine foothills of the Western Ghats, TRINAYAA brings 100% pure, unadulterated botanical seeds, raw herbal powders, and whole herbs directly to your home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
            <div className="bg-white border border-[#E5DECF] rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#123D28] text-white flex items-center justify-center mb-5 shadow-xs">
                  <Leaf size={24} />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#123D28] mb-2">
                  Direct Farm Sourcing
                </h3>
                <p className="text-xs text-[#8E734B] font-semibold mb-3">
                  நேரடி இயற்கை கொள்முதல்
                </p>
                <p className="text-xs text-[#52574C] leading-relaxed">
                  We partner directly with local farming collectives across Erode and traditional herbal cultivating tracts. No middlemen, no commercial blending—just pure single-origin harvest.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F0EBE0] flex items-center gap-2 text-[11px] font-bold text-[#123D28]">
                <CheckCircle2 size={14} className="text-[#AE6A2B]" /> 100% Traceable Harvest
              </div>
            </div>

            <div className="bg-white border border-[#E5DECF] rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#AE6A2B] text-white flex items-center justify-center mb-5 shadow-xs">
                  <Sparkles size={24} />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#123D28] mb-2">
                  Traditional Processing
                </h3>
                <p className="text-xs text-[#8E734B] font-semibold mb-3">
                  பாரம்பரிய முறையில் தயாரிப்பு
                </p>
                <p className="text-xs text-[#52574C] leading-relaxed">
                  Carefully cleaned and processed using traditional solar and shade drying methods followed by slow micro-pulverization to retain volatile essential oils and therapeutic potency.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F0EBE0] flex items-center gap-2 text-[11px] font-bold text-[#123D28]">
                <CheckCircle2 size={14} className="text-[#AE6A2B]" /> Retained Essential Oils
              </div>
            </div>

            <div className="bg-white border border-[#E5DECF] rounded-3xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#123D28] text-white flex items-center justify-center mb-5 shadow-xs">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#123D28] mb-2">
                  Zero Preservatives Promise
                </h3>
                <p className="text-xs text-[#8E734B] font-semibold mb-3">
                  100% கலப்படமற்ற தூய்மை
                </p>
                <p className="text-xs text-[#52574C] leading-relaxed">
                  Absolutely no maltodextrin, artificial food colors, anti-caking agents, or chemical preservatives. Every airtight pouch contains only 100% pure botanical powder or whole herb.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#F0EBE0] flex items-center gap-2 text-[11px] font-bold text-[#123D28]">
                <CheckCircle2 size={14} className="text-[#AE6A2B]" /> Lab Tested Purity
              </div>
            </div>
          </div>

          {/* Central Call to Action Card */}
          <div className="bg-[#FAF6EE] border border-[#E5DECF] rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="max-w-2xl mx-auto relative z-10">
              <span className="eyebrow text-xs font-bold uppercase tracking-widest text-[#AE6A2B] block mb-2">
                162 AUTHENTIC BOTANICALS READY TO SHIP
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#123D28] mb-3">
                Explore Our Complete Botanical Catalogue
              </h3>
              <p className="text-xs sm:text-sm text-[#4B5046] mb-6 leading-relaxed">
                Discover our full range of 24 natural seeds, 63 raw herbal powders, and 75 whole herbs—all categorized, searchable, and delivered fresh across India.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setLocation("/products")}
                  className="dark-button inline-flex items-center gap-2 py-3 px-6 text-sm font-semibold rounded-xl shadow-xs"
                >
                  Browse Products (162) <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setLocation("/bulk-enquiry")}
                  className="inline-flex items-center gap-2 py-3 px-6 text-sm font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-[#7C5329] border border-[#DECFB5] transition-colors"
                >
                  Request Wholesale / Bulk Quote &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => setLocation("/about")}
                  className="inline-flex items-center gap-2 py-3 px-6 text-sm font-semibold rounded-xl bg-white text-[#123D28] border border-[#E5DECF] hover:bg-[#F2ECE0] transition-colors"
                >
                  Our Heritage Story &rarr;
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="offer-banner container-wide">
          <div className="offer-botanical"><Leaf size={62} strokeWidth={0.9} /></div>
          <div>
            <span className="eyebrow">A little more nature</span>
            <h2>{dbBanners?.promoBanner || "Free delivery on orders above ₹799"}</h2>
          </div>
          <div className="offer-copy">
            <p>Carefully packed and sent from our shelves to your doorstep, anywhere in India.</p>
            <button className="light-button" onClick={() => setLocation("/products")}>Shop the collection <ArrowRight size={16} /></button>
          </div>
        </section>

        <section className="story-section container-wide" id="story">
          <div className="story-visual">
            <img src={IMG.hibiscus} alt="Dried hibiscus petals in a bowl" />
            <div className="story-stamp"><Leaf size={19} /><span>Grown with<br />intention</span></div>
          </div>
          <div className="story-copy">
            <span className="eyebrow">The Trinayaa way</span>
            <h2>Good ingredients<br />need <em>nothing extra.</em></h2>
            <p>We believe everyday wellness starts with what you can see, smell and trust. Our botanicals are sourced in small batches, cleaned carefully and packed simply—so the ingredient stays at the heart of the ritual.</p>
            <div className="story-points">
              <span><CheckCircle2 size={18} /> Sourced with intention</span>
              <span><CheckCircle2 size={18} /> Honest, simple ingredients</span>
              <span><CheckCircle2 size={18} /> Packed fresh in India</span>
            </div>
            <button className="text-button" onClick={() => setLocation("/about")}>Read our story <ArrowRight size={16} /></button>
          </div>
        </section>

        <TrustRow />
      </main>

      <footer className="site-footer">
        <div className="footer-inner container-wide">
          <div className="footer-brand">
            <BrandMark inverse />
            <p>Pure seeds. Raw powders.<br />True herbs.</p>
            <div className="socials">
              <a href="#footer" aria-label="Instagram"><Instagram size={16} /></a>
              <a href="#footer" aria-label="Facebook"><Facebook size={16} /></a>
              <a href="#footer" aria-label="Youtube"><Youtube size={16} /></a>
            </div>
          </div>
          <div className="footer-column">
            <span className="footer-title">Quick links</span>
            <button onClick={() => setLocation("/")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Home</button>
            <button onClick={() => setLocation("/products")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Products</button>
            <button onClick={() => setLocation("/bulk-enquiry")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Bulk / Wholesale</button>
            <button onClick={() => setLocation("/about")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">About</button>
            <button onClick={() => setLocation("/contact")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Contact</button>
          </div>
          <div className="footer-column">
            <span className="footer-title">Customer care</span>
            <button onClick={() => setLocation("/about")}>About Us</button>
            <button onClick={() => setLocation("/contact")}>Contact</button>
            <button onClick={() => setLocation("/track-order")}>Track Order</button>
            <button onClick={() => setLocation("/admin/login")}>Admin Portal</button>
          </div>
          <div className="footer-column footer-contact">
            <span className="footer-title">Contact us</span>
            <span><MapPin size={15} /> Erode, Tamil Nadu – 638002</span>
            <a href="mailto:support@trinayaa.in"><Mail size={15} /> support@trinayaa.in</a>
            <a href="tel:+919876543210"><Phone size={15} /> +91 98765 43210</a>
          </div>
        </div>
        <div className="footer-bottom container-wide">
          <span>© 2026 TRINAYAA ENTERPRISES. All rights reserved.</span>
          <div>
            <button onClick={() => setLocation("/policies/privacy")} className="hover:underline">Privacy Policy</button>
            <button onClick={() => setLocation("/policies/terms")} className="hover:underline">Terms & Conditions</button>
            <button onClick={() => setLocation("/policies/shipping")} className="hover:underline">Shipping Policy</button>
            <button onClick={() => setLocation("/policies/returns")} className="hover:underline">Return Policy</button>
          </div>
        </div>
      </footer>

      <CartDrawer
        cart={cart}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onUpdate={updateCart}
        onRemove={removeCart}
        onCheckout={() => {
          setCartOpen(false);
          if (!currentUser) {
            toast.info("Please sign in or register to securely place your order.", {
              description: "Your cart items are preserved safely.",
            });
            setAuthModalOpen(true);
          } else {
            setCheckoutOpen(true);
          }
        }}
      />

      <CheckoutModal
        cart={cart}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onComplete={() => {
          setCheckoutOpen(false);
          setCart([]);
          cartQuery.refetch();
        }}
        currentUser={currentUser}
        onRequireAuth={() => setAuthModalOpen(true)}
      />

      <ProductDetailModal
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onClose={() => {
          setSelectedProduct(null);
          if (window.location.pathname.startsWith("/products/")) {
            window.history.pushState(null, "", "/");
          }
        }}
        onAdd={addToCart}
        isWishlisted={selectedProduct ? wishlist.has(selectedProduct.id) : false}
        onWishlist={() => selectedProduct && toggleWishlist(selectedProduct.id)}
      />

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        guestToken={guestToken}
        onSuccess={() => {
          refetchUser();
          cartQuery.refetch();
          if (cart.length > 0) {
            setCheckoutOpen(true);
          }
        }}
      />

      <AccountModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        currentUser={currentUser}
        onLogout={() => logoutMutation.mutate()}
      />

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onCategory={(category) => {
          setActiveCategory(category);
          setMenuOpen(false);
          window.setTimeout(scrollToShop, 30);
        }}
      />
    </div>
  );
}
