"use client"

// Domain enforcement happens server-side in app/login/page.tsx
// (signInWithOtp rejects non-allowed domains before sending a link).
// This component is kept as a thin pass-through so imports don't break
// during the transition. It can be removed once the full layout lands.
export function DomainGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
