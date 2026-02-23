import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'thumbnail.image.rakuten.co.jp',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.image.rakuten.co.jp',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://your-interviewer.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
