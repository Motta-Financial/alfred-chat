/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Type errors fail the build. `_legacy/` is excluded via tsconfig, so this
  // only covers live code — `pnpm typecheck` runs the same check locally.
  images: {
    unoptimized: true,
  },
  // NEXT_PUBLIC_* env vars are exposed to the client automatically by Next.js,
  // so no explicit `env` block is needed. Removing the placeholder fallbacks
  // ensures missing prod vars fail loudly instead of silently shipping a
  // broken Supabase client.
}

export default nextConfig
