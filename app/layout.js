// app/layout.js
import "./globals.css";
import { AuthProvider } from "./authContext";
import Shell from "./shell";

export const metadata = {
  title: "DC-Sentinel - EPC Project Intelligence",
  description: "AI project intelligence for data centre EPC delivery"
};

export default function RootLayout(props) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Shell>{props.children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
