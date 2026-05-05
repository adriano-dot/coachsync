/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-project.supabase.co'],
  },
  experimental: {
    serverComponentsExternalPackages: ['anthropic'],
  },
}

module.exports = nextConfig
