import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "โปรแกรมคำนวนค่างวด Loan Rate Calculation",
  description: "Car and home loan rate calculation app",
  manifest: "/site.webmanifest?v=2",
  icons: {
    icon: [
      { url: "/icons/icon.svg?v=2", type: "image/svg+xml" },
      { url: "/favicon-32x32.png?v=2", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png?v=2", type: "image/png", sizes: "16x16" },
      { url: "/favicon.ico?v=2", sizes: "any" }
    ],
    shortcut: ["/favicon.ico?v=2"],
    apple: [{ url: "/icons/apple-touch-icon.png?v=2", sizes: "180x180" }]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Loan Rate"
  }
};

export const viewport: Viewport = {
  themeColor: "#0f766e"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
