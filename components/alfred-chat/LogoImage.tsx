"use client"

import Image from "next/image"

interface LogoImageProps {
  className?: string
  size?: number
}

export function LogoImage({ className, size = 32 }: LogoImageProps) {
  return (
    <Image
      src="/images/alfred-logo.png"
      alt="ALFRED"
      width={size}
      height={size}
      className={className}
      priority
      onError={(e) => {
        ;(e.currentTarget as HTMLImageElement).style.display = "none"
      }}
    />
  )
}
