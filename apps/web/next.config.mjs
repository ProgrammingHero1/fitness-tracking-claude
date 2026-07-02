/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
