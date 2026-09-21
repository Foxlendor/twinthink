import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FAFAFA",
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: "TWINTH.INK | The digital shadow of physical reality.",
  description: "A living digital shadow for things people imagine, build, and test. The ink is where you think.",
  keywords: ["twin", "thermodynamic simulation", "hardware engineering", "open source hardware", "Resip", "sodium acetate", "thermal straw", "digital shadow"],
  authors: [{ name: "anonymous" }],
  creator: "anonymous",
  publisher: "TwinThink",
  openGraph: {
    title: "TWINTH.INK | The digital shadow of physical reality.",
    description: "A living digital shadow for things people imagine, build, and test. The ink is where you think.",
    url: "https://www.twinth.ink",
    siteName: "TwinThink",
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icon.png?v=7", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico?v=7", sizes: "any" },
      { url: "/icon.svg?v=7", type: "image/svg+xml" }
    ],
    shortcut: "/favicon.ico?v=7",
    apple: "/apple-icon.png?v=7",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.ico?v=20260921" sizes="any" />
        <link rel="icon" href="/icon.png?v=20260921" type="image/png" />
        <link rel="icon" href="/icon.svg?v=20260921" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=20260921" />
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
