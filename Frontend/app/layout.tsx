import type { Metadata } from "next";
import "./globals.css";
import { Inter, Montserrat } from "next/font/google";
import Navbar from "@/src/layout/Navbar";


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const heading = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Auberge du Montcalm",
  description: "Auberge du Montcalm",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${heading.variable}`}>
      <body className="bg-[#ece7df]">
        <div className="pointer-events-none fixed inset-0 z-[9999] flex justify-center">
          <div className="w-full max-w-[1280px] border-x border-red-400/40" />
        </div>

        <Navbar />
        {children}
      </body>
    </html>
  );
}