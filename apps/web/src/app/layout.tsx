import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FAFAFA",
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: "TWINTH.INK | Give an idea a reality.",
  description: "A living digital record for things people imagine, build, and test. Physical-to-digital twin protocol for hardware inventions.",
  keywords: ["digital twin", "thermodynamic simulation", "hardware engineering", "open source hardware", "Resip", "sodium acetate", "thermal straw"],
  authors: [{ name: "Foxlendor" }],
  creator: "Foxlendor",
  publisher: "TwinThink",
  openGraph: {
    title: "TWINTH.INK | Give an idea a reality.",
    description: "A living digital record for things people imagine, build, and test.",
    url: "https://www.twinth.ink",
    siteName: "TwinThink",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" style={{ background: '#FAFAFA', color: '#111827' }}>
        <Navbar />
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
