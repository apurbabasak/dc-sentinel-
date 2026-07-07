// app/compliance/page.js
"use client";
import { useState, useEffect } from "react";

function StatusPill(props) {
  var s = props.status;
  var cls = "grey";
  if (s === "Compliant") { cls = "green"; }
  if (s === "Deviation") { cls = "red"; }
  if (s === "Needs Review") { cls = "amber"; }
  return <span className={"pill " + cls}>{s}</span>;
}

export default function CompliancePage() {
  var stateText = useState("");
  var text = stateText[0];
  var setText = stateText[1];

  var stateSamples = useState([]);
  var samples = stateSamples[0];
  var setSamples = stateSamples[1];

  var stateLoading = useState(false);
  var loading = stateLoading[0];
  var setLoading = stateLoading[1];

  var stateReport = useState(null);
  var report = stateReport[0];
  var setReport = stateReport[1];

  var stateErr = useState("");
  var err = stateErr[0];
  var setErr = stateErr[1];

  useEffect(function () {
    fetch("/api/samples").then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.submittals) { setSamples(d.submittals); }
    }).catch(function () {});
  }, []);

  function run() {
    setErr("");
    setReport(null);
    setLoading(true);
    fetch("/api/compliance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submittalText: text })
    }).then(function (r) { return r.json(); }).then(function (d) {
      setLoading(false);
      if (d.ok) { setReport(d.report); } else { setErr(d.error || "Something went wrong."); }
    }).catch(function (e) {
      setLoading(false);
      setErr(String(e));
    });
  }

  return (
    <div className="container">
      <h1 className="h1">Specification &amp; Quality Compliance Agent</h1>
      <p className="sub">
        Paste a vendor submittal (or load a sample). The agent extracts the technical parameters, retrieves
        the governing specification clause under strict mode, and reports each parameter as Compliant,
        Deviation, or Needs Review &mdash; with a cited clause.
      </p>

      <div className="card">
        <label className="label">Vendor submittal text</label>
        <textarea value={text} onChange={function (e) { setText(e.target.value); }}
          placeholder="Paste submittal text here, or load a sample below." />
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" onClick={run} disabled={loading || text.trim().length === 0}>
            {loading ? "Checking..." : "Check compliance"}
          </button>
          {samples.map(function (s) {
            return (
              <button key={s.id} className="btn ghost" onClick={function () { setText(s.text); setReport(null); }}>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {err ? <div className="card" style={{ color: "#B33A3A" }}>{err}</div> : null}

      {report ? (
        <div className="card">
          <div className="stat-row">
            <div className="stat"><div className="n">{report.summary.total}</div><div className="l">Parameters</div></div>
            <div className="stat"><div className="n" style={{ color: "#2E7D32" }}>{report.summary.compliant}</div><div className="l">Compliant</div></div>
            <div className="stat"><div className="n" style={{ color: "#B33A3A" }}>{report.summary.deviations}</div><div className="l">Deviations</div></div>
            <div className="stat"><div className="n" style={{ color: "#B8860B" }}>{report.summary.needsReview}</div><div className="l">Needs review</div></div>
          </div>
          <p className="muted">Equipment tag: <b>{report.equipmentTag || "n/a"}</b> &nbsp;|&nbsp; Type: <b>{report.equipmentType || "n/a"}</b></p>

          <table>
            <thead>
              <tr><th>Parameter</th><th>Submitted</th><th>Required</th><th>Status</th><th>Explanation &amp; citation</th></tr>
            </thead>
            <tbody>
              {report.results.map(function (r, i) {
                return (
                  <tr key={i}>
                    <td><b>{r.name}</b></td>
                    <td>{r.submittedValue}</td>
                    <td>{r.requiredValue || "-"}</td>
                    <td><StatusPill status={r.status} /></td>
                    <td>
                      {r.explanation}
                      {r.citations && r.citations.length > 0 ? (
                        <div className="cite">
                          <b>{r.citations[0].source}</b>{r.citations[0].clause ? " (" + r.citations[0].clause + ")" : ""} &mdash; score {r.citations[0].score}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
