import { useState, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Leaf,
  ShieldCheck,
  Truck,
  Package,
  Heart,
  ShoppingBag,
  ArrowRight,
  Search,
  Menu,
  UserRound,
  Instagram,
  Facebook,
  Youtube,
  ChevronRight,
  CheckCircle2,
  Share2,
  Clock,
  Sparkles,
  Minus,
  Plus,
  ArrowLeft,
  Award,
  AlertCircle
} from "lucide-react";

function BrandMark() {
  return (
    <div className="brand-mark cursor-pointer" aria-label="Trinayaa home">
      <img
        src="/images/brand/trinayaa_logo.png"
        alt="TRINAYAA"
        className="h-10 md:h-11 w-auto object-contain"
      />
    </div>
  );
}

function TrustRow() {
  return (
    <section className="trust-row mt-16" aria-label="Why Trinayaa">
      <div>
        <Leaf size={27} strokeWidth={1.4} />
        <span>
          <strong>Quality Sourcing</strong>
          <small>Carefully selected natural ingredients</small>
        </span>
      </div>
      <div>
        <ShieldCheck size={27} strokeWidth={1.4} />
        <span>
          <strong>Secure Checkout</strong>
          <small>Safe and trusted payments</small>
        </span>
      </div>
      <div>
        <Package size={27} strokeWidth={1.4} />
        <span>
          <strong>Careful Packing</strong>
          <small>Hygienic and secure packaging</small>
        </span>
      </div>
      <div>
        <Truck size={27} strokeWidth={1.4} />
        <span>
          <strong>Pan India Delivery</strong>
          <small>Delivering natural wellness across India</small>
        </span>
      </div>
    </section>
  );
}

function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function ProductDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/products/:slug");
  const slug = params?.slug || "";

  // Auth & Guest Token
  const { data: currentUser } = trpc.auth.me.useQuery();
  const guestToken = typeof window !== "undefined" ? localStorage.getItem("trinayaa_guest_token") || undefined : undefined;

  // Cart query & mutation
  const cartQuery = trpc.cart.get.useQuery({ guestToken });
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Added to cart successfully!");
      cartQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add to cart");
    },
  });

  // Fetch product by slug
  const {
    data: product,
    isLoading,
    error,
  } = trpc.products.getBySlug.useQuery(
    { slug },
    { enabled: Boolean(slug), retry: 1 }
  );

  // Fetch related products
  const { data: allProducts = [] } = trpc.products.list.useQuery(
    {
      category: product?.category,
      limit: 8,
    },
    { enabled: Boolean(product?.category) }
  );

  const relatedProducts = useMemo(() => {
    return allProducts.filter((p: any) => p.slug !== slug).slice(0, 4);
  }, [allProducts, slug]);

  // Product state
  const [selectedPack, setSelectedPack] = useState<string>("100 g");
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"about" | "ayurveda" | "usage" | "quality">("about");
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);

  // Pack size multiplier calculation
  const packMultiplier = useMemo(() => {
    switch (selectedPack) {
      case "250 g":
        return 2.3;
      case "500 g":
        return 4.4;
      case "1 kg":
        return 8.2;
      case "100 g":
      default:
        return 1;
    }
  }, [selectedPack]);

  const basePrice = product ? Number(product.price || product.sellingPrice || 149) : 149;
  const currentPrice = Math.round(basePrice * packMultiplier);
  const baseCompareAt = product?.compareAt ? Number(product.compareAt) : Math.round(basePrice * 1.25);
  const currentCompareAt = Math.round(baseCompareAt * packMultiplier);
  const savings = Math.max(0, currentCompareAt - currentPrice);

  const cartTotalItems = useMemo(() => {
    if (!cartQuery.data?.items) return 0;
    return cartQuery.data.items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
  }, [cartQuery.data]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCartMutation.mutate({
      productId: product.id,
      quantity,
      packSize: selectedPack,
      guestToken,
    });
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCartMutation.mutate(
      {
        productId: product.id,
        quantity,
        packSize: selectedPack,
        guestToken,
      },
      {
        onSuccess: () => {
          setLocation("/#cart");
        },
      }
    );
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product?.nameEn || "TRINAYAA Botanical",
          text: `Explore ${product?.nameEn} at TRINAYAA Enterprises.`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Product link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF8F0] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#123D28] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-serif text-[#123D28] text-lg">Loading botanical details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#FBF8F0] flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-[#E5DECF] text-center shadow-xs">
          <AlertCircle className="w-12 h-12 text-[#AE6A2B] mx-auto mb-3" />
          <h1 className="font-serif text-2xl font-bold text-[#123D28] mb-2">Botanical Not Found</h1>
          <p className="text-slate-600 text-sm mb-6">
            The botanical product you are looking for may have been moved or updated.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setLocation("/products")}
              className="px-5 py-2.5 bg-[#123D28] text-white rounded-xl text-sm font-semibold hover:bg-[#1A4D33] transition-colors"
            >
              Browse All Products
            </button>
            <button
              onClick={() => setLocation("/")}
              className="px-5 py-2.5 bg-[#FAF6EE] text-[#123D28] border border-[#E5DECF] rounded-xl text-sm font-semibold hover:bg-[#F2ECE0] transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const categorySlug = (product.category || "botanicals")
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <div className="min-h-screen bg-[#FBF8F0] text-[#1f2937] flex flex-col font-sans">
      {/* Single Clean Unified Navigation Bar */}
      <header className="site-header">
        <div className="site-header-inner">
          <button
            type="button"
            className="logo-button"
            onClick={() => setLocation("/")}
          >
            <BrandMark />
          </button>

          <nav className="desktop-nav" aria-label="Primary navigation">
            <button type="button" onClick={() => setLocation("/")}>
              Home
            </button>
            <button
              type="button"
              className="active font-bold"
              onClick={() => setLocation("/products")}
            >
              Products
            </button>
            <button type="button" onClick={() => setLocation("/about")}>
              About
            </button>
            <button type="button" onClick={() => setLocation("/contact")}>
              Contact
            </button>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="icon-action"
              onClick={() => setLocation("/products")}
              title="Search products"
            >
              <Search size={18} />
            </button>

            <button
              type="button"
              className="icon-action account-action"
              onClick={() => {
                if (currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN") {
                  setLocation("/admin");
                } else {
                  setLocation("/");
                }
              }}
              title="Account"
            >
              <UserRound size={20} />
              <span>
                {currentUser
                  ? (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN"
                      ? "Admin"
                      : currentUser.name.split(" ")[0])
                  : "Account"}
              </span>
            </button>

            <button
              type="button"
              className="icon-action cart-action"
              onClick={() => setLocation("/#cart")}
              title="Shopping Cart"
            >
              <ShoppingBag size={20} />
              <span>Cart</span>
              {cartTotalItems > 0 && <b>{cartTotalItems}</b>}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 container-wide py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#8E734B] mb-6 font-medium">
          <button
            onClick={() => setLocation("/")}
            className="hover:text-[#123D28] transition-colors"
          >
            Home
          </button>
          <ChevronRight size={14} className="text-slate-400" />
          <button
            onClick={() => setLocation("/products")}
            className="hover:text-[#123D28] transition-colors"
          >
            Botanicals
          </button>
          <ChevronRight size={14} className="text-slate-400" />
          <button
            onClick={() => setLocation(`/categories/${categorySlug}`)}
            className="hover:text-[#123D28] transition-colors"
          >
            {product.category || "Herbs"}
          </button>
          <ChevronRight size={14} className="text-slate-400" />
          <span className="text-[#123D28] font-bold truncate max-w-[220px] sm:max-w-none">
            {product.nameEn}
          </span>
        </nav>

        {/* Product Hero 2-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Product Visuals */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square bg-[#FAF6EE] rounded-3xl border border-[#E5DECF] p-8 flex items-center justify-center overflow-hidden shadow-xs">
              <img
                src={product.image || product.primaryImage || "/images/products/packaged/pouch_001.png"}
                alt={product.nameEn}
                className="w-full h-full object-contain max-h-[460px] drop-shadow-md hover:scale-105 transition-transform duration-300"
                onError={(e: any) => {
                  e.target.src = "/images/products/packaged/pouch_001.png";
                }}
              />
              {product.badge && (
                <span className="absolute top-5 left-5 bg-[#123D28] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                  {product.badge}
                </span>
              )}
              <div className="absolute top-5 right-5 flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-slate-600 hover:text-[#123D28] shadow-xs hover:bg-white transition-colors"
                  title="Share product"
                >
                  <Share2 size={16} />
                </button>
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs hover:bg-white transition-colors ${
                    isWishlisted ? "text-rose-600" : "text-slate-500"
                  }`}
                  title="Save to wishlist"
                >
                  <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            {/* Purity & Trust Highlights below image */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-white rounded-2xl border border-[#E5DECF] text-center text-xs">
              <div className="flex flex-col items-center">
                <Award className="w-5 h-5 text-[#123D28] mb-1" />
                <span className="font-bold text-[#123D28]">100% Pure</span>
                <span className="text-[10px] text-slate-500">Zero additives</span>
              </div>
              <div className="flex flex-col items-center border-x border-[#F0EBE0]">
                <Sparkles className="w-5 h-5 text-[#AE6A2B] mb-1" />
                <span className="font-bold text-[#123D28]">Traditional</span>
                <span className="text-[10px] text-slate-500">Ayurveda &amp; Siddha</span>
              </div>
              <div className="flex flex-col items-center">
                <Clock className="w-5 h-5 text-[#123D28] mb-1" />
                <span className="font-bold text-[#123D28]">Fresh Batch</span>
                <span className="text-[10px] text-slate-500">Direct from Erode</span>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Purchase Options */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider font-bold text-[#AE6A2B]">
                  {product.category || "Pure Botanical"}
                </span>
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Ready to Dispatch
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#123D28] leading-tight">
                {product.nameEn}
              </h1>

              {product.nameTa && (
                <p className="text-base text-[#AE6A2B] font-semibold mt-1">
                  {product.nameTa}
                </p>
              )}

              {product.botanicalName && (
                <p className="text-xs text-slate-500 italic mt-0.5">
                  Botanical: {product.botanicalName}
                </p>
              )}

              {/* Review badge */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex text-amber-500 text-sm">★★★★★</div>
                <span className="text-xs font-bold text-[#123D28]">4.9</span>
                <span className="text-xs text-slate-400">&bull; 128 verified ratings</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-4 bg-white rounded-2xl border border-[#E5DECF] shadow-2xs">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-3xl font-bold text-[#123D28]">
                  {formatINR(currentPrice)}
                </span>
                {currentCompareAt > currentPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatINR(currentCompareAt)}
                  </span>
                )}
                {savings > 0 && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Save {formatINR(savings)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Inclusive of all taxes &bull; Standard packing for {selectedPack}
              </p>
            </div>

            {/* Pack Size Selection */}
            <div>
              <label className="block text-xs font-bold text-[#123D28] uppercase tracking-wider mb-2">
                Select Pack Size:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["100 g", "250 g", "500 g", "1 kg"].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedPack(size)}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                      selectedPack === size
                        ? "bg-[#123D28] text-white border-[#123D28] shadow-xs"
                        : "bg-white text-[#123D28] border-[#E5DECF] hover:border-[#123D28]"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-[#123D28] uppercase tracking-wider">
                Quantity:
              </span>
              <div className="flex items-center bg-white border border-[#E5DECF] rounded-xl overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-[#FAF6EE] transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-10 text-center font-bold text-sm text-[#123D28]">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-[#FAF6EE] transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
              <span className="text-xs text-slate-500">
                Total: <strong className="text-[#123D28]">{formatINR(currentPrice * quantity)}</strong>
              </span>
            </div>

            {/* CTAs: Add to Cart & Buy Now */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-white border-2 border-[#123D28] text-[#123D28] hover:bg-[#FAF6EE] transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <ShoppingBag size={18} />
                {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={addToCartMutation.isPending}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-[#123D28] hover:bg-[#1A4D33] text-white transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                Buy Now
                <ArrowRight size={18} />
              </button>
            </div>

            {/* Delivery & Purity Badges */}
            <div className="p-4 bg-[#FAF6EE] rounded-2xl border border-[#E5DECF] space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#123D28] shrink-0" />
                <span>Pan-India delivery in <strong>3–5 business days</strong> from Tamil Nadu.</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#123D28] shrink-0" />
                <span>Secure payment via UPI, Credit/Debit cards &amp; NetBanking.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#123D28] shrink-0" />
                <span>Hygienic multi-layer moisture-resistant food grade pouch.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botanical Information Tabs */}
        <section className="mt-14 bg-white rounded-3xl border border-[#E5DECF] p-6 sm:p-8 shadow-xs">
          <div className="flex border-b border-[#F0EBE0] gap-4 sm:gap-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("about")}
              className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "about"
                  ? "border-[#123D28] text-[#123D28]"
                  : "border-transparent text-slate-500 hover:text-[#123D28]"
              }`}
            >
              Botanical Profile &amp; Description
            </button>
            <button
              onClick={() => setActiveTab("ayurveda")}
              className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "ayurveda"
                  ? "border-[#123D28] text-[#123D28]"
                  : "border-transparent text-slate-500 hover:text-[#123D28]"
              }`}
            >
              Ayurveda &amp; Siddha Benefits
            </button>
            <button
              onClick={() => setActiveTab("usage")}
              className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "usage"
                  ? "border-[#123D28] text-[#123D28]"
                  : "border-transparent text-slate-500 hover:text-[#123D28]"
              }`}
            >
              How to Use &amp; Dosage
            </button>
            <button
              onClick={() => setActiveTab("quality")}
              className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "quality"
                  ? "border-[#123D28] text-[#123D28]"
                  : "border-transparent text-slate-500 hover:text-[#123D28]"
              }`}
            >
              Purity &amp; Storage Guarantee
            </button>
          </div>

          <div className="mt-6 text-sm text-slate-700 leading-relaxed">
            {activeTab === "about" && (
              <div className="space-y-4">
                <p>
                  {product.description ||
                    `${product.nameEn} (${product.nameTa || ""}) is a prime botanical ingredient traditionally valued in South Indian herbal wellness. Sourced with utmost care directly from local cultivation centers in Tamil Nadu, this product is cleaned, graded, and packed to preserve its natural active constituents.`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 bg-[#FAF6EE] p-4 rounded-2xl border border-[#E5DECF]">
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider block">English Name</span>
                    <strong className="text-sm text-[#123D28]">{product.nameEn}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider block">Tamil / Local Name</span>
                    <strong className="text-sm text-[#AE6A2B]">{product.nameTa || "பாரம்பரிய மூலிகை"}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider block">Botanical Form</span>
                    <strong className="text-sm text-[#123D28]">{product.category || "Herbal Ingredient"}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 uppercase tracking-wider block">Source Origin</span>
                    <strong className="text-sm text-[#123D28]">Erode &amp; Western Ghats, Tamil Nadu</strong>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ayurveda" && (
              <div className="space-y-3">
                <h3 className="font-serif font-bold text-base text-[#123D28]">
                  Traditional Wellness Heritage
                </h3>
                <p>
                  In the classical scriptures of Ayurveda and Tamil Siddha Maruthuvam, botanicals such as {product.nameEn} are venerated for harmonizing the body&apos;s natural bio-energies (Vata, Pitta, and Kapha).
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
                  <li>Nourishes internal vitality and natural rejuvenation.</li>
                  <li>Free from chemical extractions, synthetics, and artificial colorants.</li>
                  <li>Whole botanical integrity retaining pure aroma and natural active compounds.</li>
                </ul>
              </div>
            )}

            {activeTab === "usage" && (
              <div className="space-y-3">
                <h3 className="font-serif font-bold text-base text-[#123D28]">
                  Recommended General Directions
                </h3>
                <p>
                  <strong>Internal Use:</strong> Take half to one teaspoon (approx. 2–3 g) with lukewarm water, milk, or pure honey once or twice daily after food, or as directed by an Ayurvedic / Siddha physician.
                </p>
                <p>
                  <strong>External / Decoction:</strong> Can be prepared as a traditional Kashayam (decoction) by gently simmering in water until reduced by half, or used externally according to traditional hair and skincare recipes.
                </p>
              </div>
            )}

            {activeTab === "quality" && (
              <div className="space-y-3">
                <h3 className="font-serif font-bold text-base text-[#123D28]">
                  Trinayaa Purity Standard
                </h3>
                <p>
                  Every pouch of {product.nameEn} is processed in a dust-free, hygienic facility following strict quality standards.
                </p>
                <p>
                  <strong>Storage Advice:</strong> Transfer into a dry, airtight glass or food-grade container upon receipt. Store away from direct sunlight and moisture. Shelf life is 12 months from packing date.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Related Botanicals Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold text-[#AE6A2B] uppercase tracking-wider block">
                  Complementary Botanicals
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#123D28]">
                  You May Also Like
                </h2>
              </div>
              <button
                onClick={() => setLocation(`/categories/${categorySlug}`)}
                className="text-xs font-bold text-[#123D28] hover:text-[#AE6A2B] flex items-center gap-1"
              >
                View all in {product.category || "Botanicals"} <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel: any) => (
                <article
                  key={rel.id}
                  onClick={() => {
                    setLocation(`/products/${rel.slug}`);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="product-card group cursor-pointer bg-white rounded-2xl border border-[#E5DECF] overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-square bg-[#FAF6EE] p-4 flex items-center justify-center">
                    <img
                      src={rel.image || rel.primaryImage || "/images/products/packaged/pouch_001.png"}
                      alt={rel.nameEn}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      onError={(e: any) => {
                        e.target.src = "/images/products/packaged/pouch_001.png";
                      }}
                    />
                  </div>
                  <div className="p-3 sm:p-4">
                    <span className="text-[10px] text-[#AE6A2B] font-bold block mb-0.5">
                      {rel.category}
                    </span>
                    <h3 className="font-serif font-bold text-xs sm:text-sm text-[#123D28] group-hover:text-[#AE6A2B] line-clamp-1">
                      {rel.nameEn}
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-serif font-bold text-xs sm:text-sm text-[#123D28]">
                        {formatINR(rel.price || rel.sellingPrice)}
                      </span>
                      <span className="text-[11px] text-[#123D28] font-bold">
                        View &rarr;
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <TrustRow />
      </main>

      {/* Official Site Footer */}
      <footer className="site-footer">
        <div className="footer-inner container-wide">
          <div className="footer-brand">
            <div className="brand-mark brand-mark-inverse" aria-label="Trinayaa home">
              <img
                src="/images/brand/trinayaa_logo_white.png"
                alt="TRINAYAA"
                className="h-10 md:h-11 w-auto object-contain"
              />
            </div>
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
            <button onClick={() => setLocation("/about")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">About</button>
            <button onClick={() => setLocation("/contact")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Contact</button>
          </div>
          <div className="footer-column">
            <span className="footer-title">Customer Care</span>
            <button onClick={() => setLocation("/contact")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Contact Us</button>
            <button onClick={() => setLocation("/track-order")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Track Order</button>
            <button onClick={() => setLocation("/policies/shipping")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Shipping Policy</button>
            <button onClick={() => setLocation("/policies/returns")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Returns &amp; Refunds</button>
          </div>
          <div className="footer-column">
            <span className="footer-title">Headquarters</span>
            <p className="text-xs text-[#DFE7D7]/80 leading-relaxed">
              TRINAYAA ENTERPRISES<br />
              42, Kongu Nagar, Erode,<br />
              Tamil Nadu – 638002, India<br />
              support@trinayaa.in
            </p>
          </div>
        </div>
        <div className="footer-bottom container-wide">
          <span>&copy; 2026 TRINAYAA ENTERPRISES. All rights reserved.</span>
          <div className="footer-policies">
            <button onClick={() => setLocation("/policies/shipping")} className="hover:underline">Shipping</button>
            <button onClick={() => setLocation("/policies/returns")} className="hover:underline">Returns</button>
            <button onClick={() => setLocation("/policies/privacy")} className="hover:underline">Privacy Policy</button>
            <button onClick={() => setLocation("/policies/terms")} className="hover:underline">Terms &amp; Conditions</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

