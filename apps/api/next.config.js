/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  transpilePackages: [
    '@finmatter/types',
    '@finmatter/shared',
    '@finmatter/cc-engine',
  ],
};

module.exports = nextConfig;
