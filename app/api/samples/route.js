// app/api/samples/route.js
// GET -> returns the sample submittals so the compliance page can offer
// one-click "load a sample" buttons for the demo.

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    var p = path.join(process.cwd(), "data", "submittals.json");
    var data = JSON.parse(fs.readFileSync(p, "utf8"));
    return NextResponse.json({ ok: true, submittals: data.submittals });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
