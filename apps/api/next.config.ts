import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Transpile workspace packages
  transpilePackages: [
    '@finmatter/types',
    '@finmatter/shared',
    '@finmatter/cc-engine',
  ],

  // Mark pdfjs-dist as external for server-side (prevents bundling ESM modules)
  serverExternalPackages: ['pdfjs-dist'],

  // Suppress warnings about ESM externals (pdfjs-dist worker is loaded at runtime)
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  webpack: (config, { isServer }) => {
    // Handle pdfjs-dist ESM module for server-side
    if (isServer) {
      // Mark pdfjs-dist and all its subpaths as external to avoid bundling issues
      const originalExternals = config.externals || [];

      // Function to check if a module should be externalized
      config.externals = [
        ...(Array.isArray(originalExternals)
          ? originalExternals
          : [originalExternals]),
        ({ request }: { request: string }, callback: Function) => {
          if (request === 'pdfjs-dist' || request?.startsWith('pdfjs-dist/')) {
            // Return undefined to use Node.js require() at runtime
            return callback();
          }
          callback();
        },
      ];
    }

    // Ignore canvas for server-side rendering (pdfjs-dist dependency)
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    return config;
  },
};

export default nextConfig;
