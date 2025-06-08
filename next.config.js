/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // For Vercel compatibility with Median.io
  },
  typescript: {
    ignoreBuildErrors: false, // Ensure TypeScript errors fail the build
  },
};

module.exports = nextConfig;