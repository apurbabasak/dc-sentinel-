// app/nav.js
"use client";
import { usePathname } from "next/navigation";

var LINKS = [
  { href: "/", label: "Overview" },
  { href: "/compliance", label: "Compliance" },
  { href: "/rfi", label: "RFI Assistant" },
  { href: "/schedule", label: "Schedule Risk" },
  { href: "/supplychain", label: "Supply Chain" },
  { href: "/commissioning", label: "Commissioning" },
  { href: "/admin", label: "Admin \u00B7 Data" },
  { href: "/health", label: "Health" }
];

export default function NavBar() {
  var path = usePathname();
  return (
    <div className="nav">
      {LINKS.map(function (l) {
        var active = path === l.href;
        return (
          <a key={l.href} href={l.href} className={active ? "active" : ""}>{l.label}</a>
        );
      })}
    </div>
  );
}
