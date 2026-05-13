/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // NEXT_PUBLIC_* env vars are exposed to the client automatically by Next.js,
  // so no explicit `env` block is needed. Removing the placeholder fallbacks
  // ensures missing prod vars fail loudly instead of silently shipping a
  // broken Supabase client.
}

export default nextConfig
