with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add RewardsTab import & Award icon
old_import = 'import EnquiriesTab from "./EnquiriesTab";'
new_import = 'import EnquiriesTab from "./EnquiriesTab";\nimport RewardsTab from "./RewardsTab";\nimport { Award } from "lucide-react";'
assert old_import in content, "old_import not found"
content = content.replace(old_import, new_import, 1)

# 2. Update AdminTab type
old_tab_type = '| "content"\n  | "settings"'
new_tab_type = '| "rewards"\n  | "content"\n  | "settings"'
assert old_tab_type in content, "old_tab_type not found"
content = content.replace(old_tab_type, new_tab_type, 1)

# 3. Update activeTab URL computation
old_active_tab = 'if (location.startsWith("/admin/customers")) return "customers";'
new_active_tab = 'if (location.startsWith("/admin/rewards")) return "rewards";\n    if (location.startsWith("/admin/customers")) return "customers";'
assert old_active_tab in content, "old_active_tab not found"
content = content.replace(old_active_tab, new_active_tab, 1)

# 4. Add sidebar navigation item
old_nav_item = '{ id: "customers" as AdminTab, label: "Customers", icon: Users },'
new_nav_item = '{ id: "customers" as AdminTab, label: "Customers", icon: Users },\n              { id: "rewards" as AdminTab, label: "Rewards & Loyalty", icon: Award },'
assert old_nav_item in content, "old_nav_item not found"
content = content.replace(old_nav_item, new_nav_item, 1)

# 5. Add state hooks for rewards settings
old_state_hook = '  const setLowStockThresholdMutation = trpc.admin.settings.setLowStockThreshold.useMutation({'
new_state_hook = '''  // Phase 7: Rewards Settings State
  const { data: rewardsSettingsData, refetch: refetchRewardsSettings } = trpc.admin.settings.getRewardsSettings.useQuery(undefined, {
    enabled: Boolean(currentUser && activeTab === "settings"),
  });
  const [feedbackPointsInput, setFeedbackPointsInput] = useState("50");
  const [thresholdPointsInput, setThresholdPointsInput] = useState("200");
  const [rewardsEnabledInput, setRewardsEnabledInput] = useState(true);

  useEffect(() => {
    if (rewardsSettingsData) {
      setFeedbackPointsInput(String(rewardsSettingsData.feedbackRewardPoints ?? 50));
      setThresholdPointsInput(String(rewardsSettingsData.freeProductRewardThreshold ?? 200));
      setRewardsEnabledInput(rewardsSettingsData.rewardsEnabled ?? true);
    }
  }, [rewardsSettingsData]);

  const setRewardsSettingsMutation = trpc.admin.settings.setRewardsSettings.useMutation({
    onSuccess: () => {
      toast.success("Rewards programme settings updated successfully");
      refetchRewardsSettings();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update rewards settings");
    },
  });

  const setLowStockThresholdMutation = trpc.admin.settings.setLowStockThreshold.useMutation({'''
assert old_state_hook in content, "old_state_hook not found"
content = content.replace(old_state_hook, new_state_hook, 1)

# 6. Add RewardsTab rendering in main body
old_render_tab = '{activeTab === "feedback" && <CustomerFeedbackTab />}'
new_render_tab = '{activeTab === "feedback" && <CustomerFeedbackTab />}\n          {activeTab === "rewards" && <RewardsTab />}'
assert old_render_tab in content, "old_render_tab not found"
content = content.replace(old_render_tab, new_render_tab, 1)

# 7. Add rewards settings card inside settings tab
old_settings_end = '''                  <span className="text-[10px] text-[#6C7167] block">
                    Automated Telegram notification is sent to authorized administrators whenever a product's available stock drops to or below this count (Default: 10 units).
                  </span>
                </div>'''

new_settings_end = '''                  <span className="text-[10px] text-[#6C7167] block">
                    Automated Telegram notification is sent to authorized administrators whenever a product's available stock drops to or below this count (Default: 10 units).
                  </span>
                </div>

                <div className="p-4 bg-[#FBF8F0] border border-[#DEDFD5] rounded space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-semibold text-[#123D28]">Customer Rewards & Loyalty Programme</label>
                      <span className="text-[10px] text-[#6C7167]">Configure point awards for customer feedback and threshold for free product redemptions.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rewardsEnabledInput}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setRewardsEnabledInput(val);
                          setRewardsSettingsMutation.mutate({ rewardsEnabled: val });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#123D28]"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block font-semibold text-[11px] mb-1">Feedback Points per Approved Review</label>
                      <input
                        type="number"
                        min="0"
                        value={feedbackPointsInput}
                        onChange={(e) => setFeedbackPointsInput(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#DEDFD5] rounded bg-white text-xs font-bold text-[#123D28]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[11px] mb-1">Free Product Points Threshold</label>
                      <input
                        type="number"
                        min="1"
                        value={thresholdPointsInput}
                        onChange={(e) => setThresholdPointsInput(e.target.value)}
                        className="w-full px-3 py-1.5 border border-[#DEDFD5] rounded bg-white text-xs font-bold text-[#123D28]"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const fb = parseInt(feedbackPointsInput, 10);
                      const th = parseInt(thresholdPointsInput, 10);
                      if (isNaN(fb) || fb < 0) {
                        toast.error("Feedback points must be a non-negative integer.");
                        return;
                      }
                      if (isNaN(th) || th <= 0) {
                        toast.error("Free product threshold must be at least 1 point.");
                        return;
                      }
                      setRewardsSettingsMutation.mutate({
                        rewardsEnabled: rewardsEnabledInput,
                        feedbackRewardPoints: fb,
                        freeProductRewardThreshold: th,
                      });
                    }}
                    disabled={setRewardsSettingsMutation.isPending}
                    className="dark-button text-xs py-1.5 px-4"
                  >
                    {setRewardsSettingsMutation.isPending ? "Saving..." : "Save Rewards Configuration"}
                  </button>
                </div>'''

assert old_settings_end in content, "old_settings_end not found"
content = content.replace(old_settings_end, new_settings_end, 1)

with open('client/src/pages/admin/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully patched AdminDashboard.tsx for Phase 7!")
