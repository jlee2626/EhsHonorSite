"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SessionManager() {
  const router = useRouter();

  useEffect(() => {
    // Start token refresh while app is running
    supabase.auth.startAutoRefresh();

    // If tab visibility changes, restart refresh when user comes back
    const onVis = async () => {
      if (document.visibilityState === "visible") {
        supabase.auth.startAutoRefresh();

        // If the stored session is invalid/expired, sign out cleanly
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          await supabase.auth.signOut();
          router.replace("/login");
        }
      } else {
        // optional: stop refresh when hidden
        supabase.auth.stopAutoRefresh();
      }
    };

    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      supabase.auth.stopAutoRefresh();
    };
  }, [router]);

  return null;
}
