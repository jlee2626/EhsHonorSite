"use client";
import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { supabase } from "@/lib/supabaseClient";

type Feedback = {
  id: string;
  text: string;
  created_at: string;
};

export default function FeedbackPage() {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<Feedback[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  async function loadFeedback() {
    setLoadingList(true);

    // explicitly load only *this* user's feedback
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData.user?.id;
    if (!user_id) {
      setLoadingList(false);
      return;
    }

    const { data, error } = await supabase
      .from("feedback")
      .select("id, text, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (!error && data) setItems(data as Feedback[]);
    setLoadingList(false);
  }

  useEffect(() => {
    loadFeedback();
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

    const { error } = await supabase.from("feedback").insert({ user_id, text });
    setSubmitting(false);

    if (error) {
      alert(error.message);
    } else {
      setText("");
      await loadFeedback();
      alert("Thanks for the feedback!");
    }
  }

  return (
    <RequireAuth>
      <main className="max-w-3xl mx-auto mt-10 space-y-6">
        <section className="rounded-2xl border p-6 bg-white">
          <h1
            className="text-2xl font-semibold mb-2"
            style={{ color: "#800000" }}
          >
            Feedback
          </h1>
          <p className="text-gray-700 text-sm">
            Share ideas or concerns about the Honor system. Your feedback isn&apos;t public.
            Only you and the Honor Committee can see it.
          </p>
        </section>

        <form
          onSubmit={submit}
          className="rounded-2xl border p-6 bg-white space-y-3"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Your feedback…"
            className="w-full border rounded-md p-2 min-h-[120px] text-sm"
            required
          />
          <button
            disabled={submitting}
            className="px-4 py-2 rounded-md text-white text-sm shadow-sm"
            style={{ backgroundColor: "#800000" }} // maroon
          >
            {submitting ? "Submitting…" : "Submit Feedback"}
          </button>
        </form>

        <section className="rounded-2xl border p-6 bg-white">
          <h2 className="text-lg font-semibold mb-2 text-black">Your Feedback</h2>
          {loadingList ? (
            <p className="text-gray-600 text-sm">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-gray-600 text-sm">
              You haven&apos;t submitted any feedback yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((f) => (
                <li key={f.id} className="border rounded-xl p-4 bg-white">
                  <p className="text-gray-800 text-sm whitespace-pre-wrap">
                    {f.text}
                  </p>
                  <div className="mt-2 text-[11px] text-gray-500">
                    {new Date(f.created_at).toLocaleString()}
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
