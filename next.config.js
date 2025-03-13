/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Add trailingSlash for better static export compatibility
  trailingSlash: true,
  // Disable server components for static export
  experimental: {
    appDir: true,
  }
};

module.exports = nextConfig;
