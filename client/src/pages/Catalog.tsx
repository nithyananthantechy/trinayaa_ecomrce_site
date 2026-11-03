import { useState, useMemo, useEffect } from "react";
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
  Filter,
  ArrowUpDown,
  Menu,
  UserRound,
  Instagram,
  Facebook,
  Youtube,
  ChevronRight,
  CheckCircle2,
  X
} from "lucide-react";

function BrandMark() {
  return (
    <div className="brand-mark" aria-label="Trinayaa home">
      <img
        src="/images/brand/trinayaa_logo.png"
        alt="TRINAYAA — Pure Seeds · Raw Powders · True Herbs"
        className="h-10 md:h-11 w-auto object-contain"
      />
    </div>
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

function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function Catalog() {
  const [, setLocation] = useLocation();
  const [, categoryParams] = useRoute("/categories/:slug");
  const { data: currentUser } = trpc.auth.me.useQuery();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // Determine active category from route slug if on /categories/:slug
  useEffect(() => {
    if (categoryParams?.slug) {
      const slug = categoryParams.slug.toLowerCase();
      if (slug.includes("seed")) {
        setSelectedCategory("Seeds");
      } else if (slug.includes("powder")) {
        setSelectedCategory("Raw Powders");
      } else if (slug.includes("herb")) {
        setSelectedCategory("Herbs");
      } else if (slug.includes("hair")) {
        setSelectedCategory("Hair Care");
      } else if (slug.includes("skin")) {
        setSelectedCategory("Skin Care");
      } else if (slug.includes("health")) {
        setSelectedCategory("Health Care");
      } else {
        setSelectedCategory("All");
      }
    } else {
      setSelectedCategory("All");
    }
  }, [categoryParams?.slug]);

  // Query products with active filter
  const { data: dbProducts = [], isLoading } = trpc.products.list.useQuery({
    category: selectedCategory === "All" ? undefined : selectedCategory,
    limit: 200,
  });

  // Cart operations
  const guestToken = typeof window !== "undefined" ? localStorage.getItem("trinayaa_guest_token") || undefined : undefined;
  const cartQuery = trpc.cart.get.useQuery({ guestToken });
  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("Added to cart");
      cartQuery.refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to add to cart"),
  });

  const cartCount = cartQuery.data?.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

  // Filter and sort products
  const products = useMemo(() => {
    let list = [...dbProducts];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.nameEn?.toLowerCase().includes(q) ||
          p.nameTa?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.shortDesc?.toLowerCase().includes(q)
      );
    }

    if (sort === "price-low") {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [dbProducts, search, sort]);

  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categoryMeta: Record<string, { title: string; subtitle: string }> = {
    All: {
      title: "All Botanical Products",
      subtitle: "Explore our full catalogue of 100% natural herbs, pure seeds, and raw powders sourced from Tamil Nadu.",
    },
    Seeds: {
      title: "Natural Botanical Seeds",
      subtitle: "Sun-dried, whole, pure seeds packed fresh for daily wellness, nutrition, and traditional haircare rituals.",
    },
    "Raw Powders": {
      title: "Pure Raw Powders",
      subtitle: "Micro-pulverized raw herbal powders with zero fillers, maltodextrin, or anti-caking chemicals.",
    },
    Herbs: {
      title: "Authentic True Herbs",
      subtitle: "Traditional roots, barks, flowers, and leaves harvested at peak potency from Western Tamil Nadu.",
    },
    "Health Care": {
      title: "Health & Immunity Care",
      subtitle: "Traditional herbal remedies to support vitality, digestion, stamina, and natural body balance.",
    },
    "Hair Care": {
      title: "Botanical Hair Care",
      subtitle: "Time-tested natural ingredients like Amla, Shikakai, Bhringraj, and Fenugreek for strong, radiant hair.",
    },
    "Skin Care": {
      title: "Pure Herbal Skin Care",
      subtitle: "Raw botanical powders for traditional herbal ubtans, face packs, and natural skin glow.",
    },
  };

  const currentMeta = categoryMeta[selectedCategory] || categoryMeta.All;

  return (
    <div className="site-shell min-h-screen bg-[#FBF8F0] text-[#123D28]">
      {/* Utility Bar */}
      <div className="utility-bar">
        <div className="utility-inner">
          <div className="utility-links">
            <span><Leaf size={13} /> Pure Herbs</span><i />
            <span>Natural Seeds</span><i />
            <span>Raw Powders</span>
          </div>
          <div className="utility-links utility-right">
            <span><Truck size={14} /> Pan India Delivery <small>(T&C Apply)</small></span><i />
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

      {/* Main Header */}
      <header className="site-header">
        <div className="site-header-inner">
          <button className="mobile-menu-button" aria-label="Open menu" onClick={() => setLocation("/")}><Menu size={22} /></button>
          <button className="logo-button" onClick={() => setLocation("/")}><BrandMark /></button>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <button onClick={() => { setSelectedCategory("All"); setLocation("/products"); }} className={selectedCategory === "All" && !categoryParams?.slug ? "font-bold underline underline-offset-4" : ""}>Shop All</button>
            <button onClick={() => { setSelectedCategory("Seeds"); setLocation("/categories/seeds"); }} className={selectedCategory === "Seeds" ? "font-bold underline underline-offset-4" : ""}>Seeds</button>
            <button onClick={() => { setSelectedCategory("Raw Powders"); setLocation("/categories/raw-powders"); }} className={selectedCategory === "Raw Powders" ? "font-bold underline underline-offset-4" : ""}>Raw Powders</button>
            <button onClick={() => { setSelectedCategory("Herbs"); setLocation("/categories/herbs"); }} className={selectedCategory === "Herbs" ? "font-bold underline underline-offset-4" : ""}>Herbs</button>
            <button onClick={() => setLocation("/about")}>About Us</button>
            <button onClick={() => setLocation("/contact")}>Contact</button>
          </nav>
          <div className="header-actions">
            <label className="header-search">
              <Search size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalog..."
              />
            </label>
            <button
              className="icon-action account-action"
              aria-label="Account"
              onClick={() => {
                if (currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN") {
                  setLocation("/admin");
                } else {
                  setLocation("/");
                }
              }}
            >
              <UserRound size={22} />
              <span>{currentUser ? (currentUser.role === "ADMIN" ? "Admin" : currentUser.name.split(" ")[0]) : "Account"}</span>
            </button>
            <button className="icon-action cart-action" aria-label="Open cart" onClick={() => setLocation("/")}>
              <ShoppingBag size={23} />
              <span>Cart</span>
              {cartCount > 0 && <b>{cartCount}</b>}
            </button>
          </div>
        </div>
      </header>

      {/* Catalog Category Banner */}
      <div className="bg-[#FAF3E5] border-b border-[#E5DECF] py-10 md:py-14">
        <div className="container-wide px-4">
          <nav className="text-xs text-[#6C7167] mb-4 flex items-center gap-1.5" aria-label="Breadcrumb">
            <button onClick={() => setLocation("/")} className="hover:underline">Home</button>
            <ChevronRight size={14} />
            <button onClick={() => setLocation("/products")} className="hover:underline">Catalog</button>
            {selectedCategory !== "All" && (
              <>
                <ChevronRight size={14} />
                <span className="font-bold text-[#123D28]">{selectedCategory}</span>
              </>
            )}
          </nav>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="eyebrow text-xs font-bold uppercase tracking-widest text-[#8E734B] block mb-1">
                E-Commerce Catalogue
              </span>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#123D28] tracking-tight">
                {currentMeta.title}
              </h1>
              <p className="text-xs md:text-sm text-[#4B5046] mt-2 max-w-2xl font-serif">
                {currentMeta.subtitle}
              </p>
            </div>
            <div className="text-xs font-semibold text-[#123D28] bg-white px-3.5 py-1.5 rounded-full border border-[#E5DECF] self-start md:self-auto shadow-xs">
              {products.length} Products Available
            </div>
          </div>
        </div>
      </div>

      <main className="container-wide py-10 px-4">
        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E5DECF]">
          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {["All", "Seeds", "Raw Powders", "Herbs", "Health Care", "Hair Care", "Skin Care"].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  if (cat === "All") setLocation("/products");
                  else if (cat === "Seeds") setLocation("/categories/seeds");
                  else if (cat === "Raw Powders") setLocation("/categories/raw-powders");
                  else if (cat === "Herbs") setLocation("/categories/herbs");
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-[#123D28] text-white shadow-xs"
                    : "bg-white text-[#4B5046] border border-[#E5DECF] hover:border-[#123D28]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort & Search */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 bg-white border border-[#E5DECF] rounded-lg px-3 py-1.5 text-xs text-[#4B5046]">
              <ArrowUpDown size={14} className="text-[#8E734B]" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent focus:outline-none text-[#123D28] font-semibold"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </label>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-[#123D28] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs text-[#6C7167]">Loading botanical products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5DECF] p-12 text-center max-w-lg mx-auto my-8">
            <Leaf size={42} className="text-[#D5CBB5] mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-[#123D28] mb-1">No Botanicals Found</h3>
            <p className="text-xs text-[#4B5046] mb-4">
              Try adjusting your search terms or select another category filter.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
                setLocation("/products");
              }}
              className="px-5 py-2.5 bg-[#123D28] text-white text-xs font-bold rounded-lg hover:bg-[#1A4D33] transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-16">
            {products.map((p: any) => (
              <article
                key={p.id}
                onClick={() => setLocation(`/products/${p.slug}`)}
                className="product-card group cursor-pointer bg-white rounded-2xl border border-[#E5DECF] overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative aspect-square bg-[#FAF6EE] p-4 overflow-hidden flex items-center justify-center">
                  <img
                    src={p.image || p.primaryImage || "/images/products/packaged/pouch_001.png"}
                    alt={p.nameEn}
                    loading="lazy"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    onError={(e: any) => {
                      e.target.src = "/images/products/packaged/pouch_001.png";
                    }}
                  />
                  {p.badge && (
                    <span className="absolute top-3 left-3 bg-[#123D28] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {p.badge}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(p.id);
                    }}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs hover:bg-white transition-colors ${
                      wishlist.has(p.id) ? "text-rose-600" : "text-slate-400"
                    }`}
                  >
                    <Heart size={15} fill={wishlist.has(p.id) ? "currentColor" : "none"} />
                  </button>
                </div>

                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#8E734B] font-semibold mb-1">
                      <span>{p.category}</span>
                      <span className="text-amber-600 font-bold">★★★★★ 4.9</span>
                    </div>
                    <h3 className="font-serif font-bold text-sm sm:text-base text-[#123D28] group-hover:text-[#AE6A2B] transition-colors line-clamp-1">
                      {p.nameEn || p.name}
                    </h3>
                    {p.nameTa && (
                      <p className="text-[11px] text-[#AE6A2B] mt-0.5 font-medium line-clamp-1">
                        {p.nameTa}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F0EBE0] flex items-center justify-between">
                    <div>
                      <div className="font-serif font-bold text-base text-[#123D28]">
                        {formatINR(p.price || p.sellingPrice)}
                      </div>
                      {p.compareAt && p.compareAt > p.price && (
                        <div className="text-[11px] text-slate-400 line-through">
                          {formatINR(p.compareAt)}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCartMutation.mutate({
                          productId: p.id,
                          quantity: 1,
                          packSize: "100 g",
                          guestToken,
                        });
                      }}
                      className="px-3 py-2 bg-[#123D28] hover:bg-[#1A4D33] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                      title="Add to cart"
                    >
                      <ShoppingBag size={14} /> Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
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
                alt="TRINAYAA — Pure Seeds · Raw Powders · True Herbs"
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
            <button onClick={() => setLocation("/products")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Shop All</button>
            <button onClick={() => setLocation("/categories/seeds")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Seeds</button>
            <button onClick={() => setLocation("/categories/raw-powders")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Raw Powders</button>
            <button onClick={() => setLocation("/categories/herbs")} className="text-left text-xs text-[#DFE7D7] hover:text-white block py-1">Herbs</button>
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
