import nodemailer from 'nodemailer'
import path from 'path'
import { generateOTPEmailHTML } from './emailTemplate'

// Survive Next.js Turbopack hot-module-reload: a plain top-level Map gets
// recreated whenever this file is recompiled, which wipes every pending OTP
// mid-signup. Stash it on globalThis so the same Map instance is reused
// across module reloads.
type OtpStore = Map<string, { otp: string; expiresAt: number }>
const otpGlobal = globalThis as unknown as { __rayOtpStore?: OtpStore }
const otpStore: OtpStore = otpGlobal.__rayOtpStore ?? new Map()
otpGlobal.__rayOtpStore = otpStore

const EMAIL_CONFIG = {
  service: 'gmail',
  auth: {
    // .trim() guards against the common mistake of writing `EMAIL_USER= foo@bar`
    // in .env.local (space after the equals sign). dotenv passes that leading
    // space through as part of the value, and Gmail then rejects the whole
    // request as "Invalid login" (535 BadCredentials).
    user: (process.env.EMAIL_USER || 'connectwithvexar@gmail.com').trim(),
    // Gmail app password — 16 chars. Spaces (both around the value and inside
    // it as Gmail prints them) are stripped here.
    pass: (process.env.EMAIL_PASSWORD || 'abcdefghijklmnop').replace(/\s+/g, ''),
  },
}

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG)
  }
  return transporter
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  // Always store the OTP first so verification works even if the email send fails
  // (e.g. wrong app password in dev). The console log below makes the OTP
  // available in your dev terminal for testing.
  const expiresAt = Date.now() + 15 * 60 * 1000
  otpStore.set(email, { otp, expiresAt })
  cleanupExpiredOTPs()
  console.log(`[OTP] Code for ${email}: ${otp} (valid 15 min)`)

  try {
    const transporter = getTransporter()

    const senderAddress = EMAIL_CONFIG.auth.user

    // Image strategy:
    //  - If PUBLIC_BASE_URL is set (production), reference the mascot via an
    //    absolute https URL. This renders reliably in every webmail client
    //    (Gmail web, Gmail mobile, Outlook, Apple Mail, Yahoo).
    //  - If not set (local dev / no public URL), fall back to a CID inline
    //    attachment so the image still shows up.
    const publicBaseUrl = (process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || '')
      .replace(/\/+$/, '') // strip trailing slash
    const useHostedImage = publicBaseUrl.startsWith('http')

    const mascotSrc = useHostedImage
      ? `${publicBaseUrl}/images/ray-simple.png`
      : 'cid:ray-chatbot'

    const mailOptions: nodemailer.SendMailOptions = {
      from: `RAY by Vexar <${senderAddress}>`,
      to: email,
      replyTo: senderAddress,
      subject: 'Your RAY verification code',
      html: generateOTPEmailHTML(otp, email, mascotSrc),
      text:
        `Hi there,\n\n` +
        `Thanks for signing up with RAY.\n\n` +
        `Your verification code is: ${otp}\n\n` +
        `This code is valid for 15 minutes. Enter it on the verification page ` +
        `to finish setting up your account.\n\n` +
        `Security tip: RAY will never ask you to share this code with anyone. ` +
        `If you did not sign up for a RAY account, you can safely ignore this email — ` +
        `no account will be created.\n\n` +
        `Need help? Just reply to this email and we'll get back to you.\n\n` +
        `— The RAY Team at Vexar Tech`,
      headers: {
        'List-Unsubscribe': `<mailto:${senderAddress}?subject=unsubscribe>`,
        'X-Entity-Ref-ID': `ray-otp-${Date.now()}`,
      },
    }

    // Only attach the file when we're falling back to CID.
    if (!useHostedImage) {
      const mascotPath = path.join(process.cwd(), 'public', 'images', 'ray-simple.png')
      mailOptions.attachments = [
        {
          filename: 'ray-chatbot.png',
          path: mascotPath,
          cid: 'ray-chatbot',
        },
      ]
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`[OTP] Email sent to ${email} (image via ${useHostedImage ? 'URL' : 'CID'}):`, info.response)
    return true
  } catch (error) {
    console.error('[OTP] Failed to send email:', error)
    return false
  }
}

export function verifyOTP(email: string, otp: string): boolean {
  const stored = otpStore.get(email)
  if (!stored) {
    return false
  }
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email)
    return false
  }
  if (stored.otp !== otp) {
    return false
  }
  otpStore.delete(email)
  return true
}

export function cleanupExpiredOTPs(): void {
  const now = Date.now()
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(email)
    }
  }
}

export function resendOTP(email: string): string {
  const newOTP = generateOTP()
  sendOTPEmail(email, newOTP).catch((err) => {
    console.error('[OTP] Error resending:', err)
  })
  return newOTP
}
