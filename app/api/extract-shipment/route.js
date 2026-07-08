// app/api/extract-shipment/route.js
// POST { text } -> Gemini extracts structured shipment fields from pasted
// tracking text (e.g. a carrier tracking page copy-paste or shipment notice).
// Returns fields the Supply Chain map can use.

import { NextResponse } from "next/server";

var gemini = require("../../../lib/gemini.js");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

var SYSTEM = [
  "You extract structured shipment data from raw tracking or logistics text.",
  "Return JSON only, no prose, no markdown fences.",
  "Shape: { \"equipment\": string, \"origin\": string, \"destination\": string, \"status\": one of [not_shipped,in_transit,customs,delayed,arrived], \"etaDays\": number, \"carrier\": string }.",
  "If a field is not present in the text, use empty string for text fields and 0 for etaDays.",
  "Map free-text statuses to the closest allowed value (e.g. 'out for delivery' -> in_transit, 'held at customs' -> customs, 'delayed'/'exception' -> delayed, 'delivered' -> arrived)."
].join(" ");

export async function POST(request) {
  try {
    var body = await request.json();
    var text = body.text || "";
    if (text.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "text is required" }, { status: 400 });
    }
    var data = await gemini.generateJson(SYSTEM, text);
    return NextResponse.json({ ok: true, shipment: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
