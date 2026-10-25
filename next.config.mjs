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
}

export default nextConfig
