import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const heading = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Auberge du Montcalm",
  description: "Auberge du Montcalm",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${heading.variable}`}>
      <body>{children}</body>
    </html>
  );
}
