"use client";
import RequireAuth from "@/components/RequireAuth";

export default function RulesPage() {
  return (
    <RequireAuth>
      <main className="max-w-3xl mx-auto mt-10 rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: "#800000" }}>
          Clear Rules
        </h1>
        <p className="text-gray-700">
          We’ll outline definitions, examples, and consequences here.
        </p>
      </main>
    </RequireAuth>
  );
}
