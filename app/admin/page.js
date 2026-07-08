// app/admin/page.js
// Admin / Data portal. Org admins enter the details the agents use:
// projects, specifications, suppliers, shipments, inventory.
// Data is stored per-org (Firestore when signed in, session in demo mode).
// Includes an AI helper that extracts shipment fields from pasted tracking text.
"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../authContext";
import { listItems, addItem, deleteItem } from "../../lib/orgStore";

var TABS = [
  { key: "projects", label: "Projects" },
  { key: "specs", label: "Specifications" },
  { key: "suppliers", label: "Suppliers" },
  { key: "shipments", label: "Shipments" },
  { key: "inventory", label: "Inventory" }
];

// Field definitions per collection: [name, label, placeholder, type]
var FIELDS = {
  projects: [
    ["name", "Project name", "Mumbai DC-1", "text"],
    ["tier", "Tier target", "Tier III", "text"],
    ["capacityMW", "Capacity (MW)", "30", "text"],
    ["location", "Location", "Mumbai, India", "text"]
  ],
  specs: [
    ["source", "Document", "Electrical Spec E-201", "text"],
    ["clause", "Clause", "3.2.4", "text"],
    ["requirement", "Requirement text", "UPS efficiency shall be >= 96% at 50% load", "textarea"]
  ],
  suppliers: [
    ["name", "Supplier name", "PowerGuard Systems", "text"],
    ["category", "Category", "UPS / Power", "text"],
    ["country", "Country", "China", "text"],
    ["contact", "Contact", "sales@powerguard.com", "text"]
  ],
  shipments: [
    ["equipment", "Equipment", "UPS Systems (500 kVA x4)", "text"],
    ["tag", "Equipment tag", "UPS-01..04", "text"],
    ["origin", "Origin", "Shanghai, China", "text"],
    ["destination", "Destination", "Mumbai, India", "text"],
    ["status", "Status", "in_transit", "status"],
    ["etaDays", "ETA (days)", "9", "text"],
    ["bufferDays", "Buffer (days)", "4", "text"],
    ["criticality", "Criticality", "critical", "criticality"]
  ],
  inventory: [
    ["item", "Item", "Battery module 12V 100Ah", "text"],
    ["sku", "SKU / part no.", "BM-12100", "text"],
    ["quantity", "Quantity", "240", "text"],
    ["location", "Store location", "Warehouse A", "text"]
  ]
};

var STATUS_OPTS = ["not_shipped", "in_transit", "customs", "delayed", "arrived"];
var CRIT_OPTS = ["critical", "high", "medium", "low"];

export default function AdminPage() {
  var auth = useAuth();
  var sTab = useState("shipments"); var tab = sTab[0]; var setTab = sTab[1];
  var sItems = useState([]); var items = sItems[0]; var setItems = sItems[1];
  var sForm = useState({}); var form = sForm[0]; var setForm = sForm[1];
  var sBusy = useState(false); var busy = sBusy[0]; var setBusy = sBusy[1];
  var sMsg = useState(""); var msg = sMsg[0]; var setMsg = sMsg[1];

  // AI extraction state
  var sTrack = useState(""); var track = sTrack[0]; var setTrack = sTrack[1];
  var sExtracting = useState(false); var extracting = sExtracting[0]; var setExtracting = sExtracting[1];

  var ns = auth.org ? auth.org.namespace : "demo-project";

  function refresh() {
    listItems(auth.mode, ns, tab).then(function (r) { setItems(r); });
  }

  useEffect(function () { refresh(); setForm({}); setMsg(""); }, [tab, ns]);

  function setField(k, v) {
    var next = Object.assign({}, form); next[k] = v; setForm(next);
  }

  function submit() {
    var required = FIELDS[tab][0][0];
    if (!form[required]) { setMsg("Please fill in " + FIELDS[tab][0][1] + "."); return; }
    setBusy(true);
    addItem(auth.mode, ns, tab, form).then(function () {
      setBusy(false); setForm({}); setMsg("Saved."); refresh();
    });
  }

  function remove(id) {
    deleteItem(auth.mode, ns, tab, id).then(refresh);
  }

  function extract() {
    if (!track.trim()) { return; }
    setExtracting(true); setMsg("");
    fetch("/api/extract-shipment", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: track })
    }).then(function (r) { return r.json(); }).then(function (d) {
      setExtracting(false);
      if (d.ok) {
        var s = d.shipment;
        setForm(Object.assign({}, form, {
          equipment: s.equipment || "", origin: s.origin || "", destination: s.destination || "",
          status: s.status || "in_transit", etaDays: String(s.etaDays || "")
        }));
        setMsg("Extracted from tracking text. Review and save.");
      } else { setMsg("Extraction failed: " + (d.error || "unknown")); }
    }).catch(function (e) { setExtracting(false); setMsg("Extraction failed."); });
  }

  return (
    <div className="container">
      <div className="eyebrow">Admin</div>
      <h1 className="h1">Data Portal</h1>
      <p className="sub">
        Enter the project details the agents assess. Everything here is scoped to
        <b> {auth.org ? auth.org.name : "your organization"}</b>. The demo project remains available via the
        Health page seed button.
      </p>

      <div className="row" style={{ marginBottom: 18 }}>
        {TABS.map(function (t) {
          return (
            <button key={t.key} className="btn ghost" style={{ opacity: tab === t.key ? 1 : 0.5 }}
              onClick={function () { setTab(t.key); }}>{t.label}</button>
          );
        })}
      </div>

      {tab === "shipments" ? (
        <div className="card">
          <div className="label">AI assist &mdash; paste tracking text</div>
          <p className="muted" style={{ marginBottom: 10 }}>
            Paste a shipment notice or tracking-page text; the AI extracts the fields below for you to review.
          </p>
          <textarea value={track} onChange={function (e) { setTrack(e.target.value); }}
            placeholder="e.g. Maersk B/L 123: 40ft container, UPS units, ex Shanghai to Mumbai, vessel departed, ETA 9 days, currently in transit off Colombo." style={{ minHeight: 90 }} />
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" onClick={extract} disabled={extracting || !track.trim()}>
              {extracting ? "Extracting..." : "Extract with AI"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="card">
        <div className="label">Add {TABS.find(function (t) { return t.key === tab; }).label.toLowerCase()}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
          {FIELDS[tab].map(function (f) {
            var nameKey = f[0], label = f[1], ph = f[2], type = f[3];
            return (
              <div key={nameKey}>
                <label className="label">{label}</label>
                {type === "textarea" ? (
                  <textarea value={form[nameKey] || ""} onChange={function (e) { setField(nameKey, e.target.value); }} placeholder={ph} style={{ minHeight: 70 }} />
                ) : type === "status" ? (
                  <select value={form[nameKey] || ""} onChange={function (e) { setField(nameKey, e.target.value); }}>
                    <option value="">Select...</option>
                    {STATUS_OPTS.map(function (o) { return <option key={o} value={o}>{o.replace("_", " ")}</option>; })}
                  </select>
                ) : type === "criticality" ? (
                  <select value={form[nameKey] || ""} onChange={function (e) { setField(nameKey, e.target.value); }}>
                    <option value="">Select...</option>
                    {CRIT_OPTS.map(function (o) { return <option key={o} value={o}>{o}</option>; })}
                  </select>
                ) : (
                  <input value={form[nameKey] || ""} onChange={function (e) { setField(nameKey, e.target.value); }} placeholder={ph} />
                )}
              </div>
            );
          })}
        </div>
        <div className="row">
          <button className="btn" onClick={submit} disabled={busy}>{busy ? "Saving..." : "Save"}</button>
          {msg ? <span className="muted">{msg}</span> : null}
        </div>
      </div>

      <div className="card">
        <div className="label">{TABS.find(function (t) { return t.key === tab; }).label} ({items.length})</div>
        {items.length === 0 ? (
          <p className="muted">Nothing entered yet. Add your first {TABS.find(function (t) { return t.key === tab; }).label.toLowerCase().replace(/s$/, "")} above.</p>
        ) : (
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  {FIELDS[tab].map(function (f) { return <th key={f[0]}>{f[1]}</th>; })}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(function (it) {
                  return (
                    <tr key={it.id}>
                      {FIELDS[tab].map(function (f) { return <td key={f[0]}>{String(it[f[0]] || "")}</td>; })}
                      <td><button className="btn ghost" style={{ padding: "5px 10px", fontSize: 12 }} onClick={function () { remove(it.id); }}>Delete</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
