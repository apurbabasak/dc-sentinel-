// app/api/ingest/route.js
// POST to this route to embed the demo corpus into Pinecone.
// This lets you seed the index from the deployed app with one click,
// without needing any local terminal.

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

var pine = require("../../../lib/pinecone.js");

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    var corpusPath = path.join(process.cwd(), "data", "corpus.json");
    var corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8"));

    var records = corpus.documents.map(function (d) {
      return {
        id: d.id,
        text: d.text,
        metadata: { source: d.source, clause: d.clause, docType: d.docType }
      };
    });

    var n = await pine.upsertChunks(corpus.namespace, records);
    return NextResponse.json({ ok: true, namespace: corpus.namespace, upserted: n });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 });
  }
}
