/** @type {import('next').NextConfig} */
  const nextConfig = {
    experimental: {
      serverActions: {
        allowedOrigins: [
          '164.90.214.139', 
          'atlas-travel-platform.vercel.app',
          'atlas-platform-oka8lgo27-mohamed-redas-projects-35480832.vercel.app',
          'localhost:3000'
        ]
      }
    },
    async headers() {
      return [
        {
          source: '/api/(.*)',
          headers: [
            {
              key: 'Access-Control-Allow-Origin',
              value: '*',
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET, POST, PUT, DELETE, OPTIONS',
            },
            {
              key: 'Access-Control-Allow-Headers',
              value: 'Content-Type, Authorization, X-Requested-With',
            },
          ],
        },
      ]
    },
  }

  module.exports = nextConfig