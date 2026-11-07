with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add PolicyCmsTab import
old_import = 'import RewardsTab from "./RewardsTab";'
new_import = 'import RewardsTab from "./RewardsTab";\nimport PolicyCmsTab from "./PolicyCmsTab";'
assert old_import in content, "old_import not found"
content = content.replace(old_import, new_import, 1)

# 2. Add 'policies' to AdminTab type
old_tab_type = '| "rewards"\n  | "content"\n  | "settings"'
new_tab_type = '| "rewards"\n  | "policies"\n  | "content"\n  | "settings"'
assert old_tab_type in content, "old_tab_type not found"
content = content.replace(old_tab_type, new_tab_type, 1)

# 3. Add 'policies' to activeTab URL computation
old_active_tab = 'if (location.startsWith("/admin/rewards")) return "rewards";'
new_active_tab = 'if (location.startsWith("/admin/policies")) return "policies";\n    if (location.startsWith("/admin/rewards")) return "rewards";'
assert old_active_tab in content, "old_active_tab not found"
content = content.replace(old_active_tab, new_active_tab, 1)

# 4. Add sidebar navigation item
old_nav = '{ id: "rewards" as AdminTab, label: "Rewards & Loyalty", icon: Award },'
new_nav = '{ id: "rewards" as AdminTab, label: "Rewards & Loyalty", icon: Award },\n              { id: "policies" as AdminTab, label: "Website Policies CMS", icon: FileText },'
assert old_nav in content, "old_nav not found"
content = content.replace(old_nav, new_nav, 1)

# 5. Add social settings state hooks
old_rewards_hook = '  const setRewardsSettingsMutation = trpc.admin.settings.setRewardsSettings.useMutation({'
new_social_hook = '''  // Phase 8: Social Links State
  const { data: socialConfigData, refetch: refetchSocialConfig } = trpc.admin.social.getConfig.useQuery(undefined, {
    enabled: Boolean(currentUser && activeTab === "settings"),
  });
  const [instagramInput, setInstagramInput] = useState("");
  const [facebookInput, setFacebookInput] = useState("");
  const [whatsappPhoneInput, setWhatsappPhoneInput] = useState("");
  const [whatsappMsgInput, setWhatsappMsgInput] = useState("");

  useEffect(() => {
    if (socialConfigData) {
      setInstagramInput(socialConfigData.instagram || "");
      setFacebookInput(socialConfigData.facebook || "");
      setWhatsappPhoneInput(socialConfigData.whatsappPhone || "");
      setWhatsappMsgInput(socialConfigData.whatsappMessage || "");
    }
  }, [socialConfigData]);

  const updateSocialMutation = trpc.admin.social.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("Social media and WhatsApp configuration saved!");
      refetchSocialConfig();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update social links");
    },
  });

  const setRewardsSettingsMutation = trpc.admin.settings.setRewardsSettings.useMutation({'''

assert old_rewards_hook in content, "old_rewards_hook not found"
content = content.replace(old_rewards_hook, new_social_hook, 1)

# 6. Add PolicyCmsTab rendering in tab switch
old_tab_render = '{activeTab === "rewards" && <RewardsTab />}'
new_tab_render = '{activeTab === "rewards" && <RewardsTab />}\n          {activeTab === "policies" && <PolicyCmsTab />}'
assert old_tab_render in content, "old_tab_render not found"
content = content.replace(old_tab_render, new_tab_render, 1)

# 7. Add Social Media & WhatsApp card in settings tab
old_rewards_card_end = '''                  <button
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

social_card_code = '''                  <button
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
                </div>

                {/* Phase 8: Social Links & WhatsApp Configuration */}
                <div className="p-4 bg-[#FBF8F0] border border-[#DEDFD5] rounded space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block font-semibold text-[#123D28]">Social Media &amp; WhatsApp Links</label>
                      <span className="text-[10px] text-[#6C7167]">
                        Manage public storefront footer social links (Instagram, Facebook, and WhatsApp).
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Instagram URL</label>
                      <input
                        type="url"
                        value={instagramInput}
                        onChange={(e) => setInstagramInput(e.target.value)}
                        placeholder="https://www.instagram.com/trinayaa_botanicals"
                        className="w-full px-3 py-1.5 border border-[#DEDFD5] rounded bg-white text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold mb-1">Facebook URL</label>
                      <input
                        type="url"
                        value={facebookInput}
                        onChange={(e) => setFacebookInput(e.target.value)}
                        placeholder="https://www.facebook.com/trinayaa.enterprises"
                        className="w-full px-3 py-1.5 border border-[#DEDFD5] rounded bg-white text-xs font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">WhatsApp Business Phone</label>
                        <input
                          type="text"
                          value={whatsappPhoneInput}
                          onChange={(e) => setWhatsappPhoneInput(e.target.value)}
                          placeholder="+91 94422 18990"
                          className="w-full px-3 py-1.5 border border-[#DEDFD5] rounded bg-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Default Pre-filled Chat Message</label>
                        <input
                          type="text"
                          value={whatsappMsgInput}
                          onChange={(e) => setWhatsappMsgInput(e.target.value)}
                          placeholder="Hello TRINAYAA, I would like to inquire about..."
                          className="w-full px-3 py-1.5 border border-[#DEDFD5] rounded bg-white text-xs"
                        />
                      </div>
                    </div>

                    {socialConfigData?.whatsappUrl && (
                      <div className="p-2.5 bg-white rounded border border-[#EFECE4] text-[11px] font-mono text-[#123D28] flex items-center justify-between gap-2 overflow-hidden">
                        <span className="truncate">Live WhatsApp Link: {socialConfigData.whatsappUrl}</span>
                        <a
                          href={socialConfigData.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#AE6A2B] hover:underline font-bold shrink-0 flex items-center gap-1"
                        >
                          <span>Test</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        updateSocialMutation.mutate({
                          instagram: instagramInput.trim() || undefined,
                          facebook: facebookInput.trim() || undefined,
                          whatsappPhone: whatsappPhoneInput.trim() || undefined,
                          whatsappMessage: whatsappMsgInput.trim() || undefined,
                        });
                      }}
                      disabled={updateSocialMutation.isPending}
                      className="dark-button text-xs py-1.5 px-4"
                    >
                      {updateSocialMutation.isPending ? "Saving..." : "Save Social Links"}
                    </button>
                  </div>
                </div>'''

assert old_rewards_card_end in content, "old_rewards_card_end not found"
content = content.replace(old_rewards_card_end, social_card_code, 1)

with open('client/src/pages/admin/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully patched AdminDashboard.tsx for Phase 8!")
