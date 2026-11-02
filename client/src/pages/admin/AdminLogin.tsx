import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Shield, ArrowRight, Lock, Mail, ArrowLeft, Leaf } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("admin@trinayaa.in");
  const [password, setPassword] = useState("Admin@Trinayaa2026!");
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.auth.adminLogin.useMutation({
    onSuccess: (data) => {
      toast.success("Welcome back, Administrator", {
        description: `Signed in as ${data.user.name}`,
      });
      setLocation("/admin");
    },
    onError: (err) => {
      toast.error("Authentication failed", {
        description: err.message || "Invalid administrator credentials",
      });
      setLoading(false);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-[#FBF8F0] text-[#1A2C20] flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-md w-full mx-auto pt-6 sm:pt-12">
        <button
          onClick={() => setLocation("/")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#123D28] hover:text-[#AE6A2B] mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Storefront
        </button>

        <div className="bg-[#FFFDF8] border border-[#DEDFD5] rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#123D28] text-white flex items-center justify-center shadow-md">
              <Leaf size={26} />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#123D28] tracking-tight">
              TRINAYAA Admin
            </h1>
            <p className="text-xs text-[#6C7167] mt-1 font-sans">
              Enter authorized administrator credentials to manage the catalogue, orders, and promotions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
            <div>
              <label className="block font-semibold mb-1 text-[#1A2C20]">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-[#6C7167]" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@trinayaa.in"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FBF8F0] border border-[#DEDFD5] rounded-md focus:outline-none focus:border-[#123D28]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#1A2C20]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-[#6C7167]" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FBF8F0] border border-[#DEDFD5] rounded-md focus:outline-none focus:border-[#123D28]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#123D28] hover:bg-[#1F5638] text-white font-bold rounded-md flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Access Admin Console"}
              <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#DEDFD5] text-center text-[11px] text-[#6C7167]">
            <Shield size={14} className="inline mr-1 text-[#123D28]" />
            Session protected with HttpOnly cookies & role validation.
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-[#6C7167] pb-4">
        © 2026 TRINAYAA ENTERPRISES · Admin Security Management
      </div>
    </div>
  );
}

