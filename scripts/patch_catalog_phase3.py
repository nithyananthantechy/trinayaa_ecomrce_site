import os

CATALOG_PATH = os.path.join(os.path.dirname(__file__), "..", "client", "src", "pages", "Catalog.tsx")

with open(CATALOG_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# Add toast import from sonner if not present
if 'import { toast } from "sonner";' not in content:
    content = 'import { toast } from "sonner";\n' + content

# Add dbWishlistIds query
target_wishlist_state = "const [wishlist, setWishlist] = useState<Set<string>>(new Set());"
new_wishlist_state = """const [wishlist, setWishlist] = useState<Set<string>>(new Set());

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
  });"""

if new_wishlist_state not in content and target_wishlist_state in content:
    content = content.replace(target_wishlist_state, new_wishlist_state)

# Replace toggleWishlist function
old_toggle = """  const toggleWishlist = (id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };"""

new_toggle = """  const toggleWishlist = (id: string) => {
    if (currentUser) {
      toggleWishlistMutation.mutate({ productId: id });
    }
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };"""

if old_toggle in content:
    content = content.replace(old_toggle, new_toggle)

# Add Wishlist button in header right before Account button
account_btn = '<button\n              className="icon-action account-action"'
wishlist_btn = """<button
              className="icon-action wishlist-action"
              aria-label="Wishlist"
              onClick={() => {
                if (currentUser) {
                  setLocation("/account?tab=wishlist");
                } else {
                  toast.info("Please sign in to view your saved wishlist.");
                }
              }}
              title="Saved Wishlist"
            >
              <Heart size={21} className={wishlist.size > 0 ? "text-rose-600 fill-rose-600" : ""} />
              <span>Wishlist</span>
              {wishlist.size > 0 && <b>{wishlist.size}</b>}
            </button>
            <button
              className="icon-action account-action\""""

if "wishlist-action" not in content and account_btn in content:
    content = content.replace(account_btn, wishlist_btn)

with open(CATALOG_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated Catalog.tsx with persistent wishlist synchronization")
