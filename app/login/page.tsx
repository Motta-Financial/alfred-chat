"use client"

import { useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"

const ALLOWED_DOMAINS = ["@motta.cpa", "@mottafinancial.com"]

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmed = email.trim().toLowerCase()
    const allowed = ALLOWED_DOMAINS.some((d) => trimmed.endsWith(d))
    if (!allowed) {
      toast.error("Access restricted to @motta.cpa and @mottafinancial.com addresses.")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setSent(true)
    toast.success("Magic link sent — check your inbox.")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAE6E1]">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-16 h-16">
            <Image
              src="/images/alfred-logo.png"
              alt="ALFRED"
              fill
              className="object-contain"
              priority
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = "none"
              }}
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Sign in to ALFRED</h1>
            <p className="mt-1 text-sm text-gray-500">Motta Hub Assistant</p>
          </div>
        </div>

        {sent ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center space-y-2">
            <p className="text-sm font-medium text-amber-900">Check your inbox</p>
            <p className="text-sm text-amber-700">
              We emailed a magic link to <strong>{email}</strong>. Click it to sign in.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-amber-700 hover:text-amber-900"
              onClick={() => setSent(false)}
            >
              Use a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@mottafinancial.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="bg-white border-gray-200"
              />
              <p className="text-xs text-gray-400">@mottafinancial.com or @motta.cpa only</p>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {loading ? "Sending…" : "Send magic link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
