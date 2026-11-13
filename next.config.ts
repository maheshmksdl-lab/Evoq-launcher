import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // The dev MCP endpoint writes every browser console message to
    // .next/dev/logs/next-development.log. On this Windows setup Turbopack's
    // watcher treats that write as a source change, so each page load logged
    // a line, triggered "Compiled", and reloaded the page in an endless loop.
    mcpServer: false,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
