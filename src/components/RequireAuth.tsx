"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
      } else {
        setChecking(false);
      }
    }

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/login");
        }
      }
    );

    const unsub = authListener?.subscription;

    return () => {
      unsub?.unsubscribe();
    };
  }, [router]);

  if (checking) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center">
        <div className="rounded-2xl border bg-white px-6 py-4 shadow-sm text-sm text-gray-700">
          Checking your session…
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
