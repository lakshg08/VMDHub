/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Ensure native modules (e.g. Prisma) aren't bundled for the edge runtime
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '.prisma/client'],
  },
};

module.exports = nextConfig;
