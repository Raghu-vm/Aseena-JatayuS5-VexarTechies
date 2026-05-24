/**
 * Tip-of-the-day messages from RAY. Picked deterministically by day-of-year
 * so the same user sees the same tip all day (but it rotates daily).
 */

export const RAY_TIPS: { tip: string; icon: string }[] = [
  { tip: "Stuck on a password reset? Ask me — it's faster than waiting on IT.", icon: '🔑' },
  { tip: "Did you know? You can ask me about leave policies in plain English.", icon: '🌴' },
  { tip: "Need your last payslip? Just ask 'show me my March payslip'.", icon: '💸' },
  { tip: "Setting up VPN for the first time? I have a step-by-step guide ready.", icon: '🌐' },
  { tip: "Submitting an expense? I can walk you through the form field by field.", icon: '🧾' },
  { tip: "Hardware request stuck? I can check the status if you give me the ticket ID.", icon: '💻' },
  { tip: "Meeting room booked but display not working? Try the AV troubleshooting flow with me.", icon: '📺' },
  { tip: "I learn from every chat — if my answer was off, tell me and I improve next time.", icon: '🧠' },
  { tip: "You can raise a support ticket directly from our conversation. No forms.", icon: '🎫' },
  { tip: "Onboarding a teammate? I can send them a personalised welcome kit.", icon: '👋' },
  { tip: "Looking for a policy doc? I read all of them, just ask for the one you need.", icon: '📄' },
  { tip: "Out of office tomorrow? I can update your calendar and notify your team.", icon: '🏖️' },
  { tip: "Don't know which department to ask? Describe the issue — I'll route it.", icon: '🧭' },
  { tip: "Most of your queries get resolved without a ticket. That's the goal.", icon: '✨' },
  { tip: "You can ask me in any tone — short, formal, casual. Whatever's natural.", icon: '💬' },
]

export function getTipOfTheDay(): { tip: string; icon: string } {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const diff = Date.now() - start.getTime()
  const day = Math.floor(diff / (1000 * 60 * 60 * 24))
  return RAY_TIPS[day % RAY_TIPS.length]
}
