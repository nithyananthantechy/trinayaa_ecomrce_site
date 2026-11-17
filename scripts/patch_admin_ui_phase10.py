import re

path = 'client/src/pages/admin/AdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Ensure BrandMark and icons are imported
if 'import BrandMark from "@/components/BrandMark";' not in content:
    content = 'import BrandMark from "@/components/BrandMark";\n' + content

# Ensure Menu and ShieldCheck are imported from lucide-react
if 'Menu,' not in content:
    content = content.replace('import {\n  LayoutDashboard,', 'import {\n  Menu,\n  ShieldCheck,\n  LayoutDashboard,')

# 2. Add mobileMenuOpen state
if 'const [mobileMenuOpen, setMobileMenuOpen] = useState(false);' not in content:
    content = content.replace(
        'export default function AdminDashboard() {\n  const [location, setLocation] = useLocation();',
        'export default function AdminDashboard() {\n  const [location, setLocation] = useLocation();\n  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);'
    )

# 3. Create the refined sidebar & header code
old_sidebar_pattern = r'\{\/\* Sidebar \*\/\}[\s\S]*?\{\/\* Main Content Area \*\/\}[\s\S]*?\{\/\* Top Header \*\/\}[\s\S]*?<\/header>'

new_sidebar_and_header = '''{/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] bg-[#123D28] text-white flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            <div>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <BrandMark inverse={true} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close navigation"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grouped Mobile Navigation */}
              <nav className="p-3 space-y-4 text-xs">
                {navGroups.map((group) => (
                  <div key={group.groupTitle} className="space-y-1">
                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-[#E5C378]/90">
                      {group.groupTitle}
                    </div>
                    {group.items.map(({ id, label, icon: Icon, badge }) => (
                      <button
                        key={id}
                        onClick={() => {
                          navigateToTab(id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all relative outline-hidden focus-visible:ring-2 focus-visible:ring-[#E5C378] ${
                          activeTab === id
                            ? "bg-white/15 text-white font-bold shadow-xs border-l-4 border-[#E5C378]"
                            : "text-[#DFE7D7] hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Icon
                          size={17}
                          className={`shrink-0 transition-colors ${
                            activeTab === id ? "text-[#E5C378]" : "text-white/80"
                          }`}
                        />
                        <span className="truncate">{label}</span>
                        {badge && (
                          <span className="ml-auto text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#AE6A2B] text-white font-extrabold shadow-xs">
                            {badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </nav>
            </div>

            {/* Mobile Admin Profile / Logout */}
            <div className="p-4 border-t border-white/10 text-xs bg-[#0F3321]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center font-bold text-white border border-white/20">
                  {currentUser?.name?.[0] || "A"}
                </div>
                <div className="overflow-hidden">
                  <div className="truncate font-semibold text-white">{currentUser?.name || "Administrator"}</div>
                  <div className="truncate text-[10px] text-[#DFE7D7]/70">{currentUser?.email}</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logoutMutation.mutate();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-950/40 hover:bg-red-900/60 text-red-200 rounded-lg transition-colors font-semibold border border-red-900/30"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside className="w-68 bg-[#123D28] text-white flex flex-col justify-between shrink-0 hidden md:flex border-r border-[#1B5237] h-screen sticky top-0 overflow-y-auto z-10">
        <div>
          {/* Sidebar Brand Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <BrandMark inverse={true} />
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              title="View Customer Storefront"
              className="text-[#DFE7D7] hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            >
              <ExternalLink size={16} />
            </a>
          </div>

          {/* Grouped Sidebar Navigation */}
          <nav className="p-3 space-y-4 text-xs font-medium">
            {navGroups.map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-[#E5C378]/90">
                  {group.groupTitle}
                </div>
                {group.items.map(({ id, label, icon: Icon, badge }) => (
                  <button
                    key={id}
                    onClick={() => navigateToTab(id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all relative outline-hidden focus-visible:ring-2 focus-visible:ring-[#E5C378] ${
                      activeTab === id
                        ? "bg-white/15 text-white font-bold shadow-xs border-l-4 border-[#E5C378]"
                        : "text-[#DFE7D7] hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon
                      size={17}
                      className={`shrink-0 transition-colors ${
                        activeTab === id ? "text-[#E5C378]" : "text-white/80"
                      }`}
                    />
                    <span className="truncate">{label}</span>
                    {badge && (
                      <span className="ml-auto text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#AE6A2B] text-white font-extrabold shadow-xs">
                        {badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Admin Profile / Logout Footer */}
        <div className="p-4 border-t border-white/10 text-xs bg-[#0F3321]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center font-bold text-white border border-white/20">
              {currentUser?.name?.[0] || "A"}
            </div>
            <div className="overflow-hidden">
              <div className="truncate font-semibold text-white">{currentUser?.name || "Administrator"}</div>
              <div className="truncate text-[10px] text-[#DFE7D7]/70">{currentUser?.email}</div>
            </div>
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-950/40 hover:bg-red-900/60 text-red-200 rounded-lg transition-colors font-semibold border border-red-900/30"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 md:hidden transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                  {tabContext.group}
                </span>
                <span className="text-slate-300">/</span>
                <h1 className="font-serif text-lg sm:text-xl font-bold text-[#123D28] tracking-tight">
                  {tabContext.title}
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block mt-0.5">
                TRINAYAA Botanical Ecommerce Management System · Erode Dispatch HQ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => {
                refetchStats();
                refetchProducts();
                refetchOrders();
                refetchCategories();
                refetchInventory();
                toast.success("Refreshed live data");
              }}
              className="p-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-[#123D28] transition-colors"
              title="Refresh Live Data"
            >
              <RefreshCw size={15} />
            </button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#123D28] hover:bg-[#1F5638] text-white font-bold text-xs py-2 px-3 sm:py-2.5 sm:px-4 rounded-xl shadow-xs transition-all border border-[#123D28]"
              title="Open Customer Storefront"
            >
              <span className="text-white font-bold tracking-wide hidden sm:inline">Customer Storefront</span>
              <span className="sm:hidden text-white font-bold">Store</span>
              <ExternalLink size={13} className="text-[#E5C378]" />
            </a>
          </div>
        </header>'''

# Add navGroups and tabContext helpers before return
helper_code = '''
  // Phase 10: Grouped navigation and context definition
  const navGroups = useMemo(() => [
    {
      groupTitle: "Overview",
      items: [
        { id: "overview" as AdminTab, label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      groupTitle: "Store Management",
      items: [
        { id: "products" as AdminTab, label: `Products (${products.length})`, icon: Package },
        { id: "categories" as AdminTab, label: "Categories", icon: FolderTree },
        { id: "inventory" as AdminTab, label: "Inventory & Stock", icon: Layers },
        { id: "orders" as AdminTab, label: "Orders", icon: ShoppingBag },
        { id: "offers" as AdminTab, label: "Festival Offers", icon: Tag },
        { id: "import" as AdminTab, label: "Bulk Import / Export", icon: FileSpreadsheet },
      ],
    },
    {
      groupTitle: "Customer Management",
      items: [
        { id: "customers" as AdminTab, label: "Customer 360", icon: Users },
        { id: "enquiries" as AdminTab, label: "Bulk Enquiries (B2B)", icon: Building2 },
        { id: "helpdesk" as AdminTab, label: "Support Helpdesk", icon: LifeBuoy },
        { id: "feedback" as AdminTab, label: "Feedback & Reviews", icon: Star },
        { id: "rewards" as AdminTab, label: "Rewards & Loyalty", icon: Award },
      ],
    },
    {
      groupTitle: "Content & Settings",
      items: [
        { id: "policies" as AdminTab, label: "Website Policies CMS", icon: FileText },
        { id: "content" as AdminTab, label: "Store Content", icon: FileText },
        { id: "settings" as AdminTab, label: "Store Settings", icon: Settings },
      ],
    },
    {
      groupTitle: "Operations",
      items: [
        { id: "telegram" as AdminTab, label: "Telegram Bot", icon: Bot },
        { id: "ai_image" as AdminTab, label: "AI Product Studio", icon: Sparkles, badge: "AI" },
      ],
    },
  ], [products.length]);

  const tabContext = useMemo(() => {
    switch (activeTab) {
      case "overview":
        return { group: "Overview", title: "Dashboard Overview" };
      case "products":
        return { group: "Store Management", title: `Products Catalogue (${products.length})` };
      case "categories":
        return { group: "Store Management", title: "Product Categories" };
      case "inventory":
        return { group: "Store Management", title: "Inventory & Low-Stock Controls" };
      case "orders":
        return { group: "Store Management", title: "Customer Orders & Dispatch" };
      case "offers":
        return { group: "Store Management", title: "Festival Offers & Banners" };
      case "import":
        return { group: "Store Management", title: "Bulk Product Import / Export" };
      case "customers":
        return { group: "Customer Management", title: "Customer 360 Profiles" };
      case "enquiries":
        return { group: "Customer Management", title: "B2B Wholesale Enquiries" };
      case "helpdesk":
        return { group: "Customer Management", title: "Customer Support Helpdesk" };
      case "feedback":
        return { group: "Customer Management", title: "Product Reviews & Moderation" };
      case "rewards":
        return { group: "Customer Management", title: "Customer Rewards & Loyalty" };
      case "policies":
        return { group: "Content & Settings", title: "Website Policies CMS" };
      case "content":
        return { group: "Content & Settings", title: "Storefront Content" };
      case "settings":
        return { group: "Content & Settings", title: "Store Settings & Social Links" };
      case "telegram":
        return { group: "Operations", title: "Telegram Administration Bot" };
      case "ai_image":
        return { group: "Operations", title: "AI Botanical Product Studio" };
      default:
        return { group: "Overview", title: "Admin Console" };
    }
  }, [activeTab, products.length]);
'''

# Insert helper code right before `return (\n    <div className="min-h-screen bg-[#F8FAFC]`
target_return = 'return (\n    <div className="min-h-screen bg-[#F8FAFC]'
if target_return in content:
    content = content.replace(target_return, helper_code + '\n  ' + target_return)
else:
    print("Could not find target_return")

# Replace sidebar and header
content, count = re.subn(old_sidebar_pattern, new_sidebar_and_header, content)
print(f"Replaced sidebar and header: count={count}")

# 4. Add Admin System Footer after </main>
admin_footer = '''        </main>

        {/* Admin System Footer */}
        <footer className="mt-auto px-6 py-4 border-t border-slate-200/90 bg-white text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">TRINAYAA Admin Operations Console</span>
            <span className="text-slate-300">·</span>
            <span>Erode Dispatch &amp; Apothecary Facility</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={13} className="text-emerald-600" />
              System Status: <strong className="text-emerald-700 font-semibold">Operational</strong>
            </span>
            <span>·</span>
            <span>&copy; 2026 TRINAYAA ENTERPRISES · v1.0</span>
          </div>
        </footer>'''

content = content.replace('        </main>', admin_footer, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully applied Phase 10 patch to AdminDashboard.tsx!")
