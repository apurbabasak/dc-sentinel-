// app/orgSetup.js
// Shown to a signed-in user who hasn't set up their organization yet.
"use client";
import { useState } from "react";
import { useAuth } from "./authContext";

export default function OrgSetup() {
  var auth = useAuth();
  var sName = useState(""); var name = sName[0]; var setName = sName[1];
  var sSite = useState(""); var site = sSite[0]; var setSite = sSite[1];
  var sBusy = useState(false); var busy = sBusy[0]; var setBusy = sBusy[1];

  function save() {
    if (!name.trim()) { return; }
    setBusy(true);
    auth.saveOrg({ name: name.trim(), site: site.trim() }).then(function () { setBusy(false); });
  }

  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", position: "relative", zIndex: 1 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div className="card">
          <div className="eyebrow">Welcome</div>
          <div className="h1" style={{ fontSize: 24 }}>Set up your organization</div>
          <p className="sub" style={{ marginBottom: 18 }}>
            This names your workspace. Your projects, specifications, suppliers and shipments are kept
            private to your organization.
          </p>
          <label className="label">Organization name</label>
          <input placeholder="Acme Data Infrastructure Pvt Ltd" value={name} onChange={function (e) { setName(e.target.value); }} style={{ marginBottom: 14 }} />
          <label className="label">Primary site / project (optional)</label>
          <input placeholder="Mumbai DC-1" value={site} onChange={function (e) { setSite(e.target.value); }} style={{ marginBottom: 18 }} />
          <button className="btn" style={{ width: "100%" }} onClick={save} disabled={busy || !name.trim()}>
            {busy ? "Saving..." : "Create workspace"}
          </button>
        </div>
      </div>
    </div>
  );
}
