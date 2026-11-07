import os

DASHBOARD_PATH = os.path.join(os.path.dirname(__file__), "..", "client", "src", "pages", "admin", "AdminDashboard.tsx")

with open(DASHBOARD_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
import_insert = 'import SupportHelpdeskTab from "./SupportHelpdeskTab";\nimport CustomerFeedbackTab from "./CustomerFeedbackTab";\n'
if "import SupportHelpdeskTab" not in content:
    content = import_insert + content

# 2. Add LifeBuoy and Star to lucide-react import if not present
if "LifeBuoy," not in content:
    content = content.replace('Building2\n} from "lucide-react";', 'Building2,\n  LifeBuoy,\n  Star\n} from "lucide-react";')

# 3. Add to AdminTab type
old_type = '| "enquiries"'
new_type = '| "enquiries"\n  | "helpdesk"\n  | "feedback"'
if new_type not in content:
    content = content.replace(old_type, new_type)

# 4. Add location checks
old_loc = 'if (location.startsWith("/admin/enquiries")) return "enquiries";'
new_loc = 'if (location.startsWith("/admin/enquiries")) return "enquiries";\n    if (location.startsWith("/admin/helpdesk")) return "helpdesk";\n    if (location.startsWith("/admin/feedback")) return "feedback";'
if new_loc not in content:
    content = content.replace(old_loc, new_loc)

# 5. Add to sidebar nav array
old_nav = '{ id: "enquiries" as AdminTab, label: "Bulk Enquiries", icon: Building2 },'
new_nav = '{ id: "enquiries" as AdminTab, label: "Bulk Enquiries", icon: Building2 },\n    { id: "helpdesk" as AdminTab, label: "Support Helpdesk", icon: LifeBuoy },\n    { id: "feedback" as AdminTab, label: "Feedback & Reviews", icon: Star },'
if new_nav not in content:
    content = content.replace(old_nav, new_nav)

# 6. Add tab body rendering
old_tab_render = '{activeTab === "enquiries" && <EnquiriesTab />}'
new_tab_render = '{activeTab === "enquiries" && <EnquiriesTab />}\n          {activeTab === "helpdesk" && <SupportHelpdeskTab />}\n          {activeTab === "feedback" && <CustomerFeedbackTab />}'
if new_tab_render not in content:
    content = content.replace(old_tab_render, new_tab_render)

with open(DASHBOARD_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated AdminDashboard.tsx with Support Helpdesk & Feedback tabs")
