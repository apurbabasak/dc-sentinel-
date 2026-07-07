// lib/pinecone.js
// Wraps the Pinecone SDK and implements the strict-mode retrieval contract
// that is the trust backbone of DC-Sentinel:
//   1. Retrieve only chunks whose similarity score clears STRICT_THRESHOLD.
//   2. Assert a grounded answer only when at least MIN_STRONG_HITS strong
//      chunks support it; otherwise the caller returns "Needs Human Review".
//   3. Every returned chunk carries its source metadata for citation.

var PineconeSDK = require("@pinecone-database/pinecone");
var Pinecone = PineconeSDK.Pinecone;
var gemini = require("./gemini");

// These two numbers ARE the strict-mode contract. Tune them here only.
var STRICT_THRESHOLD = 0.65;
var MIN_STRONG_HITS = 2;

var INDEX_NAME = process.env.PINECONE_INDEX || "dc-sentinel";

var CLIENT = null;
function client() {
  if (CLIENT === null) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY is not set.");
    }
    CLIENT = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return CLIENT;
}

function indexFor(namespace) {
  return client().index(INDEX_NAME).namespace(namespace || "default");
}

// Upsert an array of { id, text, metadata } records into a namespace.
async function upsertChunks(namespace, records) {
  var vectors = [];
  var i;
  for (i = 0; i < records.length; i++) {
    var r = records[i];
    var vector = await gemini.embed(r.text);
    var meta = Object.assign({}, r.metadata || {});
    meta.text = r.text;
    vectors.push({ id: r.id, values: vector, metadata: meta });
  }
  await indexFor(namespace).upsert(vectors);
  return vectors.length;
}

// Core strict-mode query. Returns:
//   { grounded: bool, matches: [...], strongCount: n }
// grounded is true only when at least MIN_STRONG_HITS matches clear the
// STRICT_THRESHOLD. matches always carries whatever came back (for display),
// but callers should only assert facts when grounded === true.
async function strictQuery(namespace, queryText, topK) {
  var vector = await gemini.embed(queryText);
  var res = await indexFor(namespace).query({
    vector: vector,
    topK: topK || 6,
    includeMetadata: true
  });
  var matches = res.matches || [];
  var strong = [];
  var i;
  for (i = 0; i < matches.length; i++) {
    if (matches[i].score >= STRICT_THRESHOLD) {
      strong.push(matches[i]);
    }
  }
  return {
    grounded: strong.length >= MIN_STRONG_HITS,
    strongCount: strong.length,
    matches: matches,
    strongMatches: strong
  };
}

// Build a compact citation list from matches, for showing under an answer.
function citationsFrom(matches) {
  var out = [];
  var i;
  for (i = 0; i < matches.length; i++) {
    var m = matches[i];
    var md = m.metadata || {};
    out.push({
      source: md.source || "unknown",
      clause: md.clause || md.section || "",
      page: md.page || "",
      score: Math.round((m.score || 0) * 1000) / 1000,
      snippet: (md.text || "").slice(0, 220)
    });
  }
  return out;
}

module.exports = {
  upsertChunks: upsertChunks,
  strictQuery: strictQuery,
  citationsFrom: citationsFrom,
  STRICT_THRESHOLD: STRICT_THRESHOLD,
  MIN_STRONG_HITS: MIN_STRONG_HITS,
  INDEX_NAME: INDEX_NAME
};
