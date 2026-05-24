import { NextRequest, NextResponse } from 'next/server'
import { generateOTP, sendOTPEmail } from '@/lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json()) as { email: string }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }

    const otp = generateOTP()
    const emailSent = await sendOTPEmail(email, otp)

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `OTP sent to ${email}. Check your inbox.`
        : `OTP generated for ${email}. Email service is not configured. Use the OTP from your logs for testing.`,
    })
  } catch (error) {
    console.error('Send OTP API error:', error)
    return NextResponse.json({ success: false, message: 'Failed to send OTP' }, { status: 500 })
  }
}
