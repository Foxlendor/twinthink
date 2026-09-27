import type { NextConfig } from "next";

// The site is three quiet places: the front page, the Slate, and support.
// Everything older leads to the Slate (and the Canvas is the Slate now).
const RETIRED = ["/roundup", "/bounties", "/explore", "/pitch", "/create", "/archive", "/capsule/:path*", "/twins/:path*"];

const nextConfig: NextConfig = {
  // no framework badge in anything shown or recorded
  devIndicators: false,
  async redirects() {
    return [
      { source: "/canvas", destination: "/slate", permanent: true },
      { source: "/canvas/og", destination: "/slate/og", permanent: true },
      ...RETIRED.map((source) => ({ source, destination: "/slate", permanent: false })),
    ];
  },
};

export default nextConfig;
