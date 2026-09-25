import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the headless-Chromium packages as real node externals (not bundled by
  // webpack) and make sure the compressed Chromium binary is traced into the
  // serverless function that generates PDFs.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/cron/send": ["./node_modules/@sparticuz/chromium/**"],
  },
};

export default nextConfig;
