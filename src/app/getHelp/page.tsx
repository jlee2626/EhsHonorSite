"use client";
import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { supabase } from "@/lib/supabaseClient";

type HelpItem = {
  id: string;
  topic: string;
  details: string;
  status: string;
  created_at: string;
};

export default function GetHelpPage() {
  const [topic, setTopic] = useState("general");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<HelpItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  async function loadMine() {
    setLoadingList(true);
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData?.user?.id;
    if (!user_id) { setLoadingList(false); return; }

    const { data, error } = await supabase
      .from("help_requests")
      .select("id,topic,details,status,created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) setItems(data);
    setLoadingList(false);
  }

  useEffect(() => {
    loadMine();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData?.user?.id;
    if (!user_id) { setSubmitting(false); return; }

    const { error } = await supabase
      .from("help_requests")
      .insert({ user_id, topic, details });

    setSubmitting(false);
    if (error) {
      alert(error.message);
    } else {
      setDetails("");
      setTopic("general");
      await loadMine();
      alert("Help request sent!");
    }
  }

  return (
    <RequireAuth>
      <main className="max-w-3xl mx-auto mt-10 space-y-6">
        <section className="rounded-2xl border p-6">
          <h1 className="text-2xl font-semibold mb-2" style={{ color: "#800000" }}>Get Help</h1>
          <p className="text-gray-700">Ask for confidential guidance or resources.</p>
        </section>

        <form onSubmit={submit} className="rounded-2xl border p-6 space-y-3 bg-white">
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="w-full border rounded-md p-2"
          >
            <option value="general">General question</option>
            <option value="process">Understanding the process</option>
            <option value="report">Concern/report</option>
            <option value="support">Support resources</option>
          </select>
          <textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="Describe what you need help with…"
            className="w-full border rounded-md p-2 min-h-[120px]"
            required
          />
          <button
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "#800000" }}
          >
            {submitting ? "Sending…" : "Request Help"}
          </button>
        </form>

        <section className="rounded-2xl border p-6">
          <h2 className="font-semibold mb-3">Your recent requests</h2>
          {loadingList ? (
            <p className="text-gray-600">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-gray-600">No requests yet.</p>
          ) : (
            <ul className="space-y-3">
              {items.map(h => (
                <li key={h.id} className="border rounded-lg p-4">
                  <div className="font-semibold capitalize">{h.topic.replace("_"," ")}</div>
                  <div className="text-gray-800 whitespace-pre-wrap">{h.details}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(h.created_at).toLocaleString()} • {h.status}
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
