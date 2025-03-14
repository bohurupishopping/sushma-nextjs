/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Add trailingSlash for better static export compatibility
  trailingSlash: true,
  // Remove deprecated appDir option as it's now the default in Next.js 13+
  experimental: {
    // The appDir option has been removed
  }
};

module.exports = nextConfig;
