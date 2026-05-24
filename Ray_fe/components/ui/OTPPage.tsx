'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import RayBrandPanel from './ray-brand-panel'

interface OTPPageProps {
  email: string
  onVerified: () => void
  onBack: () => void
}

const RESEND_COOLDOWN_SECONDS = 60

export default function OTPPage({ email, onVerified, onBack }: OTPPageProps) {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [resendMessage, setResendMessage] = useState('')
  const [cooldown, setCooldown] = useState<number>(RESEND_COOLDOWN_SECONDS)
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  // Countdown ticker
  useEffect(() => {
    if (cooldown <= 0) return
    const id = setInterval(() => {
      setCooldown((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(id)
  }, [cooldown])

  // Auto-focus first OTP box on mount
  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const formatCooldown = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value.replace(/[^0-9]/g, '')
    setOtp(newOtp)
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = ['', '', '', '', '', '']
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setOtp(next)
    const lastFilled = Math.min(pasted.length, 6) - 1
    inputsRef.current[Math.min(lastFilled + 1, 5)]?.focus()
  }

  const handleVerify = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }
    setIsVerifying(true)
    setError('')
    setResendMessage('')
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      })
      const result = (await response.json()) as { success: boolean; message: string }
      if (result.success) {
        onVerified()
      } else {
        setError(result.message || 'Invalid OTP. Please try again.')
        setOtp(['', '', '', '', '', ''])
        inputsRef.current[0]?.focus()
      }
    } catch (err) {
      console.error('Verify error:', err)
      setError('Verification failed. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputsRef.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return
    setIsResending(true)
    setError('')
    setResendMessage('')
    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const result = (await response.json()) as { success: boolean; message: string }
      if (result.success) {
        setResendMessage(result.message || 'New code sent. Check your inbox!')
        setOtp(['', '', '', '', '', ''])
        setCooldown(RESEND_COOLDOWN_SECONDS)
        inputsRef.current[0]?.focus()
      } else {
        setError(result.message || 'Failed to resend code. Please try again.')
      }
    } catch (err) {
      console.error('Resend error:', err)
      setError('Failed to resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* OTP: form on the LEFT, brand panel on the RIGHT (matches login) */}

      {/* Left: OTP form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Verify your email</h1>
          <p className="text-gray-500 mb-8">
            Enter the 6-digit code we sent to{' '}
            <span className="font-medium text-gray-900">{email}</span>
          </p>

          <div className="space-y-6">
            <div>
              <div className="flex gap-2 justify-between">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputsRef.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    maxLength={1}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-semibold border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all bg-white text-gray-900"
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {resendMessage && (
              <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                <p className="text-sm text-green-700">{resendMessage}</p>
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={isVerifying || otp.join('').length !== 6}
              className="w-full py-3.5 bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify and continue'
              )}
            </button>

            <div className="text-center text-sm">
              {cooldown > 0 ? (
                <p className="text-gray-500">
                  Didn&apos;t get the code? Resend in{' '}
                  <span className="font-semibold text-gray-900 tabular-nums">
                    {formatCooldown(cooldown)}
                  </span>
                </p>
              ) : (
                <p className="text-gray-500">
                  Didn&apos;t get the code?{' '}
                  <button
                    onClick={handleResend}
                    disabled={isResending}
                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Resending...
                      </>
                    ) : (
                      'Resend code'
                    )}
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: brand panel */}
      <RayBrandPanel variant="otp" />
    </div>
  )
}
