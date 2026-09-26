import type { NextConfig } from "next";

// The site is three quiet places: the front page, the Canvas, and support.
// Everything older leads to the Canvas.
const RETIRED = ["/roundup", "/bounties", "/explore", "/pitch", "/create", "/archive", "/capsule/:path*", "/twins/:path*"];

const nextConfig: NextConfig = {
  // no framework badge in anything shown or recorded
  devIndicators: false,
  async redirects() {
    return RETIRED.map((source) => ({ source, destination: "/canvas", permanent: false }));
  },
};

export default nextConfig;
