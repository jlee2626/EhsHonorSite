"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data, error } = await supabase.auth.getSession();

      // If session is missing/invalid, force a clean logout + redirect
      if (error || !data.session) {
        await supabase.auth.signOut();

        if (!cancelled) {
          setChecking(false);
          router.replace("/login"); // ✅ send to login (not "/")
        }
        return;
      }

      if (!cancelled) setChecking(false);
    }

    check();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          await supabase.auth.signOut();
          router.replace("/login");
        }
      }
    );

    const unsub = listener.subscription;

    return () => {
      cancelled = true;
      unsub.unsubscribe();
    };
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="rounded-2xl border bg-white px-6 py-4 shadow-sm text-sm text-gray-700">
          Loading…
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
