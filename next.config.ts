import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the browser preview (127.0.0.1) to load dev resources from the
  // dev server bound to localhost. Production is unaffected.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
