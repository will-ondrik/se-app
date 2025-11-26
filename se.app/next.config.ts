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
  async redirects() {
    return [
      { source: "/web_analytics", destination: "/reports/web-analytics", permanent: true },
      { source: "/kpi_dashboard", destination: "/reports/kpi-analytics", permanent: true },
      { source: "/performance", destination: "/reports/performance", permanent: true },
      { source: "/app_dashboard", destination: "/dashboard", permanent: true },
      { source: "/job_detail/:id", destination: "/jobs/:id", permanent: true },
      { source: "/company_profile", destination: "/company-profile", permanent: true },
      { source: "/index", destination: "/", permanent: true },
      { source: "/landing", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
