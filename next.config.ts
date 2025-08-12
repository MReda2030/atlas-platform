import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for performance
  experimental: {
    optimizePackageImports: ['@tanstack/react-query', 'lucide-react'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // React Query in separate chunk
            reactQuery: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]react-query/,
              name: 'react-query',
              priority: 30,
              reuseExistingChunk: true,
            },
            // UI components in separate chunk
            ui: {
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              name: 'ui-components',
              priority: 25,
              reuseExistingChunk: true,
            },
            // Analytics components in separate chunk
            analytics: {
              test: /[\\/]src[\\/]app[\\/].*analytics[\\/]/,
              name: 'analytics',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Default vendors
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    // Development optimizations
    if (dev) {
      // Faster builds in development
      config.watchOptions = {
        poll: false,
        ignored: /node_modules/,
      };
    }

    return config;
  },

  // Image optimization with CDN support
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // CDN configuration for images (optional)
    ...(process.env.CDN_URL && {
      domains: [new URL(process.env.CDN_URL).hostname],
      loader: 'custom',
      loaderFile: './src/lib/cdn-loader.ts'
    })
  },

  // CDN configuration for static assets
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.STATIC_ASSETS_CDN || '' : '',

  // Compression
  compress: true,
  
  // PoweredBy header removal for security
  poweredByHeader: false,

  // Headers for performance and CDN optimization
  async headers() {
    return [
      // Security headers for all routes
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Static assets caching (Images, fonts, etc.)
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year
          },
        ],
      },
      {
        source: '/(.*\\.(?:ico|png|jpg|jpeg|gif|webp|avif|svg))$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year
          },
        ],
      },
      // Font files
      {
        source: '/(.*\\.(?:woff|woff2|ttf|otf|eot))$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year
          },
        ],
      },
      // JavaScript and CSS files
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year
          },
        ],
      },
      // Service Worker
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate', // Always revalidate
          },
        ],
      },
      // Manifest file
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400', // 1 day
          },
        ],
      },
      // API routes with different caching strategies
      {
        source: '/api/master-data/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=1800, s-maxage=3600', // 30 min browser, 1 hour CDN
          },
        ],
      },
      {
        source: '/api/dashboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=180, s-maxage=300', // 3 min browser, 5 min CDN
          },
        ],
      },
      // Health check endpoint
      {
        source: '/api/health',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};
