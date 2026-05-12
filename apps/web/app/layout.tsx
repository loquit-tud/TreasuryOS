import type { Metadata } from "next";
import "./globals.css";

const canonicalDescription =
  "TreasuryOS is a constitutional risk layer for autonomous treasuries on Mantle. AI proposes capital actions. TreasuryOS stress-tests them against treasury law. Unsafe actions are blocked, safe actions are allowed, and decisions can be proven on-chain.";

export const metadata: Metadata = {
  title: "TreasuryOS",
  description: canonicalDescription,
  openGraph: {
    title: "TreasuryOS",
    description: canonicalDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
