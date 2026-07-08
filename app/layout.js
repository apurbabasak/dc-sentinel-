// app/layout.js
import "./globals.css";
import NavBar from "./nav";

export const metadata = {
  title: "DC-Sentinel - EPC Project Intelligence",
  description: "AI project intelligence for data centre EPC delivery"
};

function StatusBar() {
  return (
    <div className="statusbar">
      <div className="left">
        <div className="logo-mark">DC</div>
        <div>
          <div className="brand">DC<em>-</em>SENTINEL</div>
          <div className="brand-sub">EPC PROJECT INTELLIGENCE</div>
        </div>
      </div>
      <div className="live-chip">
        <span className="live-dot" />
        SYSTEMS ONLINE
      </div>
    </div>
  );
}

export default function RootLayout(props) {
  return (
    <html lang="en">
      <body>
        <StatusBar />
        <NavBar />
        {props.children}
      </body>
    </html>
  );
}
