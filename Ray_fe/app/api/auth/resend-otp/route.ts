import { NextRequest, NextResponse } from 'next/server'
import { generateOTP, sendOTPEmail } from '@/lib/emailService'

export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json()) as { email: string }

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }

    const newOTP = generateOTP()
    const emailSent = await sendOTPEmail(email, newOTP)

    return NextResponse.json({
      success: true,
      message: emailSent
        ? `A new OTP has been sent to ${email}. Check your inbox.`
        : `OTP regenerated for ${email}. Email service is not configured — use the OTP from your server logs for testing.`,
    })
  } catch (error) {
    console.error('Resend OTP API error:', error)
    return NextResponse.json({ success: false, message: 'Failed to resend OTP' }, { status: 500 })
  }
}
