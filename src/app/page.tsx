"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Landing() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const isAuthed = !!data.session;
      setAuthed(isAuthed);
      setReady(true);
      if (isAuthed) router.replace("/home"); // logged-in users go to /home
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const isAuthed = !!session;
      setAuthed(isAuthed);
      if (isAuthed) router.replace("/home");
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  if (!ready) return <main className="p-8">Loading…</main>;

  // Always show welcome (no mission) on the root path
  return (
    <main className="max-w-3xl mx-auto mt-10">
      <section className="rounded-2xl border p-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#800000" }}>
          Welcome to the EHS Honor Site
        </h1>
        <p className="text-gray-700">
          Please log in with your school Google account to access the full site.
        </p>
        <a
          href="/login"
          className="inline-block mt-4 px-4 py-2 rounded-lg border hover:bg-gray-50"
        >
          {authed ? "Enter site" : "Log in"}
        </a>
      </section>
    </main>
  );
}
