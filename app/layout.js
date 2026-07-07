// app/layout.js
import "./globals.css";

export const metadata = {
  title: "DC-Sentinel - EPC Project Intelligence",
  description: "AI project intelligence for data centre EPC delivery"
};

function Nav() {
  return (
    <div>
      <div className="topbar">
        <div className="brand">DC<span>-</span>SENTINEL</div>
        <div className="tag">ET AI Hackathon 2026 &nbsp;|&nbsp; Problem Statement 4</div>
      </div>
      <div className="nav">
        <a href="/">Home</a>
        <a href="/compliance">Compliance Agent</a>
        <a href="/rfi">RFI Assistant</a>
        <a href="/schedule">Schedule Risk</a>
        <a href="/commissioning">Commissioning QA</a>
        <a href="/health">Health Check</a>
      </div>
    </div>
  );
}

export default function RootLayout(props) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {props.children}
      </body>
    </html>
  );
}
