// lib/agents/schedule.js
// Predictive Schedule Risk Agent (lightweight, rule-based).
// Operates on a realistic project schedule + procurement dataset (data/schedule.json).
// For each activity it computes an explainable risk score from four signals:
//   - procurement status of the required equipment
//   - supplier lead time vs the need-by date
//   - remaining schedule float
//   - workforce availability
// It returns green / amber / red flags with a plain-language reason per activity.
// Rule-based on purpose: a project manager must be able to justify the score.

// Weights for each signal (sum = 100). Tunable and fully transparent.
var W_PROCUREMENT = 35;
var W_LEADTIME = 30;
var W_FLOAT = 20;
var W_WORKFORCE = 15;

function procurementRisk(status) {
  if (status === "not_ordered") { return 1.0; }
  if (status === "ordered") { return 0.5; }
  if (status === "in_transit") { return 0.3; }
  if (status === "delivered") { return 0.0; }
  return 0.6;
}

function leadTimeRisk(leadTimeDays, daysToNeed) {
  if (daysToNeed <= 0) { return 1.0; }
  var ratio = leadTimeDays / daysToNeed;
  if (ratio >= 1.0) { return 1.0; }
  if (ratio >= 0.8) { return 0.7; }
  if (ratio >= 0.5) { return 0.4; }
  return 0.1;
}

function floatRisk(floatDays) {
  if (floatDays <= 0) { return 1.0; }
  if (floatDays <= 3) { return 0.7; }
  if (floatDays <= 7) { return 0.4; }
  return 0.1;
}

function workforceRisk(availabilityPct) {
  if (availabilityPct >= 90) { return 0.0; }
  if (availabilityPct >= 70) { return 0.3; }
  if (availabilityPct >= 50) { return 0.6; }
  return 1.0;
}

function bandFor(score) {
  if (score >= 60) { return "red"; }
  if (score >= 35) { return "amber"; }
  return "green";
}

function scoreActivity(a) {
  var pr = procurementRisk(a.procurementStatus);
  var lr = leadTimeRisk(a.leadTimeDays, a.daysToNeed);
  var fr = floatRisk(a.floatDays);
  var wr = workforceRisk(a.workforceAvailabilityPct);

  var score = Math.round(pr * W_PROCUREMENT + lr * W_LEADTIME + fr * W_FLOAT + wr * W_WORKFORCE);
  var band = bandFor(score);

  var reasons = [];
  if (pr >= 0.5) {
    reasons.push("equipment is " + a.procurementStatus.replace("_", " "));
  }
  if (lr >= 0.7) {
    reasons.push("lead time (" + a.leadTimeDays + "d) is tight against need-by (" + a.daysToNeed + "d)");
  }
  if (fr >= 0.7) {
    reasons.push("only " + a.floatDays + " days of float remain");
  }
  if (wr >= 0.6) {
    reasons.push("workforce availability is " + a.workforceAvailabilityPct + "%");
  }
  if (reasons.length === 0) {
    reasons.push("all signals within tolerance");
  }

  return {
    id: a.id,
    name: a.name,
    onCriticalPath: a.onCriticalPath === true,
    score: score,
    band: band,
    reason: reasons.join("; "),
    signals: {
      procurement: Math.round(pr * 100),
      leadTime: Math.round(lr * 100),
      float: Math.round(fr * 100),
      workforce: Math.round(wr * 100)
    }
  };
}

// Score a whole schedule and return activities sorted highest risk first.
function assess(activities) {
  var scored = [];
  var i;
  for (i = 0; i < activities.length; i++) {
    scored.push(scoreActivity(activities[i]));
  }
  scored.sort(function (x, y) { return y.score - x.score; });

  var red = 0;
  var amber = 0;
  for (i = 0; i < scored.length; i++) {
    if (scored[i].band === "red") { red = red + 1; }
    if (scored[i].band === "amber") { amber = amber + 1; }
  }
  return {
    summary: { total: scored.length, red: red, amber: amber, green: scored.length - red - amber },
    weights: { procurement: W_PROCUREMENT, leadTime: W_LEADTIME, float: W_FLOAT, workforce: W_WORKFORCE },
    activities: scored
  };
}

module.exports = { assess: assess, scoreActivity: scoreActivity };
