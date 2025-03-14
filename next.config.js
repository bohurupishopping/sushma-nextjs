/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removing 'output: export' to enable middleware functionality
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    // Enabling image optimization since we're not using static export
    // unoptimized: true 
  },
  // Add trailingSlash for better compatibility
  trailingSlash: true,
  // Disable server components for static export
  experimental: {
    // appDir is now the default in newer Next.js versions and no longer needed
  }
};

module.exports = nextConfig;
