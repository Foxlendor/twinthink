import type { NextConfig } from "next";

// The site is three quiet places: the front page, the Slate, and support.
// Everything older leads to the Slate (and the Canvas is the Slate now).
const RETIRED = ["/roundup", "/bounties", "/explore", "/pitch", "/create", "/archive", "/capsule/:path*", "/twins/:path*"];

const nextConfig: NextConfig = {
  // no framework badge in anything shown or recorded
  devIndicators: false,
  // which kind of deployment this is (production, preview, development): sample content may show
  // only on a preview or in development, never in production (see lib/shadowfield/sources/samples.ts)
  env: {
    NEXT_PUBLIC_DEPLOY_ENV: process.env.VERCEL_ENV ?? process.env.DEPLOY_ENV ?? (process.env.NODE_ENV === "development" ? "development" : "local"),
  },
  async redirects() {
    return [
      { source: "/canvas", destination: "/slate", permanent: true },
      { source: "/canvas/og", destination: "/slate/og", permanent: true },
      ...RETIRED.map((source) => ({ source, destination: "/slate", permanent: false })),
    ];
  },
};

export default nextConfig;
