// app/api/rfi/route.js
// POST { question } -> runs the RFI agent and returns a grounded, cited answer.

import { NextResponse } from "next/server";

var rfi = require("../../../lib/agents/rfi.js");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

var NAMESPACE = "demo-project";

export async function POST(request) {
  try {
    var body = await request.json();
    var question = body.question || "";
    if (question.trim().length === 0) {
      return NextResponse.json({ ok: false, error: "question is required" }, { status: 400 });
    }
    var result = await rfi.answer(NAMESPACE, question);
    return NextResponse.json({ ok: true, result: result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
