/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/subcription-tracker',
  assetPrefix: '/subcription-tracker/',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
