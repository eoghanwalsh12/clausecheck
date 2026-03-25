/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // react-pdf needs canvas to be treated as external
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
