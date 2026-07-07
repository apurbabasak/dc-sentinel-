// app/api/schedule/route.js
// GET -> assesses the seeded project schedule and returns risk-ranked activities.
// This agent needs no LLM/vector call; it is pure transparent rule-based scoring.

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

var schedule = require("../../../lib/agents/schedule.js");

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    var p = path.join(process.cwd(), "data", "schedule.json");
    var data = JSON.parse(fs.readFileSync(p, "utf8"));
    var result = schedule.assess(data.activities);
    return NextResponse.json({ ok: true, result: result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
