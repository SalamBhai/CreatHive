import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Self-hosted scripts/styles only; no inline event handlers or eval.
            // YouTube/Vimeo embeds, Supabase, Cloudinary and Brevo remain allowed.
            value: [
              "default-src 'self'",
              // Next.js injects inline bootstrap scripts; 'unsafe-inline' is
              // required for them. HTML is sanitized separately in sanitize.ts.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' https://*.supabase.co https://api.brevo.com",
              "frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com",
              "font-src 'self' data:",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
      {
        // The service worker must never be cached by the browser — otherwise
        // users keep an old shell after a deploy.
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  // React Compiler handles memoisation automatically (no manual useMemo/useCallback needed).
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
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
