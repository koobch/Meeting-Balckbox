/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["*.replit.dev"],
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["pg"],
  },
};

export default nextConfig;
