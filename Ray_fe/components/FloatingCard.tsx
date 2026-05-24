'use client'

import { CSSProperties, ReactNode } from 'react'

interface FloatingCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export default function FloatingCard({ children, className = '', style }: FloatingCardProps) {
  return (
    <div
      className={`bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}
