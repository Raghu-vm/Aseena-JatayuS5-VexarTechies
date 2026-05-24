'use client'

import { useState } from 'react'
import {
  Play,
  X,
  Search,
  Zap,
  MessageSquare,
  Shield,
  Clock,
  FileText,
  Database,
  Code,
  Smartphone,
  Check,
  ArrowRight,
  Sparkles,
  Briefcase,
  Building2,
  Users,
  Brain,
  Workflow,
  Lock,
  BookOpen,
  Newspaper,
  GraduationCap,
  HelpCircle,
  TrendingUp,
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import FloatingCard from '@/components/FloatingCard'
import FeatureCard from '@/components/FeatureCard'
import { ImageWithFallback } from '@/components/figma/ImageWithFallback'

interface LandingPageProps {
  onSignup: () => void
  onLogin: () => void
}

// 11-character YouTube video ID. Swap this with your real demo video later.
// To find: from a YouTube URL like https://www.youtube.com/watch?v=dQw4w9WgXcQ
// the ID is the part after "v=".
const DEMO_VIDEO_ID = 'dQw4w9WgXcQ' // placeholder — replace with real demo

export default function LandingPage({ onSignup, onLogin }: LandingPageProps) {
  const [videoOpen, setVideoOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100">
      <Navbar onSignIn={onLogin} />

      {/* ============= HERO ============= */}
      <main id="hero" className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-700">AI-Powered RAG Solutions</span>
              </div>

              <div>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
                  Smarter AI.
                  <br />
                  Better Answers.
                  <br />
                  <span className="text-blue-500">Stronger Workflows.</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-lg">
                  RAY powers your enterprise knowledge with AI. Handle automation, and drive
                  actionable insights with unmatched precision.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={onSignup}
                  className="px-8 py-3.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => setVideoOpen(true)}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white/60 hover:bg-white/80 backdrop-blur-sm text-blue-600 rounded-xl font-semibold shadow-md border border-white/50 transition-all hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-blue-600" />
                  <span>Watch Demo</span>
                </button>
              </div>
            </div>

            {/* Hero illustration with floating cards */}
            <div className="hidden lg:flex items-center justify-center relative h-auto">
              <div className="relative w-full max-w-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200/40 via-blue-100/20 to-blue-200/40 rounded-3xl blur-3xl"></div>

                <div className="relative z-10 flex items-center justify-center">
                  <ImageWithFallback
                    src="/images/ray-simple.png"
                    alt="RAY AI Assistant"
                    className="w-full h-auto drop-shadow-2xl"
                  />
                </div>

                <FloatingCard className="absolute -top-8 -left-12 p-4 animate-bounce z-20" style={{ animationDelay: '0s' }}>
                  <p className="text-xs text-gray-500 font-medium">Hello!</p>
                  <p className="text-sm font-semibold text-blue-600">How can I help you?</p>
                </FloatingCard>

                <FloatingCard className="absolute top-4 -right-8 p-3 animate-bounce z-20" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Active Now</p>
                      <p className="text-sm font-bold text-gray-900">24/7</p>
                    </div>
                  </div>
                </FloatingCard>

                <FloatingCard className="absolute right-0 top-1/3 p-3 animate-bounce z-20" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Knowledge</p>
                      <p className="text-sm font-bold text-gray-900">Found</p>
                    </div>
                  </div>
                </FloatingCard>

                <FloatingCard className="absolute -bottom-6 -left-12 p-3 animate-bounce z-20" style={{ animationDelay: '0.6s' }}>
                  <p className="text-sm text-gray-700">Ask anything...</p>
                </FloatingCard>

                <FloatingCard className="absolute -bottom-4 right-8 p-3 animate-bounce z-20" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Summary</p>
                      <div className="space-y-1">
                        <div className="h-1 bg-gray-200 rounded-full w-16"></div>
                        <div className="h-1 bg-gray-200 rounded-full w-14"></div>
                      </div>
                    </div>
                  </div>
                </FloatingCard>

                <FloatingCard className="absolute -bottom-12 right-0 p-2 animate-bounce z-20" style={{ animationDelay: '0.5s' }}>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Search className="w-4 h-4 text-blue-600" />
                  </div>
                </FloatingCard>
              </div>
            </div>
          </div>

          {/* ============= FEATURES ============= */}
          <section id="features" className="mt-32 scroll-mt-24">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold mb-4">
                Features
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything you need in one AI workspace
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Six capabilities working together so your team finds answers faster and acts on
                them with confidence.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Brain className="w-6 h-6 text-blue-500" />}
                iconBgColor="bg-blue-50"
                title="Retrieval-Augmented AI"
                description="Answers are grounded in your own documents — no hallucinations, just verifiable facts."
              />
              <FeatureCard
                icon={<MessageSquare className="w-6 h-6 text-green-500" />}
                iconBgColor="bg-green-50"
                title="Conversational interface"
                description="Ask questions the way you'd ask a colleague. RAY remembers context across the chat."
              />
              <FeatureCard
                icon={<Shield className="w-6 h-6 text-purple-500" />}
                iconBgColor="bg-purple-50"
                title="Enterprise security"
                description="End-to-end encryption, SSO support, role-based access. Your data never trains public models."
              />
              <FeatureCard
                icon={<Workflow className="w-6 h-6 text-amber-500" />}
                iconBgColor="bg-amber-50"
                title="Workflow automation"
                description="Trigger actions, route tickets, summarize threads — automate the busywork in your day."
              />
              <FeatureCard
                icon={<TrendingUp className="w-6 h-6 text-pink-500" />}
                iconBgColor="bg-pink-50"
                title="Insights & analytics"
                description="Track what your team is asking. Spot trends, gaps, and opportunities in real time."
              />
              <FeatureCard
                icon={<Lock className="w-6 h-6 text-slate-600" />}
                iconBgColor="bg-slate-100"
                title="Audit-ready logs"
                description="Every query, response, and document access logged. Stay compliant without effort."
              />
            </div>
          </section>

          {/* ============= SOLUTIONS ============= */}
          <section id="solutions" className="mt-32 scroll-mt-24">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-semibold mb-4">
                Solutions
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Built for every role in your team
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                One platform, three experiences. Each tailored to what the role actually needs to
                do.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">For Employees</h3>
                <p className="text-gray-600 mb-4">
                  Instant answers from your company's knowledge base. Stop hunting through SharePoint.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Self-serve answers in seconds</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Document & policy lookup</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Task & ticket assistance</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm border-2 border-blue-500 hover:shadow-xl transition-shadow relative">
                <span className="absolute -top-3 left-8 px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                  Most popular
                </span>
                <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                  <Briefcase className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">For Admins</h3>
                <p className="text-gray-600 mb-4">
                  Full control of your knowledge base, users, and AI behavior. Configure RAY for your org.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />User & role management</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Document ingestion & tagging</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />System-wide settings & integrations</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="w-14 h-14 bg-cyan-100 rounded-2xl flex items-center justify-center mb-6">
                  <Building2 className="w-7 h-7 text-cyan-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">For Executives</h3>
                <p className="text-gray-600 mb-4">
                  Strategic intelligence at a glance. KPIs, risks, and trends pulled from across the company.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Executive dashboards</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Alerts & risk surfacing</li>
                  <li className="flex gap-2"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Audit logs & compliance reports</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ============= HOW IT WORKS ============= */}
          <section id="how-it-works" className="mt-32 scroll-mt-24">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-semibold mb-4">
                How it Works
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Get up and running in three steps
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                No long implementations. No consultants. Most teams are live the same day.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg">
                  1
                </div>
                <Database className="w-10 h-10 text-blue-500 mb-4 mt-2" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Connect your data</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Upload documents or sync your existing tools — Google Drive, SharePoint,
                  Confluence, Notion. RAY indexes everything securely.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-purple-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg">
                  2
                </div>
                <Users className="w-10 h-10 text-purple-500 mb-4 mt-2" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Invite your team</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Add team members and assign roles — Employee, Admin, or Executive. Each gets a
                  tailored dashboard with the right tools.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg">
                  3
                </div>
                <Sparkles className="w-10 h-10 text-green-500 mb-4 mt-2" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Start asking</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  That's it. Ask RAY anything in natural language. It pulls from your sources and
                  always cites where the answer came from.
                </p>
              </div>
            </div>
          </section>

          {/* ============= RESOURCES ============= */}
          <section id="resources" className="mt-32 scroll-mt-24">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-semibold mb-4">
                Resources
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Learn, build, and stay ahead</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Guides, articles, and tutorials to help you get the most out of RAY.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <a href="#" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Documentation</h3>
                <p className="text-sm text-gray-600 mb-3">Setup guides, API reference, integrations.</p>
                <span className="text-sm font-medium text-blue-600 group-hover:gap-2 transition-all inline-flex items-center gap-1">
                  Read docs <ArrowRight className="w-4 h-4" />
                </span>
              </a>
              <a href="#" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                  <Newspaper className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Blog</h3>
                <p className="text-sm text-gray-600 mb-3">Customer stories, product updates, AI insights.</p>
                <span className="text-sm font-medium text-blue-600 group-hover:gap-2 transition-all inline-flex items-center gap-1">
                  Read articles <ArrowRight className="w-4 h-4" />
                </span>
              </a>
              <a href="#" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Tutorials</h3>
                <p className="text-sm text-gray-600 mb-3">Step-by-step video walkthroughs for common tasks.</p>
                <span className="text-sm font-medium text-blue-600 group-hover:gap-2 transition-all inline-flex items-center gap-1">
                  Watch now <ArrowRight className="w-4 h-4" />
                </span>
              </a>
              <a href="#" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center mb-4">
                  <HelpCircle className="w-6 h-6 text-pink-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Help Center</h3>
                <p className="text-sm text-gray-600 mb-3">Common questions answered. Get unstuck in minutes.</p>
                <span className="text-sm font-medium text-blue-600 group-hover:gap-2 transition-all inline-flex items-center gap-1">
                  Find answers <ArrowRight className="w-4 h-4" />
                </span>
              </a>
            </div>
          </section>

          {/* ============= PRICING ============= */}
          <section id="pricing" className="mt-32 scroll-mt-24">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold mb-4">
                Pricing
              </span>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple pricing, every role covered</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Start free with the RAY Chatbot. Upgrade when you're ready for admin controls and
                executive intelligence.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Free tier */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">RAY Chatbot</h3>
                </div>
                <p className="text-gray-600 mb-6 text-sm">For individuals exploring AI-powered Q&amp;A.</p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-gray-900">Free</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Forever. No credit card needed.</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex gap-2 text-sm text-gray-700"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Conversational Q&amp;A with your docs</li>
                  <li className="flex gap-2 text-sm text-gray-700"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Up to 100 queries / month</li>
                  <li className="flex gap-2 text-sm text-gray-700"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Basic knowledge base</li>
                  <li className="flex gap-2 text-sm text-gray-700"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Email support</li>
                </ul>
                <button
                  onClick={onSignup}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-semibold transition-colors"
                >
                  Get started free
                </button>
              </div>

              {/* Pro tier — RAY Admin */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8 shadow-2xl shadow-blue-500/30 flex flex-col relative scale-105">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">
                  Most popular
                </span>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">RAY Admin</h3>
                </div>
                <p className="text-blue-100 mb-6 text-sm">Pro version for teams that need control.</p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold">₹299</span>
                    <span className="text-blue-200">/month</span>
                  </div>
                  <p className="text-sm text-blue-200 mt-1">per admin seat, billed monthly.</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />Everything in RAY Chatbot</li>
                  <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />Unlimited queries</li>
                  <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />User &amp; role management</li>
                  <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />Document ingestion &amp; tagging</li>
                  <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />Workflow automation</li>
                  <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />Priority email support</li>
                </ul>
                <button
                  onClick={onSignup}
                  className="w-full py-3 bg-white text-blue-700 hover:bg-blue-50 rounded-xl font-semibold transition-colors"
                >
                  Upgrade to Pro
                </button>
              </div>

              {/* Premium tier — RAY Executive */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-cyan-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">RAY Executive</h3>
                </div>
                <p className="text-gray-600 mb-6 text-sm">Super Ray Premium for leadership teams.</p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold text-gray-900">₹2,999</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">per executive seat, billed monthly.</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex gap-2 text-sm text-gray-700"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Everything in RAY Admin</li>
                  <li className="flex gap-2 text-sm text-gray-700"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Executive intelligence dashboards</li>
                  <li className="flex gap-2 text-sm text-gray-700"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Operational risk &amp; alerts</li>
                  <li className="flex gap-2 text-sm text-gray-700"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Audit-ready logs &amp; reports</li>
                  <li className="flex gap-2 text-sm text-gray-700"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />SSO &amp; advanced security</li>
                  <li className="flex gap-2 text-sm text-gray-700"><Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />Dedicated success manager</li>
                </ul>
                <button
                  onClick={onSignup}
                  className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-colors"
                >
                  Talk to sales
                </button>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-8">
              All plans include end-to-end encryption, GDPR compliance, and a 14-day money-back guarantee.
            </p>
          </section>

          {/* ============= CHATBOT CTA STRIP ============= */}
          <div className="mt-32 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 rounded-3xl p-12 shadow-2xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-white space-y-6">
                <h2 className="text-4xl font-bold">
                  Meet RAY
                  <br />
                  <span className="text-blue-400">Your AI Assistant</span>
                </h2>
                <p className="text-lg text-gray-300">
                  Experience intelligent automation. RAY transforms your workflow and provides
                  instant, accurate, source-backed answers to every query.
                </p>
                <div className="flex gap-4 flex-wrap">
                  <button
                    onClick={onSignup}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all hover:scale-105"
                  >
                    Try RAY Now
                  </button>
                  <button
                    onClick={() => setVideoOpen(true)}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold border border-white/20 transition-all"
                  >
                    Watch Demo
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <ImageWithFallback
                  src="/images/ray-landing.png"
                  alt="RAY AI Dashboard"
                  className="w-full max-w-sm h-auto drop-shadow-2xl"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-20 text-center pb-8">
            <p className="text-gray-600 font-medium">
              Powered by <span className="text-blue-600 font-bold">Vexar Tech</span>
            </p>
          </div>
        </div>
      </main>

      {/* ============= VIDEO MODAL ============= */}
      {videoOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setVideoOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors flex items-center gap-2"
              aria-label="Close video"
            >
              <span className="text-sm">Close</span>
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${DEMO_VIDEO_ID}?autoplay=1&rel=0`}
              title="RAY product demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
