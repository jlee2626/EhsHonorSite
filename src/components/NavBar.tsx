"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Role = "student" | "committee" | "admin" | null;

export default function NavBar() {
  const [authed, setAuthed] = useState(false);
  const [email, setEmail]   = useState<string | null>(null);
  const [role, setRole]     = useState<Role>(null);

  useEffect(() => {
    // On load: get user + profile role
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      setAuthed(!!user);
      setEmail(user?.email ?? null);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) setRole(profile.role as Role);
      }
    });

    // Keep in sync when auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const user = session?.user ?? null;
      setAuthed(!!user);
      setEmail(user?.email ?? null);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile) setRole(profile.role as Role);
      } else {
        setRole(null);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function roleLabel(r: Role) {
    if (!r) return "";
    if (r === "student") return "Student";
    if (r === "committee") return "Committee Member";
    if (r === "admin") return "Admin";
    return r;
  }

  return (
    <header className="w-full border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="h-8 w-8 rounded-full"
            style={{ backgroundColor: "#800000" }}  // maroon circle
          />
          <Link href="/" className="font-semibold tracking-wide text-black">
            EHS Honor Site
          </Link>
        </div>

        {/* Right: Nav */}
        {!authed ? (
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-md border border-gray-300 text-black hover:bg-gray-50 transition"
            >
              Log in
            </Link>
          </nav>
        ) : (
          <nav className="flex items-center gap-2 text-sm text-black">
            <Link className="px-3 py-2 rounded-md hover:bg-gray-100" href="/home">Home</Link>
            <Link className="px-3 py-2 rounded-md hover:bg-gray-100" href="/Qna">Q&amp;A</Link>
            <Link className="px-3 py-2 rounded-md hover:bg-gray-100" href="/feedback">Feedback</Link>
            <Link className="px-3 py-2 rounded-md hover:bg-gray-100" href="/getHelp">Get Help</Link>
            <Link className="px-3 py-2 rounded-md hover:bg-gray-100" href="/rules">Rules</Link>
            <Link className="px-3 py-2 rounded-md hover:bg-gray-100" href="/caseStudies">Case Studies</Link>
            <Link className="px-3 py-2 rounded-md hover:bg-gray-100" href="/resources">Resources</Link>
            <Link className="px-3 py-2 rounded-md hover:bg-gray-100" href="/report">Reports</Link>
          
            {(role === "committee" || role === "admin") && (
              <Link
                className="px-3 py-2 rounded-md hover:bg-gray-100"
                href="/committee"
              >
                Committee
              </Link>
            )}

            <span className="mx-2 h-5 w-px bg-gray-300" />

            {/* Welcome + role */}
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-gray-700">
                Welcome{email ? `, ${email}` : ""} 👋
              </span>
              {role && (
                <span
                  className="mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                  style={{ borderColor: "#800000", color: "#800000" }}  // maroon pill
                >
                  {roleLabel(role)}
                </span>
              )}
            </div>

            <button
              onClick={logout}
              className="ml-1 px-3 py-1.5 rounded-md text-white shadow-sm"
              style={{ backgroundColor: "#800000" }} // maroon button
            >
              Log out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
