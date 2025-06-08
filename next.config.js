/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // For Vercel compatibility with Median.io
  },
};

module.exports = nextConfig;