// scripts/seed-pinecone.mjs
// One-time (or re-runnable) script to embed the demo corpus into Pinecone.
// Run locally OR trigger via the /api/ingest route after deploy.
// Usage (if running locally with Node): node scripts/seed-pinecone.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

var __dirname = path.dirname(fileURLToPath(import.meta.url));

// We reuse the CommonJS lib via dynamic import interop.
var pineMod = await import("../lib/pinecone.js");
var pine = pineMod.default || pineMod;

var corpusPath = path.join(__dirname, "..", "data", "corpus.json");
var corpus = JSON.parse(fs.readFileSync(corpusPath, "utf8"));

var records = corpus.documents.map(function (d) {
  return {
    id: d.id,
    text: d.text,
    metadata: {
      source: d.source,
      clause: d.clause,
      docType: d.docType
    }
  };
});

console.log("Seeding " + records.length + " documents into namespace '" + corpus.namespace + "' ...");
var n = await pine.upsertChunks(corpus.namespace, records);
console.log("Done. Upserted " + n + " vectors.");
