/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip type checking during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Configure static page generation
  output: 'standalone',
  // Improve image handling
  images: {
    unoptimized: true, // Disable image optimization to prevent issues in production
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;