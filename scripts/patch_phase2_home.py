with open('client/src/pages/Home.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Import AuthModal at top
top_import = 'import AuthModal from "@/components/AuthModal";\n'
if "import AuthModal" not in text:
    text = top_import + text
    print("Added AuthModal import to Home.tsx.")

# 2. Replace old inline AuthModal implementation with empty or delegation
auth_start = 'function AuthModal({'
auth_end = 'function AccountModal({'
start_idx = text.find(auth_start)
end_idx = text.find(auth_end)

if start_idx != -1 and end_idx != -1:
    text = text[:start_idx] + text[end_idx:]
    print("Removed duplicate inline AuthModal in Home.tsx.")

# 3. In SiteHeader onAccount: navigate to /account when logged in
old_account_call = '''              if (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN") {
                setLocation("/admin");
              } else {
                setAccountModalOpen(true);
              }'''
new_account_call = '''              if (currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN") {
                setLocation("/admin");
              } else {
                setLocation("/account");
              }'''

if old_account_call in text:
    text = text.replace(old_account_call, new_account_call, 1)
    print("Updated onAccount in Home.tsx to route to /account.")

with open('client/src/pages/Home.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("Home.tsx updated successfully.")
