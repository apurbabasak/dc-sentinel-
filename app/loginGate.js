// app/loginGate.js
// Shown when nobody is signed in. "Continue as demo" is the primary path
// (safe for a live demo). Email/password signup+login is available when
// Firebase is configured.

"use client";
import { useState } from "react";
import { useAuth } from "./authContext";

export default function LoginGate() {
  var auth = useAuth();
  var sTab = useState("login"); var tab = sTab[0]; var setTab = sTab[1];
  var sEmail = useState(""); var email = sEmail[0]; var setEmail = sEmail[1];
  var sPass = useState(""); var pass = sPass[0]; var setPass = sPass[1];
  var sErr = useState(""); var err = sErr[0]; var setErr = sErr[1];
  var sBusy = useState(false); var busy = sBusy[0]; var setBusy = sBusy[1];

  function run() {
    setErr(""); setBusy(true);
    var p = tab === "signup" ? auth.signup(email, pass) : auth.login(email, pass);
    p.then(function () { setBusy(false); }).catch(function (e) {
      setBusy(false);
      setErr(friendly(String(e.message || e)));
    });
  }

  function friendly(msg) {
    if (msg.indexOf("invalid-credential") !== -1 || msg.indexOf("wrong-password") !== -1) { return "That email or password doesn't match. Try again."; }
    if (msg.indexOf("email-already-in-use") !== -1) { return "That email already has an account. Try signing in."; }
    if (msg.indexOf("weak-password") !== -1) { return "Use a password of at least 6 characters."; }
    if (msg.indexOf("invalid-email") !== -1) { return "That doesn't look like a valid email."; }
    return msg;
  }

  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", position: "relative", zIndex: 1 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div className="card" style={{ textAlign: "center", paddingTop: 30 }}>
          <div style={{ fontFamily: "var(--display)", fontSize: 26, fontWeight: 700, color: "var(--ink)", marginBottom: 4 }}>
            DC<span style={{ color: "var(--cyan)" }}>-</span>SENTINEL
          </div>
          <div className="muted" style={{ marginBottom: 22 }}>EPC Project Intelligence</div>

          <button className="btn" style={{ width: "100%", padding: "14px", fontSize: 15 }} onClick={auth.enterDemo}>
            Continue as demo
          </button>
          <div className="muted" style={{ margin: "10px 0 20px" }}>Instant access with a sample project loaded</div>

          {auth.isConfigured ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0 18px" }}>
                <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
                <span className="muted">or use an account</span>
                <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
              </div>

              <div className="row" style={{ justifyContent: "center", marginBottom: 14 }}>
                <button className={tab === "login" ? "btn ghost" : "btn ghost"} style={{ opacity: tab === "login" ? 1 : 0.55 }} onClick={function () { setTab("login"); setErr(""); }}>Sign in</button>
                <button className={tab === "signup" ? "btn ghost" : "btn ghost"} style={{ opacity: tab === "signup" ? 1 : 0.55 }} onClick={function () { setTab("signup"); setErr(""); }}>Create account</button>
              </div>

              <input placeholder="you@company.com" value={email} onChange={function (e) { setEmail(e.target.value); }} style={{ marginBottom: 10 }} />
              <input type="password" placeholder="Password" value={pass} onChange={function (e) { setPass(e.target.value); }} style={{ marginBottom: 12 }} />
              {err ? <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 12 }}>{err}</div> : null}
              <button className="btn" style={{ width: "100%" }} onClick={run} disabled={busy || !email || !pass}>
                {busy ? "Working..." : (tab === "signup" ? "Create account" : "Sign in")}
              </button>
            </div>
          ) : (
            <div className="note" style={{ textAlign: "left" }}>
              Accounts are not configured yet. Demo mode gives you the full platform now. To enable real
              sign-in, add the Firebase environment variables and redeploy.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
