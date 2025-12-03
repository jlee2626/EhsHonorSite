"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { supabase } from "@/lib/supabaseClient";

type Question = {
  id: string;
  title: string;
  body: string;
  published: boolean;
  created_at: string;
  user_id: string;
};

type Answer = {
  id: string;
  question_id: string;
  body: string;
  created_at: string;
};

export default function QnaPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]); // ✅ ADD
  const [loadingList, setLoadingList] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  async function loadQuestions() {
    setLoadingList(true);

    // who am I?
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setUserId(null);
      setQuestions([]);
      setAnswers([]); // ✅ clear answers too
      setLoadingList(false);
      return;
    }
    setUserId(uid);

    // 1) Load questions I can see: my own OR published
    const { data: qData, error: qError } = await supabase
      .from("questions")
      .select("id, title, body, published, created_at, user_id")
      .or(`user_id.eq.${uid},published.eq.true`)
      .order("created_at", { ascending: false });

    if (qError || !qData) {
      setQuestions([]);
      setAnswers([]);
      setLoadingList(false);
      return;
    }

    const qs = qData as Question[];
    setQuestions(qs);

    // 2) Load answers for ONLY those visible questions
    const questionIds = qs.map((q) => q.id);

    if (questionIds.length === 0) {
      setAnswers([]);
      setLoadingList(false);
      return;
    }

    const { data: aData, error: aError } = await supabase
      .from("answers")
      .select("id, question_id, body, created_at")
      .in("question_id", questionIds)
      .order("created_at", { ascending: true });

    if (!aError && aData) {
      setAnswers(aData as Answer[]);
    } else {
      setAnswers([]);
    }

    setLoadingList(false);
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);

    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData.user?.id;
    if (!user_id) {
      setPosting(false);
      return;
    }

    const { error } = await supabase.from("questions").insert({
      user_id,
      title,
      body,
    });

    setPosting(false);
    if (error) {
      alert(error.message);
    } else {
      setTitle("");
      setBody("");
      await loadQuestions();
      alert("Question posted!");
    }
  }

  const myQuestions = userId
    ? questions.filter((q) => q.user_id === userId)
    : [];
  const publishedQuestions = questions.filter((q) => q.published);

  function answersFor(questionId: string) {
    return answers.filter((a) => a.question_id === questionId);
  }

  return (
    <RequireAuth>
      <main className="max-w-3xl mx-auto mt-10 space-y-6">
        {/* Intro card */}
        <section className="rounded-2xl border p-6 bg-white">
          <h1
            className="text-2xl font-semibold mb-2"
            style={{ color: "#800000" }}
          >
            Q&amp;A
          </h1>
          <p className="text-gray-700 text-sm">
            Ask questions about the Honor system. Your question starts private:
            only you and the Honor Committee can see it. If the committee thinks
            it will help others, they may publish it (without sharing your name).
          </p>
        </section>

        {/* Ask form */}
        <form
          onSubmit={submit}
          className="rounded-2xl border p-6 bg-white space-y-3"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full border rounded-md p-2 text-sm"
            required
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe your question…"
            className="w-full border rounded-md p-2 min-h-[120px] text-sm"
            required
          />
          <button
            disabled={posting}
            className="px-4 py-2 rounded-md text-white text-sm shadow-sm"
            style={{ backgroundColor: "#800000" }}
          >
            {posting ? "Posting…" : "Post Question"}
          </button>
        </form>

        {/* Your questions */}
        <section className="rounded-2xl border p-6 bg-white">
          <h2 className="text-lg font-semibold mb-2 text-black">
            Your Questions
          </h2>
          {loadingList ? (
            <p className="text-gray-600 text-sm">Loading…</p>
          ) : myQuestions.length === 0 ? (
            <p className="text-gray-600 text-sm">
              You haven&apos;t asked any questions yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {myQuestions.map((q) => {
                const qAnswers = answersFor(q.id);
                return (
                  <li key={q.id} className="border rounded-xl p-4 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-black text-sm">
                          {q.title}
                        </h3>
                        <p className="mt-1 text-gray-800 text-sm whitespace-pre-wrap">
                          {q.body}
                        </p>
                      </div>
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                        style={{
                          border: "1px solid #800000",
                          color: q.published ? "#15803d" : "#800000",
                          backgroundColor: q.published ? "#ecfdf3" : "white",
                        }}
                      >
                        {q.published ? "Published" : "Private"}
                      </span>
                    </div>

                    {/* ✅ show committee answers under your question too */}
                    {qAnswers.length > 0 && (
                      <div className="mt-3 border-t pt-2 space-y-2">
                        <div className="text-xs font-semibold text-gray-700">
                          Committee response
                        </div>
                        {qAnswers.map((a) => (
                          <div key={a.id} className="text-sm text-gray-800 whitespace-pre-wrap">
                            {a.body}
                            <div className="text-[11px] text-gray-500 mt-1">
                              {new Date(a.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 text-[11px] text-gray-500">
                      {new Date(q.created_at).toLocaleString()}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Published questions */}
        <section className="rounded-2xl border p-6 bg-white">
          <h2 className="text-lg font-semibold mb-2 text-black">
            Published Questions
          </h2>
          <p className="text-gray-700 text-xs mb-2">
            These questions have been reviewed and published by the Honor
            Committee to help the whole community.
          </p>
          {loadingList ? (
            <p className="text-gray-600 text-sm">Loading…</p>
          ) : publishedQuestions.length === 0 ? (
            <p className="text-gray-600 text-sm">
              No questions have been published yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {publishedQuestions.map((q) => {
                const qAnswers = answersFor(q.id);
                return (
                  <li key={q.id} className="border rounded-xl p-4 bg-white">
                    <h3 className="font-semibold text-black text-sm">
                      {q.title}
                    </h3>
                    <p className="mt-1 text-gray-800 text-sm whitespace-pre-wrap">
                      {q.body}
                    </p>

                    {/* ✅ THIS is what you want: answers under published */}
                    {qAnswers.length > 0 && (
                      <div className="mt-3 border-t pt-2 space-y-2">
                        <div className="text-xs font-semibold text-gray-700">
                          Committee response
                        </div>
                        {qAnswers.map((a) => (
                          <div key={a.id} className="text-sm text-gray-800 whitespace-pre-wrap">
                            {a.body}
                            <div className="text-[11px] text-gray-500 mt-1">
                              {new Date(a.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-2 text-[11px] text-gray-500">
                      {new Date(q.created_at).toLocaleString()}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </RequireAuth>
  );
}
