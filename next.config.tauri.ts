import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // Static HTML export for Tauri

  // Disable image optimization (not supported in static export)
  images: {
    unoptimized: true,
  },

  // Disable trailing slashes for consistent routing
  trailingSlash: true,

  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "https://learntotarkov.com",
  },

  // Disable server-side features
  // API routes, middleware, and server components won't be available
  // The Tauri app will call the production API instead
};

export default nextConfig;
