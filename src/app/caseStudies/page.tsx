"use client";
import RequireAuth from "@/components/RequireAuth";

export default function CaseStudiesPage() {
  return (
    <RequireAuth>
      <main className="max-w-3xl mx-auto mt-10 rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: "#800000" }}>Case Studies</h1>
        <p className="text-gray-700">Realistic scenarios to learn how the Honor Code applies.</p>
      </main>
    </RequireAuth>
  );
}
