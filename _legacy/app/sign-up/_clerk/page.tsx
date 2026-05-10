"use client"

import { SignUp } from "@clerk/nextjs"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function SignUpContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Join ALFRED AI</h1>
          <p className="text-slate-400">Motta Financial Virtual Butler</p>
          <p className="text-sm text-slate-500 mt-4">
            Sign up with your @mottafinancial.com email or Microsoft 365 account
          </p>
          {error === "unauthorized_domain" && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">Access restricted to @mottafinancial.com email addresses only.</p>
            </div>
          )}
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-slate-800 shadow-xl",
            },
          }}
        />
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  )
}
