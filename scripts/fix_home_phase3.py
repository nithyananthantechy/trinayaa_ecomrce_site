import os

HOME_PATH = os.path.join(os.path.dirname(__file__), "..", "client", "src", "pages", "Home.tsx")

with open(HOME_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# Fix SiteHeader destructuring
old_header_func = """function SiteHeader({
  cartCount,
  onCart,
  onMenu,
  onAccount,
  currentUser,
}: {"""
new_header_func = """function SiteHeader({
  cartCount,
  onCart,
  onMenu,
  onAccount,
  currentUser,
  wishlistCount,
}: {"""
if old_header_func in content:
    content = content.replace(old_header_func, new_header_func)

# Fix CartDrawer destructuring
old_drawer_func = """function CartDrawer({
  cart,
  open,
  onClose,
  onUpdate,
  onRemove,
  onCheckout,
}: {"""
new_drawer_func = """function CartDrawer({
  cart,
  open,
  onClose,
  onUpdate,
  onRemove,
  onCheckout,
  onSaveForLater,
}: {"""
if old_drawer_func in content:
    content = content.replace(old_drawer_func, new_drawer_func)

# Fix currentUser ordering:
# Remove premature wishlist block at top of Home()
bad_wishlist_block = """  // Phase 3: Live Wishlist Sync
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

content = content.replace(bad_wishlist_block, "")

# Insert wishlist block right after `const { data: currentUser, refetch: refetchUser } = trpc.auth.me.useQuery();`
user_query_anchor = "const { data: currentUser, refetch: refetchUser } = trpc.auth.me.useQuery();"
content = content.replace(user_query_anchor, user_query_anchor + "\n\n" + bad_wishlist_block)

with open(HOME_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed Home.tsx props and variable scope")
