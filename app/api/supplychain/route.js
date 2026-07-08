// app/api/supplychain/route.js
// GET -> assesses seeded equipment shipments and returns risk-ranked results
// with geographic coordinates for the map. Pure rule-based, no LLM/vector call.

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

var supplychain = require("../../../lib/agents/supplychain.js");

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    var p = path.join(process.cwd(), "data", "shipments.json");
    var data = JSON.parse(fs.readFileSync(p, "utf8"));
    var result = supplychain.assess(data.shipments);
    result.destination = data.destination;
    return NextResponse.json({ ok: true, result: result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
