import { NextRequest, NextResponse } from 'next/server'
import { verifyOTP } from '@/lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = (await request.json()) as { email: string; otp: string }

    if (!email || typeof email !== 'string' || !otp || typeof otp !== 'string') {
      return NextResponse.json({ success: false, message: 'Email and OTP are required' }, { status: 400 })
    }

    const isValid = verifyOTP(email, otp)
    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Invalid or expired OTP' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'OTP verified successfully' })
  } catch (error) {
    console.error('Verify OTP API error:', error)
    return NextResponse.json({ success: false, message: 'Failed to verify OTP' }, { status: 500 })
  }
}
