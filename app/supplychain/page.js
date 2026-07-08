// app/supplychain/page.js
"use client";
import { useState, useEffect, useRef } from "react";

var BAND_COLOR = { red: "#F87171", amber: "#FBBF24", green: "#34D399" };

// Load a script once and resolve when ready.
function loadScript(src) {
  return new Promise(function (resolve, reject) {
    if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
    var s = document.createElement("script");
    s.src = src; s.onload = function () { resolve(); }; s.onerror = reject;
    document.body.appendChild(s);
  });
}
function loadCss(href) {
  if (document.querySelector('link[href="' + href + '"]')) { return; }
  var l = document.createElement("link");
  l.rel = "stylesheet"; l.href = href;
  document.head.appendChild(l);
}

export default function SupplyChainPage() {
  var sRes = useState(null); var res = sRes[0]; var setRes = sRes[1];
  var sErr = useState(""); var err = sErr[0]; var setErr = sErr[1];
  var sSel = useState(null); var sel = sSel[0]; var setSel = sSel[1];
  var mapRef = useRef(null);
  var mapObj = useRef(null);

  // fetch data
  useEffect(function () {
    fetch("/api/supplychain").then(function (r) { return r.json(); }).then(function (d) {
      if (d.ok) { setRes(d.result); } else { setErr(d.error || "Error"); }
    }).catch(function (e) { setErr(String(e)); });
  }, []);

  // draw map once data is ready
  useEffect(function () {
    if (!res) { return; }
    loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
    loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js").then(function () {
      var L = window.L;
      if (!L || !mapRef.current) { return; }
      if (mapObj.current) { mapObj.current.remove(); }

      var map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView([20, 70], 3);
      mapObj.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 10, minZoom: 2
      }).addTo(map);

      // destination marker
      var dest = res.destination;
      var destIcon = L.divIcon({
        className: "", html: '<div style="width:16px;height:16px;border-radius:50%;background:#38BDF8;box-shadow:0 0 0 4px rgba(56,189,248,0.3),0 0 14px rgba(56,189,248,0.7);border:2px solid #fff"></div>',
        iconSize: [16, 16], iconAnchor: [8, 8]
      });
      L.marker([dest.lat, dest.lng], { icon: destIcon }).addTo(map)
        .bindPopup("<b>" + dest.name + "</b><br/>Delivery destination");

      // each shipment: route line + current-position marker
      res.shipments.forEach(function (s) {
        var color = BAND_COLOR[s.band];
        // full planned route (origin -> destination), faint
        L.polyline([[s.originLat, s.originLng], [s.destLat, s.destLng]], {
          color: color, weight: 1, opacity: 0.25, dashArray: "4 6"
        }).addTo(map);
        // travelled portion (origin -> current), solid
        L.polyline([[s.originLat, s.originLng], [s.curLat, s.curLng]], {
          color: color, weight: 2.5, opacity: 0.85
        }).addTo(map);

        var icon = L.divIcon({
          className: "",
          html: '<div style="width:12px;height:12px;border-radius:50%;background:' + color + ';box-shadow:0 0 0 3px rgba(0,0,0,0.4),0 0 10px ' + color + ';border:1.5px solid #0A1424"></div>',
          iconSize: [12, 12], iconAnchor: [6, 6]
        });
        var m = L.marker([s.curLat, s.curLng], { icon: icon }).addTo(map);
        m.bindPopup(
          "<b>" + s.equipment + "</b><br/>" +
          s.origin + " &rarr; " + s.destination + "<br/>" +
          "Risk: <b style='color:" + color + "'>" + s.band.toUpperCase() + " (" + s.score + ")</b><br/>" +
          "Status: " + s.status.replace("_", " ") + " &middot; ETA " + s.etaDays + "d"
        );
        m.on("click", function () { setSel(s.id); });
      });
    }).catch(function () { setErr("Map failed to load."); });

    return function () {
      if (mapObj.current) { mapObj.current.remove(); mapObj.current = null; }
    };
  }, [res]);

  return (
    <div className="container">
      <div className="eyebrow">Agent 05 // Geospatial</div>
      <h1 className="h1">Supply Chain Visibility Agent</h1>
      <p className="sub">
        Live geospatial tracking of critical equipment shipments converging on the site, each scored for
        delivery risk from schedule buffer, transit status, route exposure and equipment criticality. Click any
        marker on the map or any row in the table. Positions are representative project data; the roadmap
        upgrades this to a live vessel AIS and port-congestion feed.
      </p>

      {err ? <div className="card" style={{ color: "#F87171" }}>{err}</div> : null}

      {res ? (
        <div className="card">
          <div className="stat-row">
            <div className="stat"><div className="n">{res.summary.total}</div><div className="l">Shipments</div></div>
            <div className="stat"><div className="n" style={{ color: "#F87171" }}>{res.summary.red}</div><div className="l">Red</div></div>
            <div className="stat"><div className="n" style={{ color: "#FBBF24" }}>{res.summary.amber}</div><div className="l">Amber</div></div>
            <div className="stat"><div className="n" style={{ color: "#34D399" }}>{res.summary.green}</div><div className="l">Green</div></div>
          </div>
        </div>
      ) : <div className="card">Loading shipments...</div>}

      <div className="card" style={{ padding: 14 }}>
        <div className="map-frame" ref={mapRef}>
          <div style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--ink-mute)", fontFamily: "var(--mono)", fontSize: 13 }}>
            Loading geospatial view&hellip;
          </div>
        </div>
      </div>

      {res ? (
        <div className="card">
          <div className="label">Shipment risk register</div>
          <div className="tablewrap">
            <table>
              <thead>
                <tr><th>Equipment</th><th>Route</th><th>Status</th><th>Buffer</th><th>Risk</th><th>Score</th><th>Why</th></tr>
              </thead>
              <tbody>
                {res.shipments.map(function (s) {
                  return (
                    <tr key={s.id} style={sel === s.id ? { background: "rgba(56,189,248,0.08)" } : {}}>
                      <td><b>{s.equipment}</b><br /><span className="muted">{s.tag}</span></td>
                      <td>{s.origin}<br /><span className="muted">&rarr; {s.destination}</span></td>
                      <td>{s.status.replace("_", " ")}</td>
                      <td>{s.bufferDays}d</td>
                      <td><span className={"pill " + s.band}>{s.band}</span></td>
                      <td style={{ fontFamily: "var(--mono)" }}><b>{s.score}</b></td>
                      <td>{s.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            Score weights &mdash; buffer {res.weights.buffer}, status {res.weights.status}, route {res.weights.route}, criticality {res.weights.criticality}.
          </p>
        </div>
      ) : null}
    </div>
  );
}
