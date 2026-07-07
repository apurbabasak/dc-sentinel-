// app/api/health/route.js
// GET -> checks that each external service is reachable with the current env vars.
// This is your foolproof "is everything wired up?" endpoint after deploy.

import { NextResponse } from "next/server";

var gemini = require("../../../lib/gemini.js");
var pine = require("../../../lib/pinecone.js");

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  var out = { ok: true, checks: {} };

  // Gemini keys present?
  try {
    var kc = gemini.keyCount();
    out.checks.geminiKeys = { ok: kc > 0, count: kc, model: gemini.GEN_MODEL };
    if (kc === 0) { out.ok = false; }
  } catch (e) {
    out.checks.geminiKeys = { ok: false, error: String(e.message || e) };
    out.ok = false;
  }

  // Gemini embedding call works?
  try {
    var v = await gemini.embed("connection test");
    out.checks.geminiEmbed = { ok: Array.isArray(v) && v.length > 0, dimension: v.length };
  } catch (e) {
    out.checks.geminiEmbed = { ok: false, error: String(e.message || e) };
    out.ok = false;
  }

  // Pinecone query works? (empty query is fine; we just want no auth error)
  try {
    var q = await pine.strictQuery("demo-project", "test", 1);
    out.checks.pinecone = { ok: true, index: pine.INDEX_NAME, matchesSeen: q.matches.length };
  } catch (e) {
    out.checks.pinecone = { ok: false, index: pine.INDEX_NAME, error: String(e.message || e) };
    out.ok = false;
  }

  return NextResponse.json(out);
}
