/** @type {import('next').NextConfig} */
  const nextConfig = {
    experimental: {
      serverActions: {
        allowedOrigins: ['164.90.214.139', 'atlas-travel-platform.vercel.app']
      }
    },
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Access-Control-Allow-Origin',
              value: '*',
            },
          ],
        },
      ]
    },
  }

  module.exports = nextConfig