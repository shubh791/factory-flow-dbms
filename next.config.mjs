/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pdfkit', '@prisma/client', 'prisma'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
