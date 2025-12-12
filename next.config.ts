import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone", // Enable standalone output for Docker deployment

  // Configure server-side externals for Pino
  serverExternalPackages: ["pino", "pino-pretty"],
};

export default nextConfig;
