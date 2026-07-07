// lib/agents/commissioning.js
// Commissioning QA Copilot (lightweight).
// Walks an integrated system test sequence (data/commissioning.json) drawn from
// TIA-942 / Uptime Tier acceptance criteria. For each test step it validates a
// measured value against the acceptance criterion (pass / fail) and assembles a
// structured commissioning test record.

// A criterion is { type, ... }. We support a few explicit, auditable rules.
function evaluate(criterion, measured) {
  var m = parseFloat(measured);
  if (criterion.type === "min") {
    if (isNaN(m)) { return { pass: false, note: "Measured value is not numeric." }; }
    return { pass: m >= criterion.value, note: "Requires >= " + criterion.value + " " + (criterion.unit || "") };
  }
  if (criterion.type === "max") {
    if (isNaN(m)) { return { pass: false, note: "Measured value is not numeric." }; }
    return { pass: m <= criterion.value, note: "Requires <= " + criterion.value + " " + (criterion.unit || "") };
  }
  if (criterion.type === "range") {
    if (isNaN(m)) { return { pass: false, note: "Measured value is not numeric." }; }
    return {
      pass: m >= criterion.min && m <= criterion.max,
      note: "Requires " + criterion.min + " to " + criterion.max + " " + (criterion.unit || "")
    };
  }
  if (criterion.type === "boolean") {
    var v = String(measured).trim().toLowerCase();
    var truthy = v === "true" || v === "yes" || v === "pass" || v === "ok";
    return { pass: truthy === (criterion.value === true), note: "Requires " + (criterion.value ? "yes/pass" : "no/fail") };
  }
  return { pass: false, note: "Unknown criterion type." };
}

// Build a test record from the test definitions and a map of measured values.
// measuredMap: { testId: measuredValue }
function buildRecord(tests, measuredMap) {
  var rows = [];
  var passed = 0;
  var i;
  for (i = 0; i < tests.length; i++) {
    var t = tests[i];
    var measured = measuredMap[t.id];
    var hasValue = measured !== undefined && measured !== null && String(measured).length > 0;
    var result = hasValue ? evaluate(t.criterion, measured) : { pass: false, note: "Not yet measured." };
    if (result.pass) { passed = passed + 1; }
    rows.push({
      id: t.id,
      system: t.system,
      name: t.name,
      standard: t.standard,
      measured: hasValue ? measured : "",
      requirement: result.note,
      status: hasValue ? (result.pass ? "Pass" : "Fail") : "Pending"
    });
  }
  return {
    summary: { total: tests.length, passed: passed, failed: rows.filter(function (r) { return r.status === "Fail"; }).length, pending: rows.filter(function (r) { return r.status === "Pending"; }).length },
    rows: rows
  };
}

module.exports = { evaluate: evaluate, buildRecord: buildRecord };
