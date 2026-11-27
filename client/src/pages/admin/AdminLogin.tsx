import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Shield, ArrowRight, Lock, Mail, ArrowLeft, Leaf, AlertCircle, Store, Eye, EyeOff } from "lucide-react";
import { COOKIE_NAME } from "@shared/const";
import BrandMark from "@/components/BrandMark";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const loginMutation = trpc.auth.adminLogin.useMutation({
    onSuccess: (data) => {
      setAuthError(null);
      toast.success("Welcome back, Administrator", {
        description: `Signed in as ${data.user.name}`,
      });
      try {
        sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.token}`);
        localStorage.setItem("trinayaa_session_token", data.token);
      } catch (e) {
        // storage unavailable
      }
      setTimeout(() => {
        window.location.href = "/admin";
      }, 200);
    },
    onError: (err) => {
      const msg = err.message || "Access denied. Administrator privileges required.";
      setAuthError(msg);
      toast.error("Authentication failed", {
        description: msg,
      });
      setLoading(false);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email || !password) {
      toast.error("Please enter your administrator email and password");
      return;
    }
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

        <div className="bg-white border border-[#E5DECF] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <BrandMark />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#123D28]/10 text-[#123D28] mb-2 border border-[#123D28]/20">
              <Shield size={12} className="text-[#123D28]" /> Super Administrator Portal
            </div>
            <p className="text-xs text-[#6C7167] font-sans">
              Enter authorized administrator credentials to manage the catalogue, orders, and promotions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
            {authError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-red-900">Authentication Failed</div>
                  <div className="text-[11px] text-red-700 mt-0.5">{authError}</div>
                </div>
              </div>
            )}
            <div>
              <label className="block font-semibold mb-1 text-[#1A2C20]">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-[#6C7167]" size={16} />
                <input
                  type="email"
                  required
                  autoComplete="username"
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
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-[#FBF8F0] border border-[#DEDFD5] rounded-md focus:outline-none focus:border-[#123D28]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6C7167] hover:text-[#123D28] transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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

          <div className="mt-6 pt-5 border-t border-[#F0EBE1] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#6C7167]">
            <span className="flex items-center gap-1">
              <Shield size={13} className="text-[#123D28]" /> Protected admin session
            </span>
            <button
              type="button"
              onClick={() => setLocation("/retail/login")}
              className="font-bold text-[#123D28] hover:text-[#AE6A2B] hover:underline cursor-pointer flex items-center gap-1 transition-colors"
            >
              <Store size={13} /> Retail Shop POS Login &rarr;
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-[#6C7167] pb-4">
        © 2026 TRINAYAA ENTERPRISES · Admin Security Management
      </div>
    </div>
  );
}

