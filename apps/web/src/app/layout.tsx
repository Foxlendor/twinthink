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
    icon: [
      { url: "/icon.png?v=5", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico?v=5", sizes: "any" },
      { url: "/icon.svg?v=5", type: "image/svg+xml" }
    ],
    shortcut: "/favicon.ico?v=5",
    apple: "/apple-touch-icon.png?v=5"
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.ico?v=5" sizes="any" />
        <link rel="icon" href="/icon.png?v=5" type="image/png" />
        <link rel="icon" href="/icon.svg?v=5" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=5" />
      </head>
      <body className="min-h-full flex flex-col" style={{ background: '#FAFAFA', color: '#111827' }}>
        <Navbar />
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
