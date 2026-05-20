/**
 * Next.js configuration — مركز الغزلان ERP
 * Production-ready for Vercel / Netlify / Render / Railway / Docker / VPS
 */
const nextConfig = {
  // App Router (no /pages directory)
  // NOTE: `output: 'standalone'` is enabled only when explicitly building for Docker
  // because it conflicts with App-Router-only projects during page-data collection
  // on Next.js 14 (PageNotFoundError: /_document). Enable via env if needed.
  ...(process.env.BUILD_STANDALONE === 'true' ? { output: 'standalone' } : {}),

  reactStrictMode: false,
  poweredByHeader: false,

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  // mongodb is a server-only package — keep it external
  experimental: {
    serverComponentsExternalPackages: ['mongodb', 'bcryptjs'],
  },

  // Skip ESLint blocking on production builds (we lint separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  webpack(config, { dev, isServer }) {
    if (dev) {
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules'],
      };
    }
    // Avoid bundling fs/net for browser builds (leaflet etc.)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },

  async headers() {
    const corsOrigin = process.env.CORS_ORIGINS || '*';
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: corsOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: 'frame-ancestors *;' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
