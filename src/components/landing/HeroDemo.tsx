'use client'

import React, { useState, useEffect, useMemo, createContext, useContext } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import type { TargetAndTransition, Transition } from 'framer-motion'
import { Check, Sparkles, Send, Mail } from 'lucide-react'

// ── Color palette (matched to website: white bg, slate borders) ──
const C = {
  ink: '#0F172A',
  body: '#374151',
  mute: '#6B7280',
  faint: '#9CA3AF',
  line: '#E2E8F0',   // matches website border
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
  bio: '6 年後端工程經驗，專注於高流量系統設計與 AI 應用整合。',
  skills: [
    { id: 'python', label: 'Python' },
    { id: 'django', label: 'Django' },
    { id: 'aws', label: 'AWS' },
  ],
  experience: [
    { company: 'TechCorp', role: 'Senior Engineer', years: '2021 – Now' },
    { company: 'StartupCo', role: 'Backend Engineer', years: '2019 – 2021' },
  ],
  education: { school: '國立台灣大學', degree: '資訊工程學士', years: '2015 – 2019' },
  job: { title: 'Senior Python Backend Engineer', company: 'TechCorp Taiwan' },
  date: 'April 26, 2026',
}

const STAGES = ['profile', 'modern', 'professional', 'cover', 'sent'] as const

const BASE_STIFFNESS = 280
const BASE_DAMPING = 30
const BASE_MASS = 0.85
const BASE_FADE_S = 0.28
const STAGE_MS = 2800

// ── Transition context ──
interface FadeProps {
  initial: TargetAndTransition
  animate: TargetAndTransition & { transition?: Transition }
  exit: TargetAndTransition & { transition?: Transition }
}
interface Transitions {
  spring: Transition
  fadeIn: FadeProps
}

const TransCtx = createContext<Transitions | null>(null)

function useTrans() {
  return useContext(TransCtx)!
}

// ── Shared morphing atoms ──

function Avatar({ size = 52 }: { size?: number }) {
  const { spring } = useTrans()
  return (
    <motion.div
      layoutId="avatar"
      transition={spring}
      style={{ width: size, height: size, backgroundColor: C.ink, borderRadius: 9999 }}
      className="flex items-center justify-center text-white flex-shrink-0"
    >
      <motion.span
        layoutId="avatar-text"
        transition={spring}
        style={{ fontSize: size * 0.36, fontWeight: 500, letterSpacing: '-0.02em' }}
      >
        {D.initials}
      </motion.span>
    </motion.div>
  )
}

function Name({ size = '1.4rem', center = false, weight = 500, serif = true }: {
  size?: string; center?: boolean; weight?: number; serif?: boolean
}) {
  const { spring } = useTrans()
  return (
    <motion.h2
      layoutId="name"
      transition={spring}
      style={{
        fontFamily: serif ? 'Georgia, serif' : 'inherit',
        fontSize: size, fontWeight: weight, color: C.ink,
        textAlign: center ? 'center' : 'left',
        margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em',
      }}
    >
      {D.name}
    </motion.h2>
  )
}

function JobTitle({ size = '0.8rem', center = false, color = C.mute, italic = false }: {
  size?: string; center?: boolean; color?: string; italic?: boolean
}) {
  const { spring } = useTrans()
  return (
    <motion.p
      layoutId="title"
      transition={spring}
      style={{ fontSize: size, color, textAlign: center ? 'center' : 'left', margin: 0, fontStyle: italic ? 'italic' : 'normal' }}
    >
      {D.title}
    </motion.p>
  )
}

function Skill({ id, label, variant = 'tag' }: { id: string; label: string; variant?: 'tag' | 'inline' }) {
  const { spring } = useTrans()
  if (variant === 'tag') {
    return (
      <motion.span
        layoutId={`skill-${id}`}
        transition={spring}
        style={{
          fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.01em',
          backgroundColor: '#F8FAFC', color: C.body,
          border: `1px solid ${C.line}`, borderRadius: 6, padding: '3px 8px',
        }}
      >
        {label}
      </motion.span>
    )
  }
  return (
    <motion.span layoutId={`skill-${id}`} transition={spring}
      style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: C.body }}>
      {label}
    </motion.span>
  )
}

function Label({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const { fadeIn } = useTrans()
  return (
    <motion.div {...fadeIn}
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

// ── Stage 0: Profile card ──
function StageProfile() {
  const { spring, fadeIn } = useTrans()
  return (
    <motion.div layoutId="card" transition={spring}
      style={{ ...cardBase, width: 300, padding: 28 }}>
      <div className="flex flex-col items-center gap-3">
        <Label>Profile</Label>
        <Avatar size={62} />
        <div className="flex flex-col items-center gap-1">
          <Name size="1.5rem" center />
          <JobTitle size="0.8rem" center />
        </div>
        <motion.p {...fadeIn}
          style={{ fontSize: '0.76rem', lineHeight: 1.55, color: C.body, textAlign: 'center', margin: 0 }}>
          {D.bio}
        </motion.p>
        <div className="flex gap-1.5 flex-wrap justify-center">
          {D.skills.map(s => <Skill key={s.id} id={s.id} label={s.label} variant="tag" />)}
        </div>
        <motion.div {...fadeIn}
          className="flex items-center gap-1.5 pt-3 w-full justify-center border-t"
          style={{ borderColor: C.line }}>
          <Mail size={10} color={C.faint} />
          <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: C.mute }}>{D.email}</span>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ── Stage 1: Modern Resume ──
function StageModern() {
  const { spring, fadeIn } = useTrans()
  return (
    <motion.div layoutId="card" transition={spring}
      style={{ ...cardBase, width: 390, padding: '28px 32px' }}>
      <div className="flex items-center gap-3 pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
        <Avatar size={48} />
        <div className="flex flex-col gap-0.5">
          <Name size="1.5rem" />
          <JobTitle color={C.body} />
        </div>
      </div>
      <motion.div {...fadeIn} className="mt-4">
        <Label style={{ marginBottom: 6 }}>About</Label>
        <p style={{ fontSize: '0.76rem', lineHeight: 1.6, color: C.body, margin: 0 }}>{D.bio}</p>
      </motion.div>
      <motion.div {...fadeIn} className="mt-4">
        <Label style={{ marginBottom: 6 }}>Skills</Label>
        <div className="flex gap-1.5 flex-wrap">
          {D.skills.map(s => <Skill key={s.id} id={s.id} label={s.label} variant="tag" />)}
        </div>
      </motion.div>
      <motion.div {...fadeIn} className="mt-4">
        <Label style={{ marginBottom: 8 }}>Experience</Label>
        <div className="flex flex-col gap-2.5">
          {D.experience.map((e, i) => (
            <div key={i} className="flex justify-between items-baseline">
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 500, color: C.ink }}>{e.company}</div>
                <div style={{ fontSize: '0.7rem', color: C.mute, marginTop: 1 }}>{e.role}</div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: C.faint }}>{e.years}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Stage 2: Professional Resume ──
function StageProfessional() {
  const { spring, fadeIn } = useTrans()
  return (
    <motion.div layoutId="card" transition={spring}
      style={{ ...cardBase, width: 390, padding: '32px 36px' }}>
      <div className="flex flex-col items-center gap-1 pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
        <Name size="1.7rem" center />
        <JobTitle size="0.76rem" center italic />
        <motion.div {...fadeIn}
          className="flex items-center gap-2 mt-1.5"
          style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: C.faint }}>
          <span>{D.email}</span>
          <span style={{ width: 3, height: 3, backgroundColor: C.faint, borderRadius: 999 }} />
          <span>Taipei · TW</span>
        </motion.div>
      </div>
      <div className="grid grid-cols-2 gap-6 mt-4">
        <motion.div {...fadeIn}>
          <Label style={{ marginBottom: 8 }}>Experience</Label>
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
        <motion.div {...fadeIn}>
          <Label style={{ marginBottom: 8 }}>Education</Label>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '0.88rem', fontWeight: 500, color: C.ink }}>{D.education.school}</div>
          <div style={{ fontSize: '0.7rem', color: C.mute, marginTop: 1 }}>{D.education.degree}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: C.faint, marginTop: 2 }}>{D.education.years}</div>
        </motion.div>
      </div>
      <motion.div {...fadeIn} className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
        <Label style={{ marginBottom: 8 }}>Core Competencies</Label>
        <div className="flex items-center gap-2 flex-wrap">
          {D.skills.map((s, i) => (
            <React.Fragment key={s.id}>
              <Skill id={s.id} label={s.label} variant="inline" />
              {i < D.skills.length - 1 && (
                <span style={{ width: 3, height: 3, backgroundColor: C.line, borderRadius: 999 }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Stage 3: Cover Letter ──
function StageCover() {
  const { spring, fadeIn } = useTrans()
  return (
    <motion.div layoutId="card" transition={spring}
      style={{ ...cardBase, width: 420, padding: '32px 38px' }}>
      <div className="flex justify-between items-start pb-4" style={{ borderBottom: `1px solid ${C.line}` }}>
        <div>
          <Name size="1.2rem" />
          <JobTitle size="0.76rem" />
        </div>
        <motion.div {...fadeIn}
          className="text-right"
          style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: C.faint }}>
          <div>{D.email}</div>
          <div className="mt-1">{D.date}</div>
        </motion.div>
      </div>
      <motion.div {...fadeIn} className="mt-5 flex flex-col gap-3">
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.88rem', color: C.ink, margin: 0 }}>
          Dear Hiring Manager,
        </p>
        <p style={{ fontSize: '0.76rem', lineHeight: 1.7, color: C.body, margin: 0 }}>
          I'm writing to express my interest in the{' '}
          <span style={{ color: C.ink, fontWeight: 500 }}>{D.job.title}</span> role at{' '}
          <span style={{ color: C.ink, fontWeight: 500 }}>{D.job.company}</span>. With six years
          building high-throughput backend systems, I'm drawn to teams that take engineering seriously.
        </p>
        <p style={{ fontSize: '0.76rem', lineHeight: 1.7, color: C.body, margin: 0 }}>
          My experience with{' '}
          <Skill id="python" label="Python" variant="inline" />,{' '}
          <Skill id="django" label="Django" variant="inline" /> and{' '}
          <Skill id="aws" label="AWS" variant="inline" /> aligns directly with your team's needs.
        </p>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: '0.88rem', color: C.ink, margin: '6px 0 0', fontStyle: 'italic' }}>
          Best regards, <strong style={{ fontStyle: 'normal' }}>Leo</strong>
        </p>
      </motion.div>
    </motion.div>
  )
}

// ── Stage 4: Submitted ──
function StageSent() {
  const { spring, fadeIn } = useTrans()
  return (
    <motion.div layoutId="card" transition={spring}
      style={{ ...cardBase, width: 340, padding: 28 }}>
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { ...(spring as object), delay: 0.1 } }}
          exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.15 } }}
          style={{ width: 52, height: 52, backgroundColor: C.emeraldSoft, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Check size={24} color={C.emerald} strokeWidth={2.5} />
        </motion.div>

        <motion.div {...fadeIn} className="flex flex-col items-center gap-0.5">
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', fontWeight: 500, color: C.ink, margin: 0 }}>
            Application sent
          </h3>
          <p style={{ fontSize: '0.78rem', color: C.mute, margin: 0 }}>投遞成功</p>
        </motion.div>

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
          style={{ backgroundColor: '#F8FAFC', border: `1px solid ${C.line}` }}>
          <Avatar size={32} />
          <div>
            <Name serif={false} size="0.82rem" />
            <JobTitle size="0.65rem" />
          </div>
        </div>

        <motion.div {...fadeIn} className="w-full pt-4" style={{ borderTop: `1px solid ${C.line}` }}>
          <Label style={{ marginBottom: 6, textAlign: 'center' }}>Sent to</Label>
          <div className="flex flex-col items-center">
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '0.88rem', color: C.ink, fontWeight: 500 }}>
              {D.job.title}
            </div>
            <div style={{ fontSize: '0.7rem', color: C.mute, marginTop: 2 }}>@ {D.job.company}</div>
          </div>
        </motion.div>

        <motion.div {...fadeIn} className="flex items-center gap-3 pt-3 w-full justify-center"
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

  const transitions = useMemo<Transitions>(() => {
    const spring: Transition = { type: 'spring', stiffness: BASE_STIFFNESS, damping: BASE_DAMPING, mass: BASE_MASS }
    const fadeDur = BASE_FADE_S
    return {
      spring,
      fadeIn: {
        initial: { opacity: 0, y: 4 } as TargetAndTransition,
        animate: { opacity: 1, y: 0, transition: { duration: fadeDur, delay: 0.14 } } as TargetAndTransition,
        exit: { opacity: 0, y: -4, transition: { duration: 0.16 } } as TargetAndTransition,
      },
    }
  }, [])

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
    <TransCtx.Provider value={transitions}>
      {/*
        Fixed width (460px ≥ widest card 420px) so the label, dots and hint
        never shift horizontally when cards of different widths morph in/out.
      */}
      <div
        style={{ width: 460 }}
        className="flex flex-col items-center gap-4 select-none"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Stage label — fixed position because container width is constant */}
        <div style={{
          fontFamily: 'monospace', fontSize: '0.6rem',
          letterSpacing: '0.15em', color: '#9CA3AF', textTransform: 'uppercase',
          height: 16, display: 'flex', alignItems: 'center',
        }}>
          {['Profile', 'Modern', 'Professional', 'Cover Letter', 'Submitted'][stage]}
        </div>

        {/* Card canvas — fixed height so the bg wrapper never resizes between stages */}
        <div className="flex items-start justify-center" style={{ width: '100%', height: 420 }}>
          <LayoutGroup>
            <AnimatePresence mode="popLayout">
              {renderStage()}
            </AnimatePresence>
          </LayoutGroup>
        </div>

        {/* Stage dots */}
        <div className="flex items-center gap-1.5">
          {STAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setStage(i)}
              style={{
                width: i === stage ? 20 : 6,
                height: 6,
                borderRadius: 9999,
                backgroundColor: i === stage ? C.ink : C.line,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                padding: 0,
              }}
              aria-label={`Stage ${i + 1}`}
            />
          ))}
        </div>

        {/* Hover hint — fixed height prevents bottom bounce */}
        <p style={{
          fontFamily: 'monospace', fontSize: '0.58rem',
          color: C.faint, margin: 0, letterSpacing: '0.05em',
          height: 14, display: 'flex', alignItems: 'center',
        }}>
          {hovered ? 'Paused' : 'Hover to pause · Click dots to navigate'}
        </p>
      </div>
    </TransCtx.Provider>
  )
}
