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
  // shared links and their cards resolve against the site itself
  metadataBase: new URL("https://twinth.ink"),
  title: "twinth.ink",
  description: "A place where ideas are kept, given away, and built on.",
  authors: [{ name: "anonymous" }],
  creator: "anonymous",
  publisher: "TwinThink",
  openGraph: {
    title: "twinth.ink",
    description: "A place where ideas are kept, given away, and built on.",
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
      style={{ background: 'var(--bg-primary)' }}
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        {/* TwinThink is night-only: night is set on the page itself and again before the first paint, whatever the system says; an old saved day choice is cleared */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.setAttribute('data-theme','dark');try{localStorage.removeItem('twinthink.night.v1')}catch(e){}`,
          }}
        />
        <link rel="icon" href="/favicon.ico?v=20260921" sizes="any" />
        <link rel="icon" href="/icon.png?v=20260921" type="image/png" />
        <link rel="icon" href="/icon.svg?v=20260921" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=20260921" />
      </head>
      <body className="min-h-full flex flex-col" style={{ color: 'var(--text-primary)' }}>
        <Navbar />
        <div style={{ flex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
