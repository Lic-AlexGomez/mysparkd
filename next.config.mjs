/** @type {import('next').NextConfig} */
const buildId =
  process.env.NETLIFY_COMMIT_REF ||
  process.env.COMMIT_REF ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  "local"

const nextConfig = {
  /** Fuerza hashes nuevos en `/_next/static/` cuando cambia el commit (evita CDN con JS viejo). */
  generateBuildId: async () => buildId,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|gif|avif)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ]
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns'],
  },
  compress: true,
  turbopack: {},
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    /** Commit desplegado (Netlify: COMMIT_REF). Comprueba en consola: document.documentElement.dataset.sparkdBuild */
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
}

export default nextConfig