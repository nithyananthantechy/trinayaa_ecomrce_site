with open('client/src/pages/CustomerAccountPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Award and Gift icons to imports
old_import = '  MessageSquare,\n} from "lucide-react";'
new_import = '  MessageSquare,\n  Award,\n  Gift,\n} from "lucide-react";'
assert old_import in content, "old_import not found"
content = content.replace(old_import, new_import, 1)

# 2. Add 'rewards' to AccountTab
old_tab_type = 'type AccountTab = "profile" | "addresses" | "orders" | "wishlist" | "tickets" | "feedback" | "security";'
new_tab_type = 'type AccountTab = "profile" | "addresses" | "orders" | "wishlist" | "tickets" | "feedback" | "rewards" | "security";'
assert old_tab_type in content, "old_tab_type not found"
content = content.replace(old_tab_type, new_tab_type, 1)

# 3. Add rewards queries and state hooks
old_state = '  // Change password state\n  const [oldPassword, setOldPassword] = useState("");'
new_state = '''  // Phase 7: Rewards Queries and Redemption State
  const { data: rewardsOverview, refetch: refetchRewardsOverview } = trpc.rewards.myOverview.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const { data: rewardsTransactions = [], refetch: refetchRewardsTransactions } = trpc.rewards.myTransactions.useQuery(
    { limit: 30 },
    { enabled: Boolean(user && activeTab === "rewards") }
  );
  const { data: rewardsRedemptions = [], refetch: refetchRewardsRedemptions } = trpc.rewards.myRedemptions.useQuery(
    { limit: 30 },
    { enabled: Boolean(user && activeTab === "rewards") }
  );
  const { data: eligibleProducts = [] } = trpc.rewards.eligibleProducts.useQuery(undefined, {
    enabled: Boolean(activeTab === "rewards"),
  });

  const [redeemProductModalOpen, setRedeemProductModalOpen] = useState(false);
  const [selectedRedeemProduct, setSelectedRedeemProduct] = useState<any>(null);
  const [redemptionNotes, setRedemptionNotes] = useState("");

  const redeemMutation = trpc.rewards.redeemProduct.useMutation({
    onSuccess: () => {
      toast.success("Free product redemption requested! Our team will dispatch it soon.");
      setRedeemProductModalOpen(false);
      setSelectedRedeemProduct(null);
      setRedemptionNotes("");
      refetchRewardsOverview();
      refetchRewardsTransactions();
      refetchRewardsRedemptions();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to redeem free product");
    },
  });

  // Change password state
  const [oldPassword, setOldPassword] = useState("");'''

assert old_state in content, "old_state not found"
content = content.replace(old_state, new_state, 1)

# 4. Add navigation tab button
old_nav = '{ id: "feedback" as AccountTab, label: "Feedback & Reviews", icon: Star },'
new_nav = '{ id: "feedback" as AccountTab, label: "Feedback & Reviews", icon: Star },\n            { id: "rewards" as AccountTab, label: `My Rewards (${rewardsOverview?.balance ?? 0} pts)`, icon: Award },'
assert old_nav in content, "old_nav not found"
content = content.replace(old_nav, new_nav, 1)

# 5. Add rewards tab rendering and modal
target_sec_end = '''              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                className="py-2 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 rounded-xl text-xs font-bold transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}'''

rewards_jsx = '''              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                className="py-2 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 rounded-xl text-xs font-bold transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: MY REWARDS & LOYALTY (PHASE 7) */}
        {/* ======================================================== */}
        {activeTab === "rewards" && (
          <div className="space-y-6">
            {/* Hero Points Card */}
            <div className="bg-gradient-to-br from-[#123D28] via-[#1A4D33] to-[#0A2618] rounded-3xl p-6 sm:p-8 text-[#FBF9F5] shadow-lg relative overflow-hidden border border-[#256141]">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold text-[#E8BF83] border border-white/10 mb-3">
                    <Award size={14} />
                    <span>TRINAYAA Botanical Club</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">Your Reward Balance</h2>
                  <p className="text-xs text-[#D8E2D5] mt-1 max-w-md">
                    Earn 50 reward points for every approved feedback or review. Redeem 200 points for 100% free botanical wellness products!
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-center min-w-[200px]">
                  <div className="text-[11px] font-bold text-[#D8E2D5] uppercase tracking-wider">Available Balance</div>
                  <div className="font-serif text-4xl sm:text-5xl font-bold text-[#E8BF83] my-1">
                    {rewardsOverview?.balance ?? 0}
                  </div>
                  <div className="text-[11px] text-white/80 font-medium">TRINAYAA Points</div>
                </div>
              </div>

              {/* Progress to next free product */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-medium text-[#D8E2D5]">Progress to Free Botanical Product</span>
                  <span className="font-bold text-[#E8BF83]">
                    {rewardsOverview?.balance ?? 0} / {rewardsOverview?.freeProductRewardThreshold ?? 200} pts
                  </span>
                </div>
                <div className="w-full bg-white/15 h-3 rounded-full overflow-hidden p-0.5">
                  <div
                    className="bg-gradient-to-r from-[#AE6A2B] to-[#E8BF83] h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((rewardsOverview?.balance ?? 0) /
                            (rewardsOverview?.freeProductRewardThreshold ?? 200)) *
                            100
                        )
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-[11px] text-[#D8E2D5] mt-2">
                  {(rewardsOverview?.balance ?? 0) >= (rewardsOverview?.freeProductRewardThreshold ?? 200)
                    ? "🎉 Congratulations! You have enough points to claim a free product right now below!"
                    : `Only ${(rewardsOverview?.freeProductRewardThreshold ?? 200) - (rewardsOverview?.balance ?? 0)} more points needed to claim your next free botanical wellness product.`}
                </p>
              </div>

              {/* Total stats */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10 text-xs">
                <div>
                  <span className="text-[#D8E2D5]">Lifetime Earned:</span>
                  <span className="font-bold text-[#E8BF83] ml-2">+{rewardsOverview?.totalEarned ?? 0} pts</span>
                </div>
                <div>
                  <span className="text-[#D8E2D5]">Lifetime Redeemed:</span>
                  <span className="font-bold text-[#E8BF83] ml-2">-{rewardsOverview?.totalRedeemed ?? 0} pts</span>
                </div>
              </div>
            </div>

            {/* How It Works Banner */}
            <div className="bg-white rounded-3xl border border-[#DEDFD5] p-6 shadow-xs">
              <h3 className="font-serif text-base font-bold text-[#123D28] mb-4">How TRINAYAA Rewards Work</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#EFECE4]">
                  <div className="w-8 h-8 rounded-xl bg-[#123D28] text-white flex items-center justify-center font-bold mb-2">
                    1
                  </div>
                  <div className="font-bold text-[#123D28] text-sm">Experience Products</div>
                  <p className="text-[#6C7167] mt-1">
                    Order our single-origin, farmer-direct herbs, raw powders and seeds.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#EFECE4]">
                  <div className="w-8 h-8 rounded-xl bg-[#AE6A2B] text-white flex items-center justify-center font-bold mb-2">
                    2
                  </div>
                  <div className="font-bold text-[#123D28] text-sm">Review & Feedback</div>
                  <p className="text-[#6C7167] mt-1">
                    Submit a review or feedback. Each approved submission automatically earns 50 points.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#EFECE4]">
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold mb-2">
                    3
                  </div>
                  <div className="font-bold text-[#123D28] text-sm">Redeem Free Products</div>
                  <p className="text-[#6C7167] mt-1">
                    When you reach 200 points, pick any eligible botanical product and we ship it 100% free!
                  </p>
                </div>
              </div>
            </div>

            {/* Redeem Free Products Catalog */}
            <div className="bg-white rounded-3xl border border-[#DEDFD5] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFECE4]">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#123D28]">Redeem Free Botanical Products</h3>
                  <p className="text-xs text-[#6C7167] mt-0.5">
                    Choose any product below to redeem for {rewardsOverview?.freeProductRewardThreshold ?? 200} points.
                  </p>
                </div>
                <div className="text-xs font-bold text-[#AE6A2B] bg-[#F6EDE8] px-3 py-1 rounded-full">
                  Cost: {rewardsOverview?.freeProductRewardThreshold ?? 200} pts each
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {eligibleProducts.slice(0, 8).map((p: any) => {
                  const canAfford = (rewardsOverview?.balance ?? 0) >= (rewardsOverview?.freeProductRewardThreshold ?? 200);
                  return (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-[#DEDFD5] p-3 flex flex-col justify-between bg-[#FAF8F2] hover:bg-white transition-all shadow-2xs"
                    >
                      <div>
                        <div className="w-full aspect-square rounded-xl bg-white border border-[#EFECE4] overflow-hidden mb-2.5">
                          <img
                            src={p.image || p.primaryImage}
                            alt={p.nameEn}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="font-bold text-xs text-[#123D28] line-clamp-1">{p.nameEn}</div>
                        <div className="text-[10px] text-[#6C7167] mt-0.5 font-mono">{p.sku} · ₹{p.sellingPrice} value</div>
                        <div className="text-[10px] text-[#AE6A2B] font-semibold">{p.botanicalCategory || p.category}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!canAfford) {
                            toast.error(
                              `You need ${rewardsOverview?.freeProductRewardThreshold ?? 200} points to redeem this item. You currently have ${rewardsOverview?.balance ?? 0} points.`
                            );
                            return;
                          }
                          setSelectedRedeemProduct(p);
                          setRedeemProductModalOpen(true);
                        }}
                        disabled={!canAfford}
                        className={`w-full mt-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 ${
                          canAfford
                            ? "bg-[#123D28] hover:bg-[#1A4D33] text-white cursor-pointer"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                        }`}
                      >
                        <Gift size={13} />
                        <span>{canAfford ? "Redeem Free" : `Need ${rewardsOverview?.freeProductRewardThreshold ?? 200} pts`}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Redemption Requests History */}
            <div className="bg-white rounded-3xl border border-[#DEDFD5] p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#EFECE4]">
                <h3 className="font-serif text-lg font-bold text-[#123D28]">My Redemption Requests</h3>
                <p className="text-xs text-[#6C7167] mt-0.5">
                  Track the dispatch status of your claimed free reward products.
                </p>
              </div>

              {rewardsRedemptions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#6C7167] border border-dashed border-[#DEDFD5] rounded-2xl">
                  You haven't requested any free reward products yet. Earn points with feedback to claim yours!
                </div>
              ) : (
                <div className="divide-y divide-[#EFECE4] border border-[#DEDFD5] rounded-2xl overflow-hidden">
                  {rewardsRedemptions.map((r: any) => (
                    <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[#FAF8F2] hover:bg-white transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-[#DEDFD5] overflow-hidden shrink-0">
                          <img src={r.productImage || "/images/brand/emblem_crisp.png"} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-[#123D28] text-sm">{r.productName}</div>
                          <div className="text-[10px] text-[#6C7167] font-mono">
                            {r.productSku} · Requested {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                          {r.orderId && (
                            <div className="text-[11px] font-mono text-[#AE6A2B] font-bold mt-0.5">
                              Dispatch Reference: {r.orderId}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <span className="font-bold text-[#AE6A2B] bg-[#F6EDE8] px-2.5 py-1 rounded text-xs">
                          {r.pointsSpent} pts
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            r.status === "FULFILLED"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.status === "APPROVED"
                              ? "bg-blue-100 text-blue-800"
                              : r.status === "REQUESTED"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Points Activity Ledger */}
            <div className="bg-white rounded-3xl border border-[#DEDFD5] p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#EFECE4]">
                <h3 className="font-serif text-lg font-bold text-[#123D28]">Points Activity History</h3>
                <p className="text-xs text-[#6C7167] mt-0.5">
                  Complete audit log of points earned and redeemed on your account.
                </p>
              </div>

              {rewardsTransactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#6C7167] border border-dashed border-[#DEDFD5] rounded-2xl">
                  No points activity recorded yet. Leave a product review to earn your first 50 points!
                </div>
              ) : (
                <div className="divide-y divide-[#EFECE4] border border-[#DEDFD5] rounded-2xl overflow-hidden">
                  {rewardsTransactions.map((tx: any) => (
                    <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-[#FAF8F2] transition-colors">
                      <div>
                        <div className="font-bold text-[#123D28]">{tx.description}</div>
                        <div className="text-[10px] text-[#6C7167] mt-0.5">
                          {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })} · {tx.transactionType}
                        </div>
                      </div>
                      <div
                        className={`font-serif text-sm font-bold ${
                          tx.points > 0 ? "text-emerald-700" : "text-[#AE6A2B]"
                        }`}
                      >
                        {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Redeem Product Confirmation Modal */}
        {redeemProductModalOpen && selectedRedeemProduct && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DEDFD5] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EFECE4]">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#AE6A2B] block">
                    Claim Free Product
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#123D28]">Confirm Reward Redemption</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setRedeemProductModalOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 bg-[#FAF8F2] rounded-2xl border border-[#EFECE4] flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border border-[#DEDFD5] overflow-hidden bg-white shrink-0">
                  <img
                    src={selectedRedeemProduct.image || selectedRedeemProduct.primaryImage}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-sm text-[#123D28]">{selectedRedeemProduct.nameEn}</div>
                  <div className="text-xs text-[#6C7167] font-mono">{selectedRedeemProduct.sku}</div>
                  <div className="text-xs font-bold text-[#AE6A2B] mt-0.5">
                    Cost: {rewardsOverview?.freeProductRewardThreshold ?? 200} points
                  </div>
                </div>
              </div>

              <div className="text-xs text-[#6C7167] space-y-2">
                <p>
                  Your available points: <strong className="text-[#123D28]">{rewardsOverview?.balance ?? 0} pts</strong>.
                  Upon confirmation, {rewardsOverview?.freeProductRewardThreshold ?? 200} points will be deducted and our team will dispatch this product to your default address.
                </p>
                <div>
                  <label className="block font-semibold text-[#2B3527] mb-1">Optional delivery note or request:</label>
                  <textarea
                    rows={2}
                    value={redemptionNotes}
                    onChange={(e) => setRedemptionNotes(e.target.value)}
                    placeholder="e.g. Please deliver along with my upcoming order or contact before delivery"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded-xl bg-[#FAF8F2] text-xs focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EFECE4]">
                <button
                  type="button"
                  onClick={() => setRedeemProductModalOpen(false)}
                  className="py-2.5 px-4 border border-[#DEDFD5] text-[#6C7167] font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={redeemMutation.isPending}
                  onClick={() =>
                    redeemMutation.mutate({
                      productId: selectedRedeemProduct.id,
                      notes: redemptionNotes.trim() || undefined,
                    })
                  }
                  className="py-2.5 px-6 bg-[#123D28] hover:bg-[#1A4D33] text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  {redeemMutation.isPending ? "Redeeming..." : "Confirm & Claim Free Product"}
                </button>
              </div>
            </div>
          </div>
        )}'''

assert target_sec_end in content, "target_sec_end not found"
content = content.replace(target_sec_end, rewards_jsx, 1)

with open('client/src/pages/CustomerAccountPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully patched CustomerAccountPage.tsx for Phase 7!")
