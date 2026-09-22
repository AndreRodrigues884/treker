import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server (HMR websocket included) work when browsing via
  // 127.0.0.1 instead of localhost — both resolve to the same machine,
  // but Next treats them as different origins and blocks dev resources
  // cross-origin by default.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
