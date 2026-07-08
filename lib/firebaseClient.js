// lib/firebaseClient.js
// Initializes Firebase on the client. Config comes from NEXT_PUBLIC_ env vars
// so it is safe to expose (these are public by design in Firebase web apps).
// If config is missing, we expose isConfigured=false so the UI can fall back
// to demo mode gracefully instead of crashing.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

var config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export var isConfigured = Boolean(config.apiKey && config.projectId);

var app = null;
var auth = null;
var db = null;

if (isConfigured) {
  app = getApps().length ? getApp() : initializeApp(config);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
