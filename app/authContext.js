// app/authContext.js
// Central auth + organization state for the whole app.
// Two modes:
//   1. Real Firebase auth (email/password) when Firebase is configured.
//   2. "Demo mode" - a local, no-account session that always works, so the
//      live demo never depends on typing a password on stage.
// Either way, downstream code reads { user, org, mode } from this context.

"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { isConfigured, auth, db } from "../lib/firebaseClient";

var AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

var DEMO_USER = { uid: "demo", email: "demo@dc-sentinel.app", displayName: "Demo User" };
var DEMO_ORG = { id: "demo-project", name: "Northstar Datacenters (Demo)", namespace: "demo-project" };

export function AuthProvider(props) {
  var sUser = useState(null); var user = sUser[0]; var setUser = sUser[1];
  var sOrg = useState(null); var org = sOrg[0]; var setOrg = sOrg[1];
  var sMode = useState("loading"); var mode = sMode[0]; var setMode = sMode[1]; // loading | demo | firebase | signedout
  var sReady = useState(false); var ready = sReady[0]; var setReady = sReady[1];

  // On mount: check for an existing demo session, else watch Firebase auth.
  useEffect(function () {
    if (typeof window !== "undefined") {
      var demoFlag = window.sessionStorage.getItem("dcs_demo");
      if (demoFlag === "1") {
        setUser(DEMO_USER); setOrg(DEMO_ORG); setMode("demo"); setReady(true);
        return;
      }
    }
    if (!isConfigured) {
      // No Firebase -> app still usable via demo mode only.
      setMode("signedout"); setReady(true);
      return;
    }
    var unsub = onAuthChangedSafe(function (fbUser) {
      if (fbUser) {
        setUser({ uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName || fbUser.email });
        loadOrg(fbUser.uid).then(function (o) { setOrg(o); setMode("firebase"); setReady(true); });
      } else {
        setUser(null); setOrg(null); setMode("signedout"); setReady(true);
      }
    });
    return unsub;
  }, []);

  function onAuthChangedSafe(cb) {
    try {
      var mod = require("firebase/auth");
      return mod.onAuthStateChanged(auth, cb);
    } catch (e) {
      cb(null);
      return function () {};
    }
  }

  async function loadOrg(uid) {
    try {
      var fs = require("firebase/firestore");
      var ref = fs.doc(db, "users", uid);
      var snap = await fs.getDoc(ref);
      if (snap.exists()) {
        var data = snap.data();
        if (data.org) { return data.org; }
      }
    } catch (e) {}
    return null;
  }

  function enterDemo() {
    if (typeof window !== "undefined") { window.sessionStorage.setItem("dcs_demo", "1"); }
    setUser(DEMO_USER); setOrg(DEMO_ORG); setMode("demo"); setReady(true);
  }

  async function signup(email, password) {
    var fs = require("firebase/auth");
    var cred = await fs.createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async function login(email, password) {
    var fs = require("firebase/auth");
    var cred = await fs.signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }

  async function saveOrg(orgData) {
    // Persist the org for this user, and set it in state.
    var withNs = Object.assign({}, orgData);
    if (!withNs.namespace) {
      withNs.namespace = "org-" + (user ? user.uid : "anon");
    }
    setOrg(withNs);
    if (mode === "firebase" && user) {
      try {
        var fs = require("firebase/firestore");
        await fs.setDoc(fs.doc(db, "users", user.uid), { org: withNs }, { merge: true });
      } catch (e) {}
    }
    return withNs;
  }

  async function logout() {
    if (typeof window !== "undefined") { window.sessionStorage.removeItem("dcs_demo"); }
    if (mode === "firebase") {
      try { var fs = require("firebase/auth"); await fs.signOut(auth); } catch (e) {}
    }
    setUser(null); setOrg(null); setMode("signedout");
  }

  var value = {
    user: user, org: org, mode: mode, ready: ready,
    isConfigured: isConfigured,
    enterDemo: enterDemo, signup: signup, login: login, saveOrg: saveOrg, logout: logout
  };

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}
