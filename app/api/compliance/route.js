// app/api/compliance/route.js
// POST { submittalText } -> runs the compliance agent and returns a deviation report.

import { NextResponse } from "next/server";

var compliance = require("../../../lib/agents/compliance.js");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

var NAMESPACE = "demo-project";

export async function POST(request) {
  try {
    var body = await request.json();
    var submittalText = body.submittalText || "";
    if (submittalText.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "submittalText is required" }, { status: 400 });
    }
    var report = await compliance.checkSubmittal(NAMESPACE, submittalText);
    return NextResponse.json({ ok: true, report: report });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
