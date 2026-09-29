import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the headless-Chromium packages as real node externals (not bundled by
  // webpack) and make sure the compressed Chromium binary is traced into the
  // serverless function that generates PDFs.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    // Every route that spins up headless Chromium needs the compressed binary
    // traced into its serverless bundle — otherwise executablePath() throws and
    // the PDF silently falls back to HTML / a link-only email.
    "/api/cron/send": ["./node_modules/@sparticuz/chromium/**"],
    "/api/render": ["./node_modules/@sparticuz/chromium/**"],
  },
};

export default nextConfig;
