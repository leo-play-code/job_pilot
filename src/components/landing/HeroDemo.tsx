'use client'

import React, { useState, useEffect, useMemo, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TargetAndTransition, Transition } from 'framer-motion'
import { Check, Sparkles, Send, Mail } from 'lucide-react'

const C = {
  ink: '#0F172A',
  body: '#374151',
  mute: '#6B7280',
  faint: '#9CA3AF',
  line: '#E2E8F0',
  card: '#FFFFFF',
  emerald: '#15803D',
  emeraldSoft: '#DCFCE7',
  amber: '#B45309',
}

const D = {
  name: 'Leo Huang',
  initials: 'LH',
  title: 'Senior Python Engineer',
  email: 'leo.huang@example.com',
  bio: '2 年後端工程經驗，專注於高流量系統設計與 AI 應用整合。',
  skills: [
    { id: 'python', label: 'Python' },
    { id: 'django', label: 'Django' },
    { id: 'aws', label: 'AWS' },
  ],
  experience: [
    { company: 'TechCorp', role: 'Senior Engineer', years: '2021 – Now' },
    { company: 'StartupCo', role: 'Backend Engineer', years: '2019 – 2021' },
  ],
  education: { school: '私立元智大學', degree: '電機工程學士', years: '2015 – 2019' },
  job: { title: 'Senior Python Backend Engineer', company: 'TechCorp Taiwan' },
  date: 'April 26, 2026',
}

const STAGES = ['profile', 'modern', 'professional', 'cover', 'sent'] as const
const STAGE_LABELS = ['Profile', 'Modern', 'Professional', 'Cover Letter', 'Submitted']
const STAGE_MS = 3000

// Card crossfade — no size animation so cards never stretch
const cardVariants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] } as Transition },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } as Transition },
}

// Staggered reveal for items inside each card
interface FadeProps {
  initial: TargetAndTransition
  animate: TargetAndTransition & { transition?: Transition }
  exit: TargetAndTransition & { transition?: Transition }
}
const FadeCtx = createContext<FadeProps | null>(null)
function useFade() { return useContext(FadeCtx)! }

// ── Static sub-components (no layoutId = no shape-tween) ──

function Avatar({ size = 52, bg = C.ink }: { size?: number; bg?: string }) {
  return (
    <div style={{ width: size, height: size, backgroundColor: bg, borderRadius: 9999, flexShrink: 0 }}
      className="flex items-center justify-center text-white">
      <span style={{ fontSize: size * 0.36, fontWeight: 500, letterSpacing: '-0.02em' }}>
        {D.initials}
      </span>
    </div>
  )
}

function Name({ size = '1.4rem', center = false, weight = 500, serif = true }: {
  size?: string; center?: boolean; weight?: number; serif?: boolean
}) {
  return (
    <h2 style={{
      fontFamily: serif ? 'Georgia, serif' : 'inherit',
      fontSize: size, fontWeight: weight, color: C.ink,
      textAlign: center ? 'center' : 'left',
      margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em',
    }}>
      {D.name}
    </h2>
  )
}

function JobTitle({ size = '0.8rem', center = false, color = C.mute, italic = false }: {
  size?: string; center?: boolean; color?: string; italic?: boolean
}) {
  return (
    <p style={{ fontSize: size, color, textAlign: center ? 'center' : 'left', margin: 0, fontStyle: italic ? 'italic' : 'normal' }}>
      {D.title}
    </p>
  )
}

function Tag({ label }: { label: string }) {
  return (
    <span style={{
      fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.01em',
      backgroundColor: '#F8FAFC', color: C.body,
      border: `1px solid ${C.line}`, borderRadius: 6, padding: '3px 8px',
    }}>
      {label}
    </span>
  )
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: C.body }}>
      {children}
    </span>
  )
}

function SectionLabel({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const fade = useFade()
  return (
    <motion.div {...fade}
      style={{ fontFamily: 'monospace', fontSize: '0.58rem', letterSpacing: '0.15em', color: C.faint, textTransform: 'uppercase', ...style }}>
      {children}
    </motion.div>
  )
}

const cardBase: React.CSSProperties = {
  backgroundColor: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: 14,
  boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
}

// ── Stage cards ──

function StageProfile() {
  const fade = useFade()
  return (
    <motion.div {...cardVariants} style={{ ...cardBase, width: 300, padding: 28 }}>
      <div className="flex flex-col items-center gap-3">
        <SectionLabel>Profile</SectionLabel>
        <Avatar size={62} />
        <div className="flex flex-col items-center gap-1">
          <Name size="1.5rem" center />
          <JobTitle size="0.8rem" center />
        </div>
        <motion.p {...fade} style={{ fontSize: '0.76rem', lineHeight: 1.55, color: C.body, textAlign: 'center', margin: 0 }}>
          {D.bio}
        </motion.p>
        <div className="flex gap-1.5 flex-wrap justify-center">
          {D.skills.map(s => <Tag key={s.id} label={s.label} />)}
        </div>
        <motion.div {...fade} className="flex items-center gap-1.5 pt-3 w-full justify-center border-t" style={{ borderColor: C.line }}>
          <Mail size={10} color={C.faint} />
          <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: C.mute }}>{D.email}</span>
        </motion.div>
      </div>
    </motion.div>
  )
}

function StageModern() {
  const fade = useFade()
  return (
    <motion.div {...cardVariants} style={{ ...cardBase, width: 390, padding: '28px 32px' }}>
      <div className="flex items-center gap-3 pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
        <Avatar size={48} />
        <div className="flex flex-col gap-0.5">
          <Name size="1.5rem" />
          <JobTitle color={C.body} />
        </div>
      </div>
      <motion.div {...fade} className="mt-4">
        <SectionLabel style={{ marginBottom: 6 }}>About</SectionLabel>
        <p style={{ fontSize: '0.76rem', lineHeight: 1.6, color: C.body, margin: 0 }}>{D.bio}</p>
      </motion.div>
      <motion.div {...fade} className="mt-4">
        <SectionLabel style={{ marginBottom: 6 }}>Skills</SectionLabel>
        <div className="flex gap-1.5 flex-wrap">
          {D.skills.map(s => <Tag key={s.id} label={s.label} />)}
        </div>
      </motion.div>
      <motion.div {...fade} className="mt-4">
        <SectionLabel style={{ marginBottom: 8 }}>Experience</SectionLabel>
        <div className="flex flex-col gap-2.5">
          {D.experience.map((e, i) => (
            <div key={i} className="flex justify-between items-baseline">
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 500, color: C.ink }}>{e.company}</div>
                <div style={{ fontSize: '0.7rem', color: C.mute, marginTop: 1 }}>{e.role}</div>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: C.faint }}>{e.years}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

function StageProfessional() {
  const fade = useFade()
  return (
    <motion.div {...cardVariants} style={{ ...cardBase, width: 390, padding: '32px 36px' }}>
      <div className="flex flex-col items-center gap-1 pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
        <Name size="1.7rem" center />
        <JobTitle size="0.76rem" center italic />
        <motion.div {...fade} className="flex items-center gap-2 mt-1.5"
          style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: C.faint }}>
          <span>{D.email}</span>
          <span style={{ width: 3, height: 3, backgroundColor: C.faint, borderRadius: 999 }} />
          <span>Taipei · TW</span>
        </motion.div>
      </div>
      <div className="grid grid-cols-2 gap-6 mt-4">
        <motion.div {...fade}>
          <SectionLabel style={{ marginBottom: 8 }}>Experience</SectionLabel>
          <div className="flex flex-col gap-3">
            {D.experience.map((e, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '0.88rem', fontWeight: 500, color: C.ink }}>{e.company}</div>
                <div style={{ fontSize: '0.7rem', color: C.mute, marginTop: 1 }}>{e.role}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: C.faint, marginTop: 2 }}>{e.years}</div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div {...fade}>
          <SectionLabel style={{ marginBottom: 8 }}>Education</SectionLabel>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '0.88rem', fontWeight: 500, color: C.ink }}>{D.education.school}</div>
          <div style={{ fontSize: '0.7rem', color: C.mute, marginTop: 1 }}>{D.education.degree}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: C.faint, marginTop: 2 }}>{D.education.years}</div>
        </motion.div>
      </div>
      <motion.div {...fade} className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <SectionLabel style={{ marginBottom: 8 }}>Core Competencies</SectionLabel>
        <div className="flex items-center gap-2 flex-wrap">
          {D.skills.map((s, i) => (
            <React.Fragment key={s.id}>
              <Mono>{s.label}</Mono>
              {i < D.skills.length - 1 && <span style={{ width: 3, height: 3, backgroundColor: C.line, borderRadius: 999 }} />}
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

function StageCover() {
  const fade = useFade()
  return (
    <motion.div {...cardVariants} style={{ ...cardBase, width: 390, padding: '32px 36px' }}>
      <div className="flex justify-between items-start pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div>
          <Name size="1.2rem" />
          <JobTitle size="0.76rem" />
        </div>
        <motion.div {...fade} className="text-right"
          style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: C.faint }}>
          <div>{D.email}</div>
          <div className="mt-1">{D.date}</div>
        </motion.div>
      </div>
      <motion.div {...fade} className="mt-5 flex flex-col gap-3">
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.88rem', color: C.ink, margin: 0 }}>Dear Hiring Manager,</p>
        <p style={{ fontSize: '0.76rem', lineHeight: 1.7, color: C.body, margin: 0 }}>
          I'm writing to express my interest in the{' '}
          <span style={{ color: C.ink, fontWeight: 500 }}>{D.job.title}</span> role at{' '}
          <span style={{ color: C.ink, fontWeight: 500 }}>{D.job.company}</span>. With six years
          building high-throughput backend systems, I'm drawn to teams that take engineering seriously.
        </p>
        <p style={{ fontSize: '0.76rem', lineHeight: 1.7, color: C.body, margin: 0 }}>
          My experience with <Mono>Python</Mono>, <Mono>Django</Mono> and <Mono>AWS</Mono> aligns directly with your team's needs.
        </p>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.88rem', color: C.ink, margin: '6px 0 0', fontStyle: 'italic' }}>
          Best regards, <strong style={{ fontStyle: 'normal' }}>Leo</strong>
        </p>
      </motion.div>
    </motion.div>
  )
}

function StageSent() {
  const fade = useFade()
  return (
    <motion.div {...cardVariants} style={{ ...cardBase, width: 320, padding: 28 }}>
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 22, delay: 0.15 } }}
          style={{ width: 52, height: 52, backgroundColor: C.emeraldSoft, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Check size={24} color={C.emerald} strokeWidth={2.5} />
        </motion.div>

        <motion.div {...fade} className="flex flex-col items-center gap-0.5">
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', fontWeight: 500, color: C.ink, margin: 0 }}>Application sent</h3>
          <p style={{ fontSize: '0.78rem', color: C.mute, margin: 0 }}>投遞成功</p>
        </motion.div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
          style={{ backgroundColor: '#F8FAFC', border: `1px solid ${C.line}` }}>
          <Avatar size={32} bg={C.emerald} />
          <div>
            <Name serif={false} size="0.82rem" />
            <JobTitle size="0.65rem" />
          </div>
        </div>

        <motion.div {...fade} className="w-full pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
          <SectionLabel style={{ marginBottom: 6, textAlign: 'center' }}>Sent to</SectionLabel>
          <div className="flex flex-col items-center">
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '0.88rem', color: C.ink, fontWeight: 500 }}>{D.job.title}</div>
            <div style={{ fontSize: '0.7rem', color: C.mute, marginTop: 2 }}>@ {D.job.company}</div>
          </div>
        </motion.div>

        <motion.div {...fade} className="flex items-center gap-3 pt-3 w-full justify-center"
          style={{ borderTop: `1px dashed ${C.line}` }}>
          <div className="flex items-center gap-1.5">
            <Send size={10} color={C.emerald} />
            <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: C.body }}>47 sent today</span>
          </div>
          <span style={{ width: 3, height: 3, backgroundColor: C.line, borderRadius: 999 }} />
          <div className="flex items-center gap-1.5">
            <Sparkles size={10} color={C.amber} />
            <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: C.body }}>4/5 free</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ── Main exported component ──
export function HeroDemo() {
  const [stage, setStage] = useState(0)
  const [hovered, setHovered] = useState(false)

  const fade = useMemo<FadeProps>(() => ({
    initial: { opacity: 0, y: 5 } as TargetAndTransition,
    animate: { opacity: 1, y: 0, transition: { duration: 0.32, delay: 0.18 } } as TargetAndTransition,
    exit:    { opacity: 0, y: -5, transition: { duration: 0.18 } } as TargetAndTransition,
  }), [])

  useEffect(() => {
    if (hovered) return
    const t = setTimeout(() => setStage(s => (s + 1) % STAGES.length), STAGE_MS)
    return () => clearTimeout(t)
  }, [stage, hovered])

  const renderStage = () => {
    switch (stage) {
      case 0: return <StageProfile key="profile" />
      case 1: return <StageModern key="modern" />
      case 2: return <StageProfessional key="professional" />
      case 3: return <StageCover key="cover" />
      case 4: return <StageSent key="sent" />
      default: return null
    }
  }

  return (
    <FadeCtx.Provider value={fade}>
      <div
        style={{ width: 460 }}
        className="flex flex-col items-center gap-8 select-none"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Stage label */}
        <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.15em', color: '#9CA3AF', textTransform: 'uppercase', height: 16, display: 'flex', alignItems: 'center' }}>
          {STAGE_LABELS[stage]}
        </div>

        {/* Card canvas — fixed height, cards crossfade inside */}
        <div className="flex items-center justify-center" style={{ width: '100%', height: 420, position: 'relative' }}>
          <AnimatePresence mode="wait">
            {renderStage()}
          </AnimatePresence>
        </div>

        {/* Stage dots */}
        <div className="flex items-center gap-1.5">
          {STAGES.map((_, i) => (
            <button key={i} onClick={() => setStage(i)}
              style={{
                width: i === stage ? 20 : 6, height: 6, borderRadius: 9999,
                backgroundColor: i === stage ? C.ink : C.line,
                border: 'none', cursor: 'pointer', transition: 'all 0.25s ease', padding: 0,
              }}
              aria-label={`Stage ${i + 1}`}
            />
          ))}
        </div>

        {/* Hint */}
        <p style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: C.faint, margin: 0, letterSpacing: '0.05em', height: 14, display: 'flex', alignItems: 'center' }}>
          {hovered ? 'Paused' : 'Hover to pause · Click dots to navigate'}
        </p>
      </div>
    </FadeCtx.Provider>
  )
}
