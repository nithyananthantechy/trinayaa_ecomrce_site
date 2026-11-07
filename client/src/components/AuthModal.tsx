import React, { useState, useEffect, FormEvent } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { COOKIE_NAME } from "@shared/const";
import {
  X,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  Lock,
  User,
  KeyRound,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  guestToken?: string;
  initialTab?: "signin" | "register" | "otp";
}

export default function AuthModal({
  open,
  onClose,
  onSuccess,
  guestToken,
  initialTab = "signin",
}: AuthModalProps) {
  const [authMode, setAuthMode] = useState<"password" | "otp">(
    initialTab === "otp" ? "otp" : "password"
  );
  const [tab, setTab] = useState<"signin" | "register">(
    initialTab === "register" ? "register" : "signin"
  );

  // Email/password form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Mobile OTP state
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpName, setOtpName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Reset modal state on open
  useEffect(() => {
    if (open) {
      setAuthMode(initialTab === "otp" ? "otp" : "password");
      setTab(initialTab === "register" ? "register" : "signin");
      setOtpSent(false);
      setOtpCode("");
      setDevOtpHint(null);
    }
  }, [open, initialTab]);

  // 1. Password login mutation
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome back, ${data.user.name}`);
      try {
        sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.token}`);
        localStorage.setItem("trinayaa_session_token", data.token);
      } catch (e) {}
      setLoading(false);
      onSuccess();
      onClose();
      if (data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN") {
        window.location.href = "/admin";
      }
    },
    onError: (err) => {
      toast.error(err.message || "Sign in failed");
      setLoading(false);
    },
  });

  // 2. Password registration mutation
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      toast.success(`Account created! Welcome, ${data.user.name}`);
      try {
        sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.token}`);
        localStorage.setItem("trinayaa_session_token", data.token);
      } catch (e) {}
      setLoading(false);
      onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed");
      setLoading(false);
    },
  });

  // 3. Request OTP mutation
  const requestOtpMutation = trpc.auth.requestOtp.useMutation({
    onSuccess: (data) => {
      setOtpSent(true);
      setCountdown(data.resendCooldownSeconds || 60);
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
        toast.info(`Verification code: ${data.devOtp}`, {
          description: "Use this code for authentication.",
        });
      } else {
        toast.success(data.message || "Verification code dispatched.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to dispatch verification code");
    },
  });

  // 4. Verify OTP mutation
  const verifyOtpMutation = trpc.auth.verifyOtp.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome, ${data.user.name}!`);
      try {
        sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.token}`);
        localStorage.setItem("trinayaa_session_token", data.token);
      } catch (e) {}
      onSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || "Verification failed");
    },
  });

  if (!open) return null;

  // Handle password submit
  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (tab === "register") {
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
    }
    setLoading(true);
    if (tab === "signin") {
      loginMutation.mutate({ email, password, guestToken });
    } else {
      registerMutation.mutate({ email, password, confirmPassword, name, phone, guestToken });
    }
  };

  // Handle request OTP
  const handleRequestOtp = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const clean = otpPhone.replace(/[\s\-\(\)\+]/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(clean)) {
      toast.error("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)");
      return;
    }
    requestOtpMutation.mutate({ phone: clean, purpose: "LOGIN" });
  };

  // Handle verify OTP
  const handleVerifyOtp = (e: FormEvent) => {
    e.preventDefault();
    const clean = otpPhone.replace(/[\s\-\(\)\+]/g, "").slice(-10);
    if (!otpCode.trim()) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }
    verifyOtpMutation.mutate({
      phone: clean,
      otp: otpCode.trim(),
      name: otpName.trim() || undefined,
      guestToken,
      purpose: "LOGIN",
    });
  };

  return (
    <div className="modal-shell z-50">
      <button className="drawer-overlay" onClick={onClose} aria-label="Close authentication" />
      <section
        className="checkout-modal max-w-md w-full p-6 bg-[#FFFDF8] rounded-3xl border border-[#DEDFD5] shadow-2xl relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="modal-head pb-3 border-b border-[#DEDFD5] flex items-center justify-between">
          <div>
            <span className="eyebrow text-xs font-bold uppercase tracking-widest text-[#AE6A2B] block">
              TRINAYAA Account
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#123D28]">
              {authMode === "otp"
                ? "Mobile OTP Login"
                : tab === "signin"
                ? "Customer Sign In"
                : "Create Customer Account"}
            </h2>
          </div>
          <button
            className="p-1 rounded-full text-[#6C7167] hover:text-[#123D28] hover:bg-slate-100 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Primary Auth Method Switcher: Password vs Mobile OTP */}
        <div className="flex p-1 bg-[#F4EFE6] rounded-xl my-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setAuthMode("password")}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === "password"
                ? "bg-[#123D28] text-white shadow-xs font-bold"
                : "text-[#4A5546] hover:text-[#123D28]"
            }`}
          >
            <Lock size={13} />
            <span>Email &amp; Password</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("otp")}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === "otp"
                ? "bg-[#123D28] text-white shadow-xs font-bold"
                : "text-[#4A5546] hover:text-[#123D28]"
            }`}
          >
            <Phone size={13} />
            <span>Mobile OTP</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* 1. PASSWORD MODE (SIGN IN / REGISTER TABS) */}
        {/* ======================================================== */}
        {authMode === "password" ? (
          <div>
            <div className="flex border-b border-[#DEDFD5] mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTab("signin")}
                className={`pb-2 px-4 transition-colors ${
                  tab === "signin"
                    ? "border-b-2 border-[#123D28] text-[#123D28]"
                    : "text-[#6C7167] hover:text-[#123D28]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setTab("register")}
                className={`pb-2 px-4 transition-colors ${
                  tab === "register"
                    ? "border-b-2 border-[#123D28] text-[#123D28]"
                    : "text-[#6C7167] hover:text-[#123D28]"
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
              {tab === "register" && (
                <>
                  <div>
                    <label className="block font-semibold mb-1 text-[#2B3527]">Full Name *</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Anand Kumar"
                      className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-[#2B3527]">Mobile Number</label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold mb-1 text-[#2B3527]">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#2B3527]">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                />
              </div>

              {tab === "register" && (
                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading || loginMutation.isPending || registerMutation.isPending}
                className="w-full py-2.5 px-4 bg-[#123D28] hover:bg-[#1A4D33] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs mt-4"
              >
                <span>
                  {loading || loginMutation.isPending || registerMutation.isPending
                    ? "Processing..."
                    : tab === "signin"
                    ? "Sign In"
                    : "Create Account"}
                </span>
                <ArrowRight size={15} />
              </button>
            </form>
          </div>
        ) : (
          /* ======================================================== */
          /* 2. MOBILE OTP MODE */
          /* ======================================================== */
          <div className="space-y-4 text-xs">
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <p className="text-xs text-[#525B4E] leading-relaxed">
                  Enter your 10-digit Indian mobile number. We will send a secure 6-digit one-time password (OTP) via SMS to sign in instantly.
                </p>

                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">Mobile Number</label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-[#ECE5D4] border border-r-0 border-[#DEDFD5] rounded-l-lg font-bold text-[#123D28]">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="w-full px-3 py-2 border border-[#DEDFD5] rounded-r-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28] text-sm font-medium tracking-wider"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={requestOtpMutation.isPending || otpPhone.length !== 10}
                  className="w-full py-2.5 px-4 bg-[#123D28] hover:bg-[#1A4D33] disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <Phone size={15} />
                  <span>
                    {requestOtpMutation.isPending ? "Sending Verification Code..." : "Send Verification Code"}
                  </span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-[#EAF2ED] border border-[#C5DCCB] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#6C7167] block text-[11px]">Code sent to</span>
                    <strong className="text-[#123D28]">+91 {otpPhone}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                      setDevOtpHint(null);
                    }}
                    className="text-[#AE6A2B] font-bold text-xs hover:underline"
                  >
                    Change Number
                  </button>
                </div>

                {devOtpHint && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                    <span>
                      Demo Mode Code: <strong>{devOtpHint}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(devOtpHint)}
                      className="px-2 py-0.5 bg-amber-200 text-amber-950 font-bold rounded text-[11px]"
                    >
                      Fill
                    </button>
                  </div>
                )}

                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-lg font-bold py-2.5 px-3 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">
                    Your Name <span className="text-[#6C7167] font-normal">(if registering new account)</span>
                  </label>
                  <input
                    type="text"
                    value={otpName}
                    onChange={(e) => setOtpName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyOtpMutation.isPending || otpCode.length < 4}
                  className="w-full py-2.5 px-4 bg-[#123D28] hover:bg-[#1A4D33] disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <KeyRound size={15} />
                  <span>{verifyOtpMutation.isPending ? "Verifying..." : "Verify & Sign In"}</span>
                </button>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#6C7167]">
                  {countdown > 0 ? (
                    <span>Resend code in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRequestOtp()}
                      disabled={requestOtpMutation.isPending}
                      className="text-[#123D28] font-bold hover:underline"
                    >
                      Resend Verification Code
                    </button>
                  )}
                  <span className="text-[#8E734B]">Code valid for 5 mins</span>
                </div>
              </form>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
