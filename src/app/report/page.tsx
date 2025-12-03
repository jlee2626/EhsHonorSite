"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { supabase } from "@/lib/supabaseClient";

type ReportItem = {
  id: string;
  subject: string;
  details: string;
  status: string;
  created_at: string;
};

export default function ReportsPage() {
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [items, setItems] = useState<ReportItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  async function loadReports() {
    setLoadingList(true);

    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData.user?.id;
    if (!user_id) {
      setLoadingList(false);
      return;
    }

    const { data, error } = await supabase
      .from("reports")
      .select("id, subject, details, status, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (!error && data) setItems(data as ReportItem[]);
    setLoadingList(false);
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData.user?.id;
    if (!user_id) {
      setSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("reports")
      .insert({ user_id, subject, details });

    setSubmitting(false);
    if (error) {
      alert(error.message);
    } else {
      setSubject("");
      setDetails("");
      await loadReports();
      alert("Your report has been submitted.");
    }
  }

  return (
    <RequireAuth>
      <main className="max-w-3xl mx-auto mt-10 space-y-6">
        <section className="rounded-2xl border p-6 bg-white">
          <h1 className="text-2xl font-semibold mb-2" style={{ color: "#800000" }}>
            Report a Concern
          </h1>
          <p className="text-gray-700 text-sm">
            Use this form to share a concern with the Honor Committee. Reports are not public.
            Only committee members can see them and follow up appropriately.
          </p>
        </section>

        <form onSubmit={submit} className="rounded-2xl border p-6 bg-white space-y-3">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full border rounded-md p-2 text-sm"
            required
          />
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe your concern…"
            className="w-full border rounded-md p-2 min-h-[140px] text-sm"
            required
          />
          <button
            disabled={submitting}
            className="px-4 py-2 rounded-md text-white text-sm shadow-sm"
            style={{ backgroundColor: "#800000" }} // maroon
          >
            {submitting ? "Submitting…" : "Submit Report"}
          </button>
        </form>

        <section className="rounded-2xl border p-6 bg-white">
          <h2 className="text-lg font-semibold mb-2 text-black">Your Reports</h2>
          {loadingList ? (
            <p className="text-gray-600 text-sm">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-gray-600 text-sm">You haven&apos;t submitted any reports yet.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((r) => (
                <li key={r.id} className="border rounded-xl p-4 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-black text-sm">{r.subject}</h3>
                      <p className="mt-1 text-gray-700 text-sm whitespace-pre-wrap">
                        {r.details}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border"
                      style={{ borderColor: "#800000", color: "#800000" }}
                    >
                      {r.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-gray-500">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </RequireAuth>
  );
}
