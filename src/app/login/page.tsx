"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function checkSchoolEmail(e: string): boolean {
    return e.toLowerCase().endsWith("@episcopalhighschool.org");
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setMessage(null);

    if (!checkSchoolEmail(email)) {
      setErrorMsg("Please use your @episcopalhighschool.org email.");
      return;
    }

    setLoadingEmail(true);

    if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoadingEmail(false);

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      if (data.session) {
        router.replace("/home");
      }
    } else {
      // signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      setLoadingEmail(false);

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      if (data.session) {
        // email confirmation disabled → user logged in immediately
        router.replace("/home");
      } else {
        // email confirmation enabled → ask them to check mailbox
        setMessage(
          "Sign up successful. Please check your email to confirm your account."
        );
      }
    }
  }

  async function handleGoogleLogin() {
    setErrorMsg(null);
    setMessage(null);
    setLoadingGoogle(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });

    setLoadingGoogle(false);

    if (error) {
      setErrorMsg(error.message);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1
          className="text-2xl font-semibold mb-1 text-center"
          style={{ color: "#800000" }}
        >
          EHS Honor Site
        </h1>
        <p className="text-gray-700 text-sm text-center mb-4">
          Use your school account to log in or sign up.
        </p>

        {/* Toggle buttons */}
        <div className="flex mb-4 rounded-full border border-gray-200 bg-gray-50 p-1 text-xs">
          <button
            onClick={() => {
              setMode("login");
              setErrorMsg(null);
              setMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-full ${
              mode === "login"
                ? "bg-white text-black shadow-sm"
                : "text-gray-500"
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => {
              setMode("signup");
              setErrorMsg(null);
              setMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-full ${
              mode === "signup"
                ? "bg-white text-black shadow-sm"
                : "text-gray-500"
            }`}
          >
            Sign up
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {errorMsg}
          </div>
        )}
        {message && (
          <div className="mb-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
            {message}
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              School Email
            </label>
            <input
              type="email"
              className="w-full border rounded-md px-2 py-1.5 text-sm"
              placeholder="you@episcopalhighschool.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full border rounded-md px-2 py-1.5 text-sm"
              placeholder={mode === "login" ? "Your password" : "Create a password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loadingEmail}
            className="w-full mt-1 px-4 py-2 rounded-md text-white text-sm shadow-sm"
            style={{ backgroundColor: "#800000" }} // maroon
          >
            {loadingEmail
              ? mode === "login"
                ? "Logging in…"
                : "Signing up…"
              : mode === "login"
              ? "Log in"
              : "Sign up"}
          </button>
        </form>

        <div className="flex items-center my-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-2 text-[11px] uppercase tracking-wide text-gray-400">
            or
          </span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loadingGoogle}
          className="w-full px-4 py-2 rounded-md border text-sm flex items-center justify-center gap-2 bg-white hover:bg-gray-50"
        >
          {loadingGoogle ? (
            "Redirecting…"
          ) : (
            <>
              <span
                className="inline-block h-4 w-4 rounded-full"
                style={{ backgroundColor: "#800000" }}
              />
              <span>Continue with Google</span>
            </>
          )}
        </button>
      </div>
    </main>
  );
}
