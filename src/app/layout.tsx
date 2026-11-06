import type { Metadata, Viewport } from "next";
import { Barlow, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const barlow = Barlow({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-barlow", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Électricité N.A.B. — Électricien à Bordeaux et en Nouvelle-Aquitaine",
    template: "%s — Électricité N.A.B.",
  },
  description:
    "Installation, rénovation, mise aux normes NF C 15-100 et dépannage électrique 7j/7 pour particuliers et professionnels, à Bordeaux et dans toute la Nouvelle-Aquitaine.",
};

export const viewport: Viewport = {
  themeColor: "#0e2240",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${barlow.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
