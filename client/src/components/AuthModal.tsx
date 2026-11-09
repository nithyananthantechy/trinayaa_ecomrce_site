import React, { useState, useEffect, FormEvent, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { COOKIE_NAME } from "@shared/const";
import {
  X,
  ArrowRight,
  ShieldCheck,
  Phone,
  Lock,
  User,
  KeyRound,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Smartphone,
} from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

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
  // Main Tab: "signin" or "register"
  const [tab, setTab] = useState<"signin" | "register">(
    initialTab === "register" ? "register" : "signin"
  );

  // In Sign-in tab: "password" or "otp"
  const [signinMethod, setSigninMethod] = useState<"password" | "otp">(
    initialTab === "otp" ? "otp" : "password"
  );

  // Registration step: "form" or "verify_otp"
  const [registerStep, setRegisterStep] = useState<"form" | "verify_otp">("form");

  // Form fields
  const [identifier, setIdentifier] = useState(""); // Email or Phone for password login
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerOtp, setRegisterOtp] = useState("");

  // OTP Login fields
  const [loginPhone, setLoginPhone] = useState("");
  const [loginOtpCode, setLoginOtpCode] = useState("");
  const [loginOtpSent, setLoginOtpSent] = useState(false);

  // Helpers
  const [loading, setLoading] = useState(false);
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
      setTab(initialTab === "register" ? "register" : "signin");
      setSigninMethod(initialTab === "otp" ? "otp" : "password");
      setRegisterStep("form");
      setLoginOtpSent(false);
      setLoginOtpCode("");
      setRegisterOtp("");
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

  // 2. Standard registration mutation
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      toast.success(`Account verified & created! Welcome, ${data.user.name}`);
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

  // 3. Firebase Verified Login Mutation
  const firebaseAuthMutation = trpc.auth.firebaseAuth.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome, ${data.user.name}!`);
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

  // 4. Firebase Verified Registration Mutation
  const firebaseRegisterMutation = trpc.auth.firebaseRegister.useMutation({
    onSuccess: (data) => {
      toast.success(`Account verified & created! Welcome, ${data.user.name}`);
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

  // 5. Backend Fallback Request OTP mutation
  const requestOtpMutation = trpc.auth.requestOtp.useMutation({
    onSuccess: (data) => {
      setCountdown(data.resendCooldownSeconds || 60);
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
        toast.info(`Verification code: ${data.devOtp}`, {
          description: "Use this code for instant verification.",
        });
      } else {
        toast.success(data.message || "Verification code dispatched via SMS.");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to dispatch verification code");
    },
  });

  // 6. Backend Fallback Verify OTP mutation
  const verifyOtpMutation = trpc.auth.verifyOtp.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome, ${data.user.name}!`);
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
      toast.error(err.message || "Verification failed");
      setLoading(false);
    },
  });

  if (!open) return null;

  // ----------------------------------------------------
  // FIREBASE PHONE AUTH HELPERS
  // ----------------------------------------------------
  const initRecaptcha = () => {
    try {
      const container = document.getElementById("recaptcha-container");
      if (!container) {
        console.warn("[reCAPTCHA] #recaptcha-container element not found in DOM");
        return undefined;
      }
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = undefined;
      }
      window.recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, container, {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {
          window.recaptchaVerifier = undefined;
        },
      });
      return window.recaptchaVerifier;
    } catch (e: any) {
      console.error("[reCAPTCHA Init Error]", e);
      return undefined;
    }
  };

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------

  // Sign In with Password submit
  const handlePasswordLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("Please enter your email address or mobile number");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }
    setLoading(true);
    loginMutation.mutate({
      email: identifier.trim(),
      password,
      guestToken,
    });
  };

  // Sign In with OTP: Request code
  const handleSendLoginOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const clean = loginPhone.replace(/[\s\-\(\)\+]/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(clean)) {
      toast.error("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)");
      return;
    }

    setLoading(true);
    try {
      const verifier = initRecaptcha();
      if (verifier) {
        const confirmation = await signInWithPhoneNumber(firebaseAuth, "+91" + clean, verifier);
        window.confirmationResult = confirmation;
        setLoginOtpSent(true);
        setCountdown(60);
        setLoading(false);
        toast.success(`Verification SMS sent to +91 ${clean} via Google Firebase!`);
        return;
      }
    } catch (err: any) {
      console.error("[Firebase SMS Error]", err);
      toast.error(`Firebase: ${err?.message || err?.code || "Failed to send SMS via Firebase"}`);
    }

    // Fallback to server gateway
    requestOtpMutation.mutate(
      { phone: clean, purpose: "LOGIN" },
      {
        onSuccess: () => {
          setLoginOtpSent(true);
          setLoading(false);
        },
        onError: () => {
          setLoading(false);
        },
      }
    );
  };

  // Sign In with OTP: Verify code & login
  const handleVerifyLoginOtp = async (e: FormEvent) => {
    e.preventDefault();
    const clean = loginPhone.replace(/[\s\-\(\)\+]/g, "").slice(-10);
    if (!loginOtpCode.trim()) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    if (window.confirmationResult) {
      try {
        await window.confirmationResult.confirm(loginOtpCode.trim());
        firebaseAuthMutation.mutate({
          phone: clean,
          guestToken,
        });
        return;
      } catch (err: any) {
        console.warn("[Firebase verify failed, trying fallback]", err);
      }
    }

    // Fallback to server verification
    verifyOtpMutation.mutate({
      phone: clean,
      otp: loginOtpCode.trim(),
      guestToken,
      purpose: "LOGIN",
    });
  };

  // Register: Step 1 -> Validate & dispatch phone OTP
  const handleStartRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Please enter your full name (at least 2 characters)");
      return;
    }
    if (!registerEmail.trim() || !registerEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    const cleanPhone = registerPhone.replace(/[\s\-\(\)\+]/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const verifier = initRecaptcha();
      if (verifier) {
        const confirmation = await signInWithPhoneNumber(firebaseAuth, "+91" + cleanPhone, verifier);
        window.confirmationResult = confirmation;
        setRegisterStep("verify_otp");
        setCountdown(60);
        setLoading(false);
        toast.success(`Verification SMS sent to +91 ${cleanPhone} via Google Firebase!`);
        return;
      }
    } catch (err: any) {
      console.error("[Firebase Register SMS Error]", err);
      toast.error(`Firebase: ${err?.message || err?.code || "Failed to send SMS via Firebase"}`);
    }

    // Fallback dispatch to server
    requestOtpMutation.mutate(
      { phone: cleanPhone, purpose: "REGISTER" },
      {
        onSuccess: () => {
          setRegisterStep("verify_otp");
          setLoading(false);
        },
        onError: () => {
          setLoading(false);
        },
      }
    );
  };

  // Register: Step 2 -> Verify OTP and complete registration
  const handleCompleteRegister = async (e: FormEvent) => {
    e.preventDefault();
    const cleanPhone = registerPhone.replace(/[\s\-\(\)\+]/g, "").slice(-10);
    if (!registerOtp.trim()) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    if (window.confirmationResult) {
      try {
        await window.confirmationResult.confirm(registerOtp.trim());
        firebaseRegisterMutation.mutate({
          name: name.trim(),
          email: registerEmail.trim(),
          phone: cleanPhone,
          password,
          confirmPassword,
          guestToken,
        });
        return;
      } catch (err: any) {
        console.warn("[Firebase Register Confirm failed, trying server fallback]", err);
      }
    }

    registerMutation.mutate({
      name: name.trim(),
      email: registerEmail.trim(),
      phone: cleanPhone,
      password,
      confirmPassword,
      otp: registerOtp.trim(),
      guestToken,
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
        {/* Invisible reCAPTCHA container for Google Firebase */}
        <div id="recaptcha-container"></div>

        {/* Header */}
        <div className="modal-head pb-3 border-b border-[#DEDFD5] flex items-center justify-between">
          <div>
            <span className="eyebrow text-xs font-bold uppercase tracking-widest text-[#AE6A2B] block">
              TRINAYAA Account
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#123D28]">
              {tab === "signin"
                ? signinMethod === "password"
                  ? "Customer Sign In"
                  : "Sign In with Mobile OTP"
                : registerStep === "form"
                ? "Create Customer Account"
                : "Verify Mobile Number"}
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

        {/* Primary Tab Switcher: Sign In vs Register */}
        <div className="flex border-b border-[#DEDFD5] my-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab("signin");
              setDevOtpHint(null);
            }}
            className={`pb-2.5 px-4 transition-all flex items-center gap-1.5 ${
              tab === "signin"
                ? "border-b-2 border-[#123D28] text-[#123D28]"
                : "text-[#6C7167] hover:text-[#123D28]"
            }`}
          >
            <Lock size={13} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setRegisterStep("form");
              setDevOtpHint(null);
            }}
            className={`pb-2.5 px-4 transition-all flex items-center gap-1.5 ${
              tab === "register"
                ? "border-b-2 border-[#123D28] text-[#123D28]"
                : "text-[#6C7167] hover:text-[#123D28]"
            }`}
          >
            <User size={13} />
            <span>Register</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: SIGN IN (PASSWORD OR OTP)                        */}
        {/* ======================================================== */}
        {tab === "signin" && (
          <div>
            {signinMethod === "password" ? (
              /* PASSWORD SIGN IN FORM */
              <form onSubmit={handlePasswordLogin} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">
                    Email Address or Mobile Number *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="you@example.com or 9876543210"
                      className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28] text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-[#2B3527]">Password *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setSigninMethod("otp");
                        setLoginOtpSent(false);
                        setDevOtpHint(null);
                      }}
                      className="text-[#AE6A2B] hover:text-[#8E531D] font-bold text-[11px] flex items-center gap-1 hover:underline"
                    >
                      <Smartphone size={12} />
                      <span>Sign in with OTP instead</span>
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28] text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || loginMutation.isPending}
                  className="w-full py-2.5 px-4 bg-[#123D28] hover:bg-[#1A4D33] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs mt-3 disabled:opacity-50"
                >
                  <span>{loading || loginMutation.isPending ? "Signing in..." : "Sign In"}</span>
                  <ArrowRight size={15} />
                </button>

                {/* Sub-toggle near password/bottom */}
                <div className="pt-2 text-center border-t border-[#EFECE6] mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSigninMethod("otp");
                      setLoginOtpSent(false);
                      setDevOtpHint(null);
                    }}
                    className="w-full py-2 px-3 border border-[#DEDFD5] bg-[#F7F4EC] hover:bg-[#EFEAE0] text-[#123D28] font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <Sparkles size={14} className="text-[#AE6A2B]" />
                    <span>Quick Login with Mobile OTP (SMS Direct)</span>
                  </button>
                </div>
              </form>
            ) : (
              /* OTP SIGN IN FORM */
              <div className="space-y-4 text-xs">
                {!loginOtpSent ? (
                  <form onSubmit={handleSendLoginOtp} className="space-y-3.5">
                    <p className="text-xs text-[#525B4E] leading-relaxed">
                      Enter your 10-digit mobile number. Google Firebase will deliver an official SMS verification code directly to your phone.
                    </p>

                    <div>
                      <label className="block font-semibold mb-1 text-[#2B3527]">Mobile Number *</label>
                      <div className="flex items-center">
                        <span className="px-3 py-2 bg-[#ECE5D4] border border-r-0 border-[#DEDFD5] rounded-l-lg font-bold text-[#123D28]">
                          +91
                        </span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={loginPhone}
                          onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="9876543210"
                          className="w-full px-3 py-2 border border-[#DEDFD5] rounded-r-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28] text-sm font-medium tracking-wider"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || requestOtpMutation.isPending || loginPhone.length !== 10}
                      className="w-full py-2.5 px-4 bg-[#123D28] hover:bg-[#1A4D33] disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Phone size={14} />
                      <span>{loading ? "Sending SMS..." : "Send Verification SMS"}</span>
                    </button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setSigninMethod("password")}
                        className="text-[#123D28] hover:underline font-bold text-xs inline-flex items-center gap-1"
                      >
                        <Lock size={12} />
                        <span>Sign in with Password instead</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyLoginOtp} className="space-y-3.5">
                    <div className="p-3 bg-[#EAF2ED] border border-[#C5DCCB] rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[#6C7167] block text-[11px]">SMS sent to</span>
                        <strong className="text-[#123D28]">+91 {loginPhone}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginOtpSent(false);
                          setLoginOtpCode("");
                          setDevOtpHint(null);
                        }}
                        className="text-[#AE6A2B] font-bold text-xs hover:underline"
                      >
                        Change Number
                      </button>
                    </div>

                    {devOtpHint && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                        <span>
                          🧪 Test Code: <strong>{devOtpHint}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setLoginOtpCode(devOtpHint)}
                          className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-[11px] transition-colors"
                        >
                          Auto-fill
                        </button>
                      </div>
                    )}

                    <div>
                      <label className="block font-semibold mb-1 text-[#2B3527]">
                        6-Digit SMS Verification Code *
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={loginOtpCode}
                        onChange={(e) => setLoginOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="w-full text-center tracking-widest text-lg font-bold py-2 px-3 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || loginOtpCode.length < 4}
                      className="w-full py-2.5 px-4 bg-[#123D28] hover:bg-[#1A4D33] disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
                    >
                      <KeyRound size={15} />
                      <span>{loading ? "Verifying..." : "Verify & Sign In"}</span>
                    </button>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-[#6C7167]">
                      {countdown > 0 ? (
                        <span>Resend SMS in {countdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendLoginOtp()}
                          disabled={loading}
                          className="text-[#123D28] font-bold hover:underline"
                        >
                          Resend SMS Code
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSigninMethod("password")}
                        className="text-[#AE6A2B] font-bold hover:underline"
                      >
                        Use Password
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: REGISTER (WITH PHONE SMS VERIFICATION)            */}
        {/* ======================================================== */}
        {tab === "register" && (
          <div>
            {registerStep === "form" ? (
              /* REGISTRATION FORM (STEP 1) */
              <form onSubmit={handleStartRegister} className="space-y-3 text-xs">
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
                  <label className="block font-semibold mb-1 text-[#2B3527]">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">
                    Mobile Number (for SMS Verification) *
                  </label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 bg-[#ECE5D4] border border-r-0 border-[#DEDFD5] rounded-l-lg font-bold text-[#123D28]">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="w-full px-3 py-2 border border-[#DEDFD5] rounded-r-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28] text-sm font-medium tracking-wider"
                    />
                  </div>
                  <span className="text-[11px] text-[#6C7167] mt-1 block">
                    We'll send a 6-digit SMS text code directly to your phone.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3 py-2 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-[#123D28] hover:bg-[#1A4D33] disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs mt-4"
                >
                  <ShieldCheck size={16} />
                  <span>
                    {loading ? "Sending SMS Code..." : "Verify Mobile & Create Account"}
                  </span>
                  <ArrowRight size={15} />
                </button>
              </form>
            ) : (
              /* REGISTRATION OTP VERIFICATION (STEP 2) */
              <form onSubmit={handleCompleteRegister} className="space-y-4 text-xs">
                <div className="p-3 bg-[#EAF2ED] border border-[#C5DCCB] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#6C7167] block text-[11px]">SMS Code sent to</span>
                    <strong className="text-[#123D28]">+91 {registerPhone}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterStep("form");
                      setRegisterOtp("");
                      setDevOtpHint(null);
                    }}
                    className="text-[#AE6A2B] font-bold text-xs hover:underline flex items-center gap-1"
                  >
                    <ArrowLeft size={12} />
                    <span>Edit details</span>
                  </button>
                </div>

                {devOtpHint && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                    <span>
                      🧪 Test Code: <strong>{devOtpHint}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setRegisterOtp(devOtpHint)}
                      className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold rounded-lg text-[11px] transition-colors"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}

                <div>
                  <label className="block font-semibold mb-1 text-[#2B3527]">
                    Enter 6-Digit SMS Verification Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={registerOtp}
                    onChange={(e) => setRegisterOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full text-center tracking-widest text-lg font-bold py-2.5 px-3 border border-[#DEDFD5] rounded-lg bg-[#FAF8F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#123D28]"
                  />
                  <span className="text-[11px] text-[#6C7167] mt-1 block text-center">
                    Valid for 5 minutes. Protects your account from unauthorized registration.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading || registerOtp.length < 4}
                  className="w-full py-2.5 px-4 bg-[#123D28] hover:bg-[#1A4D33] disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <CheckCircle2 size={16} />
                  <span>
                    {loading ? "Verifying & Creating..." : "Verify & Complete Registration"}
                  </span>
                </button>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#6C7167]">
                  {countdown > 0 ? (
                    <span>Resend SMS in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const clean = registerPhone.replace(/[\s\-\(\)\+]/g, "").slice(-10);
                        handleStartRegister({ preventDefault: () => {} } as FormEvent);
                      }}
                      disabled={loading}
                      className="text-[#123D28] font-bold hover:underline"
                    >
                      Resend SMS Code
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setRegisterStep("form")}
                    className="text-[#6C7167] hover:text-[#123D28] hover:underline"
                  >
                    ← Back to Details
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
