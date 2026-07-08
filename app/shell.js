// app/shell.js
// Decides what to render based on auth state:
//   not ready         -> nothing (brief)
//   signed out        -> LoginGate
//   signed in, no org -> OrgSetup
//   ready             -> the actual app (children) with nav + status bar
"use client";
import { useAuth } from "./authContext";
import LoginGate from "./loginGate";
import OrgSetup from "./orgSetup";
import NavBar from "./nav";

function StatusBar() {
  var auth = useAuth();
  var initials = "";
  if (auth.user && auth.user.email) {
    initials = auth.user.email.slice(0, 2).toUpperCase();
  }
  return (
    <div className="statusbar">
      <div className="left">
        <div className="logo-mark">DC</div>
        <div>
          <div className="brand">DC<em>-</em>SENTINEL</div>
          <div className="brand-sub">EPC PROJECT INTELLIGENCE</div>
        </div>
      </div>
      <div className="left">
        {auth.org ? <span className="muted" style={{ marginRight: 4 }}>{auth.org.name}</span> : null}
        <div className="live-chip"><span className="live-dot" />SYSTEMS ONLINE</div>
        {auth.user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(56,189,248,0.12)", border: "1px solid var(--line-hi)", display: "grid", placeItems: "center", color: "var(--cyan)", fontSize: 12, fontWeight: 600 }}>{initials || "DM"}</div>
            <button className="btn ghost" style={{ padding: "6px 12px", fontSize: 12 }} onClick={auth.logout}>Sign out</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function Shell(props) {
  var auth = useAuth();

  if (!auth.ready) {
    return (
      <div>
        <div className="statusbar">
          <div className="left">
            <div className="logo-mark">DC</div>
            <div><div className="brand">DC<em>-</em>SENTINEL</div><div className="brand-sub">EPC PROJECT INTELLIGENCE</div></div>
          </div>
        </div>
        <div className="container"><div className="muted">Loading...</div></div>
      </div>
    );
  }

  if (!auth.user) {
    return (<div><StatusBar />{" "}<LoginGate /></div>);
  }

  if (!auth.org) {
    return (<div><StatusBar /><OrgSetup /></div>);
  }

  return (
    <div>
      <StatusBar />
      <NavBar />
      {props.children}
    </div>
  );
}
