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
  env: {
    // Fallback placeholder values allow the build to succeed without env vars.
    // Real values are injected by Vercel at build time and override these.
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key",
    NEXT_PUBLIC_HUB_CHAT_URL:
      process.env.NEXT_PUBLIC_HUB_CHAT_URL ?? "https://app.motta.cpa/api/alfred/chat",
    NEXT_PUBLIC_HUB_CONVERSATIONS_URL:
      process.env.NEXT_PUBLIC_HUB_CONVERSATIONS_URL ??
      "https://app.motta.cpa/api/alfred/conversations",
  },
}

export default nextConfig
