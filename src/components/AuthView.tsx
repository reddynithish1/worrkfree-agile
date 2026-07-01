import React, { useState } from "react";
import { User } from "../types";

interface AuthViewProps {
  onLogin: (user: User) => void;
}

export default function AuthView({ onLogin }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const payload = isLogin ? { email, password } : { name, email, password };
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 relative overflow-hidden z-50">
      {/* Background blobs for aesthetic */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] mix-blend-screen animate-blob" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[150px] mix-blend-screen animate-blob animation-delay-2000" />
      
      <div className="w-full max-w-md p-8 glass-panel border border-slate-900/10 rounded-2xl shadow-2xl relative z-10 backdrop-blur-xl bg-white/5">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600/90 rounded-xl flex items-center justify-center text-slate-900 font-bold text-xl shadow-lg shadow-blue-500/25 mx-auto mb-4">
            W
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {isLogin ? "Sign in to your WorrkFree workspace" : "Get started with WorrkFree"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/50 border border-slate-900/10 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="John Doe"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/50 border border-slate-900/10 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/50 border border-slate-900/10 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-slate-900 font-medium py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/25 mt-6 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
