// app/page.js
export default function Home() {
  var agents = [
    { ic: "\u{1F6E1}\uFE0F", h: "Compliance Agent", p: "Upload a vendor submittal. Get a cited deviation report in seconds, before the unit is ordered.", href: "/compliance", tag: "built" },
    { ic: "\u{1F4AC}", h: "RFI Assistant", p: "Ask any project question. Grounded, cited answers, with prior resolved RFIs surfaced.", href: "/rfi", tag: "built" },
    { ic: "\u{1F4C8}", h: "Schedule Risk", p: "Explainable critical-path risk flags from procurement, lead time, float and workforce.", href: "/schedule", tag: "built" },
    { ic: "\u{1F30D}", h: "Supply Chain", p: "Live geospatial tracking of critical equipment shipments with per-shipment risk scoring.", href: "/supplychain", tag: "live" },
    { ic: "\u2705", h: "Commissioning QA", p: "Walk TIA-942 test steps, validate against acceptance criteria, build the test record.", href: "/commissioning", tag: "built" }
  ];
  return (
    <div className="container">
      <div className="hero">
        <div className="eyebrow">ET AI Hackathon 2026 // Problem Statement 4</div>
        <h1>The Project Intelligence Brain for Data Centre EPC Delivery</h1>
        <p>
          One live intelligence layer over specifications, submittals, RFIs, schedules and shipments.
          Deviations are caught before they reach site, not after.
        </p>
        <div className="metrics">
          <div className="metric"><div className="v">5</div><div className="k">AI agents</div></div>
          <div className="metric"><div className="v">&lt;10s</div><div className="k">submittal to verdict</div></div>
          <div className="metric"><div className="v">100%</div><div className="k">cited evidence</div></div>
          <div className="metric"><div className="v">0.65</div><div className="k">strict-mode threshold</div></div>
        </div>
      </div>

      <div className="note" style={{ marginBottom: 22 }}>
        First time here? Open <b>Health</b> to confirm Gemini and Pinecone are connected, then click
        <b> Seed demo data</b> to load the sample project. After that, every agent is live.
      </div>

      <div className="agent-grid">
        {agents.map(function (a) {
          return (
            <a key={a.href} href={a.href} className="agent-card">
              <div className="ic">{a.ic}</div>
              <h3>{a.h}</h3>
              <p>{a.p}</p>
              <span className={a.tag === "live" ? "tag-live" : "tag-built"}>
                {a.tag === "live" ? "\u25C9 LIVE GEOSPATIAL" : "\u25C9 OPERATIONAL"}
              </span>
            </a>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="eyebrow">Architecture</div>
        <p className="sub" style={{ marginBottom: 0 }}>
          Four layers: ingestion, intelligence, agents, experience. The intelligence layer pairs a Pinecone
          index (namespaced per project) with Gemini under a strict-mode retrieval contract: a verdict is
          asserted only when the similarity score clears 0.65 and at least two strong chunks support it,
          otherwise it routes to human review. That is what makes the output admissible into a formal
          quality audit trail.
        </p>
      </div>
    </div>
  );
}
