import React, { useState } from "react";
import { User } from "../types";

interface AuthViewProps {
  onLogin: (user: User) => void;
}

type AuthMode = "login" | "signup" | "forgot-email" | "forgot-code" | "forgot-newpass";

export default function AuthView({ onLogin }: AuthViewProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [storedResetCode, setStoredResetCode] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const isLogin = mode === "login";
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Invalid email format");
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLogin ? { email, password } : { displayName, email, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }
      
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(resetEmail)) {
        throw new Error("Please enter a valid email address");
      }

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset code");
      }

      // Store the reset code (returned by the API for demo purposes)
      if (data.resetCode) {
        setStoredResetCode(data.resetCode);
      }
      
      setSuccess("Reset code sent! Check below for your code.");
      setMode("forgot-code");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (resetCode.length !== 6) {
      setError("Please enter the full 6-digit code");
      return;
    }

    // Move to new password step
    setMode("forgot-newpass");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      if (newPassword !== confirmNewPassword) {
        throw new Error("Passwords do not match");
      }

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, token: resetCode, newPassword })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess("Password reset successfully! You can now sign in.");
      // Clear all reset state
      setResetCode("");
      setNewPassword("");
      setConfirmNewPassword("");
      setStoredResetCode("");
      
      // Go back to login after a short delay
      setTimeout(() => {
        setMode("login");
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToLogin = () => {
    setMode("login");
    clearMessages();
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setStoredResetCode("");
  };

  const getTitle = () => {
    switch (mode) {
      case "login": return "Welcome back";
      case "signup": return "Create an account";
      case "forgot-email": return "Reset your password";
      case "forgot-code": return "Enter reset code";
      case "forgot-newpass": return "Set new password";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "login": return "Sign in to your WorrkFree workspace";
      case "signup": return "Get started with WorrkFree";
      case "forgot-email": return "Enter your email to receive a reset code";
      case "forgot-code": return `We sent a 6-digit code to ${resetEmail}`;
      case "forgot-newpass": return "Choose a strong new password";
    }
  };

  const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const inputClass = "w-full bg-white/50 border border-slate-900/10 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all";
  const labelClass = "block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider";
  const btnPrimary = "w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2";

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 relative overflow-hidden z-50">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[150px] mix-blend-screen animate-blob animation-delay-2000" />
      
      <div className="w-[calc(100%-2rem)] max-w-md p-6 md:p-8 glass-panel border border-slate-900/10 rounded-2xl shadow-2xl relative z-10 backdrop-blur-xl bg-white/5 mx-4 md:mx-0">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600/90 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/25 mx-auto mb-4">
            W
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {getTitle()}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {getSubtitle()}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm text-center">
            {success}
          </div>
        )}

        {/* LOGIN / SIGNUP FORM */}
        {(mode === "login" || mode === "signup") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className={labelClass}>Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass}
                  placeholder="John Doe"
                  required
                />
              </div>
            )}
            
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                title="Please enter a valid email address (e.g., user@example.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider">Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot-email");
                      clearMessages();
                      setResetEmail(email); // Pre-fill with current email
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button type="submit" disabled={isLoading} className={btnPrimary + " mt-6"}>
              {isLoading && <LoadingSpinner />}
              {mode === "login" ? "Sign In" : "Sign Up"}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD - STEP 1: Enter Email */}
        {mode === "forgot-email" && (
          <form onSubmit={handleForgotEmail} className="space-y-4">
            <div>
              <label className={labelClass}>Email Address</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <button type="submit" disabled={isLoading} className={btnPrimary + " mt-2"}>
              {isLoading && <LoadingSpinner />}
              Send Reset Code
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD - STEP 2: Enter Code */}
        {mode === "forgot-code" && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            {/* Show the reset code for demo purposes */}
            {storedResetCode && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                <p className="text-xs text-slate-500 mb-1">Your reset code (demo only):</p>
                <p className="text-2xl font-mono font-bold text-blue-600 tracking-[0.3em]">{storedResetCode}</p>
              </div>
            )}

            <div>
              <label className={labelClass}>6-Digit Reset Code</label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setResetCode(val);
                }}
                className={inputClass + " text-center text-xl tracking-[0.4em] font-mono"}
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
              />
            </div>

            <button type="submit" disabled={resetCode.length !== 6} className={btnPrimary + " mt-2"}>
              Verify Code
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD - STEP 3: New Password */}
        {mode === "forgot-newpass" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className={labelClass}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                required
                minLength={6}
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1">Must be at least 6 characters</p>
            </div>

            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button type="submit" disabled={isLoading} className={btnPrimary + " mt-2"}>
              {isLoading && <LoadingSpinner />}
              Reset Password
            </button>
          </form>
        )}

        {/* Footer navigation */}
        <div className="mt-6 text-center text-sm text-slate-500">
          {(mode === "login" || mode === "signup") && (
            <>
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  clearMessages();
                }}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </>
          )}
          {(mode === "forgot-email" || mode === "forgot-code" || mode === "forgot-newpass") && (
            <button
              onClick={goBackToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Sign In
            </button>
          )}
        </div>

        {/* Step indicator for forgot password flow */}
        {(mode === "forgot-email" || mode === "forgot-code" || mode === "forgot-newpass") && (
          <div className="flex justify-center gap-2 mt-4">
            {["forgot-email", "forgot-code", "forgot-newpass"].map((step, i) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === mode
                    ? "w-8 bg-blue-600"
                    : ["forgot-email", "forgot-code", "forgot-newpass"].indexOf(mode) > i
                    ? "w-4 bg-blue-400"
                    : "w-4 bg-slate-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
