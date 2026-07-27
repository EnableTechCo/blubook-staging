import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  turbopack: {
    root: process.cwd(),
  },
  experimental: {
    // Allow document uploads through server actions (default is 1MB).
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
