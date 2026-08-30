import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "TwinThink | Open Engineering Digital Twin Platform",
  description: "Explore, simulate, and calibrate physical-to-digital engineering twins. Interactive thermodynamic ODE engine, telemetry validation, parametric CAD, and hardware BOM.",
  keywords: ["digital twin", "thermodynamic simulation", "hardware engineering", "open source hardware", "Resip", "sodium acetate", "thermal straw"],
  authors: [{ name: "Foxlendor" }],
  creator: "Foxlendor",
  publisher: "TwinThink",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "TwinThink | Resip™ Thermal Straw Digital Twin",
    description: "Battery-free, kinetic-impact thermal exchange straw digital twin with live thermodynamic ODE simulation and physical test telemetry.",
    url: "https://www.twinth.ink",
    siteName: "TwinThink",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TwinThink | Digital Twins for Physical Hardware",
    description: "Open digital twin ecosystem. Synchronized 3D CAD, thermodynamic ODE solver, and physical benchtop test calibration.",
    creator: "@siu3d",
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
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
