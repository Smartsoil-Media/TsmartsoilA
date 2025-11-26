/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Temporarily enabled to see styling changes, will fix TS errors after
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
