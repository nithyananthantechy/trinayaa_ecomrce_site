import os

ACCOUNT_PAGE_PATH = os.path.join(os.path.dirname(__file__), "..", "client", "src", "pages", "CustomerAccountPage.tsx")

with open(ACCOUNT_PAGE_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add icons to lucide-react import
old_import = '  AlertCircle,\n  X,\n} from "lucide-react";'
new_import = '  AlertCircle,\n  X,\n  Heart,\n  LifeBuoy,\n  Star,\n  Send,\n  MessageSquare,\n} from "lucide-react";'
if "Heart," not in content:
    content = content.replace(old_import, new_import)

# 2. Update AccountTab type
old_tab_type = 'type AccountTab = "profile" | "addresses" | "orders" | "security";'
new_tab_type = 'type AccountTab = "profile" | "addresses" | "orders" | "wishlist" | "tickets" | "feedback" | "security";'
if new_tab_type not in content:
    content = content.replace(old_tab_type, new_tab_type)

# 3. Add queries and mutations state
state_insert = """
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
"""

# Insert state after `ordersLoading } = trpc.orders.customerOrders.useQuery`
orders_query_anchor = "const { data: orders = [], isLoading: ordersLoading } = trpc.orders.customerOrders.useQuery(undefined, {\n    enabled: Boolean(currentUser),\n  });"
if "Phase 3: Wishlist, Tickets & Feedback state" not in content and orders_query_anchor in content:
    content = content.replace(orders_query_anchor, orders_query_anchor + "\n" + state_insert)

# Update the Tab buttons list
old_tabs_array = """          {[
            { id: "profile" as AccountTab, label: "My Profile", icon: User },
            { id: "addresses" as AccountTab, label: `Saved Addresses (${addresses.length})`, icon: MapPin },
            { id: "orders" as AccountTab, label: `My Orders (${orders.length})`, icon: ShoppingBag },
            { id: "security" as AccountTab, label: "Login & Security", icon: KeyRound },
          ].map(({ id, label, icon: Icon }) => ("""

new_tabs_array = """          {[
            { id: "profile" as AccountTab, label: "My Profile", icon: User },
            { id: "addresses" as AccountTab, label: `Saved Addresses (${addresses.length})`, icon: MapPin },
            { id: "orders" as AccountTab, label: `My Orders (${orders.length})`, icon: ShoppingBag },
            { id: "wishlist" as AccountTab, label: `My Wishlist (${wishlistItems.length})`, icon: Heart },
            { id: "tickets" as AccountTab, label: `Support Helpdesk (${myTickets.length})`, icon: LifeBuoy },
            { id: "feedback" as AccountTab, label: "Feedback & Reviews", icon: Star },
            { id: "security" as AccountTab, label: "Login & Security", icon: KeyRound },
          ].map(({ id, label, icon: Icon }) => ("""

if old_tabs_array in content:
    content = content.replace(old_tabs_array, new_tabs_array)

# Add the 3 new Tab Views right before `{activeTab === "security" && (`
security_tab_anchor = '{activeTab === "security" && ('

phase3_tabs_render = """
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
              <Link href="/products">
                <a className="py-2 px-3.5 bg-[#123D28] text-white rounded-xl text-xs font-bold hover:bg-[#1A4D33] transition-colors flex items-center gap-1.5 shadow-2xs">
                  <Plus size={13} /> Browse Catalogue
                </a>
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
                <Link href="/products">
                  <a className="inline-block py-2.5 px-5 bg-[#123D28] text-white rounded-xl text-xs font-bold hover:bg-[#1A4D33] transition-colors">
                    Explore 162 Pure Botanicals
                  </a>
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
"""

if "activeTab === \"wishlist\"" not in content and security_tab_anchor in content:
    content = content.replace(security_tab_anchor, phase3_tabs_render + "\n        " + security_tab_anchor)

# Add Modals (New Ticket Modal and Conversation Thread Modal) before final closing </div>
modals_code = """
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
"""

# Insert modals right before the closing `<AuthModal` or `</main>`
auth_modal_anchor = "<AuthModal"
if "MODAL 1: RAISE SUPPORT TICKET" not in content and auth_modal_anchor in content:
    content = content.replace(auth_modal_anchor, modals_code + "\n      " + auth_modal_anchor)

with open(ACCOUNT_PAGE_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated CustomerAccountPage.tsx with Wishlist, Support Helpdesk & Feedback tabs")
