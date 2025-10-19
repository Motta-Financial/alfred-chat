"use client"

import type React from "react"

import { useUser, useClerk } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function DomainGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && user) {
      const email = user.primaryEmailAddress?.emailAddress

      // Check if user has a valid @mottafinancial.com email
      if (email && !email.endsWith("@mottafinancial.com")) {
        console.log("[v0] Unauthorized domain detected:", email)
        // Sign out and redirect to sign-in with error
        signOut().then(() => {
          router.push("/sign-in?error=unauthorized_domain")
        })
      }
    }
  }, [isLoaded, user, signOut, router])

  // Don't render children until we've verified the domain
  if (!isLoaded) {
    return null
  }

  if (user) {
    const email = user.primaryEmailAddress?.emailAddress
    if (email && !email.endsWith("@mottafinancial.com")) {
      return null
    }
  }

  return <>{children}</>
}
