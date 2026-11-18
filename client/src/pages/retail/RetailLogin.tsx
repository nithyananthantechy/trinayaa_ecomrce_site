import { useState, FormEvent } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Store, ArrowRight, Lock, Mail, ArrowLeft, AlertCircle, ShoppingBag, MapPin } from "lucide-react";
import { COOKIE_NAME } from "@shared/const";

export default function RetailLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const loginMutation = trpc.auth.retailLogin.useMutation({
    onSuccess: (data) => {
      setAuthError(null);
      toast.success("Welcome back, Retail Handler", {
        description: `Signed in as ${data.user.name} (${data.user.role})`,
      });
      try {
        sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.token}`);
        localStorage.setItem("trinayaa_session_token", data.token);
      } catch (e) {
        // Storage fallback
      }
      setTimeout(() => {
        window.location.href = "/retail";
      }, 200);
    },
    onError: (err) => {
      const msg = err.message || "Access denied. Retail staff credentials required.";
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
      toast.error("Please enter your registered staff email/phone and password");
      return;
    }
    setLoading(true);
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-[#FBF8F0] text-[#1A2C20] flex flex-col justify-between p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full mx-auto pt-6 sm:pt-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#123D28] hover:text-[#AE6A2B] transition-colors"
          >
            <ArrowLeft size={16} /> Back to Storefront
          </button>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EAF2ED] text-[#123D28]">
            <MapPin size={12} /> Erode HQ &amp; Branches
          </span>
        </div>

        <div className="bg-white border border-[#E5DECF] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[#123D28] p-2.5 flex items-center justify-center shadow-md">
              <Store size={32} className="text-[#FBF8F0]" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#123D28] tracking-tight">
              TRINAYAA Retail POS
            </h1>
            <p className="text-xs text-[#6C7167] mt-1 font-sans">
              Retail Shop Operations · Offline Sales Billing · Branch Inventory Control
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
            {authError && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-red-900">Sign-in Failed</div>
                  <div className="text-[11px] text-red-700 mt-0.5">{authError}</div>
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold mb-1 text-[#1A2C20]">Staff Email or Phone</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-[#6C7167]" size={16} />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="retail.erode@trinayaa.in"
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FBF8F0] border border-[#DEDFD5] rounded-md focus:outline-none focus:border-[#123D28]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#123D28] hover:bg-[#1E5638] text-white rounded-md font-bold text-xs tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Authenticating Staff..." : "Sign In to Retail Portal"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#F0EBE1] text-center text-[11px] text-[#6C7167]">
            <span>Need full administrator access? </span>
            <button
              type="button"
              onClick={() => setLocation("/admin/login")}
              className="font-bold text-[#123D28] hover:underline cursor-pointer"
            >
              Admin Console Login
            </button>
          </div>
        </div>
      </div>

      <div className="text-center py-6 text-[11px] text-[#6C7167]">
        © 2026 TRINAYAA ENTERPRISES · Physical Retail Branch POS &amp; Inventory Subsystem
      </div>
    </div>
  );
}
