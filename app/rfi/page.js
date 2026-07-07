// app/rfi/page.js
"use client";
import { useState } from "react";

var SAMPLE_QUESTIONS = [
  "What is the required minimum UPS efficiency?",
  "What supply air temperature range must the cooling maintain?",
  "What is the chilled water supply setpoint?",
  "What fire suppression is required for electrical rooms?"
];

export default function RfiPage() {
  var sQ = useState("");
  var q = sQ[0];
  var setQ = sQ[1];

  var sLoading = useState(false);
  var loading = sLoading[0];
  var setLoading = sLoading[1];

  var sRes = useState(null);
  var res = sRes[0];
  var setRes = sRes[1];

  var sErr = useState("");
  var err = sErr[0];
  var setErr = sErr[1];

  function ask(question) {
    var text = question || q;
    if (text.trim().length === 0) { return; }
    setErr("");
    setRes(null);
    setLoading(true);
    fetch("/api/rfi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text })
    }).then(function (r) { return r.json(); }).then(function (d) {
      setLoading(false);
      if (d.ok) { setRes(d.result); } else { setErr(d.error || "Something went wrong."); }
    }).catch(function (e) { setLoading(false); setErr(String(e)); });
  }

  return (
    <div className="container">
      <h1 className="h1">Project Knowledge &amp; RFI Assistant</h1>
      <p className="sub">
        Ask any question about the project. Answers are grounded only in the project documents under the
        strict-mode contract, always cited, and any prior resolved RFI on the topic is surfaced to cut rework.
      </p>

      <div className="card">
        <label className="label">Your question</label>
        <input value={q} onChange={function (e) { setQ(e.target.value); }}
          placeholder="e.g. What is the required minimum UPS efficiency?" />
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" onClick={function () { ask(); }} disabled={loading || q.trim().length === 0}>
            {loading ? "Thinking..." : "Ask"}
          </button>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          {SAMPLE_QUESTIONS.map(function (s, i) {
            return (
              <button key={i} className="btn ghost" onClick={function () { setQ(s); ask(s); }}>{s}</button>
            );
          })}
        </div>
      </div>

      {err ? <div className="card" style={{ color: "#B33A3A" }}>{err}</div> : null}

      {res ? (
        <div className="card">
          {res.grounded ? null : <div className="note" style={{ marginBottom: 12 }}>No confident answer found &mdash; routed to a formal RFI rather than guessed.</div>}
          <p style={{ fontSize: 15, lineHeight: 1.55, color: "#1B1B1B" }}>{res.answer}</p>

          {res.priorRfi ? (
            <div className="cite" style={{ background: "#FBF0D8", color: "#7a5a00" }}>
              <b>Prior resolved RFI found:</b> {res.priorRfi.source} &mdash; {res.priorRfi.snippet}
            </div>
          ) : null}

          {res.citations && res.citations.length > 0 ? (
            <div style={{ marginTop: 10 }}>
              <div className="label">Sources</div>
              {res.citations.map(function (c, i) {
                return (
                  <div key={i} className="cite">
                    <b>{c.source}</b>{c.clause ? " (" + c.clause + ")" : ""} &mdash; score {c.score}<br />
                    {c.snippet}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
