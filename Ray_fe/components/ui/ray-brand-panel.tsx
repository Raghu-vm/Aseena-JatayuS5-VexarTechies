'use client'

/**
 * RayBrandPanel — the lilac side-panel used on login, signup, and OTP pages.
 *
 * Centralised so all three auth pages share one source of visual truth.
 * Each page passes a `variant` to pick its mascot + intro line; layout
 * (which side it sits on) is controlled by the parent page via CSS order.
 *
 * Image strategy:
 *   - Tries the named image first (e.g. /ray-landing.png).
 *   - If it 404s, falls back to /ray-robot.png automatically.
 *   - mix-blend-mode: multiply blends any residual white backdrop into
 *     the lilac wash so background-free PNGs look properly transparent.
 */

import { useState } from 'react'
import Image from 'next/image'

export type RayBrandVariant = 'login' | 'signup' | 'otp'

interface RayBrandPanelProps {
  variant: RayBrandVariant
  /** Optional override for the gradient direction or color */
  className?: string
}

const COPY: Record<RayBrandVariant, { eyebrow: string; title: string; body: string; mascot: string }> = {
  login: {
    eyebrow: 'AI-powered workspace',
    title: 'Hey, welcome back!',
    body: "I'm RAY. Sign in and I'll catch you up on what's happened while you were away.",
    mascot: 'ray-landing.png',
  },
  signup: {
    eyebrow: 'Free for individuals',
    title: "Hi, I'm RAY!",
    body: "I'll be your AI sidekick from day one. Set up your account and let's get going.",
    mascot: '/ray-welcome.png',
  },
  otp: {
    eyebrow: 'Almost there',
    title: 'Just one more step!',
    body: "I've sent a 6-digit code to your inbox. Pop it in on the right and you're in.",
    mascot: '/ray-simple.png',
  },
}

export default function RayBrandPanel({ variant, className = '' }: RayBrandPanelProps) {
  const copy = COPY[variant]
  const [imgSrc, setImgSrc] = useState(copy.mascot)

  // signup gets the deeper-violet wash; login + otp get the softer lilac
  const gradient =
    variant === 'signup'
      ? 'linear-gradient(180deg, #fafcfd 0%, #ffffff 100%)'
      : 'linear-gradient(180deg, #FBFAFD 0%, #ffffff 100%)'

  return (
    <div
      className={`hidden lg:flex lg:w-[42%] relative overflow-hidden ${className}`}
      style={{ background: gradient }}
    >
      {/* Subtle decorative orbs — picked to enhance the wash, not compete */}
      <div
        aria-hidden
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full"
        style={{ background: 'rgba(123, 91, 255, 0.08)', filter: 'blur(60px)' }}
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full"
        style={{ background: 'rgba(0, 184, 212, 0.06)', filter: 'blur(60px)' }}
      />

      <div className="relative z-10 flex flex-col justify-between p-12 w-full" style={{ color: '#1E1240' }}>
        
        {/* Mascot + speech bubble area */}
        {/* Speech bubble on TOP, mascot BELOW */}
        <div className="flex flex-col items-center gap-6 py-8">
          {/* Intro card — looks like a thought hovering above RAY */}
          <div
            className="relative rounded-2xl px-5 py-4 max-w-[560px] w-full"
            style={{
              background: '#FFFFFF',
              border: '1px solid #EDE7FF',
              boxShadow: '0 4px 20px rgba(45, 27, 92, 0.06)',
            }}
          >
            <p
              className="text-[10px] tracking-[0.12em] uppercase font-semibold mb-1.5"
              style={{ color: '#7B5BFF' }}
            >
              {copy.eyebrow}
            </p>
            <h2
              className="text-xl font-semibold leading-snug mb-2"
              style={{ color: '#1E1240' }}
            >
              {copy.title}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#5A4A8A' }}>
              {copy.body}
            </p>
            {/* Speech-bubble tail pointing DOWN to the mascot */}
            <div
              aria-hidden
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45"
              style={{
                background: '#FFFFFF',
                borderRight: '1px solid #EDE7FF',
                borderBottom: '1px solid #EDE7FF',
              }}
            />
          </div>

          {/* Mascot below the bubble */}
          <div className="relative w-full max-w-[780px] aspect-square">
            <Image
              src={imgSrc}
              alt={`RAY ${variant}`}
              fill
              priority
              sizes="(min-width: 1024px) 780px, 0px"
              style={{
                objectFit: 'contain',
                mixBlendMode: 'multiply',
              }}
              onError={() => {
                if (imgSrc !== '/ray-robot.png') setImgSrc('/ray-robot.png')
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs" style={{ color: '#5A4A8A' }}>
          © 2026 Vexar Tech · Made with care in Chennai
        </p>
      </div>
    </div>
  )
}
