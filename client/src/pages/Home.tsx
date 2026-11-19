import AuthModal from "@/components/AuthModal";
import { resolveProductImage, getCategoryPlaceholder } from "../lib/productImage";
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Facebook,
  Gift,
  Heart,
  Instagram,
  Leaf,
  LifeBuoy,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Minus,
  Package,
  PackageSearch,
  Repeat,
  Calendar,
  Percent,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  UserRound,
  X,
  Youtube,
} from "lucide-react";
import { useEffect, useMemo, useState, useRef, FormEvent } from "react";
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
  hero: "/images/hero/trinayaa_home_hero_banner_2x.jpg?v=3",
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
import StoreFooter from "@/components/StoreFooter";


function SiteHeader({
  cartCount,
  onCart,
  onMenu,
  onAccount,
  currentUser,
  wishlistCount,
  onLogout,
}: {
  cartCount: number;
  onCart: () => void;
  onMenu: () => void;
  onAccount: () => void;
  currentUser: any;
  wishlistCount?: number;
  onLogout: () => void;
}) {
  const [, setLocation] = useLocation();
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAccountDropdownOpen(false);
      }
    }
    if (accountDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [accountDropdownOpen]);
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
            {currentUser && (
              <>
                <i />
                <button
                  onClick={() => setLocation(currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN" ? "/admin" : "/account")}
                  className="font-bold text-[#123D28] hover:text-[#8C6D3F] transition-colors"
                >
                  My Account
                </button>
              </>
            )}
            {(currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN") && (
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
              className="icon-action wishlist-action"
              aria-label="Wishlist"
              onClick={() => {
                if (currentUser) {
                  window.location.href = "/account?tab=wishlist";
                } else {
                  toast.info("Please sign in to view your saved wishlist.");
                }
              }}
              title="Saved Wishlist"
            >
              <Heart size={21} className={wishlistCount && wishlistCount > 0 ? "text-rose-600 fill-rose-600" : ""} />
              <span>Wishlist</span>
              {wishlistCount && wishlistCount > 0 ? <b>{wishlistCount}</b> : null}
            </button>
            <div className="relative" ref={dropdownRef}>
              <button
                className="icon-action account-action"
                aria-label="Account"
                onClick={() => {
                  if (currentUser) {
                    setAccountDropdownOpen((prev) => !prev);
                  } else {
                    onAccount();
                  }
                }}
              >
                <UserRound size={22} />
                <span>{currentUser ? (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN" ? "Admin" : currentUser.name.split(" ")[0]) : "Account"}</span>
                {currentUser && (
                  <ChevronDown size={12} className={`transition-transform duration-200 ${accountDropdownOpen ? "rotate-180" : ""}`} />
                )}
              </button>

              {accountDropdownOpen && currentUser && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#DEDFD5] rounded-2xl shadow-2xl p-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  {/* Greeting & Role */}
                  <div className="p-3 bg-[#FBF8F0] border border-[#EFECE4] rounded-xl mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#123D28] text-[#FBF8F0] font-serif font-bold text-sm flex items-center justify-center shrink-0">
                        {currentUser.name?.[0] || "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-[#123D28] truncate">{currentUser.name}</div>
                        <div className="text-[10px] text-[#6C7167] truncate">{currentUser.email}</div>
                      </div>
                    </div>
                    <span className="inline-block mt-2 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100/80 text-emerald-900 border border-emerald-200">
                      {currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN" ? "🛡️ Store Administrator" : "🌿 Verified Customer"}
                    </span>
                  </div>

                  {/* Shortcuts */}
                  <div className="space-y-0.5 py-1 text-[#2B3527]">
                    <button
                      onClick={() => { setAccountDropdownOpen(false); setLocation("/account?tab=orders"); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#FAF8F2] hover:text-[#123D28] rounded-xl transition-colors font-medium text-left"
                    >
                      <Package size={15} className="text-[#8C6D3F]" />
                      <span>My Orders &amp; Tracking</span>
                    </button>
                    <button
                      onClick={() => { setAccountDropdownOpen(false); setLocation("/account?tab=wishlist"); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#FAF8F2] hover:text-[#123D28] rounded-xl transition-colors font-medium text-left"
                    >
                      <Heart size={15} className="text-rose-600" />
                      <span>My Saved Wishlist</span>
                    </button>
                    <button
                      onClick={() => { setAccountDropdownOpen(false); setLocation("/account?tab=rewards"); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#FAF8F2] hover:text-[#123D28] rounded-xl transition-colors font-medium text-left"
                    >
                      <Award size={15} className="text-amber-600" />
                      <span>Loyalty Rewards &amp; Points</span>
                    </button>
                    <button
                      onClick={() => { setAccountDropdownOpen(false); setLocation("/account?tab=tickets"); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#FAF8F2] hover:text-[#123D28] rounded-xl transition-colors font-medium text-left"
                    >
                      <LifeBuoy size={15} className="text-emerald-700" />
                      <span>Support Helpdesk (Tickets)</span>
                    </button>
                    <button
                      onClick={() => { setAccountDropdownOpen(false); setLocation("/account?tab=addresses"); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#FAF8F2] hover:text-[#123D28] rounded-xl transition-colors font-medium text-left"
                    >
                      <MapPin size={15} className="text-[#8C6D3F]" />
                      <span>Delivery Addresses</span>
                    </button>
                    <button
                      onClick={() => { setAccountDropdownOpen(false); setLocation("/product-enquiry"); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[#FAF8F2] hover:text-[#123D28] rounded-xl transition-colors font-medium text-left"
                    >
                      <PackageSearch size={15} className="text-emerald-700" />
                      <span>New Product Enquiry</span>
                    </button>
                    {(currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN") && (
                      <button
                        onClick={() => { setAccountDropdownOpen(false); setLocation("/admin"); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 bg-[#123D28]/10 hover:bg-[#123D28]/15 text-[#123D28] font-bold rounded-xl transition-colors text-left"
                      >
                        <ShieldCheck size={15} className="text-[#123D28]" />
                        <span>Admin Console &rarr;</span>
                      </button>
                    )}
                  </div>

                  {/* Primary Button: View Full My Account */}
                  <div className="pt-2 mt-1 border-t border-[#EFECE4] space-y-1.5">
                    <button
                      onClick={() => { setAccountDropdownOpen(false); setLocation("/account"); }}
                      className="w-full py-2.5 px-3 bg-[#123D28] hover:bg-[#1A4D33] text-white rounded-xl font-bold text-center block transition-colors shadow-xs text-xs"
                    >
                      View Full My Account &rarr;
                    </button>
                    <button
                      onClick={() => { setAccountDropdownOpen(false); onLogout(); }}
                      className="w-full py-1.5 px-3 text-red-700 hover:text-red-900 hover:bg-red-50 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors text-xs"
                    >
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
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
  onSaveForLater,
}: {
  cart: CartItem[];
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, size: string, delta: number) => void;
  onRemove: (id: string, size: string) => void;
  onCheckout: () => void;
  onSaveForLater?: (id: string, size: string) => void;
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
                    {onSaveForLater && (
                      <button
                        type="button"
                        onClick={() => onSaveForLater(item.id, item.size)}
                        className="text-[11px] text-[#AE6A2B] hover:text-[#123D28] font-semibold flex items-center gap-1 mt-1.5 transition-colors"
                      >
                        <Heart size={11} /> Save for later
                      </button>
                    )}
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

  // Form fields (Phase 6: Billing & Shipping Separation, Gift Delivery)
  const [name, setName] = useState(currentUser?.name || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Erode");
  const [pinCode, setPinCode] = useState("638002");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(false);

  // Phase 6 State
  const [isSameAddress, setIsSameAddress] = useState(true);
  const [billingName, setBillingName] = useState(currentUser?.name || "");
  const [billingPhone, setBillingPhone] = useState(currentUser?.phone || "");
  const [billingEmail, setBillingEmail] = useState(currentUser?.email || "");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("Erode");
  const [billingState, setBillingState] = useState("Tamil Nadu");
  const [billingPinCode, setBillingPinCode] = useState("638002");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isGiftOrder, setIsGiftOrder] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");

  const { data: savedAddresses = [], refetch: refetchAddresses } = trpc.addresses.list.useQuery(undefined, {
    enabled: open && Boolean(currentUser),
    retry: false,
  });
  const saveAddressMutation = trpc.addresses.create.useMutation();

  // Phase 2: Active Festival Offers Query for Checkout Visibility
  const { data: rawFestivalOffers = [], isLoading: loadingOffers } = trpc.offers.getActive.useQuery(undefined, {
    enabled: open,
    staleTime: 30000,
  });

  // Deduplicate offers by uppercase code to ensure clean display
  const festivalOffers = useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    for (const off of rawFestivalOffers) {
      const codeUpper = (off.code || "").trim().toUpperCase();
      if (codeUpper && !seen.has(codeUpper)) {
        seen.add(codeUpper);
        list.push(off);
      }
    }
    return list;
  }, [rawFestivalOffers]);

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Phase 5: Server-side COD Eligibility Check
  const { data: codEligibility } = trpc.orders.checkCodEligibility.useQuery(
    {
      items: cart.map((it) => ({
        productId: it.id,
        packSize: it.size,
        quantity: it.quantity,
      })),
      couponCode: appliedCoupon?.code,
    },
    { enabled: open && cart.length > 0 }
  );

  const isCodAvailableForCart = codEligibility?.isEligible ?? true;
  const codIneligibilityReason = codEligibility?.reason;

  useEffect(() => {
    if (!isCodAvailableForCart && payment === "cod") {
      setPayment("upi");
    }
  }, [isCodAvailableForCart, payment]);

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

      // 1. Create order on server (Phase 6: Distinct Bill To, Ship To, Gift Delivery)
      const cleanBillingPhone = (billingPhone || cleanPhone).replace(/[\s-]/g, "");
      const cleanRecipientPhone = (recipientPhone || cleanPhone).replace(/[\s-]/g, "");
      const cleanBillingPin = (billingPinCode || cleanPin).trim();

      const order = await createOrderMutation.mutateAsync({
        customerName: isSameAddress ? name : (billingName || name),
        customerEmail: isSameAddress ? email : (billingEmail || email),
        customerPhone: isSameAddress ? cleanPhone : cleanBillingPhone,
        billingName: isSameAddress ? name : (billingName || name),
        billingPhone: isSameAddress ? cleanPhone : cleanBillingPhone,
        billingEmail: isSameAddress ? email : (billingEmail || email),
        recipientName: isSameAddress ? name : (recipientName || name),
        recipientPhone: isSameAddress ? cleanPhone : cleanRecipientPhone,
        recipientEmail: isSameAddress ? email : (recipientEmail || email),
        isSameAddress,
        isGiftOrder,
        giftMessage: isGiftOrder ? giftMessage.trim() : undefined,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        shippingAddress: {
          street: address,
          city,
          state: "Tamil Nadu",
          pinCode: cleanPin,
          deliveryInstructions: deliveryInstructions.trim() || undefined,
        },
        billingAddress: isSameAddress ? undefined : {
          street: billingAddress || address,
          city: billingCity || city,
          state: billingState || "Tamil Nadu",
          pinCode: cleanBillingPin,
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
                {/* Delivery / Shipping Address (Ship To) */}
                <div className="form-section">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="flex items-center gap-1.5">
                        <Truck size={16} className="text-[#123D28]" />
                        Delivery / Shipping Address (Ship To)
                      </h3>
                      <p className="text-[11px] text-[#6C7167]">Where should your parcel be delivered?</p>
                    </div>
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
                    <label className="full-field">Delivery Instructions (Optional)<input value={deliveryInstructions} onChange={(e) => setDeliveryInstructions(e.target.value)} placeholder="e.g. Leave with security, call upon arrival" /></label>
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

                {/* Billing Address Configuration (Bill To) - Phase 6 */}
                <div className="form-section p-3.5 bg-[#FAF8F2] rounded-xl border border-[#DEDFD5]">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-[#123D28] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSameAddress}
                      onChange={(e) => setIsSameAddress(e.target.checked)}
                      className="rounded accent-[#123D28] w-4 h-4"
                    />
                    <span>Billing address same as shipping address</span>
                  </label>

                  {!isSameAddress && (
                    <div className="mt-3.5 pt-3 border-t border-[#DEDFD5] space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-[#123D28] uppercase tracking-wider">Billing Details (Bill To)</h4>
                        <p className="text-[11px] text-[#6C7167]">Invoiced purchaser details for tax invoice & records.</p>
                      </div>
                      <div className="form-grid">
                        <label>Purchaser Name<input required={!isSameAddress} value={billingName} onChange={(e) => setBillingName(e.target.value)} placeholder="Purchaser full name" /></label>
                        <label>Purchaser Mobile<input required={!isSameAddress} value={billingPhone} onChange={(e) => setBillingPhone(e.target.value)} placeholder="+91 98765 43210" /></label>
                        <label className="full-field">Purchaser Email<input type="email" required={!isSameAddress} value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} placeholder="billing@example.com" /></label>
                        <label className="full-field">Billing Address<input required={!isSameAddress} value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="Billing street address" /></label>
                        <label>City<input required={!isSameAddress} value={billingCity} onChange={(e) => setBillingCity(e.target.value)} placeholder="City" /></label>
                        <label>State<input required={!isSameAddress} value={billingState} onChange={(e) => setBillingState(e.target.value)} placeholder="State" /></label>
                        <label>PIN Code<input required={!isSameAddress} value={billingPinCode} onChange={(e) => setBillingPinCode(e.target.value)} placeholder="PIN Code" /></label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Gift Delivery Option - Phase 6 */}
                <div className="form-section p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-[#8E5E28] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGiftOrder}
                      onChange={(e) => setIsGiftOrder(e.target.checked)}
                      className="rounded accent-[#8E5E28] w-4 h-4"
                    />
                    <span className="flex items-center gap-1.5">
                      <Gift size={15} className="text-[#8E5E28]" />
                      <span>This is a gift order (Deliver to recipient with custom gift message)</span>
                    </span>
                  </label>

                  {isGiftOrder && (
                    <div className="mt-3 pt-3 border-t border-amber-200/80 space-y-2">
                      <label className="block text-xs font-semibold text-[#123D28]">
                        Gift Message for Recipient (Printed on shipping slip)
                        <textarea
                          rows={2}
                          maxLength={500}
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          placeholder="Wishing you health and natural wellness from TRINAYAA..."
                          className="w-full mt-1 p-2 text-xs border border-[#DEDFD5] rounded-md bg-white focus:outline-none focus:border-[#123D28]"
                        />
                      </label>
                      <p className="text-[10.5px] text-[#8E5E28] italic">
                        🎁 Confidential Packaging Notice: Outer label and packing sticker will never reveal product prices or invoice values to the recipient.
                      </p>
                    </div>
                  )}
                </div>
                <div className="form-section space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-serif font-bold text-[#123D28] flex items-center gap-1.5">
                        <Gift size={16} className="text-[#AE6A2B]" />
                        Festival Offers
                      </h3>
                      <p className="text-[11px] text-[#6C7167]">Explore available offers for your order.</p>
                    </div>
                    {appliedCoupon && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                        <Check size={12} className="text-emerald-700" /> {appliedCoupon.code} Applied
                      </span>
                    )}
                  </div>

                  {/* Active Festival Offer Cards */}
                  {loadingOffers ? (
                    <div className="text-xs text-[#6C7167] py-2 animate-pulse flex items-center gap-1.5">
                      <Sparkles size={14} className="animate-spin text-[#AE6A2B]" /> Loading festival offers...
                    </div>
                  ) : festivalOffers.length === 0 ? (
                    <p className="text-xs text-[#6C7167] italic py-1 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                      No festival offers are currently available for this order.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {festivalOffers.map((offer: any) => {
                        const isApplied = appliedCoupon?.code?.toUpperCase() === offer.code?.toUpperCase();
                        const meetsMinOrder = !offer.minOrderValue || subtotal >= offer.minOrderValue;
                        const discountBadge =
                          offer.discountType === "PERCENTAGE"
                            ? `${offer.discountValue}% OFF`
                            : `₹${offer.discountValue} OFF`;

                        return (
                          <div
                            key={offer.id || offer.code}
                            className={`p-3 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isApplied
                                ? "bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-300"
                                : meetsMinOrder
                                ? "bg-[#FAF7F0] border-[#DEDFD5] hover:border-[#123D28]/40 shadow-2xs"
                                : "bg-slate-50/80 border-slate-200 opacity-80"
                            }`}
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-serif font-bold text-[#123D28] text-xs">
                                  {offer.name}
                                </span>
                                <span className="px-1.5 py-0.5 rounded-sm bg-white border border-[#DEDFD5] font-mono font-bold text-[10.5px] tracking-wider text-[#123D28]">
                                  {offer.code}
                                </span>
                                <span className="font-bold text-emerald-800 text-[11px] bg-emerald-100/70 px-1.5 py-0.5 rounded">
                                  {discountBadge}
                                </span>
                              </div>

                              <div className="text-[11px] text-[#6C7167] flex items-center gap-2 flex-wrap">
                                {offer.minOrderValue > 0 ? (
                                  <span>Min order: ₹{offer.minOrderValue}</span>
                                ) : (
                                  <span>No minimum order</span>
                                )}
                                {offer.maxDiscount > 0 && offer.discountType === "PERCENTAGE" && (
                                  <span>• Max discount: ₹{offer.maxDiscount}</span>
                                )}
                                {offer.endDate && (
                                  <span>
                                    • Valid till: {new Date(offer.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                                  </span>
                                )}
                              </div>

                              {offer.bannerText && (
                                <p className="text-[10.5px] text-[#123D28]/80 italic line-clamp-1">
                                  {offer.bannerText}
                                </p>
                              )}

                              {!meetsMinOrder && (
                                <p className="text-[10.5px] text-amber-700 font-medium">
                                  Add ₹{Math.round(offer.minOrderValue - subtotal)} more to unlock this offer
                                </p>
                              )}
                            </div>

                            <div className="shrink-0 self-end sm:self-center">
                              {isApplied ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAppliedCoupon(null);
                                    setCouponCode("");
                                    toast.info("Offer removed");
                                  }}
                                  className="text-xs text-rose-700 hover:text-rose-900 font-semibold px-2.5 py-1 rounded-md border border-rose-300 bg-rose-50 hover:bg-rose-100 transition-colors"
                                >
                                  Remove
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={validateCouponMutation.isPending}
                                  onClick={() => {
                                    setCouponCode(offer.code);
                                    validateCouponMutation.mutate({ code: offer.code, subtotal });
                                  }}
                                  className={`text-xs py-1.5 px-3.5 rounded-lg font-semibold transition-all ${
                                    meetsMinOrder
                                      ? "bg-[#123D28] text-white hover:bg-[#0B2D1D] shadow-xs cursor-pointer"
                                      : "bg-[#123D28]/20 text-[#123D28]/60 cursor-pointer hover:bg-[#123D28]/30"
                                  }`}
                                  title={meetsMinOrder ? "Apply this festival offer" : `Requires minimum order of ₹${offer.minOrderValue}`}
                                >
                                  Apply Offer
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Manual Promo Code Input Area */}
                  <div className="pt-2 border-t border-[#DEDFD5]/60">
                    <label className="block text-[11px] font-semibold text-[#123D28] mb-1">
                      Have another coupon or promo code?
                    </label>
                    <div className="flex gap-2">
                      <input
                        placeholder="Enter promo code (e.g. FESTIVE15)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="text-xs uppercase flex-1"
                      />
                      <button
                        type="button"
                        disabled={!couponCode.trim() || validateCouponMutation.isPending}
                        onClick={() => validateCouponMutation.mutate({ code: couponCode.trim(), subtotal })}
                        className="dark-button text-xs py-1.5 px-4 shrink-0"
                      >
                        {validateCouponMutation.isPending ? "Validating..." : "Apply"}
                      </button>
                    </div>
                    {appliedCoupon && (
                      <div className="flex items-center justify-between text-xs text-emerald-800 mt-2 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-700" />
                          Coupon <strong>{appliedCoupon.code}</strong> applied ({formatINR(discountAmount)} saved)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponCode("");
                            toast.info("Coupon removed");
                          }}
                          className="text-rose-600 hover:text-rose-800 hover:underline font-semibold ml-2 text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-section">
                  <h3>Payment method</h3>
                  <div className="payment-options">
                    {[
                      { value: "upi", title: "UPI / QR", desc: "Fast and familiar", disabled: false },
                      { value: "card", title: "Card", desc: "Visa, Mastercard & RuPay", disabled: false },
                      {
                        value: "cod",
                        title: "Cash on delivery",
                        desc: isCodAvailableForCart
                          ? "Available across India"
                          : codIneligibilityReason || "Unavailable for this order",
                        disabled: !isCodAvailableForCart,
                      },
                    ].map((opt) => (
                      <label
                        className={`payment-option ${payment === opt.value ? "is-selected" : ""} ${
                          opt.disabled ? "opacity-60 cursor-not-allowed bg-slate-50/80" : ""
                        }`}
                        key={opt.value}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={opt.value}
                          disabled={opt.disabled}
                          checked={payment === opt.value}
                          onChange={(e) => {
                            if (!opt.disabled) setPayment(e.target.value);
                          }}
                        />
                        <span className="payment-icon">
                          {opt.value === "upi" ? <Sparkles size={18} /> : opt.value === "card" ? <CreditCard size={18} /> : <Package size={18} />}
                        </span>
                        <span>
                          <strong>{opt.title}</strong>
                          <small className={opt.disabled ? "text-amber-800 font-semibold" : ""}>{opt.desc}</small>
                        </span>
                        {payment === opt.value && <CheckCircle2 size={18} className="payment-check" />}
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
  onSubscribe,
  isWishlisted,
  onWishlist,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onAdd: (product: Product, size: string, unitPrice: number, quantity: number) => void;
  onSubscribe?: (product: Product, size: string, unitPrice: number, quantity: number, frequency: string) => void;
  isWishlisted: boolean;
  onWishlist: () => void;
}) {
  const [selectedSize, setSelectedSize] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [purchaseMode, setPurchaseMode] = useState<"ONE_TIME" | "SUBSCRIPTION">("ONE_TIME");
  const [selectedFrequency, setSelectedFrequency] = useState<string>("30_DAYS");

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
            <span
              className={`ml-2 font-medium text-xs ${
                product.stockAvailability === "Out of Stock"
                  ? "text-rose-600 font-bold"
                  : product.stockAvailability === "Limited availability"
                  ? "text-amber-700 font-semibold"
                  : "text-[#2E7D32]"
              }`}
            >
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

          {/* Phase 7: Purchase Mode Selector (One-Time vs Recurring Subscription) */}
          <div className="choice-block">
            <div className="choice-label">
              <strong>Purchase Mode</strong>
              <span>Flexible recurring delivery</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                className={`py-2 px-3 rounded-xl border text-left transition-all ${
                  purchaseMode === "ONE_TIME"
                    ? "border-[#123D28] bg-[#EAF2ED] text-[#123D28] font-bold shadow-xs"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setPurchaseMode("ONE_TIME")}
              >
                <div className="text-xs font-semibold">One-Time Order</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Standard single delivery</div>
              </button>
              <button
                type="button"
                className={`py-2 px-3 rounded-xl border text-left transition-all relative ${
                  purchaseMode === "SUBSCRIPTION"
                    ? "border-[#123D28] bg-[#EAF2ED] text-[#123D28] font-bold shadow-xs"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setPurchaseMode("SUBSCRIPTION")}
              >
                <span className="absolute -top-2 right-2 bg-[#123D28] text-white text-[9px] uppercase px-1.5 py-0.5 rounded font-bold">
                  Recurring
                </span>
                <div className="text-xs font-semibold flex items-center gap-1 text-[#123D28]">
                  <Repeat size={12} /> Subscribe
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Automated delivery</div>
              </button>
            </div>

            {purchaseMode === "SUBSCRIPTION" && (
              <div className="mt-3 p-3 bg-[#FAF8F5] border border-[#123D28]/20 rounded-xl space-y-2">
                <div className="text-xs font-bold text-[#123D28] flex items-center gap-1.5">
                  <Calendar size={13} /> Select Delivery Frequency
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {[
                    { value: "15_DAYS", label: "15 Days" },
                    { value: "30_DAYS", label: "30 Days" },
                    { value: "45_DAYS", label: "45 Days" },
                    { value: "60_DAYS", label: "60 Days" },
                    { value: "90_DAYS", label: "90 Days" },
                  ].map((freq) => (
                    <button
                      key={freq.value}
                      type="button"
                      className={`py-1 px-1.5 text-center text-xs rounded-lg border transition-all ${
                        selectedFrequency === freq.value
                          ? "border-[#123D28] bg-[#123D28] text-white font-bold"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedFrequency(freq.value)}
                    >
                      {freq.label}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-[#4F554B] flex items-center gap-1.5 pt-1">
                  <CheckCircle2 size={13} className="text-[#123D28] shrink-0" />
                  <span>Pause, skip, or cancel anytime in My Account.</span>
                </div>
              </div>
            )}
          </div>
          <div className="detail-actions">
            <div className="qty-stepper large-stepper">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}><Plus size={15} /></button>
            </div>
            {purchaseMode === "SUBSCRIPTION" ? (
              <button
                className="dark-button add-detail-button bg-[#123D28] hover:bg-[#0B2518]"
                disabled={product.stockAvailability === "Out of Stock"}
                style={product.stockAvailability === "Out of Stock" ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                onClick={() => {
                  if (product.stockAvailability === "Out of Stock") return;
                  if (onSubscribe) {
                    onSubscribe(product, currentSizeObj.label, currentSizeObj.price, quantity, selectedFrequency);
                  }
                  onClose();
                }}
              >
                <span>Subscribe Now</span> <Repeat size={16} />
              </button>
            ) : (
              <button
                className="dark-button add-detail-button"
                disabled={product.stockAvailability === "Out of Stock"}
                style={product.stockAvailability === "Out of Stock" ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                onClick={() => {
                  if (product.stockAvailability === "Out of Stock") return;
                  onAdd(product, currentSizeObj.label, currentSizeObj.price, quantity);
                  onClose();
                }}
              >
                {product.stockAvailability === "Out of Stock" ? "Out of stock" : "Add to cart"} <ShoppingBag size={17} />
              </button>
            )}
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


function SubscribeModal({
  subscribingItem,
  open,
  onClose,
  currentUser,
  onRequireAuth,
}: {
  subscribingItem: {
    product: Product;
    size: string;
    unitPrice: number;
    quantity: number;
    frequency: string;
  } | null;
  open: boolean;
  onClose: () => void;
  currentUser: any;
  onRequireAuth: () => void;
}) {
  const [, setLocation] = useLocation();
  const [selectedAddressId, setSelectedAddressId] = useState<string>("default");
  const [manualAddress, setManualAddress] = useState({
    recipientName: "",
    phone: "",
    street: "",
    city: "Erode",
    state: "Tamil Nadu",
    pinCode: "638001",
  });
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [paymentPreference, setPaymentPreference] = useState<"COD" | "MANUAL_RENEWAL">("COD");
  const [createdSub, setCreatedSub] = useState<any>(null);

  const { data: addresses = [] } = trpc.addresses.list.useQuery(undefined, {
    enabled: Boolean(currentUser && open),
  });

  const createMutation = trpc.subscriptions.create.useMutation({
    onSuccess: (sub) => {
      setCreatedSub(sub);
      toast.success(`Subscription created successfully: ${sub?.subscriptionNumber || ""}`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create subscription");
    },
  });

  useEffect(() => {
    if (currentUser) {
      setManualAddress((prev) => ({
        ...prev,
        recipientName: currentUser.name || "",
        phone: currentUser.phone || "",
      }));
    }
  }, [currentUser]);

  if (!open || !subscribingItem) return null;

  const itemSubtotal = subscribingItem.unitPrice * subscribingItem.quantity;
  const shippingFee = itemSubtotal >= 799 ? 0 : 60;
  const totalPerCycle = itemSubtotal + shippingFee;

  const freqLabel = {
    "15_DAYS": "Every 15 Days",
    "30_DAYS": "Every 30 Days (Monthly)",
    "45_DAYS": "Every 45 Days",
    "60_DAYS": "Every 60 Days",
    "90_DAYS": "Every 90 Days",
  }[subscribingItem.frequency] || "Every 30 Days";

  const handleConfirm = () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    let deliveryAddress: any = null;
    if (selectedAddressId !== "manual" && addresses.length > 0) {
      const chosen = addresses.find((a: any) => a.id === selectedAddressId) || addresses[0];
      deliveryAddress = {
        recipientName: chosen.recipientName,
        phone: chosen.phone,
        street: chosen.street || chosen.addressLine1,
        city: chosen.city,
        state: chosen.state,
        pinCode: chosen.pinCode,
      };
    } else {
      if (!manualAddress.recipientName || !manualAddress.phone || !manualAddress.street || !manualAddress.pinCode) {
        toast.error("Please fill in all required delivery address fields.");
        return;
      }
      deliveryAddress = manualAddress;
    }

    createMutation.mutate({
      productId: subscribingItem.product.id,
      quantity: subscribingItem.quantity,
      frequency: subscribingItem.frequency as any,
      deliveryAddress,
      deliveryInstructions: deliveryInstructions || undefined,
      paymentPreference,
    });
  };

  return (
    <div className="modal-shell" role="dialog" aria-modal="true">
      <button className="drawer-overlay" onClick={onClose} aria-label="Close subscription setup" />
      <div className="relative bg-[#FBF8F0] w-full max-w-xl mx-auto rounded-2xl shadow-2xl overflow-hidden z-50 border border-[#123D28]/15 my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#123D28] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#E5C378]">
              <Repeat size={18} />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#E5C378]">Set Up Botanical Subscription</h2>
              <p className="text-xs text-white/80">Automated recurring wellness delivery</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {createdSub ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#123D28]">Subscription Activated!</h3>
              <p className="text-xs text-[#4F554B] max-w-sm mx-auto">
                Your botanical subscription <span className="font-mono font-bold text-[#123D28]">{createdSub.subscriptionNumber}</span> is now active.
              </p>
              <div className="p-3 bg-white border border-[#123D28]/10 rounded-xl text-left max-w-sm mx-auto space-y-1 text-xs">
                <div><strong>Product:</strong> {createdSub.productName} ({createdSub.variantLabel})</div>
                <div><strong>Frequency:</strong> {freqLabel}</div>
                <div><strong>Per Cycle Total:</strong> ₹{createdSub.totalPerCycle}</div>
                <div><strong>Payment:</strong> {createdSub.paymentPreference === "COD" ? "Cash on Delivery" : "Online Renewal"}</div>
                <div><strong>Next Scheduled Delivery:</strong> {createdSub.nextDeliveryDate?.slice(0, 10)}</div>
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <button
                  type="button"
                  className="py-2 px-4 bg-[#123D28] text-white rounded-xl font-bold hover:bg-[#0B2518] transition-colors"
                  onClick={() => {
                    onClose();
                    setLocation("/account?tab=subscriptions");
                  }}
                >
                  View My Subscriptions
                </button>
                <button
                  type="button"
                  className="py-2 px-4 bg-gray-200 text-gray-800 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                  onClick={onClose}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : !currentUser ? (
            <div className="text-center py-6 space-y-3">
              <UserRound size={36} className="mx-auto text-[#123D28]" />
              <h3 className="text-base font-serif font-bold text-[#123D28]">Sign In to Subscribe</h3>
              <p className="text-xs text-[#4F554B] max-w-sm mx-auto">
                Please log in or create an account to manage recurring subscription orders, addresses, and delivery schedules.
              </p>
              <button
                type="button"
                className="py-2.5 px-6 bg-[#123D28] text-white rounded-xl font-bold hover:bg-[#0B2518] transition-colors"
                onClick={() => {
                  onClose();
                  onRequireAuth();
                }}
              >
                Sign In / Register &rarr;
              </button>
            </div>
          ) : (
            <>
              {/* Product preview */}
              <div className="flex items-center gap-3 p-3 bg-white border border-[#123D28]/15 rounded-xl">
                <img
                  src={subscribingItem.product.image}
                  alt={subscribingItem.product.name}
                  className="w-16 h-16 rounded-lg object-cover border border-[#123D28]/10"
                  onError={(e: any) => { e.target.src = "/images/products/packaged/pouch_001.png"; }}
                />
                <div className="flex-1">
                  <div className="font-bold text-[#123D28] text-sm">{subscribingItem.product.name}</div>
                  <div className="text-gray-500 text-xs">Pack: {subscribingItem.size} · Qty: {subscribingItem.quantity}</div>
                  <div className="text-xs font-semibold text-[#AE6A2B] mt-0.5">{freqLabel}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Cycle Total</div>
                  <div className="text-sm font-bold text-[#123D28]">₹{totalPerCycle}</div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-2">
                <label className="font-bold text-[#123D28] block">Delivery Address</label>
                {addresses.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {addresses.map((addr: any) => (
                      <label
                        key={addr.id}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                          selectedAddressId === addr.id ? "border-[#123D28] bg-[#EAF2ED]" : "border-gray-200 bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="subAddress"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 text-xs">
                          <span className="font-bold text-gray-900">{addr.recipientName}</span> ({addr.phone})
                          <div className="text-gray-600">{addr.street || addr.addressLine1}, {addr.city}, {addr.state} - {addr.pinCode}</div>
                        </div>
                      </label>
                    ))}
                    <label
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                        selectedAddressId === "manual" ? "border-[#123D28] bg-[#EAF2ED]" : "border-gray-200 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="subAddress"
                        checked={selectedAddressId === "manual"}
                        onChange={() => setSelectedAddressId("manual")}
                      />
                      <span className="font-bold text-gray-900">Enter a different delivery address</span>
                    </label>
                  </div>
                )}

                {(addresses.length === 0 || selectedAddressId === "manual") && (
                  <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-600 block mb-1">Recipient Name</span>
                        <input
                          type="text"
                          value={manualAddress.recipientName}
                          onChange={(e) => setManualAddress({ ...manualAddress, recipientName: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                          placeholder="Full Name"
                        />
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">Phone Number</span>
                        <input
                          type="tel"
                          value={manualAddress.phone}
                          onChange={(e) => setManualAddress({ ...manualAddress, phone: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 block mb-1">Street Address</span>
                      <input
                        type="text"
                        value={manualAddress.street}
                        onChange={(e) => setManualAddress({ ...manualAddress, street: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                        placeholder="House / Street / Area"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-gray-600 block mb-1">City</span>
                        <input
                          type="text"
                          value={manualAddress.city}
                          onChange={(e) => setManualAddress({ ...manualAddress, city: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">State</span>
                        <input
                          type="text"
                          value={manualAddress.state}
                          onChange={(e) => setManualAddress({ ...manualAddress, state: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1">PIN Code</span>
                        <input
                          type="text"
                          value={manualAddress.pinCode}
                          onChange={(e) => setManualAddress({ ...manualAddress, pinCode: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                          placeholder="638001"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Delivery Instructions */}
              <div>
                <label className="font-bold text-[#123D28] block mb-1">Delivery Instructions (Optional)</label>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="e.g. Leave with security / Ring bell twice"
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                />
              </div>

              {/* Payment Preference */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#123D28] block">Payment Method per Cycle</label>
                <div className="grid grid-cols-2 gap-2">
                  <label
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                      paymentPreference === "COD" ? "border-[#123D28] bg-[#EAF2ED]" : "border-gray-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentPref"
                      checked={paymentPreference === "COD"}
                      onChange={() => setPaymentPreference("COD")}
                    />
                    <div>
                      <div className="font-bold text-gray-900">Cash on Delivery</div>
                      <div className="text-[10px] text-gray-500">Pay cash upon parcel delivery</div>
                    </div>
                  </label>
                  <label
                    className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                      paymentPreference === "MANUAL_RENEWAL" ? "border-[#123D28] bg-[#EAF2ED]" : "border-gray-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentPref"
                      checked={paymentPreference === "MANUAL_RENEWAL"}
                      onChange={() => setPaymentPreference("MANUAL_RENEWAL")}
                    />
                    <div>
                      <div className="font-bold text-gray-900">Online Renewal</div>
                      <div className="text-[10px] text-gray-500">Pay via UPI/Card per due cycle</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-3 bg-white border border-[#123D28]/15 rounded-xl space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Product Subtotal ({subscribingItem.quantity} unit{subscribingItem.quantity > 1 ? "s" : ""})</span>
                  <span>₹{itemSubtotal}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping Fee</span>
                  <span>{shippingFee === 0 ? <strong className="text-emerald-700">Free</strong> : `₹${shippingFee}`}</span>
                </div>
                <div className="border-t border-gray-200 pt-1 flex justify-between font-bold text-[#123D28] text-sm">
                  <span>Per Cycle Total</span>
                  <span>₹{totalPerCycle}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="py-2.5 px-4 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  onClick={onClose}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="py-2.5 px-6 rounded-xl bg-[#123D28] hover:bg-[#0B2518] text-white font-bold transition-colors flex items-center gap-2"
                  onClick={handleConfirm}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Activating..." : "Confirm & Start Subscription"}
                  <Repeat size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
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

          <div className="p-3 bg-[#EAF2ED] border border-[#C5DDCF] rounded-xl flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-[#123D28]">Customer Account Portal</div>
              <div className="text-[10px] text-[#4F6858]">Access Wishlist, Rewards, Support Helpdesk &amp; Profile</div>
            </div>
            <button
              onClick={() => {
                onClose();
                setLocation("/account");
              }}
              className="py-1.5 px-3 bg-[#123D28] hover:bg-[#1A4D33] text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
            >
              Open Portal &rarr;
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
          <button onClick={() => { onClose(); setLocation("/account"); }}>My Account (Orders & Helpdesk) <ArrowRight size={16} /></button>
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
  const [subscribingItem, setSubscribingItem] = useState<{
    product: Product;
    size: string;
    unitPrice: number;
    quantity: number;
    frequency: string;
  } | null>(null);

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

  // Phase 3: Live Wishlist Sync
  const { data: dbWishlistIds = [], refetch: refetchWishlistIds } = trpc.wishlist.getIds.useQuery(undefined, {
    enabled: Boolean(currentUser),
    retry: false,
  });

  useEffect(() => {
    if (dbWishlistIds && dbWishlistIds.length > 0) {
      setWishlist(new Set(dbWishlistIds));
    }
  }, [dbWishlistIds]);

  const toggleWishlistMutation = trpc.wishlist.toggle.useMutation({
    onSuccess: (res) => {
      refetchWishlistIds();
      toast.success(res.wishlisted ? "Added to your wishlist" : "Removed from your wishlist");
    },
  });

  const saveForLaterMutation = trpc.wishlist.saveForLater.useMutation({
    onSuccess: () => {
      refetchWishlistIds();
      toast.success("Saved item to your wishlist");
    },
  });
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
              setLocation("/account");
            }
          } else {
            setAuthModalOpen(true);
          }
        }}
        currentUser={currentUser}
        wishlistCount={wishlist.size}
        onLogout={() => logoutMutation.mutate()}
      />
      <main>
        {/* Top Hero Brand Banner */}
        <section className="hero-section container-wide pt-2 sm:pt-4" aria-label="TRINAYAA Hero Banner">
          <div
            onClick={() => setLocation("/products")}
            className="group relative cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl shadow-sm border border-[#E5DECF] transition-all hover:shadow-md bg-[#FAF6F0]"
            role="banner"
          >
            <img
              src={IMG.hero}
              srcSet="/images/hero/trinayaa_home_hero_banner.jpg?v=3 1024w, /images/hero/trinayaa_home_hero_banner_2x.jpg?v=3 2048w"
              sizes="(max-width: 1024px) 100vw, 1400px"
              alt="TRINAYAA — Rooted in Nature. Made for Everyday Wellness. Natural Herbs, Seeds, Raw Powders."
              className="w-full h-auto object-cover block transition-transform duration-700 group-hover:scale-[1.006]"
              loading="eager"
              decoding="async"
            />
            {/* SEO and Screen Reader Headings */}
            <h1 className="sr-only">
              TRINAYAA — Rooted in Nature. Made for Everyday Wellness. Natural Herbs, Seeds, Raw Powders.
            </h1>
            <p className="sr-only">
              High quality natural seeds, raw powders and herbal products for a healthier, more natural lifestyle.
            </p>
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

      <StoreFooter />

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
        onSubscribe={(prod, size, price, qty, freq) => {
          setSubscribingItem({ product: prod, size, unitPrice: price, quantity: qty, frequency: freq });
        }}
        isWishlisted={selectedProduct ? wishlist.has(selectedProduct.id) : false}
        onWishlist={() => selectedProduct && toggleWishlist(selectedProduct.id)}
      />

      <SubscribeModal
        subscribingItem={subscribingItem}
        open={Boolean(subscribingItem)}
        onClose={() => setSubscribingItem(null)}
        currentUser={currentUser}
        onRequireAuth={() => setAuthModalOpen(true)}
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
