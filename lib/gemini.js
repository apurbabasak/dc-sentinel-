// lib/gemini.js
// Wraps the Google Generative AI SDK for two jobs: creating embeddings
// (to search Pinecone) and generating grounded answers.
// Supports multi-key rotation the same way the Amar Gauranga app does:
// set GEMINI_API_KEY_1 .. GEMINI_API_KEY_8 in the environment, or a single
// GEMINI_API_KEY. Rotation spreads load and survives a single key's rate limit.

var GenAI = require("@google/generative-ai");
var GoogleGenerativeAI = GenAI.GoogleGenerativeAI;

var EMBED_MODEL = "gemini-embedding-001";
var GEN_MODEL = "gemini-2.5-flash";

// gemini-embedding-001 defaults to 3072 dimensions. We pin it to 768 so it
// stays compatible with a 768-dim Pinecone index. If you ever recreate the
// index at 3072, change this and the index together.
var EMBED_DIM = 768;

function collectKeys() {
  var keys = [];
  var i;
  for (i = 1; i <= 8; i++) {
    var k = process.env["GEMINI_API_KEY_" + i];
    if (k && k.trim().length > 0) {
      keys.push(k.trim());
    }
  }
  if (keys.length === 0 && process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY.trim());
  }
  return keys;
}

var KEY_STATE = { keys: null, cursor: 0 };

function nextKey() {
  if (KEY_STATE.keys === null) {
    KEY_STATE.keys = collectKeys();
  }
  if (KEY_STATE.keys.length === 0) {
    throw new Error("No Gemini API key found. Set GEMINI_API_KEY or GEMINI_API_KEY_1..8 in your environment.");
  }
  var key = KEY_STATE.keys[KEY_STATE.cursor % KEY_STATE.keys.length];
  KEY_STATE.cursor = KEY_STATE.cursor + 1;
  return key;
}

function keyCount() {
  if (KEY_STATE.keys === null) {
    KEY_STATE.keys = collectKeys();
  }
  return KEY_STATE.keys.length;
}

// Create an embedding vector for a single piece of text.
// We call the REST endpoint directly because it supports outputDimensionality
// (to pin the vector to 768 dims), which older SDK versions do not expose.
async function embed(text) {
  var key = nextKey();
  var url = "https://generativelanguage.googleapis.com/v1beta/models/" + EMBED_MODEL + ":embedContent";
  var body = {
    model: "models/" + EMBED_MODEL,
    content: { parts: [{ text: text }] },
    outputDimensionality: EMBED_DIM
  };
  var res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    var errText = await res.text();
    throw new Error("Embedding request failed (" + res.status + "): " + errText.slice(0, 300));
  }
  var data = await res.json();
  var values = data && data.embedding ? data.embedding.values : null;
  if (!values || values.length === 0) {
    throw new Error("Embedding response had no values.");
  }
  return values;
}

// Ask Gemini to generate text. systemText frames the task; userText is the content.
async function generate(systemText, userText) {
  var key = nextKey();
  var client = new GoogleGenerativeAI(key);
  var model = client.getGenerativeModel({
    model: GEN_MODEL,
    systemInstruction: systemText
  });
  var result = await model.generateContent(userText);
  return result.response.text();
}

// Ask Gemini to return strict JSON. We instruct it to emit JSON only, then
// strip any accidental markdown fences before parsing.
async function generateJson(systemText, userText) {
  var raw = await generate(systemText, userText);
  var cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    var start = cleaned.indexOf("{");
    var startArr = cleaned.indexOf("[");
    if (startArr !== -1 && (start === -1 || startArr < start)) {
      start = startArr;
    }
    var endObj = cleaned.lastIndexOf("}");
    var endArr = cleaned.lastIndexOf("]");
    var end = endObj > endArr ? endObj : endArr;
    if (start !== -1 && end !== -1) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Model did not return valid JSON. Got: " + cleaned.slice(0, 200));
  }
}

module.exports = {
  embed: embed,
  generate: generate,
  generateJson: generateJson,
  keyCount: keyCount,
  EMBED_MODEL: EMBED_MODEL,
  GEN_MODEL: GEN_MODEL
};
