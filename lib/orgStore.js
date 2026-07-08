// lib/orgStore.js
// Stores org-scoped data (specs, suppliers, shipments, inventory, projects).
// In Firebase mode it persists to Firestore under orgs/{namespace}/{collection}.
// In demo mode it uses sessionStorage so the demo works with zero backend.
// Same API either way, so the UI does not care which mode it is in.

import { isConfigured, db } from "./firebaseClient";

function sessKey(ns, coll) { return "dcs_" + ns + "_" + coll; }

function readSession(ns, coll) {
  if (typeof window === "undefined") { return []; }
  try {
    var raw = window.sessionStorage.getItem(sessKey(ns, coll));
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}
function writeSession(ns, coll, items) {
  if (typeof window === "undefined") { return; }
  try { window.sessionStorage.setItem(sessKey(ns, coll), JSON.stringify(items)); } catch (e) {}
}

function genId() { return "id-" + Date.now() + "-" + Math.floor(Math.random() * 9999); }

// List all items in a collection for an org.
export async function listItems(mode, ns, coll) {
  if (mode === "firebase" && isConfigured) {
    try {
      var fs = require("firebase/firestore");
      var q = fs.collection(db, "orgs", ns, coll);
      var snap = await fs.getDocs(q);
      var out = [];
      snap.forEach(function (d) { out.push(Object.assign({ id: d.id }, d.data())); });
      return out;
    } catch (e) { return []; }
  }
  return readSession(ns, coll);
}

// Add an item; returns the item with its id.
export async function addItem(mode, ns, coll, item) {
  var withId = Object.assign({}, item);
  if (mode === "firebase" && isConfigured) {
    try {
      var fs = require("firebase/firestore");
      var ref = await fs.addDoc(fs.collection(db, "orgs", ns, coll), item);
      withId.id = ref.id;
      return withId;
    } catch (e) {}
  }
  withId.id = genId();
  var items = readSession(ns, coll);
  items.push(withId);
  writeSession(ns, coll, items);
  return withId;
}

// Delete an item by id.
export async function deleteItem(mode, ns, coll, id) {
  if (mode === "firebase" && isConfigured) {
    try {
      var fs = require("firebase/firestore");
      await fs.deleteDoc(fs.doc(db, "orgs", ns, coll, id));
      return;
    } catch (e) {}
  }
  var items = readSession(ns, coll).filter(function (x) { return x.id !== id; });
  writeSession(ns, coll, items);
}
