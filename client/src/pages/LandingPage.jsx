import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Video, MessageSquare, BarChart2, ArrowRight, Sparkles } from 'lucide-react'
import LogoMark from '../components/ui/Logo'

const features = [
  {
    icon: <Video className="w-6 h-6 text-white" />,
    label: 'Multi-Modal Interviews',
    desc: 'Video, audio & text',
  },
  {
    icon: <Brain className="w-6 h-6 text-white" />,
    label: 'AI-Powered Evaluation',
    desc: 'Bloom\'s taxonomy based',
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-white" />,
    label: 'Dynamic Questions',
    desc: 'Adaptive difficulty',
  },
  {
    icon: <BarChart2 className="w-6 h-6 text-white" />,
    label: 'Detailed Analytics',
    desc: 'Performance insights',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative">

      {/* ── Animated gradient background ── */}
      <div className="absolute inset-0 hero-bg" />

      {/* ── Floating decorative orbs ── */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full animate-orb-1 pointer-events-none"
        style={{
          top: '10%',
          left: '5%',
          background: 'radial-gradient(circle, rgba(96,165,250,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full animate-orb-2 pointer-events-none"
        style={{
          bottom: '5%',
          right: '8%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full animate-orb-1 pointer-events-none delay-500"
        style={{
          top: '50%',
          right: '20%',
          background: 'radial-gradient(circle, rgba(219,39,119,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* ── Subtle grid overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ── MAIN CONTENT — centered text + CTA ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pb-8 sm:pb-4">

        {/* Brand pill */}
        <div
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full glass-card mb-8 sm:mb-10 animate-scale-in"
          style={{ animationDelay: '100ms', animationFillMode: 'both' }}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="text-white/90 font-medium text-sm tracking-wide">AI-Powered Interview Platform</span>
        </div>

        {/* Main heading */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white leading-[1.05] max-w-5xl mb-5 sm:mb-6 animate-slide-up"
          style={{
            fontFamily: 'Poppins, sans-serif',
            letterSpacing: '-0.03em',
            animationDelay: '200ms',
            animationFillMode: 'both',
          }}
        >
          Master Your{' '}
          <span className="gradient-text-blue">Interview Skills</span>
          {' '}with AI
        </h1>

        {/* Subtitle */}
        <p
          className="text-white/60 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 animate-slide-up"
          style={{ animationDelay: '350ms', animationFillMode: 'both' }}
        >
          Real-time mock interviews with personalized feedback, emotion analysis,
          and data-driven insights to boost your employability
        </p>

        {/* CTA button */}
        <div
          className="animate-slide-up"
          style={{ animationDelay: '500ms', animationFillMode: 'both' }}
        >
          <button
            id="hero-get-started"
            onClick={() => navigate('/signup')}
            className="group relative inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl bg-white text-blue-700 font-bold text-base sm:text-lg
                       shadow-[0_8px_32px_rgb(0_0_0/0.15)] hover:shadow-[0_16px_48px_rgb(255_255_255/0.2)]
                       hover:scale-105 hover:-translate-y-0.5
                       transition-all duration-300 ease-out active:scale-[0.98] active:translate-y-0"
          >
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-2xl animate-glow opacity-60 pointer-events-none" />
            <span className="relative z-10 flex items-center gap-3">
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </span>
          </button>
        </div>
      </div>

      {/* ── BOTTOM FEATURE STRIP — in-flow, not overlapping ── */}
      <div className="relative z-10 flex-none px-4 sm:px-6 pb-6 sm:pb-8">
        <div
          className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 animate-slide-up"
          style={{ animationDelay: '650ms', animationFillMode: 'both' }}
        >
          {features.map((f) => (
            <div
              key={f.label}
              className="glass-card p-3 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 text-center group"
            >
              {/* Icon */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300">
                {f.icon}
              </div>
              <div>
                <span className="text-white font-semibold text-xs sm:text-sm leading-snug block">{f.label}</span>
                <span className="text-white/40 text-[10px] sm:text-xs mt-0.5 block">{f.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
