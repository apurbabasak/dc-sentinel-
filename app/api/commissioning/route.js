// app/api/commissioning/route.js
// GET  -> returns the list of TIA-942 test definitions.
// POST { measured: { testId: value } } -> validates and returns a test record.

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

var commissioning = require("../../../lib/agents/commissioning.js");

export const dynamic = "force-dynamic";

function loadTests() {
  var p = path.join(process.cwd(), "data", "commissioning.json");
  return JSON.parse(fs.readFileSync(p, "utf8")).tests;
}

export async function GET() {
  try {
    return NextResponse.json({ ok: true, tests: loadTests() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    var body = await request.json();
    var measured = body.measured || {};
    var record = commissioning.buildRecord(loadTests(), measured);
    return NextResponse.json({ ok: true, record: record });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
