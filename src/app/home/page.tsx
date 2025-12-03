export default function HomeSection() {
    return (
      <main className="max-w-4xl mx-auto mt-10 space-y-6">
        <section className="rounded-2xl border p-6">
          <h2 className="text-2xl font-semibold mb-2" style={{ color: "#800000" }}>
            Mission Statement
          </h2>
          <p className="text-gray-700">
            We foster a culture of trust at EHS by educating, supporting, and guiding our community
            to live the Honor Code in daily life.
          </p>
        </section>
        <section className="rounded-2xl border p-6">
          <h3 className="text-xl font-semibold mb-2">Quick Links</h3>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li><a className="underline" href="/rules">Clear Rules</a></li>
            <li><a className="underline" href="/caseStudies">Case Studies</a></li>
            <li><a className="underline" href="/qna">Q&amp;A</a></li>
            <li><a className="underline" href="/feedback">Feedback</a></li>
            <li><a className="underline" href="/getHelp">Get Help</a></li>
            <li><a className="underline" href="/resources">Resources</a></li>
            <li><a className="underline" href="/report">Reports</a></li>
          </ul>
        </section>
      </main>
    );
  }
  