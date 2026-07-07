// app/page.js
export default function Home() {
  return (
    <div className="container">
      <h1 className="h1">DC-Sentinel</h1>
      <p className="sub">
        The Project Intelligence Brain for Data Centre EPC Delivery. One living intelligence layer over
        specifications, submittals, RFIs, schedules and test records &mdash; so deviations are caught before
        they reach site, not after.
      </p>

      <div className="note" style={{ marginBottom: 20 }}>
        First time here? Go to <b>Health Check</b> to confirm Gemini and Pinecone are connected, then click
        <b> Seed demo data</b> there to load the sample project into the index. After that, every agent below is live.
      </div>

      <div className="hero-grid">
        <div className="hero-card">
          <h3>Compliance Agent</h3>
          <p>Upload a vendor submittal. Get a cited deviation report in seconds &mdash; before the unit is ordered.</p>
          <a className="btn" href="/compliance">Open</a>
        </div>
        <div className="hero-card">
          <h3>RFI Assistant</h3>
          <p>Ask any question about the project. Grounded, cited answers, with prior resolved RFIs surfaced.</p>
          <a className="btn" href="/rfi">Open</a>
        </div>
        <div className="hero-card">
          <h3>Schedule Risk</h3>
          <p>Explainable critical-path risk flags from procurement, lead time, float and workforce.</p>
          <a className="btn" href="/schedule">Open</a>
        </div>
        <div className="hero-card">
          <h3>Commissioning QA</h3>
          <p>Walk TIA-942 test steps, validate each against acceptance criteria, build the test record.</p>
          <a className="btn" href="/commissioning">Open</a>
        </div>
      </div>

      <div className="card" style={{ marginTop: 22 }}>
        <b style={{ color: "#0B1F3A" }}>How it is built.</b>
        <p className="sub" style={{ marginTop: 8, marginBottom: 0 }}>
          Four layers &mdash; ingestion, intelligence, agents, experience. The intelligence layer pairs a
          Pinecone index (namespaced per project) with Gemini 2.5 Flash under a strict-mode retrieval
          contract: a verdict is asserted only when the similarity score clears 0.65 and at least two strong
          chunks support it, otherwise the answer is routed to human review. That is what makes the output
          admissible into a formal quality audit trail.
        </p>
      </div>
    </div>
  );
}
