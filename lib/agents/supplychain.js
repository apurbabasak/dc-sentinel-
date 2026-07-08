// lib/agents/supplychain.js
// Supply Chain Visibility Agent (geospatial, lightweight).
// Operates on a realistic dataset of critical equipment shipments
// (data/shipments.json), each with an origin, destination, current position,
// and status. It computes an explainable delivery-risk score per shipment from
// transparent signals: schedule buffer, transit status, route exposure
// (choke points / port congestion), and criticality of the equipment.
//
// NOTE ON HONESTY: positions here are representative project data, not a live
// vessel AIS feed. The roadmap upgrades this to live AIS + port congestion.

var W_BUFFER = 35;      // days buffer vs remaining transit
var W_STATUS = 25;      // where in the journey it is
var W_ROUTE = 25;       // route exposure (choke points, congestion)
var W_CRITICALITY = 15; // how critical the equipment is to the schedule

function bufferRisk(bufferDays) {
  if (bufferDays <= 0) { return 1.0; }
  if (bufferDays <= 5) { return 0.75; }
  if (bufferDays <= 12) { return 0.45; }
  if (bufferDays <= 25) { return 0.2; }
  return 0.05;
}

function statusRisk(status) {
  if (status === "delayed") { return 1.0; }
  if (status === "not_shipped") { return 0.8; }
  if (status === "customs") { return 0.6; }
  if (status === "in_transit") { return 0.35; }
  if (status === "arrived") { return 0.0; }
  return 0.5;
}

function routeRisk(exposure) {
  // exposure is a 0..1 value on the shipment (choke points / congestion)
  if (exposure >= 0.7) { return 1.0; }
  if (exposure >= 0.4) { return 0.6; }
  if (exposure >= 0.2) { return 0.3; }
  return 0.1;
}

function criticalityRisk(level) {
  if (level === "critical") { return 1.0; }
  if (level === "high") { return 0.7; }
  if (level === "medium") { return 0.4; }
  return 0.15;
}

function bandFor(score) {
  if (score >= 60) { return "red"; }
  if (score >= 35) { return "amber"; }
  return "green";
}

function scoreShipment(s) {
  var br = bufferRisk(s.bufferDays);
  var st = statusRisk(s.status);
  var rr = routeRisk(s.routeExposure);
  var cr = criticalityRisk(s.criticality);
  var score = Math.round(br * W_BUFFER + st * W_STATUS + rr * W_ROUTE + cr * W_CRITICALITY);
  var band = bandFor(score);

  var reasons = [];
  if (br >= 0.6) { reasons.push("only " + s.bufferDays + " days buffer before need-by"); }
  if (st >= 0.6) { reasons.push("status is " + s.status.replace("_", " ")); }
  if (rr >= 0.6) { reasons.push("route passes a congested or high-exposure corridor"); }
  if (cr >= 0.7) { reasons.push(s.criticality + " path equipment"); }
  if (reasons.length === 0) { reasons.push("on track, all signals within tolerance"); }

  return {
    id: s.id,
    equipment: s.equipment,
    tag: s.tag,
    origin: s.origin,
    destination: s.destination,
    originLat: s.originLat, originLng: s.originLng,
    destLat: s.destLat, destLng: s.destLng,
    curLat: s.curLat, curLng: s.curLng,
    status: s.status,
    etaDays: s.etaDays,
    bufferDays: s.bufferDays,
    criticality: s.criticality,
    score: score,
    band: band,
    reason: reasons.join("; "),
    signals: {
      buffer: Math.round(br * 100),
      status: Math.round(st * 100),
      route: Math.round(rr * 100),
      criticality: Math.round(cr * 100)
    }
  };
}

function assess(shipments) {
  var scored = [];
  var i;
  for (i = 0; i < shipments.length; i++) {
    scored.push(scoreShipment(shipments[i]));
  }
  scored.sort(function (a, b) { return b.score - a.score; });
  var red = 0, amber = 0;
  for (i = 0; i < scored.length; i++) {
    if (scored[i].band === "red") { red = red + 1; }
    if (scored[i].band === "amber") { amber = amber + 1; }
  }
  return {
    summary: { total: scored.length, red: red, amber: amber, green: scored.length - red - amber },
    weights: { buffer: W_BUFFER, status: W_STATUS, route: W_ROUTE, criticality: W_CRITICALITY },
    shipments: scored
  };
}

module.exports = { assess: assess, scoreShipment: scoreShipment };
