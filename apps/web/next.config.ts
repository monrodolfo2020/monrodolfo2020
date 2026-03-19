import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@mall/types', '@mall/validators', '@mall/scoring'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
