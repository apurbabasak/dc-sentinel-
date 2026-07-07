// lib/agents/compliance.js
// HERO AGENT: Specification & Quality Compliance.
// Given a vendor submittal (free text or extracted PDF text), the agent:
//   1. Extracts the structured technical parameters from the submittal.
//   2. For each parameter, retrieves the governing specification clause from
//      Pinecone under the strict-mode contract.
//   3. Compares submitted vs required and marks each parameter
//      Compliant | Deviation | Needs Review, always with a cited clause.

var gemini = require("../gemini");
var pine = require("../pinecone");

var EXTRACT_SYSTEM = [
  "You are an EPC quality engineer assistant.",
  "Extract the technical parameters from the vendor submittal text provided.",
  "Return JSON only, no prose, no markdown fences.",
  "Shape: { \"equipmentTag\": string, \"equipmentType\": string, \"parameters\": [ { \"name\": string, \"value\": string } ] }.",
  "Use concise engineering parameter names such as capacity, input voltage, output voltage, redundancy, efficiency, battery autonomy, dimensions, certification.",
  "If the equipment tag is not stated, infer a reasonable placeholder like UPS-01 from context."
].join(" ");

var VERDICT_SYSTEM = [
  "You are an EPC quality compliance engineer.",
  "You are given one submitted parameter and the governing specification excerpts retrieved from the project spec.",
  "Decide if the submitted value complies with the specification.",
  "Return JSON only, no prose, no markdown fences.",
  "Shape: { \"status\": \"Compliant\" | \"Deviation\" | \"Needs Review\", \"requiredValue\": string, \"explanation\": string }.",
  "Use \"Deviation\" when the submitted value clearly fails the requirement.",
  "Use \"Compliant\" when it clearly meets it.",
  "Base requiredValue and explanation ONLY on the provided specification excerpts. Do not invent requirements."
].join(" ");

// Extract parameters from raw submittal text.
async function extractParameters(submittalText) {
  var data = await gemini.generateJson(EXTRACT_SYSTEM, submittalText);
  if (!data.parameters) {
    data.parameters = [];
  }
  return data;
}

// Judge one parameter against the spec namespace under strict mode.
async function judgeParameter(namespace, equipmentType, param) {
  var queryText = equipmentType + " " + param.name + " specification requirement";
  var q = await pine.strictQuery(namespace, queryText, 5);

  if (!q.grounded) {
    return {
      name: param.name,
      submittedValue: param.value,
      status: "Needs Review",
      requiredValue: "",
      explanation: "No specification clause cleared the strict retrieval threshold, so this parameter is routed to a human reviewer rather than guessed.",
      citations: pine.citationsFrom(q.matches).slice(0, 2)
    };
  }

  var excerpts = "";
  var i;
  for (i = 0; i < q.strongMatches.length; i++) {
    var md = q.strongMatches[i].metadata || {};
    excerpts = excerpts + "\n- (" + (md.source || "spec") + (md.clause ? ", " + md.clause : "") + "): " + (md.text || "");
  }
  var userText = "Submitted parameter: " + param.name + " = " + param.value + "\nSpecification excerpts:" + excerpts;

  var verdict = await gemini.generateJson(VERDICT_SYSTEM, userText);
  return {
    name: param.name,
    submittedValue: param.value,
    status: verdict.status || "Needs Review",
    requiredValue: verdict.requiredValue || "",
    explanation: verdict.explanation || "",
    citations: pine.citationsFrom(q.strongMatches).slice(0, 2)
  };
}

// Full run: extract then judge each parameter. Returns a deviation report.
async function checkSubmittal(namespace, submittalText) {
  var extracted = await extractParameters(submittalText);
  var results = [];
  var i;
  for (i = 0; i < extracted.parameters.length; i++) {
    var r = await judgeParameter(namespace, extracted.equipmentType || "", extracted.parameters[i]);
    results.push(r);
  }
  var deviations = 0;
  var review = 0;
  for (i = 0; i < results.length; i++) {
    if (results[i].status === "Deviation") { deviations = deviations + 1; }
    if (results[i].status === "Needs Review") { review = review + 1; }
  }
  return {
    equipmentTag: extracted.equipmentTag || "",
    equipmentType: extracted.equipmentType || "",
    summary: {
      total: results.length,
      compliant: results.length - deviations - review,
      deviations: deviations,
      needsReview: review
    },
    results: results
  };
}

module.exports = {
  extractParameters: extractParameters,
  judgeParameter: judgeParameter,
  checkSubmittal: checkSubmittal
};
