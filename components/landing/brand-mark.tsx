import Image from "next/image"

interface BrandMarkProps {
  className?: string
  size?: number
}

export function BrandMark({ className, size = 32 }: BrandMarkProps) {
  return (
    <Image
      src="/icon.svg"
      alt="BookIA"
      width={size}
      height={size}
      className={className}
      priority
    />
  )
}