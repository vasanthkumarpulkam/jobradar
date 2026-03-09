import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Vasanth Job Radar",
  description: "Live job feed — last 30 minutes — direct ATS",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: "#05080f" }}>{children}</body>
    </html>
  );
}
