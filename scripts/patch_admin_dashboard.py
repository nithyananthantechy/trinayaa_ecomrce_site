import re

with open('client/src/pages/admin/AdminDashboard.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Imports
target1 = 'SlidersHorizontal\n} from "lucide-react";'
if target1 not in text:
    target1 = 'SlidersHorizontal\r\n} from "lucide-react";'

replace1 = '''SlidersHorizontal,
  Building2
} from "lucide-react";
import EnquiriesTab from "./EnquiriesTab";'''

text = text.replace(target1, replace1, 1)

# 2. AdminTab type
target2 = '| "orders"\n  | "customers"'
if target2 not in text:
    target2 = '| "orders"\r\n  | "customers"'

replace2 = '''| "orders"
  | "enquiries"
  | "customers"'''

text = text.replace(target2, replace2, 1)

# 3. activeTab memo
target3 = 'if (location.startsWith("/admin/orders")) return "orders";'
replace3 = '''if (location.startsWith("/admin/orders")) return "orders";
    if (location.startsWith("/admin/enquiries")) return "enquiries";'''

text = text.replace(target3, replace3, 1)

# 4. Sidebar navigation
target4 = '{ id: "orders" as AdminTab, label: "Orders", icon: ShoppingBag },'
replace4 = '''{ id: "orders" as AdminTab, label: "Orders", icon: ShoppingBag },
              { id: "enquiries" as AdminTab, label: "Bulk Enquiries", icon: Building2 },'''

text = text.replace(target4, replace4, 1)

# 5. Main content tab render
target5 = '{activeTab === "telegram" && ('
replace5 = '''{activeTab === "enquiries" && <EnquiriesTab />}

          {/* ========================================== */}
          {activeTab === "telegram" && ('''

text = text.replace(target5, replace5, 1)

with open('client/src/pages/admin/AdminDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("AdminDashboard.tsx patched successfully.")
