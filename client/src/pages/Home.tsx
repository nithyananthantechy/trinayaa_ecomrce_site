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
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type Category = "All" | "Seeds" | "Raw Powders" | "Herbs";
type Product = {
  id: string;
  name: string;
  category: Exclude<Category, "All">;
  price: number;
  compareAt?: number;
  image: string;
  badge?: string;
  description: string;
  sizes: { label: string; price: number }[];
};
type CartItem = Product & { size: string; unitPrice: number; quantity: number };

const IMG = {
  hero: "/manus-storage/async-images/5LIyWsiye2ad4dTMne5kce/image-1.webp",
  moringa: "/manus-storage/async-images/5LIyWsiye2ad4dTMne5kce/image-2.webp",
  blackSeed: "/manus-storage/async-images/5LIyWsiye2ad4dTMne5kce/image-3.webp",
  hibiscus: "/manus-storage/async-images/5LIyWsiye2ad4dTMne5kce/image-4.webp",
  amlaFenugreek: "/manus-storage/async-images/5LIyWsiye2ad4dTMne5kce/image-5.webp",
};

const products: Product[] = [
  {
    id: "moringa",
    name: "Moringa Leaf Powder",
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

const categories: { label: Exclude<Category, "All">; caption: string; image: string; className: string }[] = [
  { label: "Herbs", caption: "Whole botanicals for natural care", image: IMG.hibiscus, className: "category-herbs" },
  { label: "Raw Powders", caption: "Pure and finely processed", image: IMG.moringa, className: "category-powders" },
  { label: "Seeds", caption: "Premium seeds for a healthy lifestyle", image: IMG.blackSeed, className: "category-seeds" },
];

function formatINR(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`brand-mark ${inverse ? "brand-mark-inverse" : ""}`} aria-label="Trinayaa home">
      <div className="brand-leaf" aria-hidden="true">
        <Leaf size={25} strokeWidth={1.5} />
      </div>
      <div>
        <div className="brand-name">TRINAYAA</div>
        <div className="brand-tagline">PURE SEEDS · RAW POWDERS · TRUE HERBS</div>
      </div>
    </div>
  );
}

function SiteHeader({ cartCount, onCart, onMenu }: { cartCount: number; onCart: () => void; onMenu: () => void }) {
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
            <button onClick={() => toast.info("Our care team replies within one business day.")}>Support</button><i />
            <button onClick={() => setLocation("/track-order")}>Track Order</button>
          </div>
        </div>
      </div>
      <header className="site-header">
        <div className="site-header-inner">
          <button className="mobile-menu-button" aria-label="Open menu" onClick={onMenu}><Menu size={22} /></button>
          <button className="logo-button" onClick={() => setLocation("/")}><BrandMark /></button>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#shop">Shop All</a>
            <a href="#shop" onClick={() => window.dispatchEvent(new CustomEvent("trinayaa-filter", { detail: "Seeds" }))}>Seeds</a>
            <a href="#shop" onClick={() => window.dispatchEvent(new CustomEvent("trinayaa-filter", { detail: "Raw Powders" }))}>Raw Powders</a>
            <a href="#shop" onClick={() => window.dispatchEvent(new CustomEvent("trinayaa-filter", { detail: "Herbs" }))}>Herbs</a>
            <a href="#story">About Us</a>
            <button onClick={() => toast.info("Write to support@trinayaa.in and we will be in touch.")}>Contact</button>
          </nav>
          <div className="header-actions">
            <label className="header-search">
              <Search size={18} />
              <input aria-label="Search products" placeholder="Search for herbs, seeds, powders..." onChange={(e) => window.dispatchEvent(new CustomEvent("trinayaa-search", { detail: e.target.value }))} />
            </label>
            <button className="icon-action account-action" aria-label="Account" onClick={() => toast.info("Account sign-in will connect to your customer profile.")}><UserRound size={22} /><span>Account</span></button>
            <button className="icon-action cart-action" aria-label="Open cart" onClick={onCart}><ShoppingBag size={23} /><span>Cart</span>{cartCount > 0 && <b>{cartCount}</b>}</button>
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

function ProductCard({ product, isWishlisted, onWishlist, onDetails, onAdd }: { product: Product; isWishlisted: boolean; onWishlist: () => void; onDetails: () => void; onAdd: () => void }) {
  return (
    <article className="product-card">
      <div className="product-image-wrap" onClick={onDetails} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onDetails()}>
        <img src={product.image} alt={product.name} />
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button className={`wishlist-button ${isWishlisted ? "is-wishlisted" : ""}`} aria-label={`${isWishlisted ? "Remove" : "Add"} ${product.name} ${isWishlisted ? "from" : "to"} wishlist`} onClick={(e) => { e.stopPropagation(); onWishlist(); }}><Heart size={17} fill={isWishlisted ? "currentColor" : "none"} /></button>
        <button className="quick-view" onClick={(e) => { e.stopPropagation(); onDetails(); }}>Quick view <ArrowRight size={14} /></button>
      </div>
      <div className="product-card-content">
        <div className="product-card-topline"><span className="product-category">{product.category}</span><span className="rating">★★★★★ <em>4.9</em></span></div>
        <button className="product-name" onClick={onDetails}>{product.name}</button>
        <div className="product-buy-row"><div><strong>{formatINR(product.price)}</strong>{product.compareAt && <del>{formatINR(product.compareAt)}</del>}<small> / {product.sizes[0].label}</small></div><button className="add-button" onClick={onAdd}><ShoppingBag size={15} /> Add to Cart</button></div>
      </div>
    </article>
  );
}

function CartDrawer({ cart, open, onClose, onUpdate, onRemove, onCheckout }: { cart: CartItem[]; open: boolean; onClose: () => void; onUpdate: (id: string, size: string, delta: number) => void; onRemove: (id: string, size: string) => void; onCheckout: () => void }) {
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return <div className={`drawer-shell ${open ? "is-open" : ""}`} aria-hidden={!open}>
    <button className="drawer-overlay" onClick={onClose} aria-label="Close cart" />
    <aside className="cart-drawer" aria-label="Shopping cart">
      <div className="drawer-head"><div><span className="eyebrow">Your basket</span><h2>Cart <small>{cart.length ? `(${cart.length})` : ""}</small></h2></div><button onClick={onClose} className="close-button"><X size={20} /></button></div>
      {cart.length === 0 ? <div className="empty-cart"><ShoppingBag size={40} strokeWidth={1.2} /><h3>Your basket is waiting</h3><p>Add a few everyday botanicals to get started.</p><button className="dark-button" onClick={onClose}>Explore products <ArrowRight size={16} /></button></div> : <>
        <div className="cart-items">{cart.map((item) => <div className="cart-item" key={`${item.id}-${item.size}`}><img src={item.image} alt="" /><div className="cart-item-info"><div className="cart-item-top"><div><strong>{item.name}</strong><small>{item.size}</small></div><button onClick={() => onRemove(item.id, item.size)} aria-label={`Remove ${item.name}`}><X size={15} /></button></div><div className="cart-item-bottom"><div className="qty-stepper"><button onClick={() => onUpdate(item.id, item.size, -1)}><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => onUpdate(item.id, item.size, 1)}><Plus size={13} /></button></div><strong>{formatINR(item.unitPrice * item.quantity)}</strong></div></div></div>)}</div>
        <div className="cart-summary"><div><span>Subtotal</span><strong>{formatINR(subtotal)}</strong></div><p>Taxes and delivery calculated at checkout.</p><button className="dark-button full-button" onClick={onCheckout}>Proceed to checkout <ArrowRight size={16} /></button><button className="text-button centered" onClick={onClose}>Continue shopping</button></div>
      </>}
    </aside>
  </div>;
}

function CheckoutModal({ cart, open, onClose, onComplete }: { cart: CartItem[]; open: boolean; onClose: () => void; onComplete: () => void }) {
  const [payment, setPayment] = useState("upi");
  const [submitted, setSubmitted] = useState(false);
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  useEffect(() => {
    if (!open) {
      setSubmitted(false);
      setPayment("upi");
    }
  }, [open]);
  if (!open) return null;
  return <div className="modal-shell"><button className="drawer-overlay" onClick={onClose} aria-label="Close checkout" /><section className="checkout-modal" role="dialog" aria-modal="true" aria-label="Secure checkout">
    {!submitted ? <><div className="modal-head"><div><span className="eyebrow">Secure checkout</span><h2>Bring nature home</h2><p>Complete your details and choose a preferred payment method.</p></div><button className="close-button" onClick={onClose}><X size={20} /></button></div><div className="checkout-grid"><form className="checkout-form" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}><div className="form-section"><h3>Contact</h3><div className="form-grid"><label>Full name<input required placeholder="Your name" /></label><label>Mobile number<input required placeholder="+91 98765 43210" /></label><label className="full-field">Email address<input type="email" required placeholder="you@example.com" /></label></div></div><div className="form-section"><h3>Delivery address</h3><div className="form-grid"><label className="full-field">Address<input required placeholder="House / street / area" /></label><label>City<input required placeholder="Erode" /></label><label>PIN code<input required inputMode="numeric" placeholder="638000" /></label></div></div><div className="form-section"><h3>Payment method</h3><div className="payment-options">{[["upi", "UPI / QR", "Fast and familiar"], ["card", "Card", "Visa, Mastercard & RuPay"], ["cod", "Cash on delivery", "Available across India"]].map(([value, title, desc]) => <label className={`payment-option ${payment === value ? "is-selected" : ""}`} key={value}><input type="radio" name="payment" value={value} checked={payment === value} onChange={(e) => setPayment(e.target.value)} /><span className="payment-icon">{value === "upi" ? <Sparkles size={18} /> : value === "card" ? <CreditCard size={18} /> : <Package size={18} />}</span><span><strong>{title}</strong><small>{desc}</small></span>{payment === value && <CheckCircle2 size={18} className="payment-check" />}</label>)}</div><p className="gateway-note"><ShieldCheck size={15} /> Gateway-ready checkout. Payments will be securely handed off once your provider is connected.</p></div><button className="dark-button full-button checkout-submit" type="submit">Review order · {formatINR(subtotal)} <ArrowRight size={16} /></button></form><aside className="checkout-summary"><span className="eyebrow">Order summary</span><h3>{cart.length} {cart.length === 1 ? "item" : "items"}</h3>{cart.map((item) => <div className="summary-line" key={`${item.id}-${item.size}`}><span>{item.name} <small>{item.size} · {item.quantity}×</small></span><strong>{formatINR(item.unitPrice * item.quantity)}</strong></div>)}<div className="summary-total"><span>Subtotal</span><strong>{formatINR(subtotal)}</strong></div><div className="summary-perk"><Truck size={17} /><span><strong>Pan India delivery</strong><small>Free delivery on orders above ₹799</small></span></div></aside></div></> : <div className="success-state"><div className="success-icon"><Check size={30} /></div><span className="eyebrow">Preview order received</span><h2>You’re all set for a little more nature.</h2><p>Your checkout flow is ready. Connect a payment gateway and order service to turn this into a live purchase.</p><button className="dark-button" onClick={() => { setSubmitted(false); onComplete(); }}>Back to storefront <ArrowRight size={16} /></button></div>}
  </section></div>;
}

function ProductDetail({ product, open, onClose, onAdd, isWishlisted, onWishlist }: { product: Product | null; open: boolean; onClose: () => void; onAdd: (product: Product, size: string, unitPrice: number, quantity: number) => void; isWishlisted: boolean; onWishlist: () => void }) {
  const [selectedSize, setSelectedSize] = useState(0);
  const [quantity, setQuantity] = useState(1);
  if (!open || !product) return null;
  return <div className="modal-shell"><button className="drawer-overlay" onClick={onClose} aria-label="Close product details" /><section className="product-modal" role="dialog" aria-modal="true"><button className="close-button product-close" onClick={onClose}><X size={20} /></button><div className="product-modal-image"><img src={product.image} alt={product.name} /></div><div className="product-modal-copy"><span className="eyebrow">{product.category} · {product.badge}</span><h2>{product.name}</h2><div className="detail-rating">★★★★★ <span>4.9 · 28 reviews</span></div><p className="detail-description">{product.description} Every batch is packed with care in small, considered quantities.</p><div className="detail-price"><strong>{formatINR(product.sizes[selectedSize].price)}</strong>{product.compareAt && <del>{formatINR(product.compareAt)}</del>}<span>Inclusive of all taxes</span></div><div className="choice-block"><div className="choice-label"><strong>Choose a size</strong><span>Freshly packed</span></div><div className="size-options">{product.sizes.map((size, index) => <button key={size.label} className={selectedSize === index ? "is-selected" : ""} onClick={() => setSelectedSize(index)}>{size.label}<small>{formatINR(size.price)}</small></button>)}</div></div><div className="detail-actions"><div className="qty-stepper large-stepper"><button onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus size={15} /></button><span>{quantity}</span><button onClick={() => setQuantity(quantity + 1)}><Plus size={15} /></button></div><button className="dark-button add-detail-button" onClick={() => { onAdd(product, product.sizes[selectedSize].label, product.sizes[selectedSize].price, quantity); onClose(); }}>Add to cart <ShoppingBag size={17} /></button><button className={`heart-detail ${isWishlisted ? "is-wishlisted" : ""}`} onClick={onWishlist} aria-label="Toggle wishlist"><Heart size={19} fill={isWishlisted ? "currentColor" : "none"} /></button></div><div className="detail-features"><span><Leaf size={16} /> Plant-based</span><span><Truck size={16} /> Ships in 1–2 days</span><span><ShieldCheck size={16} /> Quality checked</span></div></div></section></div>;
}

function MobileMenu({ open, onClose, onCategory }: { open: boolean; onClose: () => void; onCategory: (category: Exclude<Category, "All">) => void }) {
  const [, setLocation] = useLocation();
  if (!open) return null;
  return <div className="mobile-menu-shell"><button className="drawer-overlay" onClick={onClose} aria-label="Close menu" /><aside className="mobile-menu"><div className="mobile-menu-head"><BrandMark /><button className="close-button" onClick={onClose}><X size={20} /></button></div><nav><a href="#shop" onClick={onClose}>Shop All <ArrowRight size={16} /></a><a href="#shop" onClick={() => onCategory("Seeds")}>Seeds <ArrowRight size={16} /></a><a href="#shop" onClick={() => onCategory("Raw Powders")}>Raw Powders <ArrowRight size={16} /></a><a href="#shop" onClick={() => onCategory("Herbs")}>Herbs <ArrowRight size={16} /></a><a href="#story" onClick={onClose}>About Us <ArrowRight size={16} /></a><button onClick={() => { onClose(); setLocation("/track-order"); }}>Track Order <ArrowRight size={16} /></button></nav><div className="mobile-menu-foot"><span>support@trinayaa.in</span><span>Pan India delivery</span></div></aside></div>;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const onFilter = (event: Event) => setActiveCategory((event as CustomEvent<Category>).detail);
    const onSearch = (event: Event) => setSearch((event as CustomEvent<string>).detail);
    window.addEventListener("trinayaa-filter", onFilter);
    window.addEventListener("trinayaa-search", onSearch);
    return () => { window.removeEventListener("trinayaa-filter", onFilter); window.removeEventListener("trinayaa-search", onSearch); };
  });

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => activeCategory === "All" || product.category === activeCategory).filter((product) => product.name.toLowerCase().includes(search.toLowerCase()) || product.category.toLowerCase().includes(search.toLowerCase()));
    if (sort === "price-low") result = [...result].sort((a, b) => a.price - b.price);
    if (sort === "price-high") result = [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [activeCategory, search, sort]);

  const toggleWishlist = (id: string) => setWishlist((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const addToCart = (product: Product, size = product.sizes[0].label, unitPrice = product.sizes[0].price, quantity = 1) => {
    setCart((current) => { const existing = current.find((item) => item.id === product.id && item.size === size); if (existing) return current.map((item) => item.id === product.id && item.size === size ? { ...item, quantity: item.quantity + quantity } : item); return [...current, { ...product, size, unitPrice, quantity }]; });
    toast.success(`${product.name} added to your basket`, { description: `${size} · ${formatINR(unitPrice)}` });
  };
  const updateCart = (id: string, size: string, delta: number) => setCart((current) => current.map((item) => item.id === id && item.size === size ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  const removeCart = (id: string, size: string) => setCart((current) => current.filter((item) => !(item.id === id && item.size === size)));
  const scrollToShop = () => document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });

  return <div className="site-shell">
    <SiteHeader cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} onCart={() => setCartOpen(true)} onMenu={() => setMenuOpen(true)} />
    <main>
      <section className="hero-section">
        <div className="hero-art" style={{ backgroundImage: `url(${IMG.hero})` }} />
        <div className="hero-content container-wide"><span className="eyebrow hero-eyebrow">Natural herbs for a better tomorrow</span><h1>Pure Seeds.<br /><em>Raw Powders.</em><br /><span>True Herbs.</span></h1><p>Carefully sourced natural herbs, pure seeds and raw herbal powders for your everyday wellness journey.</p><button className="dark-button hero-button" onClick={scrollToShop}>Explore Products <ArrowRight size={17} /></button><div className="hero-notes"><span><Leaf size={17} /> Natural Products</span><span><Sparkles size={17} /> Carefully Sourced</span><span><Heart size={17} /> Trusted Quality</span></div></div>
      </section>
      <section className="category-strip container-wide" aria-label="Shop by category">{categories.map((category) => <button className={`category-card ${category.className}`} key={category.label} onClick={() => { setActiveCategory(category.label); scrollToShop(); }}><div><span className="eyebrow">{category.label}</span><h3>{category.label === "Herbs" ? "Botanical" : category.label === "Raw Powders" ? "Daily wellness" : "Nature’s"}<br />collection</h3><p>{category.caption}</p><span className="circle-arrow"><ArrowRight size={16} /></span></div><img src={category.image} alt="" /></button>)}</section>
      <section className="catalog-section" id="shop"><div className="container-wide"><div className="section-heading"><div><span className="eyebrow">Curated with care</span><h2>Featured <em>products</em></h2></div><button className="outline-link" onClick={() => { setActiveCategory("All"); setSearch(""); }}>View all products <ArrowRight size={16} /></button></div><div className="catalog-toolbar"><div className="filter-chips">{(["All", "Seeds", "Raw Powders", "Herbs"] as Category[]).map((category) => <button key={category} className={activeCategory === category ? "is-active" : ""} onClick={() => setActiveCategory(category)}>{category}</button>)}</div><div className="catalog-tools"><label className="catalog-search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search catalog" /></label><label className="sort-select"><span>Sort by</span><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select><ChevronDown size={15} /></label></div></div><div className="catalog-result-line"><span>{filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} ready to ship</span><span className="organic-note"><span className="organic-dot" /> Small-batch selection</span></div><div className="product-grid">{filteredProducts.map((product) => <ProductCard key={product.id} product={product} isWishlisted={wishlist.has(product.id)} onWishlist={() => toggleWishlist(product.id)} onDetails={() => setSelectedProduct(product)} onAdd={() => addToCart(product)} />)}</div>{filteredProducts.length === 0 && <div className="empty-results"><Search size={28} /><h3>No botanicals found</h3><p>Try another search or browse every product.</p><button className="text-button" onClick={() => { setSearch(""); setActiveCategory("All"); }}>Clear filters <ArrowRight size={15} /></button></div>}</div></section>
      <section className="offer-banner container-wide"><div className="offer-botanical"><Leaf size={62} strokeWidth={0.9} /></div><div><span className="eyebrow">A little more nature</span><h2>Free delivery on orders<br /><em>above ₹799</em></h2></div><div className="offer-copy"><p>Carefully packed and sent from our shelves to your doorstep, anywhere in India.</p><button className="light-button" onClick={scrollToShop}>Shop the collection <ArrowRight size={16} /></button></div></section>
      <section className="story-section container-wide" id="story"><div className="story-visual"><img src={IMG.hibiscus} alt="Dried hibiscus petals in a bowl" /><div className="story-stamp"><Leaf size={19} /><span>Grown with<br />intention</span></div></div><div className="story-copy"><span className="eyebrow">The Trinayaa way</span><h2>Good ingredients<br />need <em>nothing extra.</em></h2><p>We believe everyday wellness starts with what you can see, smell and trust. Our botanicals are sourced in small batches, cleaned carefully and packed simply—so the ingredient stays at the heart of the ritual.</p><div className="story-points"><span><CheckCircle2 size={18} /> Sourced with intention</span><span><CheckCircle2 size={18} /> Honest, simple ingredients</span><span><CheckCircle2 size={18} /> Packed fresh in India</span></div><button className="text-button" onClick={() => toast.info("Our sourcing story is coming soon.")}>Read our story <ArrowRight size={16} /></button></div></section>
      <TrustRow />
    </main>
    <footer className="site-footer"><div className="footer-inner container-wide"><div className="footer-brand"><BrandMark inverse /><p>Pure seeds. Raw powders.<br />True herbs.</p><div className="socials"><a href="#footer" aria-label="Instagram"><Instagram size={16} /></a><a href="#footer" aria-label="Facebook"><Facebook size={16} /></a><a href="#footer" aria-label="Youtube"><Youtube size={16} /></a></div></div><div className="footer-column"><span className="footer-title">Quick links</span><a href="#shop">Shop All</a><a href="#shop">Seeds</a><a href="#shop">Raw Powders</a><a href="#shop">Herbs</a></div><div className="footer-column"><span className="footer-title">Customer care</span><a href="#story">About Us</a><a href="#footer" onClick={() => toast.info("Write to support@trinayaa.in for help.")}>Contact</a><button onClick={() => setLocation("/track-order")}>Track Order</button><a href="#footer">FAQs</a></div><div className="footer-column footer-contact"><span className="footer-title">Contact us</span><span><MapPin size={15} /> Erode, Tamil Nadu – 638002</span><a href="mailto:support@trinayaa.in"><Mail size={15} /> support@trinayaa.in</a><a href="tel:+919876543210"><Phone size={15} /> +91 98765 43210</a></div></div><div className="footer-bottom container-wide"><span>© 2026 TRINAYAA ENTERPRISES. All rights reserved.</span><div><a href="#footer">Privacy Policy</a><a href="#footer">Terms & Conditions</a><a href="#footer">Shipping Policy</a><a href="#footer">Return Policy</a></div></div></footer>
    <CartDrawer cart={cart} open={cartOpen} onClose={() => setCartOpen(false)} onUpdate={updateCart} onRemove={removeCart} onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }} />
    <CheckoutModal cart={cart} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} onComplete={() => { setCheckoutOpen(false); setCart([]); }} />
    <ProductDetail product={selectedProduct} open={Boolean(selectedProduct)} onClose={() => setSelectedProduct(null)} onAdd={addToCart} isWishlisted={selectedProduct ? wishlist.has(selectedProduct.id) : false} onWishlist={() => selectedProduct && toggleWishlist(selectedProduct.id)} />
    <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} onCategory={(category) => { setActiveCategory(category); setMenuOpen(false); window.setTimeout(scrollToShop, 30); }} />
  </div>;
}
