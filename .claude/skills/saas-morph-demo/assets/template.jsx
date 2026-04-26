// ============================================================
// JobPilot · Morph Demo (embeddable component)
//
// Usage:
//   <MorphDemo />                                       // default: autoplay, with tabs + controls
//   <MorphDemo autoplay={false} showControls={false} /> // minimal: just the morph card
//   <MorphDemo defaultSpeed={1.5} showTabs={false} />   // custom speed, no tabs
//
// The component renders into its parent's space — it does NOT take over
// the page. Wrap it in your own section / container to position it.
//
//   <section className="bg-amber-50 py-20">
//     <div className="max-w-3xl mx-auto px-6">
//       <h2>See it in action</h2>
//       <MorphDemo />
//     </div>
//   </section>
// ============================================================

import React, { useState, useEffect, useMemo, useContext, createContext } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
// CUSTOMIZE: swap lucide icons to fit the product (e.g. FileText, Zap, Heart, Pencil, etc.)
import { Check, Sparkles, Send, Pause, Play, RotateCcw, Mail, Gauge } from 'lucide-react';

// ============ Animation base values (do not change unless asked) ============
const BASE_STIFFNESS = 280;
const BASE_DAMPING = 30;
const BASE_MASS = 0.85;
const BASE_STAGE_MS = 2600;
const BASE_FADE_S = 0.3;

// ============ CUSTOMIZE: Color palette ============
// Pick one palette from references/visual-identity.md, or design a new one.
// Keep semantic names consistent (paper, card, ink, body, mute, faint, line, accent).
const COLOR = {
  ink: '#0A0A0A',
  body: '#404040',
  mute: '#737373',
  faint: '#A8A29E',
  line: '#EAE6DC',
  card: '#FFFFFF',
  emerald: '#15803D',     // CUSTOMIZE: rename + recolor to match product (e.g. accent1 for success/AI)
  emeraldSoft: '#DCFCE7', // soft tint of accent1
  amber: '#B45309',       // CUSTOMIZE: rename + recolor (e.g. accent2 for highlights)
};

// ============ CUSTOMIZE: Persona data ============
// The "demo persona" — keep specific and short. The 3-5 "shared entities"
// (here: skills) MUST have stable `id` values because layoutIds derive from them.
const D = {
  name: 'Leo Huang',
  initials: 'LH',
  title: 'Senior Python Engineer',
  email: 'leo.huang@example.com',
  bio: '6 年後端工程經驗,專注於高流量系統設計與 AI 應用整合。',
  skills: [
    { id: 'python', label: 'Python' },
    { id: 'django', label: 'Django' },
    { id: 'aws', label: 'AWS' },
  ],
  experience: [
    { company: 'TechCorp', role: 'Senior Engineer', years: '2021 — Now' },
    { company: 'StartupCo', role: 'Backend Engineer', years: '2019 — 2021' },
  ],
  education: { school: '國立台灣大學', degree: '資訊工程學士', years: '2015 — 2019' },
  job: { title: 'Senior Python Backend Engineer', company: 'TechCorp Taiwan' },
  date: 'April 26, 2026',
};

// ============ CUSTOMIZE: Stage labels ============
// 5 stages, in product-specific language. The `sub` shows in tab nav.
const STAGES = [
  { id: 'profile', sub: '01 · Profile' },
  { id: 'modern', sub: '02 · Modern' },
  { id: 'professional', sub: '03 · Professional' },
  { id: 'cover', sub: '04 · Cover Letter' },
  { id: 'sent', sub: '05 · Submitted' },
];

const SPEEDS = [0.5, 1, 1.5, 2];

// ============ CUSTOMIZE: Font loading ============
// Match the fonts referenced inside the Stage* components below.
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap';

function useFonts() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.querySelector(`link[data-morph-fonts="true"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    link.dataset.morphFonts = 'true';
    document.head.appendChild(link);
  }, []);
}

// ============ Transition Context ============
const TransitionContext = createContext(null);

function useTransitions() {
  const ctx = useContext(TransitionContext);
  if (!ctx) {
    return {
      spring: { type: 'spring', stiffness: BASE_STIFFNESS, damping: BASE_DAMPING, mass: BASE_MASS },
      fade: { duration: BASE_FADE_S, ease: [0.4, 0, 0.2, 1] },
      fadeIn: {
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0, transition: { duration: BASE_FADE_S, delay: 0.15, ease: [0.4, 0, 0.2, 1] } },
        exit: { opacity: 0, y: -4, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } },
      },
    };
  }
  return ctx;
}

// ============ CUSTOMIZE: Shared morphing elements ============
// Rename these if the product has different "shared entities".
// The KEY thing is each shared element uses `layoutId` — that's what makes it morph.
// For new shared elements, give them a unique layoutId.

function Avatar({ size = 56, bg = COLOR.ink }) {
  const { spring } = useTransitions();
  return (
    <motion.div
      layoutId="avatar"
      transition={spring}
      style={{ width: size, height: size, backgroundColor: bg, borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}
    >
      <motion.span
        layoutId="avatar-text"
        transition={spring}
        style={{ fontSize: size * 0.36, fontFamily: 'Geist, sans-serif', fontWeight: 500, letterSpacing: '-0.02em' }}
      >
        {D.initials}
      </motion.span>
    </motion.div>
  );
}

function Name({ font = 'serif', size = '1.5rem', center = false, weight = 500, color = COLOR.ink, tracking }) {
  const { spring } = useTransitions();
  return (
    <motion.h2
      layoutId="name"
      transition={spring}
      style={{
        fontFamily: font === 'serif' ? 'Fraunces, serif' : 'Geist, sans-serif',
        fontSize: size,
        letterSpacing: tracking ?? (font === 'serif' ? '-0.025em' : '-0.01em'),
        fontWeight: weight,
        color,
        textAlign: center ? 'center' : 'left',
        margin: 0,
        lineHeight: 1.05,
      }}
    >
      {D.name}
    </motion.h2>
  );
}

function Title({ size = '0.875rem', center = false, color = COLOR.mute, mono = false, italic = false }) {
  const { spring } = useTransitions();
  return (
    <motion.p
      layoutId="title"
      transition={spring}
      style={{
        fontFamily: mono ? 'Geist Mono, monospace' : 'Geist, sans-serif',
        fontSize: size,
        color,
        textAlign: center ? 'center' : 'left',
        margin: 0,
        fontStyle: italic ? 'italic' : 'normal',
      }}
    >
      {D.title}
    </motion.p>
  );
}

function Skill({ id, label, variant = 'tag' }) {
  const { spring } = useTransitions();
  if (variant === 'tag') {
    return (
      <motion.span
        layoutId={`skill-${id}`}
        transition={spring}
        style={{
          fontFamily: 'Geist Mono, monospace',
          fontSize: '0.7rem',
          letterSpacing: '0.01em',
          backgroundColor: '#F5F5F4',
          color: COLOR.body,
          border: `1px solid ${COLOR.line}`,
          borderRadius: 6,
          padding: '4px 10px',
        }}
      >
        {label}
      </motion.span>
    );
  }
  return (
    <motion.span
      layoutId={`skill-${id}`}
      transition={spring}
      style={{ fontFamily: 'Geist Mono, monospace', fontSize: '0.75rem', color: COLOR.body }}
    >
      {label}
    </motion.span>
  );
}

function SectionLabel({ children, style = {} }) {
  const { fadeIn } = useTransitions();
  return (
    <motion.div
      {...fadeIn}
      style={{
        fontFamily: 'Geist Mono, monospace',
        fontSize: '0.625rem',
        letterSpacing: '0.18em',
        color: COLOR.faint,
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

const cardStyle = (width, padding) => ({
  width,
  backgroundColor: COLOR.card,
  border: `1px solid ${COLOR.line}`,
  borderRadius: 16,
  padding,
  boxShadow: '0 1px 2px rgba(10,10,10,0.03), 0 12px 32px rgba(10,10,10,0.05)',
});

const flexRow = (props = {}) => ({ display: 'flex', ...props });
const flexCol = (props = {}) => ({ display: 'flex', flexDirection: 'column', ...props });

// ============ CUSTOMIZE: Stage 0 (Input/Profile) ============
// Compact card showing the persona's raw data. Width ~360px.
// Shared elements introduced here. Subsequent stages morph FROM here.
function StageProfile() {
  const { spring, fadeIn } = useTransitions();
  return (
    <motion.div layoutId="card" transition={spring} style={cardStyle(360, 32)}>
      <div style={flexCol({ alignItems: 'center', gap: 14 })}>
        <SectionLabel>Profile</SectionLabel>
        <Avatar size={68} />
        <div style={flexCol({ alignItems: 'center', gap: 6, marginTop: 4 })}>
          <Name font="serif" size="1.625rem" center weight={500} />
          <Title size="0.875rem" center color={COLOR.mute} />
        </div>
        <motion.p
          {...fadeIn}
          style={{
            fontFamily: 'Geist, sans-serif',
            fontSize: '0.8125rem',
            lineHeight: 1.55,
            color: COLOR.body,
            maxWidth: 260,
            textAlign: 'center',
            margin: 0,
          }}
        >
          {D.bio}
        </motion.p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
          {D.skills.map((s) => <Skill key={s.id} id={s.id} label={s.label} variant="tag" />)}
        </div>
        <motion.div
          {...fadeIn}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginTop: 4, paddingTop: 12,
            borderTop: `1px solid ${COLOR.line}`,
            width: '100%', justifyContent: 'center',
          }}
        >
          <Mail size={11} color={COLOR.faint} />
          <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: '0.7rem', color: COLOR.mute }}>
            {D.email}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============ CUSTOMIZE: Stage 1 (First transformation) ============
// Larger card, structurally different from Stage 0. Width ~460px.
// Reuses Avatar/Name/Title/Skills via shared layoutIds — they will morph.
function StageModern() {
  const { spring, fadeIn } = useTransitions();
  return (
    <motion.div layoutId="card" transition={spring} style={cardStyle(460, '36px 40px')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottom: `1px solid ${COLOR.line}` }}>
        <Avatar size={56} />
        <div style={flexCol({ gap: 4 })}>
          <Name font="serif" size="1.75rem" weight={500} />
          <Title size="0.875rem" color={COLOR.body} />
        </div>
      </div>

      <motion.div {...fadeIn} style={{ marginTop: 20 }}>
        <SectionLabel style={{ marginBottom: 8 }}>About</SectionLabel>
        <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.8125rem', lineHeight: 1.6, color: COLOR.body, margin: 0 }}>
          {D.bio}
        </p>
      </motion.div>

      <motion.div {...fadeIn} style={{ marginTop: 20 }}>
        <SectionLabel style={{ marginBottom: 8 }}>Skills</SectionLabel>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {D.skills.map((s) => <Skill key={s.id} id={s.id} label={s.label} variant="tag" />)}
        </div>
      </motion.div>

      <motion.div {...fadeIn} style={{ marginTop: 20 }}>
        <SectionLabel style={{ marginBottom: 10 }}>Experience</SectionLabel>
        <div style={flexCol({ gap: 12 })}>
          {D.experience.map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.875rem', fontWeight: 500, color: COLOR.ink }}>{e.company}</div>
                <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.75rem', color: COLOR.mute, marginTop: 2 }}>{e.role}</div>
              </div>
              <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: '0.7rem', color: COLOR.faint }}>{e.years}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div {...fadeIn} style={{ marginTop: 20 }}>
        <SectionLabel style={{ marginBottom: 8 }}>Education</SectionLabel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.875rem', fontWeight: 500, color: COLOR.ink }}>{D.education.school}</div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.75rem', color: COLOR.mute, marginTop: 2 }}>{D.education.degree}</div>
          </div>
          <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: '0.7rem', color: COLOR.faint }}>{D.education.years}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============ CUSTOMIZE: Stage 2 (Same data, different layout) ============
// Same dimensions as Stage 1, but structurally different layout.
// e.g. centered/formal vs. left-aligned/casual, or single column vs. two columns.
function StageProfessional() {
  const { spring, fadeIn } = useTransitions();
  return (
    <motion.div layoutId="card" transition={spring} style={cardStyle(460, '44px 48px')}>
      <div style={flexCol({ alignItems: 'center', gap: 4, paddingBottom: 20, borderBottom: `1px solid ${COLOR.line}` })}>
        <Name font="serif" size="2rem" center weight={500} tracking="-0.03em" />
        <Title size="0.8125rem" center color={COLOR.body} italic />
        <motion.div
          {...fadeIn}
          style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, fontFamily: 'Geist Mono, monospace', fontSize: '0.7rem', color: COLOR.faint }}
        >
          <span>{D.email}</span>
          <span style={{ width: 3, height: 3, backgroundColor: COLOR.faint, borderRadius: 999 }} />
          <span>Taipei · TW</span>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginTop: 24 }}>
        <motion.div {...fadeIn}>
          <SectionLabel style={{ marginBottom: 10 }}>Experience</SectionLabel>
          <div style={flexCol({ gap: 14 })}>
            {D.experience.map((e, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '0.95rem', fontWeight: 500, color: COLOR.ink, letterSpacing: '-0.01em' }}>{e.company}</div>
                <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.75rem', color: COLOR.mute, marginTop: 1 }}>{e.role}</div>
                <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: '0.65rem', color: COLOR.faint, marginTop: 3 }}>{e.years}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeIn}>
          <SectionLabel style={{ marginBottom: 10 }}>Education</SectionLabel>
          <div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '0.95rem', fontWeight: 500, color: COLOR.ink, letterSpacing: '-0.01em' }}>{D.education.school}</div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.75rem', color: COLOR.mute, marginTop: 1 }}>{D.education.degree}</div>
            <div style={{ fontFamily: 'Geist Mono, monospace', fontSize: '0.65rem', color: COLOR.faint, marginTop: 3 }}>{D.education.years}</div>
          </div>
        </motion.div>
      </div>

      <motion.div {...fadeIn} style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${COLOR.line}` }}>
        <SectionLabel style={{ marginBottom: 10 }}>Core Competencies</SectionLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {D.skills.map((s, i) => (
            <React.Fragment key={s.id}>
              <Skill id={s.id} label={s.label} variant="inline" />
              {i < D.skills.length - 1 && <span style={{ width: 3, height: 3, backgroundColor: COLOR.line, borderRadius: 999 }} />}
            </React.Fragment>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============ CUSTOMIZE: Stage 3 (Different document type) ============
// Different document/output type. Wider format. Same data, completely new layout.
function StageCover() {
  const { spring, fadeIn } = useTransitions();
  return (
    <motion.div layoutId="card" transition={spring} style={cardStyle(500, '44px 52px')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 20, borderBottom: `1px solid ${COLOR.line}` }}>
        <div>
          <Name font="serif" size="1.375rem" weight={500} />
          <Title size="0.8125rem" color={COLOR.mute} />
        </div>
        <motion.div
          {...fadeIn}
          style={{ textAlign: 'right', fontFamily: 'Geist Mono, monospace', fontSize: '0.7rem', color: COLOR.faint }}
        >
          <div>{D.email}</div>
          <div style={{ marginTop: 4 }}>{D.date}</div>
        </motion.div>
      </div>

      <motion.div {...fadeIn} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '0.95rem', color: COLOR.ink, margin: 0, letterSpacing: '-0.005em' }}>
          Dear Hiring Manager,
        </p>
        <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.8125rem', lineHeight: 1.7, color: COLOR.body, margin: 0 }}>
          I'm writing to express my interest in the{' '}
          <span style={{ color: COLOR.ink, fontWeight: 500 }}>{D.job.title}</span> role at{' '}
          <span style={{ color: COLOR.ink, fontWeight: 500 }}>{D.job.company}</span>. With six years building
          high-throughput backend systems, I'm drawn to teams that take engineering craft seriously.
        </p>
        <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.8125rem', lineHeight: 1.7, color: COLOR.body, margin: 0 }}>
          My experience with{' '}
          <Skill id="python" label="Python" variant="inline" />,{' '}
          <Skill id="django" label="Django" variant="inline" /> and{' '}
          <Skill id="aws" label="AWS" variant="inline" /> aligns directly with what your team is building.
        </p>
        <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.8125rem', lineHeight: 1.7, color: COLOR.body, margin: 0 }}>
          I'd welcome the chance to discuss how I can contribute.
        </p>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '0.95rem', color: COLOR.ink, margin: '8px 0 0', fontStyle: 'italic' }}>
          Best regards,
        </p>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', color: COLOR.ink, margin: 0, fontWeight: 500 }}>
          Leo
        </p>
      </motion.div>
    </motion.div>
  );
}

// ============ CUSTOMIZE: Stage 4 (Outcome / Submitted) ============
// Compact success state. Width ~400px. Communicates "value delivered".
// IMPORTANT: re-collect the shared entities here (e.g. as tags) to close
// the loop — stage 0's elements should reappear in stage 4 in a new form.
function StageSent() {
  const { spring, fadeIn } = useTransitions();
  return (
    <motion.div layoutId="card" transition={spring} style={cardStyle(400, 32)}>
      <div style={flexCol({ alignItems: 'center', gap: 16 })}>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, transition: { ...spring, delay: 0.12 } }}
          exit={{ scale: 0.8, opacity: 0, transition: { duration: 0.15 } }}
          style={{ width: 56, height: 56, backgroundColor: COLOR.emeraldSoft, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Check size={26} color={COLOR.emerald} strokeWidth={2.5} />
        </motion.div>

        <motion.div {...fadeIn} style={flexCol({ alignItems: 'center', gap: 4 })}>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.375rem', fontWeight: 500, color: COLOR.ink, margin: 0, letterSpacing: '-0.02em' }}>
            Application sent
          </h3>
          <p style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.8125rem', color: COLOR.mute, margin: 0 }}>
            投遞成功
          </p>
        </motion.div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, padding: '10px 16px', borderRadius: 8, backgroundColor: '#FAFAF9', border: `1px solid ${COLOR.line}` }}>
          <Avatar size={36} bg={COLOR.emerald} />
          <div style={flexCol()}>
            <Name font="sans" size="0.875rem" weight={500} />
            <Title size="0.7rem" color={COLOR.mute} mono />
          </div>
        </div>

        <motion.div {...fadeIn} style={{ width: '100%', marginTop: 4, paddingTop: 16, borderTop: `1px solid ${COLOR.line}` }}>
          <SectionLabel style={{ marginBottom: 6, textAlign: 'center' }}>Sent to</SectionLabel>
          <div style={flexCol({ alignItems: 'center' })}>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: '0.95rem', color: COLOR.ink, fontWeight: 500, letterSpacing: '-0.01em' }}>{D.job.title}</div>
            <div style={{ fontFamily: 'Geist, sans-serif', fontSize: '0.75rem', color: COLOR.mute, marginTop: 2 }}>@ {D.job.company}</div>
          </div>
        </motion.div>

        <motion.div
          {...fadeIn}
          style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, paddingTop: 12, width: '100%', justifyContent: 'center', borderTop: `1px dashed ${COLOR.line}` }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Send size={11} color={COLOR.emerald} />
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: '0.7rem', color: COLOR.body }}>47 sent today</span>
          </div>
          <span style={{ width: 3, height: 3, backgroundColor: COLOR.line, borderRadius: 999 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={11} color={COLOR.amber} />
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: '0.7rem', color: COLOR.body }}>4/5 free remaining</span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============ Embeddable component ============
// This is the production output. Do NOT add hero <h1>, page background,
// or min-height: 100vh — the parent application handles all of that.
// The component renders only into its own space.
export default function MorphDemo({
  autoplay = true,
  defaultSpeed = 1,
  showTabs = true,
  showControls = true,
  className,
  style,
}) {
  useFonts();

  const [stage, setStage] = useState(0);
  const [paused, setPaused] = useState(!autoplay);
  const [speed, setSpeed] = useState(defaultSpeed);

  const transitions = useMemo(() => {
    const stiffness = BASE_STIFFNESS * speed;
    const damping = BASE_DAMPING + (speed - 1) * 4;
    const spring = { type: 'spring', stiffness, damping, mass: BASE_MASS };
    const fadeDur = BASE_FADE_S / speed;
    const fade = { duration: fadeDur, ease: [0.4, 0, 0.2, 1] };
    const fadeIn = {
      initial: { opacity: 0, y: 4 },
      animate: { opacity: 1, y: 0, transition: { duration: fadeDur, delay: 0.15 / speed, ease: [0.4, 0, 0.2, 1] } },
      exit: { opacity: 0, y: -4, transition: { duration: 0.18 / speed, ease: [0.4, 0, 0.2, 1] } },
    };
    return { spring, fade, fadeIn };
  }, [speed]);

  const stageDuration = BASE_STAGE_MS / speed;

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setStage((s) => (s + 1) % STAGES.length), stageDuration);
    return () => clearTimeout(t);
  }, [stage, paused, stageDuration]);

  const renderStage = () => {
    switch (stage) {
      case 0: return <StageProfile key="profile" />;
      case 1: return <StageModern key="modern" />;
      case 2: return <StageProfessional key="professional" />;
      case 3: return <StageCover key="cover" />;
      case 4: return <StageSent key="sent" />;
      default: return null;
    }
  };

  const ctrlBtn = (active = false) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', borderRadius: 8,
    border: active ? `1px solid ${COLOR.ink}` : `1px solid ${COLOR.line}`,
    backgroundColor: active ? COLOR.ink : 'transparent',
    color: active ? '#FAF7F0' : COLOR.body,
    cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'Geist, sans-serif',
    transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
  });

  const speedBtn = (active = false) => ({
    padding: '4px 10px', borderRadius: 6, border: 'none',
    backgroundColor: active ? COLOR.ink : 'transparent',
    color: active ? '#FAF7F0' : COLOR.mute,
    cursor: 'pointer', fontSize: '0.7rem',
    fontFamily: 'Geist Mono, monospace', letterSpacing: '0.02em',
    transition: 'background-color 0.15s, color 0.15s',
  });

  return (
    <TransitionContext.Provider value={transitions}>
      <div
        className={className}
        style={{
          width: '100%',
          fontFamily: 'Geist, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          ...style,
        }}
      >
        {/* Tab navigation (optional) */}
        {showTabs && (
          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
            {STAGES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setStage(i); setPaused(true); }}
                style={{
                  fontFamily: 'Geist Mono, monospace',
                  fontSize: '0.7rem',
                  letterSpacing: '0.04em',
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: stage === i ? `1px solid ${COLOR.ink}` : `1px solid ${COLOR.line}`,
                  backgroundColor: stage === i ? COLOR.ink : 'transparent',
                  color: stage === i ? '#FAF7F0' : COLOR.mute,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
                }}
              >
                {s.sub}
              </button>
            ))}
          </nav>
        )}

        {/* Card canvas — fixed min-height so parent layout doesn't jump */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 660, position: 'relative' }}>
          <LayoutGroup>
            <AnimatePresence mode="popLayout">{renderStage()}</AnimatePresence>
          </LayoutGroup>
        </div>

        {/* Controls (optional) */}
        {showControls && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setPaused((p) => !p)} style={ctrlBtn()}>
                {paused ? <Play size={12} /> : <Pause size={12} />}
                {paused ? '繼續' : '暫停'}
              </button>
              <button onClick={() => { setStage(0); setPaused(false); }} style={ctrlBtn()}>
                <RotateCcw size={12} />
                重新開始
              </button>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, padding: 3, borderRadius: 8, border: `1px solid ${COLOR.line}`, backgroundColor: 'rgba(255,255,255,0.5)' }}
              >
                <Gauge size={12} color={COLOR.mute} style={{ marginLeft: 6, marginRight: 4 }} />
                {SPEEDS.map((s) => (
                  <button key={s} onClick={() => setSpeed(s)} style={speedBtn(speed === s)} aria-label={`Set speed to ${s}x`}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>
            <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: '0.7rem', color: COLOR.faint, letterSpacing: '0.05em' }}>
              {String(stage + 1).padStart(2, '0')} / {String(STAGES.length).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>
    </TransitionContext.Provider>
  );
}
