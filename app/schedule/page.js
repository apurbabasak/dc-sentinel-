// app/schedule/page.js
"use client";
import { useState, useEffect } from "react";

export default function SchedulePage() {
  var sRes = useState(null);
  var res = sRes[0];
  var setRes = sRes[1];

  var sLoading = useState(true);
  var loading = sLoading[0];
  var setLoading = sLoading[1];

  var sErr = useState("");
  var err = sErr[0];
  var setErr = sErr[1];

  useEffect(function () {
    fetch("/api/schedule").then(function (r) { return r.json(); }).then(function (d) {
      setLoading(false);
      if (d.ok) { setRes(d.result); } else { setErr(d.error || "Error"); }
    }).catch(function (e) { setLoading(false); setErr(String(e)); });
  }, []);

  return (
    <div className="container">
      <h1 className="h1">Predictive Schedule Risk Agent</h1>
      <p className="sub">
        Explainable, rule-based critical-path risk. Each activity is scored on four transparent signals &mdash;
        procurement status, lead time vs need-by, remaining float, and workforce availability &mdash; then
        flagged green, amber or red with a plain-language reason a project manager can defend.
      </p>

      {loading ? <div className="card">Loading schedule...</div> : null}
      {err ? <div className="card" style={{ color: "#B33A3A" }}>{err}</div> : null}

      {res ? (
        <div>
          <div className="card">
            <div className="stat-row">
              <div className="stat"><div className="n">{res.summary.total}</div><div className="l">Activities</div></div>
              <div className="stat"><div className="n" style={{ color: "#B33A3A" }}>{res.summary.red}</div><div className="l">Red</div></div>
              <div className="stat"><div className="n" style={{ color: "#B8860B" }}>{res.summary.amber}</div><div className="l">Amber</div></div>
              <div className="stat"><div className="n" style={{ color: "#2E7D32" }}>{res.summary.green}</div><div className="l">Green</div></div>
            </div>
            <p className="muted">
              Score weights &mdash; procurement {res.weights.procurement}, lead time {res.weights.leadTime}, float {res.weights.float}, workforce {res.weights.workforce}.
            </p>
          </div>

          <div className="card">
            <table>
              <thead>
                <tr><th>Activity</th><th>Critical path</th><th>Risk</th><th>Score</th><th>Why</th></tr>
              </thead>
              <tbody>
                {res.activities.map(function (a) {
                  return (
                    <tr key={a.id}>
                      <td><b>{a.name}</b><br /><span className="muted">{a.id}</span></td>
                      <td>{a.onCriticalPath ? "Yes" : "No"}</td>
                      <td><span className={"pill " + a.band}>{a.band}</span></td>
                      <td><b>{a.score}</b></td>
                      <td>{a.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
