import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "National Vulnerability Database - CVE History Dashboard",
  description: "National Vulnerability Database - CVE History Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
