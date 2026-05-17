"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [resetReady, setResetReady] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace("#", ""));
    const hashType = hash.get("type");

    if (mode === "reset" || hashType === "recovery") {
      setResetReady(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setResetReady(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [mode, supabase]);

  async function handleSendResetLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailSent(false);
    setSendingEmail(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/forgot-password?mode=reset`,
    });

    if (resetError) {
      setError(resetError.message);
      setSendingEmail(false);
      return;
    }

    setSendingEmail(false);
    setEmailSent(true);
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setWarning(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/password-changed", {
      method: "POST",
    });

    if (!response.ok) {
      setWarning("Password updated, but confirmation email could not be sent.");
    }

    setLoading(false);
    setPasswordUpdated(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#202123] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-4 py-8"
      >
        <div className="bg-[#343541] rounded-2xl border border-[#4a4a5a]/50 shadow-2xl shadow-black/40 p-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 mb-3">
              <img
                src="/logo.svg"
                alt="AlphaSight AI"
                className="w-10 h-10 rounded-xl"
              />
              <h1 className="text-2xl font-bold text-gray-100 tracking-tight">
                AlphaSight AI
              </h1>
            </div>
            <p className="text-sm text-gray-400">
              {resetReady ? "Set your new password" : "Reset your password"}
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {warning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm"
            >
              {warning}
            </motion.div>
          )}

          {passwordUpdated ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-100 mb-2">
                Password updated
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                Your password has been changed successfully.
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all duration-200"
              >
                Back to sign in
              </Link>
            </div>
          ) : resetReady ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-300 mb-1.5"
                >
                  New password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#202123] border border-[#4a4a5a]/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-300 mb-1.5"
                >
                  Confirm new password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#202123] border border-[#4a4a5a]/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  "Change password"
                )}
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSendResetLink} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-1.5"
                  >
                    Account email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#202123] border border-[#4a4a5a]/50 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {sendingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>

              {emailSent && (
                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
                  Reset email sent. Use the link to continue and set your new password.
                </div>
              )}
            </>
          )}

          <p className="mt-6 text-center text-sm text-gray-400">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#202123]" />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
