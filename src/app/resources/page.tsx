"use client";
import RequireAuth from "@/components/RequireAuth";

export default function ResourcesPage() {
  return (
    <RequireAuth>
      <main className="max-w-3xl mx-auto mt-10 rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: "#800000" }}>Resources</h1>
        <ul className="list-disc pl-6 text-gray-700 space-y-1">
          <li>Honor Code handbook (PDF)</li>
          <li>Advisor contacts</li>
          <li>Wellness & counseling</li>
        </ul>
      </main>
    </RequireAuth>
  );
}
