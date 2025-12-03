"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import RequireAuth from "@/components/RequireAuth";

type Role = "student" | "committee" | "admin" | null;

type Question = {
  id: string;
  title: string;
  body: string;
  published: boolean;
  created_at: string;
};

type FeedbackItem = {
  id: string;
  text: string;
  created_at: string;
};

type HelpItem = {
  id: string;
  topic: string;
  details: string;
  status: string;
  created_at: string;
};

type ReportItem = {
  id: string;
  subject: string;
  details: string;
  status: string;
  created_at: string;
};

type Answer = {
  id: string;
  question_id: string;
  body: string;
  created_at: string;
};

type Tab = "questions" | "feedback" | "help" | "reports";

export default function CommitteeDashboard() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  const [activeTab, setActiveTab] = useState<Tab>("questions");

  // Questions + answers
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadingAnswers, setLoadingAnswers] = useState(true);
  const [updatingQuestionId, setUpdatingQuestionId] = useState<string | null>(null);
  const [addingAnswerId, setAddingAnswerId] = useState<string | null>(null);

  // Feedback
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(true);

  // Help requests
  const [helpRequests, setHelpRequests] = useState<HelpItem[]>([]);
  const [loadingHelp, setLoadingHelp] = useState(true);
  const [updatingHelpId, setUpdatingHelpId] = useState<string | null>(null);

  // Reports
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);

  // 1) Check role; require committee/admin
  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        setLoadingRole(false);
        router.replace("/");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        setLoadingRole(false);
        router.replace("/");
        return;
      }

      setRole(profile.role as Role);
      setLoadingRole(false);

      if (profile.role !== "committee" && profile.role !== "admin") {
        router.replace("/home");
      }
    })();
  }, [router]);

  // 2) Load all data

  async function loadQuestions() {
    setLoadingQuestions(true);
    const { data, error } = await supabase
      .from("questions")
      .select("id, title, body, published, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setQuestions(data as Question[]);
    setLoadingQuestions(false);
  }

  async function loadAnswers() {
    setLoadingAnswers(true);
    const { data, error } = await supabase
      .from("answers")
      .select("id, question_id, body, created_at")
      .order("created_at", { ascending: true });
    if (!error && data) setAnswers(data as Answer[]);
    setLoadingAnswers(false);
  }

  async function loadFeedback() {
    setLoadingFeedback(true);
    const { data, error } = await supabase
      .from("feedback")
      .select("id, text, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setFeedback(data as FeedbackItem[]);
    setLoadingFeedback(false);
  }

  async function loadHelpRequests() {
    setLoadingHelp(true);
    const { data, error } = await supabase
      .from("help_requests")
      .select("id, topic, details, status, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setHelpRequests(data as HelpItem[]);
    setLoadingHelp(false);
  }

  async function loadReports() {
    setLoadingReports(true);
    const { data, error } = await supabase
      .from("reports")
      .select("id, subject, details, status, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setReports(data as ReportItem[]);
    setLoadingReports(false);
  }

  useEffect(() => {
    loadQuestions();
    loadAnswers();
    loadFeedback();
    loadHelpRequests();
    loadReports();
  }, []);

  // 3) Mutations
  async function deleteAnswer(answerId: string) {
    const ok = confirm("Delete this response? This cannot be undone.");
    if (!ok) return;
  
    setAddingAnswerId(answerId); // reuse loading state lightly
    const { error } = await supabase
      .from("answers")
      .delete()
      .eq("id", answerId);
  
    setAddingAnswerId(null);
  
    if (error) {
      alert(error.message);
    } else {
      await loadAnswers();
    }
  }
  
  // publish/unpublish (without touching answers)
  async function togglePublish(q: Question, makePublished: boolean) {
    setUpdatingQuestionId(q.id);
    const { error } = await supabase
      .from("questions")
      .update({ published: makePublished })
      .eq("id", q.id);

    setUpdatingQuestionId(null);
    if (error) {
      alert(error.message);
    } else {
      await loadQuestions();
    }
  }

  // publish with answer (for unpublished questions)
  async function publishWithAnswer(q: Question, answerBody: string) {
    if (!answerBody.trim()) {
      alert("Please write a response before publishing.");
      return;
    }
    setAddingAnswerId(q.id);
  
    // get committee user id
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setAddingAnswerId(null);
      alert("You must be logged in as committee to publish.");
      return;
    }
  
    // 1) insert answer WITH user_id
    const { error: aError } = await supabase.from("answers").insert({
      question_id: q.id,
      user_id: uid,
      body: answerBody,
    });
  
    if (aError) {
      setAddingAnswerId(null);
      alert(aError.message);
      return;
    }
  
    // 2) mark question as published
    const { error: qError } = await supabase
      .from("questions")
      .update({ published: true })
      .eq("id", q.id);
  
    setAddingAnswerId(null);
  
    if (qError) {
      alert(qError.message);
    } else {
      await Promise.all([loadQuestions(), loadAnswers()]);
    }
  }
  
  async function addAnswer(q: Question, answerBody: string) {
    if (!answerBody.trim()) {
      alert("Please write a response before submitting.");
      return;
    }
    setAddingAnswerId(q.id);
  
    // get committee user id
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setAddingAnswerId(null);
      alert("You must be logged in as committee to respond.");
      return;
    }
  
    const { error } = await supabase.from("answers").insert({
      question_id: q.id,
      user_id: uid,
      body: answerBody,
    });
  
    setAddingAnswerId(null);
    if (error) {
      alert(error.message);
    } else {
      await loadAnswers();
    }
  }
  

  async function updateHelpStatus(item: HelpItem, status: string) {
    setUpdatingHelpId(item.id);
    const { error } = await supabase
      .from("help_requests")
      .update({ status })
      .eq("id", item.id);

    setUpdatingHelpId(null);
    if (error) {
      alert(error.message);
    } else {
      await loadHelpRequests();
    }
  }

  async function updateReportStatus(item: ReportItem, status: string) {
    setUpdatingReportId(item.id);
    const { error } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", item.id);

    setUpdatingReportId(null);
    if (error) {
      alert(error.message);
    } else {
      await loadReports();
    }
  }

  if (loadingRole) {
    return (
      <RequireAuth>
        <main className="max-w-4xl mx-auto mt-10">
          <div className="rounded-2xl border p-6 bg-white">
            <p className="text-gray-700">Checking permissions…</p>
          </div>
        </main>
      </RequireAuth>
    );
  }

  if (role !== "committee" && role !== "admin") {
    return (
      <RequireAuth>
        <main className="max-w-4xl mx-auto mt-10">
          <div className="rounded-2xl border p-6 bg-white">
            <p className="text-gray-700">You don&apos;t have access to this page.</p>
          </div>
        </main>
      </RequireAuth>
    );
  }

  const unpublished = questions.filter((q) => !q.published);
  const published = questions.filter((q) => q.published);

  return (
    <RequireAuth>
      <main className="max-w-4xl mx-auto mt-10 space-y-6">
        {/* Header */}
        <section className="rounded-2xl border p-6 bg-white">
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "#800000" }}
          >
            Committee Dashboard
          </h1>
          <p className="text-gray-700 text-sm">
            Central place for committee work: review questions, feedback, help requests,
            and reports while protecting student privacy.
          </p>
        </section>

        {/* Tabs */}
        <section className="rounded-2xl border bg-white">
          <div className="flex border-b border-gray-200">
            {(
              [
                { id: "questions", label: "Questions" },
                { id: "feedback", label: "Feedback" },
                { id: "help", label: "Help Requests" },
                { id: "reports", label: "Reports" },
              ] as { id: Tab; label: string }[]
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 ${
                    isActive
                      ? "border-[rgb(128,0,0)] text-black"
                      : "border-transparent text-gray-500 hover:text-black hover:bg-gray-50"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === "questions" && (
             <QuestionsTab
                unpublished={unpublished}
                published={published}
                answers={answers}
                loading={loadingQuestions || loadingAnswers}
                updatingId={updatingQuestionId}
                addingAnswerId={addingAnswerId}
                onTogglePublish={togglePublish}
                onPublishWithAnswer={publishWithAnswer}
                onAddAnswer={addAnswer}
                onDeleteAnswer={deleteAnswer}
           />
           
            )}

            {activeTab === "feedback" && (
              <FeedbackTab feedback={feedback} loading={loadingFeedback} />
            )}

            {activeTab === "help" && (
              <HelpTab
                items={helpRequests}
                loading={loadingHelp}
                updatingId={updatingHelpId}
                onUpdateStatus={updateHelpStatus}
              />
            )}

            {activeTab === "reports" && (
              <ReportsTab
                items={reports}
                loading={loadingReports}
                updatingId={updatingReportId}
                onUpdateStatus={updateReportStatus}
              />
            )}
          </div>
        </section>
      </main>
    </RequireAuth>
  );
}

/* ---- Subcomponents ---- */

function QuestionsTab({
    unpublished,
    published,
    answers,
    loading,
    updatingId,
    addingAnswerId,
    onTogglePublish,
    onPublishWithAnswer,
    onAddAnswer,
    onDeleteAnswer,
  }: {
    unpublished: Question[];
    published: Question[];
    answers: Answer[];
    loading: boolean;
    updatingId: string | null;
    addingAnswerId: string | null;
    onTogglePublish: (q: Question, makePublished: boolean) => void;
    onPublishWithAnswer: (q: Question, answerBody: string) => void;
    onAddAnswer: (q: Question, answerBody: string) => void;
    onDeleteAnswer: (answerId: string) => void;
  }) {
  
  // local answer inputs keyed by question id
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});

  function setDraft(id: string, value: string) {
    setAnswerDrafts((prev) => ({ ...prev, [id]: value }));
  }

  function getAnswersFor(qid: string) {
    return answers.filter((a) => a.question_id === qid);
  }

  return (
    <div className="space-y-6">
      {/* Unpublished */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-black">Unpublished Questions</h2>
          {loading && <span className="text-xs text-gray-500">Loading…</span>}
        </div>
        {unpublished.length === 0 && !loading ? (
          <p className="text-gray-600 text-sm">No unpublished questions right now.</p>
        ) : (
          <ul className="space-y-3">
            {unpublished.map((q) => (
              <li key={q.id} className="border rounded-xl p-4 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-black text-sm">
                      {q.title}
                    </h3>
                    <p className="mt-1 text-gray-700 text-sm whitespace-pre-wrap">
                      {q.body}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-700">
                    Private
                  </span>
                </div>

                {/* Answer draft + publish */}
                <div className="mt-3 space-y-2 border-t pt-2">
                  <label className="text-xs font-semibold text-gray-700">
                    Committee response (required to publish)
                  </label>
                  <textarea
                    value={answerDrafts[q.id] ?? ""}
                    onChange={(e) => setDraft(q.id, e.target.value)}
                    className="w-full border rounded-md px-2 py-1.5 text-xs"
                    placeholder="Write your response…"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(q.created_at).toLocaleString()}</span>
                    <button
                      onClick={() =>
                        onPublishWithAnswer(q, answerDrafts[q.id] ?? "")
                      }
                      disabled={addingAnswerId === q.id}
                      className="px-3 py-1.5 rounded-md text-white text-xs shadow-sm"
                      style={{ backgroundColor: "#800000" }} // maroon
                    >
                      {addingAnswerId === q.id
                        ? "Publishing…"
                        : "Publish with answer"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Published */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-black">Published Questions</h2>
        </div>
        {published.length === 0 && !loading ? (
          <p className="text-gray-600 text-sm">No published questions yet.</p>
        ) : (
          <ul className="space-y-3">
            {published.map((q) => {
              const qAnswers = getAnswersFor(q.id);
              return (
                <li key={q.id} className="border rounded-xl p-4 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-black text-sm">
                        {q.title}
                      </h3>
                      <p className="mt-1 text-gray-700 text-sm whitespace-pre-wrap">
                        {q.body}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-green-50 text-green-700 border border-green-200">
                      Published
                    </span>
                  </div>

                  {/* Existing answers */}
                  {qAnswers.length > 0 && (
                    <div className="mt-3 border-t pt-2 space-y-1">
                      <div className="text-xs font-semibold text-gray-700">
                        Committee responses
                      </div>
                      {qAnswers.map((a) => (
                        <div key={a.id} className="text-xs text-gray-800 whitespace-pre-wrap">
                            <div className="flex items-start justify-between gap-2">
                            <div>
                                {a.body}
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                {new Date(a.created_at).toLocaleString()}
                                </div>
                            </div>

                            <button
                                onClick={() => onDeleteAnswer(a.id)}
                                disabled={addingAnswerId === a.id}
                                className="text-[10px] px-2 py-1 rounded-md border hover:bg-gray-50"
                                style={{ borderColor: "#800000", color: "#800000" }}
                            >
                                {addingAnswerId === a.id ? "Deleting…" : "Delete"}
                            </button>
                            </div>
                        </div>
                    ))}
                    </div>
                  )}

                  {/* Add another answer */}
                  <div className="mt-3 space-y-2 border-t pt-2">
                    <label className="text-xs font-semibold text-gray-700">
                      Add another response (optional)
                    </label>
                    <textarea
                      value={answerDrafts[q.id] ?? ""}
                      onChange={(e) => setDraft(q.id, e.target.value)}
                      className="w-full border rounded-md px-2 py-1.5 text-xs"
                      placeholder="Write a follow-up response…"
                    />
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>{new Date(q.created_at).toLocaleString()}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onAddAnswer(q, answerDrafts[q.id] ?? "")}
                          disabled={addingAnswerId === q.id}
                          className="px-3 py-1.5 rounded-md text-white text-xs shadow-sm"
                          style={{ backgroundColor: "#800000" }} // maroon
                        >
                          {addingAnswerId === q.id ? "Saving…" : "Add answer"}
                        </button>
                        <button
                          onClick={() => onTogglePublish(q, false)}
                          disabled={updatingId === q.id}
                          className="px-3 py-1.5 rounded-md text-xs border"
                          style={{
                            borderColor: "#800000",
                            color: "#800000",
                          }}
                        >
                          {updatingId === q.id ? "Updating…" : "Unpublish"}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function FeedbackTab({
  feedback,
  loading,
}: {
  feedback: FeedbackItem[];
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-black mb-1">All Feedback</h2>
      <p className="text-gray-700 text-sm">
        These entries include suggestions, concerns, or reflections shared by students.
        They are never public; only committee and admins can see this list.
      </p>
      {loading ? (
        <p className="text-gray-600 text-sm">Loading…</p>
      ) : feedback.length === 0 ? (
        <p className="text-gray-600 text-sm">No feedback has been submitted yet.</p>
      ) : (
        <ul className="space-y-3">
          {feedback.map((f) => (
            <li key={f.id} className="border rounded-xl p-4 bg-white">
              <p className="text-gray-800 text-sm whitespace-pre-wrap">{f.text}</p>
              <div className="mt-2 text-[11px] text-gray-500">
                {new Date(f.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HelpTab({
  items,
  loading,
  updatingId,
  onUpdateStatus,
}: {
  items: HelpItem[];
  loading: boolean;
  updatingId: string | null;
  onUpdateStatus: (item: HelpItem, status: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-black mb-1">Help Requests</h2>
      <p className="text-gray-700 text-sm">
        These are confidential help requests from students. Use the status to track follow-up.
      </p>
      {loading ? (
        <p className="text-gray-600 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-600 text-sm">No help requests yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((h) => (
            <li key={h.id} className="border rounded-xl p-4 bg-white">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    {h.topic.replace("_", " ")}
                  </div>
                  <p className="mt-1 text-gray-800 text-sm whitespace-pre-wrap">
                    {h.details}
                  </p>
                </div>
                <select
                  value={h.status}
                  onChange={(e) => onUpdateStatus(h, e.target.value)}
                  disabled={updatingId === h.id}
                  className="border rounded-md px-2 py-1 text-xs"
                  style={{ borderColor: "#800000" }}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="mt-2 text-[11px] text-gray-500">
                {new Date(h.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReportsTab({
  items,
  loading,
  updatingId,
  onUpdateStatus,
}: {
  items: ReportItem[];
  loading: boolean;
  updatingId: string | null;
  onUpdateStatus: (item: ReportItem, status: string) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-black mb-1">Reports</h2>
      <p className="text-gray-700 text-sm">
        Formal reports submitted by students. Adjust the status as cases are reviewed
        and resolved.
      </p>
      {loading ? (
        <p className="text-gray-600 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-gray-600 text-sm">No reports have been submitted yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="border rounded-xl p-4 bg-white">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-black text-sm">{r.subject}</h3>
                  <p className="mt-1 text-gray-800 text-sm whitespace-pre-wrap">
                    {r.details}
                  </p>
                </div>
                <select
                  value={r.status}
                  onChange={(e) => onUpdateStatus(r, e.target.value)}
                  disabled={updatingId === r.id}
                  className="border rounded-md px-2 py-1 text-xs"
                  style={{ borderColor: "#800000" }}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In progress</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="mt-2 text-[11px] text-gray-500">
                {new Date(r.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
