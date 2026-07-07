// lib/agents/rfi.js
// Project Knowledge & RFI Intelligence Agent.
// A conversational RAG layer over the whole project corpus. Answers a question
// under the strict-mode contract, with citations, and surfaces any similar
// prior RFI that was already resolved (to cut rework).

var gemini = require("../gemini");
var pine = require("../pinecone");

var ANSWER_SYSTEM = [
  "You are an EPC project knowledge assistant for a data centre construction project.",
  "Answer the engineer's question using ONLY the provided document excerpts.",
  "Be concise and specific. Quote figures and clause references where relevant.",
  "If the excerpts do not contain the answer, say you cannot find it in the project documents and suggest raising a formal RFI.",
  "Do not invent facts that are not in the excerpts."
].join(" ");

// Answer a question over the project corpus (namespace) under strict mode.
async function answer(namespace, question) {
  var q = await pine.strictQuery(namespace, question, 6);

  if (!q.grounded) {
    return {
      grounded: false,
      answer: "I could not find a confident answer in the project documents. Based on the strict-mode contract, I am not going to guess. I suggest raising a formal RFI so this is tracked and resolved by the design team.",
      citations: pine.citationsFrom(q.matches).slice(0, 3),
      priorRfi: null
    };
  }

  var excerpts = "";
  var i;
  for (i = 0; i < q.strongMatches.length; i++) {
    var md = q.strongMatches[i].metadata || {};
    excerpts = excerpts + "\n- (" + (md.source || "doc") + (md.clause ? ", " + md.clause : "") + "): " + (md.text || "");
  }
  var text = await gemini.generate(ANSWER_SYSTEM, "Question: " + question + "\n\nDocument excerpts:" + excerpts);

  // Look specifically for a prior resolved RFI among the strong matches.
  var priorRfi = null;
  for (i = 0; i < q.strongMatches.length; i++) {
    var m = q.strongMatches[i];
    var mmd = m.metadata || {};
    if (mmd.docType === "rfi") {
      priorRfi = {
        source: mmd.source || "RFI",
        clause: mmd.clause || "",
        score: Math.round((m.score || 0) * 1000) / 1000,
        snippet: (mmd.text || "").slice(0, 260)
      };
      break;
    }
  }

  return {
    grounded: true,
    answer: text,
    citations: pine.citationsFrom(q.strongMatches).slice(0, 4),
    priorRfi: priorRfi
  };
}

module.exports = { answer: answer };
