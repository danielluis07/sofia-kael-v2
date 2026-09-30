import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // three ships untranspiled ESM (#2).
  transpilePackages: ["three"],
};

export default nextConfig;
