/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['pdfkit', '@prisma/client', 'prisma'],
};

export default nextConfig;
