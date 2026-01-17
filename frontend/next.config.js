/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
    ],
    // Allow unoptimized images for better compatibility with proxied images
    unoptimized: false,
  },

  // Webpack configuration to handle optional dependencies from 'natural' package
  webpack: (config, { isServer }) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/apparatus/,
      },
      {
        module: /node_modules\/natural/,
      },
      {
        module: /lapack/,
      },
      {
        module: /webworker-threads/,
      },
    ];

    return config;
  },
};

module.exports = nextConfig;
