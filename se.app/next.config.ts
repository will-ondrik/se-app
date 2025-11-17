import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/:path*", // TODO: update to your Go server URL/port
      },
    ];
  },
};

export default nextConfig;
