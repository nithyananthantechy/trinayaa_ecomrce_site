import React, { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Search,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  UserCheck,
  Building,
  Crown,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";

export default function AdminUsersTab() {
  const { data: admins = [], refetch, isLoading } = trpc.admin.adminUsers.list.useQuery();
  const { data: currentUser } = trpc.auth.me.useQuery();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "SUPER_ADMIN" | "ADMIN">("ALL");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resetPasswordAdmin, setResetPasswordAdmin] = useState<any | null>(null);

  // Form states for adding admin
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"ADMIN" | "SUPER_ADMIN">("ADMIN");

  // Form state for password reset
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Mutations
  const createAdminMutation = trpc.admin.adminUsers.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Administrator ${data.user.name} created successfully`);
      setIsAddModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setRole("ADMIN");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateAdminMutation = trpc.admin.adminUsers.update.useMutation({
    onSuccess: () => {
      toast.success("Administrator updated successfully");
      setResetPasswordAdmin(null);
      setNewPassword("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteAdminMutation = trpc.admin.adminUsers.delete.useMutation({
    onSuccess: () => {
      toast.success("Administrator removed");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const filteredAdmins = useMemo(() => {
    return admins.filter((adm: any) => {
      const matchesSearch =
        adm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adm.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (adm.phone && adm.phone.includes(searchTerm));
      const matchesRole = roleFilter === "ALL" || adm.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [admins, searchTerm, roleFilter]);

  const superAdminCount = admins.filter((a: any) => a.role === "SUPER_ADMIN").length;
  const standardAdminCount = admins.filter((a: any) => a.role === "ADMIN").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#AE6A2B] uppercase tracking-wider">Access Control & Security</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              System Admin Management
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#123D28] mt-1 flex items-center gap-2">
            <ShieldCheck size={26} className="text-[#123D28]" /> Administrator Accounts &amp; Staff Roles
          </h2>
          <p className="text-xs text-[#6C7167] mt-1 max-w-2xl">
            Create and oversee staff administrator accounts. Configure Super Admin (Founder/Executive) vs Standard Admin
            privileges, reset security credentials, and manage team access.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              refetch();
              toast.info("Refreshed administrator accounts");
            }}
            className="text-xs text-[#6C7167] hover:text-[#123D28] flex items-center gap-1.5 py-2 px-3 border border-[#DEDFD5] rounded-lg bg-white shadow-2xs cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="dark-button text-xs py-2 px-4 shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>+ Add Administrator</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DEDFD5] p-4 rounded-xl shadow-2xs">
          <span className="text-[11px] font-bold text-[#6C7167] uppercase tracking-wider block">Total Administrators</span>
          <div className="text-2xl font-serif font-bold text-[#123D28] mt-1">{admins.length}</div>
          <span className="text-[10px] text-[#6C7167]">Staff &amp; Executive accounts</span>
        </div>

        <div className="bg-white border border-[#DEDFD5] p-4 rounded-xl shadow-2xs">
          <span className="text-[11px] font-bold text-[#6C7167] uppercase tracking-wider block">Super Admins (Founders)</span>
          <div className="text-2xl font-serif font-bold text-emerald-800 mt-1">{superAdminCount}</div>
          <span className="text-[10px] text-[#6C7167]">Full administrative &amp; financial control</span>
        </div>

        <div className="bg-white border border-[#DEDFD5] p-4 rounded-xl shadow-2xs">
          <span className="text-[11px] font-bold text-[#6C7167] uppercase tracking-wider block">Store Administrators</span>
          <div className="text-2xl font-serif font-bold text-[#AE6A2B] mt-1">{standardAdminCount}</div>
          <span className="text-[10px] text-[#6C7167]">Operations, catalog &amp; support</span>
        </div>

        <div className="bg-white border border-[#DEDFD5] p-4 rounded-xl shadow-2xs">
          <span className="text-[11px] font-bold text-[#6C7167] uppercase tracking-wider block">Current Session</span>
          <div className="text-sm font-bold text-[#123D28] mt-2 truncate">{currentUser?.name || "Administrator"}</div>
          <span className="text-[10px] text-emerald-700 font-semibold">{currentUser?.role || "SUPER_ADMIN"}</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C7167]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or mobile..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#DEDFD5] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-[#6C7167] whitespace-nowrap">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="text-xs px-3 py-2 border border-[#DEDFD5] rounded-lg bg-white text-[#123D28] font-medium"
          >
            <option value="ALL">All Roles ({admins.length})</option>
            <option value="SUPER_ADMIN">Super Admins ({superAdminCount})</option>
            <option value="ADMIN">Standard Admins ({standardAdminCount})</option>
          </select>
        </div>
      </div>

      {/* Administrators Table */}
      <div className="bg-white border border-[#DEDFD5] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#DEDFD5] flex items-center justify-between bg-[#FBF8F0]/40">
          <h3 className="font-serif text-sm font-bold text-[#123D28] flex items-center gap-2">
            <UserCheck size={16} className="text-[#AE6A2B]" /> System Administrators ({filteredAdmins.length})
          </h3>
          <span className="text-[11px] text-[#6C7167]">Session Protected · HttpOnly Authenticated</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#6C7167]">Loading administrators...</div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle size={32} className="mx-auto text-amber-600/70 mb-2" />
            <p className="text-sm font-semibold text-[#123D28]">No administrators found matching criteria</p>
            <p className="text-xs text-[#6C7167] mt-1">Try resetting the search filter or add a new administrator above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F2] text-[#6C7167] uppercase font-bold text-[10px] tracking-wider border-b border-[#DEDFD5]">
                <tr>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDFD5]/70">
                {filteredAdmins.map((adm: any) => {
                  const isCurrent = adm.id === currentUser?.id;
                  const isSuperAdmin = adm.role === "SUPER_ADMIN";
                  const isActive = adm.status === "ACTIVE";

                  return (
                    <tr key={adm.id} className="hover:bg-[#FAF8F2]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#123D28] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {adm.name ? adm.name.charAt(0).toUpperCase() : "A"}
                          </div>
                          <div>
                            <div className="font-bold text-[#123D28] flex items-center gap-1.5">
                              <span>{adm.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#6C7167] font-mono flex items-center gap-1">
                              <Mail size={11} /> {adm.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-full">
                            <Crown size={11} className="text-emerald-700" /> SUPER ADMIN (FOUNDER)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-800 border border-blue-300 font-bold px-2 py-0.5 rounded-full">
                            <Building size={11} className="text-blue-700" /> STORE ADMIN
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={10} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2 py-0.5 rounded-full">
                            <AlertTriangle size={10} /> Suspended
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#6C7167]">
                        {adm.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone size={11} /> {adm.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[#6C7167] text-[11px]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(adm.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Role toggle */}
                          <select
                            value={adm.role}
                            disabled={isCurrent || updateAdminMutation.isPending}
                            onChange={(e) =>
                              updateAdminMutation.mutate({
                                id: adm.id,
                                role: e.target.value as any,
                              })
                            }
                            className="text-[11px] px-2 py-1 border border-[#DEDFD5] rounded bg-white font-medium text-[#123D28]"
                            title="Change Role"
                          >
                            <option value="SUPER_ADMIN">Super Admin</option>
                            <option value="ADMIN">Standard Admin</option>
                          </select>

                          {/* Reset Password Button */}
                          <button
                            type="button"
                            onClick={() => setResetPasswordAdmin(adm)}
                            className="p-1.5 rounded-lg border border-[#DEDFD5] bg-white hover:bg-[#FBF8F0] text-[#123D28] transition-colors cursor-pointer"
                            title="Reset Credentials / Password"
                          >
                            <KeyRound size={13} />
                          </button>

                          {/* Status Toggle Button */}
                          <button
                            type="button"
                            disabled={isCurrent || updateAdminMutation.isPending}
                            onClick={() =>
                              updateAdminMutation.mutate({
                                id: adm.id,
                                status: isActive ? "SUSPENDED" : "ACTIVE",
                              })
                            }
                            className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors cursor-pointer ${
                              isActive
                                ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            } ${isCurrent ? "opacity-50 cursor-not-allowed" : ""}`}
                            title={isCurrent ? "Cannot suspend own account" : isActive ? "Suspend Account" : "Activate Account"}
                          >
                            {isActive ? "Suspend" : "Activate"}
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            disabled={isCurrent || deleteAdminMutation.isPending}
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to permanently delete administrator account "${adm.name}" (${adm.email})?`)) {
                                deleteAdminMutation.mutate({ id: adm.id });
                              }
                            }}
                            className={`p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white transition-colors cursor-pointer ${
                              isCurrent ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                            title={isCurrent ? "Cannot delete own account" : "Delete Administrator"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD ADMINISTRATOR */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DEDFD5] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DEDFD5] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#AE6A2B]">Admin Provisioning</span>
                <h3 className="font-serif text-xl font-bold text-[#123D28]">Add New Administrator</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#6C7167] hover:text-[#123D28] p-1.5 rounded-lg hover:bg-[#FBF8F0]"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return toast.error("Please enter the administrator's full name");
                if (!email.trim()) return toast.error("Please enter a valid email address");
                if (password.length < 8) return toast.error("Password must be at least 8 characters");

                createAdminMutation.mutate({
                  name: name.trim(),
                  email: email.trim(),
                  password,
                  role,
                  phone: phone.trim() || undefined,
                });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#123D28] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Senthil Nathan"
                  className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FBF8F0] focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#123D28] mb-1">Admin Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. senthil@trinayaa.in"
                  className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FBF8F0] focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                />
                <span className="text-[10px] text-[#6C7167] mt-0.5 block">
                  Used to sign into the TRINAYAA Admin Console at <code className="bg-slate-100 px-1 py-0.2 rounded font-mono">/admin/login</code>
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#123D28] mb-1">Initial Password * (min 8 characters)</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter strong password (min 8 chars)"
                    className="w-full px-3 py-2 pr-9 border border-[#DEDFD5] rounded-lg bg-[#FBF8F0] focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6C7167] hover:text-[#123D28]"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#123D28] mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FBF8F0] focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#123D28] mb-1.5">Administrative Role &amp; Permissions *</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setRole("ADMIN")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      role === "ADMIN"
                        ? "border-[#123D28] bg-[#123D28]/5 shadow-xs"
                        : "border-[#DEDFD5] bg-white hover:bg-[#FAF8F2]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-[#123D28]">
                      <Building size={14} className="text-[#AE6A2B]" /> Store Admin
                    </div>
                    <p className="text-[10px] text-[#6C7167] mt-1">
                      Orders, inventory, catalog, customer care, and dispatches.
                    </p>
                  </div>

                  <div
                    onClick={() => setRole("SUPER_ADMIN")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      role === "SUPER_ADMIN"
                        ? "border-emerald-700 bg-emerald-50/50 shadow-xs"
                        : "border-[#DEDFD5] bg-white hover:bg-[#FAF8F2]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <Crown size={14} className="text-emerald-700" /> Super Admin
                    </div>
                    <p className="text-[10px] text-[#6C7167] mt-1">
                      Full executive privileges: Staff management, policies, settings, and finances.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#DEDFD5]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#DEDFD5] rounded-lg text-[#6C7167] hover:bg-[#FBF8F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAdminMutation.isPending}
                  className="dark-button py-2 px-5"
                >
                  {createAdminMutation.isPending ? "Creating..." : "Create Administrator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: RESET PASSWORD */}
      {/* ========================================================= */}
      {resetPasswordAdmin && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DEDFD5] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DEDFD5] pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#AE6A2B]">Security</span>
                <h3 className="font-serif text-lg font-bold text-[#123D28]">Reset Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setResetPasswordAdmin(null)}
                className="text-[#6C7167] hover:text-[#123D28] p-1.5 rounded-lg hover:bg-[#FBF8F0]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="text-xs bg-[#FBF8F0] p-3 rounded-lg border border-[#DEDFD5]">
              <div className="font-bold text-[#123D28]">{resetPasswordAdmin.name}</div>
              <div className="text-[11px] text-[#6C7167] font-mono">{resetPasswordAdmin.email}</div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPassword.length < 8) {
                  return toast.error("New password must be at least 8 characters");
                }
                updateAdminMutation.mutate({
                  id: resetPasswordAdmin.id,
                  newPassword,
                });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#123D28] mb-1">New Password (min 8 characters) *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 pr-9 border border-[#DEDFD5] rounded-lg bg-[#FBF8F0] focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6C7167] hover:text-[#123D28]"
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#DEDFD5]">
                <button
                  type="button"
                  onClick={() => setResetPasswordAdmin(null)}
                  className="px-4 py-2 border border-[#DEDFD5] rounded-lg text-[#6C7167] hover:bg-[#FBF8F0]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateAdminMutation.isPending}
                  className="dark-button py-2 px-5"
                >
                  {updateAdminMutation.isPending ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
