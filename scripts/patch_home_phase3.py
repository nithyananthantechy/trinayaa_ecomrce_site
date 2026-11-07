import os

HOME_PATH = os.path.join(os.path.dirname(__file__), "..", "client", "src", "pages", "Home.tsx")

with open(HOME_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add Header wishlist prop and button
header_props_old = 'currentUser?: any;\n}) {'
header_props_new = 'currentUser?: any;\n  wishlistCount?: number;\n}) {'
if "wishlistCount?: number;" not in content:
    content = content.replace(header_props_old, header_props_new)

header_account_old = '<button\n              className="icon-action account-action"\n              aria-label="Account"\n              onClick={onAccount}\n            >'
header_wishlist_new = """<button
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
            <button
              className="icon-action account-action"
              aria-label="Account"
              onClick={onAccount}
            >"""

if "wishlist-action" not in content and header_account_old in content:
    content = content.replace(header_account_old, header_wishlist_new)

# 2. Add Save for Later to CartDrawer props
cart_drawer_props_old = '  onCheckout: () => void;\n}) {'
cart_drawer_props_new = '  onCheckout: () => void;\n  onSaveForLater?: (id: string, size: string) => void;\n}) {'
if "onSaveForLater?: (id: string, size: string) => void;" not in content:
    content = content.replace(cart_drawer_props_old, cart_drawer_props_new)

cart_item_bottom_old = """                    <div className="cart-item-bottom">
                      <div className="qty-stepper">
                        <button onClick={() => onUpdate(item.id, item.size, -1)}><Minus size={13} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => onUpdate(item.id, item.size, 1)}><Plus size={13} /></button>
                      </div>
                      <strong>{formatINR(item.unitPrice * item.quantity)}</strong>
                    </div>"""

cart_item_bottom_new = """                    <div className="cart-item-bottom">
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
                    )}"""

if cart_item_bottom_old in content:
    content = content.replace(cart_item_bottom_old, cart_item_bottom_new)

# 3. Add queries and mutations in Home component
target_home_wishlist = "const [wishlist, setWishlist] = useState<Set<string>>(new Set());"
home_wishlist_sync = """const [wishlist, setWishlist] = useState<Set<string>>(new Set());

  // Phase 3: Live Wishlist Sync
  const { data: dbWishlistIds = [], refetch: refetchWishlistIds } = trpc.wishlist.getIds.useQuery(undefined, {
    enabled: Boolean(currentUser),
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
  });"""

if "Live Wishlist Sync" not in content and target_home_wishlist in content:
    content = content.replace(target_home_wishlist, home_wishlist_sync)

# 4. Update Home toggleWishlist implementation
old_home_toggle = """  const toggleWishlist = (id: string) =>
    setWishlist((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id);
      else next.add(id);
      return next;
    });"""

new_home_toggle = """  const toggleWishlist = (id: string) => {
    if (currentUser) {
      toggleWishlistMutation.mutate({ productId: id });
    }
    setWishlist((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveForLater = (id: string, size: string) => {
    if (currentUser) {
      saveForLaterMutation.mutate({ productId: id });
    }
    setWishlist((current) => new Set([...current, id]));
    removeFromCart(id, size);
  };"""

if old_home_toggle in content:
    content = content.replace(old_home_toggle, new_home_toggle)

# 5. Pass wishlistCount to Header and onSaveForLater to CartDrawer
content = content.replace(
    'currentUser={currentUser}\n      />',
    'currentUser={currentUser}\n        wishlistCount={wishlist.size}\n      />'
)
content = content.replace(
    'onCheckout={() => setCheckoutOpen(true)}\n      />',
    'onCheckout={() => setCheckoutOpen(true)}\n        onSaveForLater={handleSaveForLater}\n      />'
)

with open(HOME_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated Home.tsx with persistent wishlist and save for later")
