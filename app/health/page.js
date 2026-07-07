// app/health/page.js
"use client";
import { useState } from "react";

function Check(props) {
  var c = props.data;
  var ok = c && c.ok;
  return (
    <tr>
      <td><b>{props.name}</b></td>
      <td><span className={"pill " + (ok ? "green" : "red")}>{ok ? "OK" : "Problem"}</span></td>
      <td className="muted">{props.detail}</td>
    </tr>
  );
}

export default function HealthPage() {
  var sHealth = useState(null);
  var health = sHealth[0];
  var setHealth = sHealth[1];

  var sSeed = useState("");
  var seedMsg = sSeed[0];
  var setSeedMsg = sSeed[1];

  var sBusy = useState(false);
  var busy = sBusy[0];
  var setBusy = sBusy[1];

  function runHealth() {
    setBusy(true);
    setHealth(null);
    fetch("/api/health").then(function (r) { return r.json(); }).then(function (d) {
      setBusy(false); setHealth(d);
    }).catch(function (e) { setBusy(false); setHealth({ ok: false, checks: {}, error: String(e) }); });
  }

  function runSeed() {
    setBusy(true);
    setSeedMsg("Seeding...");
    fetch("/api/ingest", { method: "POST" }).then(function (r) { return r.json(); }).then(function (d) {
      setBusy(false);
      if (d.ok) { setSeedMsg("Seeded " + d.upserted + " documents into namespace '" + d.namespace + "'."); }
      else { setSeedMsg("Seed failed: " + (d.error || "unknown")); }
    }).catch(function (e) { setBusy(false); setSeedMsg("Seed failed: " + String(e)); });
  }

  var g = health ? health.checks.geminiKeys : null;
  var ge = health ? health.checks.geminiEmbed : null;
  var pc = health ? health.checks.pinecone : null;

  return (
    <div className="container">
      <h1 className="h1">Health Check &amp; Setup</h1>
      <p className="sub">
        Confirm that Gemini and Pinecone are connected, then seed the demo project into the index. Do this
        once after deploying (or whenever you change environment variables).
      </p>

      <div className="card">
        <div className="row">
          <button className="btn" onClick={runHealth} disabled={busy}>Run health check</button>
          <button className="btn gold" onClick={runSeed} disabled={busy}>Seed demo data</button>
        </div>
        {seedMsg ? <div className="note" style={{ marginTop: 12 }}>{seedMsg}</div> : null}
      </div>

      {health ? (
        <div className="card">
          <div style={{ marginBottom: 10 }}>
            Overall: <span className={"pill " + (health.ok ? "green" : "red")}>{health.ok ? "All systems go" : "Needs attention"}</span>
          </div>
          <table>
            <thead><tr><th>Service</th><th>Status</th><th>Detail</th></tr></thead>
            <tbody>
              <Check name="Gemini API keys" data={g} detail={g ? (g.ok ? (g.count + " key(s), model " + g.model) : (g.error || "no keys")) : ""} />
              <Check name="Gemini embeddings" data={ge} detail={ge ? (ge.ok ? ("dimension " + ge.dimension) : (ge.error || "")) : ""} />
              <Check name="Pinecone index" data={pc} detail={pc ? (pc.ok ? ("index '" + pc.index + "', " + pc.matchesSeen + " match(es) seen") : (pc.error || "")) : ""} />
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="card">
        <b style={{ color: "#0B1F3A" }}>Environment variables you need (set these in Vercel):</b>
        <table style={{ marginTop: 10 }}>
          <thead><tr><th>Variable</th><th>What it is</th></tr></thead>
          <tbody>
            <tr><td><code>GEMINI_API_KEY_1</code> ... <code>_8</code></td><td className="muted">One or more Gemini API keys (rotation). A single <code>GEMINI_API_KEY</code> also works.</td></tr>
            <tr><td><code>PINECONE_API_KEY</code></td><td className="muted">Your Pinecone API key.</td></tr>
            <tr><td><code>PINECONE_INDEX</code></td><td className="muted">Index name (default <code>dc-sentinel</code>). Must be a 768-dim index for text-embedding-004.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
