// app/commissioning/page.js
"use client";
import { useState, useEffect } from "react";

export default function CommissioningPage() {
  var sTests = useState([]);
  var tests = sTests[0];
  var setTests = sTests[1];

  var sMeasured = useState({});
  var measured = sMeasured[0];
  var setMeasured = sMeasured[1];

  var sRecord = useState(null);
  var record = sRecord[0];
  var setRecord = sRecord[1];

  var sLoading = useState(false);
  var loading = sLoading[0];
  var setLoading = sLoading[1];

  useEffect(function () {
    fetch("/api/commissioning").then(function (r) { return r.json(); }).then(function (d) {
      if (d.ok) { setTests(d.tests); }
    }).catch(function () {});
  }, []);

  function setVal(id, v) {
    var next = Object.assign({}, measured);
    next[id] = v;
    setMeasured(next);
  }

  function prefill() {
    // A realistic set of measured values: some pass, some fail, for the demo.
    setMeasured({ "C-01": "8", "C-02": "94", "C-03": "0.8", "C-04": "22", "C-05": "26", "C-06": "0.7", "C-07": "yes", "C-08": "yes" });
  }

  function build() {
    setLoading(true);
    fetch("/api/commissioning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ measured: measured })
    }).then(function (r) { return r.json(); }).then(function (d) {
      setLoading(false);
      if (d.ok) { setRecord(d.record); }
    }).catch(function () { setLoading(false); });
  }

  return (
    <div className="container">
      <h1 className="h1">Commissioning QA Copilot</h1>
      <p className="sub">
        Walk the integrated system test sequence from TIA-942 / Uptime Tier acceptance criteria. Enter each
        measured value; the copilot validates it against the criterion and assembles a structured
        commissioning test record.
      </p>

      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <button className="btn ghost" onClick={prefill}>Prefill demo values</button>
          <button className="btn" onClick={build} disabled={loading}>{loading ? "Validating..." : "Build test record"}</button>
        </div>
        <div className="tablewrap"><table>
          <thead>
            <tr><th>Test</th><th>System</th><th>Standard</th><th>Measured value</th></tr>
          </thead>
          <tbody>
            {tests.map(function (t) {
              return (
                <tr key={t.id}>
                  <td><b>{t.name}</b><br /><span className="muted">{t.id}</span></td>
                  <td>{t.system}</td>
                  <td className="muted">{t.standard}</td>
                  <td>
                    <input value={measured[t.id] || ""} onChange={function (e) { setVal(t.id, e.target.value); }}
                      placeholder="value" style={{ maxWidth: 160 }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>

      {record ? (
        <div className="card">
          <div className="stat-row">
            <div className="stat"><div className="n">{record.summary.total}</div><div className="l">Tests</div></div>
            <div className="stat"><div className="n" style={{ color: "#2E7D32" }}>{record.summary.passed}</div><div className="l">Pass</div></div>
            <div className="stat"><div className="n" style={{ color: "#B33A3A" }}>{record.summary.failed}</div><div className="l">Fail</div></div>
            <div className="stat"><div className="n" style={{ color: "#8A8A8A" }}>{record.summary.pending}</div><div className="l">Pending</div></div>
          </div>
          <div className="tablewrap"><table>
            <thead>
              <tr><th>Test</th><th>Measured</th><th>Requirement</th><th>Status</th></tr>
            </thead>
            <tbody>
              {record.rows.map(function (r) {
                var cls = r.status === "Pass" ? "green" : (r.status === "Fail" ? "red" : "grey");
                return (
                  <tr key={r.id}>
                    <td><b>{r.name}</b><br /><span className="muted">{r.system} &middot; {r.standard}</span></td>
                    <td>{r.measured || "-"}</td>
                    <td className="muted">{r.requirement}</td>
                    <td><span className={"pill " + cls}>{r.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
      ) : null}
    </div>
  );
}
