"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let unsub = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      setReady(true);
      if (!session) router.replace("/");
    });

    // get current session immediately (faster than waiting for event)
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setReady(true);
      if (!data.session) router.replace("/");
    });

    return () => {
      unsub.data.subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) return <main className="p-8">Loading…</main>;
  if (!authed) return null; // we're redirecting

  return <>{children}</>;
}
