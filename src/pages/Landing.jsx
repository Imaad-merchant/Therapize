import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PERSONAS } from '@/lib/therapist-personas'
import {
  Brain,
  ArrowRight,
  Sparkles,
  Check,
  Shield,
  Clock,
  Heart,
  Zap,
  Target,
  MessageCircle,
  Lock,
  Eye,
  Compass,
  Bookmark,
  TrendingUp,
  Ear,
  Lightbulb,
  Swords,
  BookmarkCheck,
  AlertCircle,
  Fingerprint,
  Gauge,
  Layers,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

// ============================================================================
// HERO
// ============================================================================
function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] rounded-full opacity-60" />
      </div>

      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="text-center space-y-6 mb-14"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs">
              <Sparkles className="w-3 h-3 text-primary" />
              Trained in 13 clinical modalities
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-6xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.05]"
          >
            The AI therapist that actually{' '}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              understands you
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Deep psychoanalysis, real-time brain mapping, and 13 specialist therapists — each trained in the frameworks licensed clinicians use. Available the moment you need support.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button asChild size="lg" className="gap-2 h-12 px-6 text-base shadow-lg shadow-primary/20">
              <Link to="/auth">
                Start Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-6 text-base">
              <Link to="/auth">Sign In</Link>
            </Button>
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-4">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-green-500" />
              Private & encrypted
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              Crisis-safe protocols
            </div>
          </motion.div>
        </motion.div>

        {/* Hero product mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-5xl mx-auto"
        >
          <HeroMockup />
        </motion.div>
      </div>
    </section>
  )
}

// Realistic product mockup: chat + brain panel side by side
function HeroMockup() {
  const emotionData = [
    { name: 'Loneliness', value: 35 },
    { name: 'Shame', value: 28 },
    { name: 'Hope', value: 22 },
    { name: 'Grief', value: 15 },
  ]
  const colors = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b']

  return (
    <div className="relative rounded-2xl border border-border/60 bg-card shadow-2xl shadow-primary/10 overflow-hidden">
      {/* Fake browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/30">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        </div>
        <div className="flex-1 mx-4">
          <div className="h-5 rounded-md bg-background/60 text-center text-[10px] text-muted-foreground flex items-center justify-center">
            tenzure.io/chat
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
        {/* Chat column */}
        <div className="p-5 sm:p-6 border-r border-border/60">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-sm">🧠</div>
            <div>
              <div className="text-xs font-semibold">Sage</div>
              <div className="text-[10px] text-muted-foreground">Integrative Psychoanalyst</div>
            </div>
            <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-md">
              <Ear className="w-2.5 h-2.5" /> Listening
            </div>
          </div>

          <div className="space-y-3">
            <MessageBubbleMockup
              from="ai"
              text="What I'm hearing underneath all of that is someone who learned early that their needs were too much. Does that land?"
            />
            <MessageBubbleMockup
              from="user"
              text="Yeah. My mom always said I was 'too sensitive.' I think I've been trying to be smaller my whole life."
            />
            <MessageBubbleMockup
              from="ai"
              text="When you say you've been trying to be smaller — smaller than what, exactly? What would taking up your full space feel like?"
              isTyping
            />
          </div>
        </div>

        {/* Brain panel column */}
        <div className="hidden lg:block p-4 bg-muted/20 space-y-3">
          <div className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-primary" />
            <div className="text-xs font-bold">Brain Language</div>
            <div className="ml-auto text-[9px] text-green-600 font-medium flex items-center gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </div>
          </div>

          {/* Profile sync CTA */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/30 rounded-lg p-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold">Update Master Profile</div>
                <div className="text-[9px] text-muted-foreground truncate">Add insights to profile</div>
              </div>
            </div>
          </div>

          {/* Trajectory */}
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-card border">
            <div className="w-5 h-5 rounded bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-green-500" />
            </div>
            <div>
              <div className="text-[10px] font-semibold">Going Deeper</div>
              <div className="text-[9px] text-muted-foreground">Core wound emerging</div>
            </div>
          </div>

          {/* Pie chart */}
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Emotional Spectrum</div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={emotionData} dataKey="value" cx="50%" cy="50%" innerRadius={14} outerRadius={28} strokeWidth={1.5} stroke="white">
                      {emotionData.map((_, i) => (
                        <Cell key={i} fill={colors[i]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-0.5">
                {emotionData.map((e, i) => (
                  <div key={e.name} className="flex items-center gap-1.5 text-[9px]">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[i] }} />
                    <span className="text-muted-foreground flex-1">{e.name}</span>
                    <span className="font-medium tabular-nums">{e.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key insight */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-2.5">
            <div className="flex items-center gap-1 mb-1">
              <Eye className="w-2.5 h-2.5 text-primary" />
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary">Key Insight</span>
            </div>
            <div className="text-[10px] font-semibold mb-1">The Parentified Child</div>
            <div className="text-[9px] text-muted-foreground leading-snug">Taking up less space became a survival strategy. Now it's the cage.</div>
          </div>

          {/* Patterns */}
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Active Patterns</div>
            <div className="space-y-1">
              <PatternPill label="Emotional Deprivation" framework="Schema" />
              <PatternPill label="Self-Silencing" framework="IFS" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageBubbleMockup({ from, text, isTyping }) {
  const isUser = from === 'user'
  return (
    <div className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Brain className="w-3 h-3 text-primary" />
        </div>
      )}
      <div
        className={cn(
          'text-xs px-3 py-2 rounded-2xl max-w-[85%] leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-card border rounded-bl-sm'
        )}
      >
        {text}
        {isTyping && <span className="inline-block w-1 h-3 ml-0.5 bg-primary/60 animate-pulse rounded-sm align-middle" />}
      </div>
    </div>
  )
}

function PatternPill({ label, framework }) {
  return (
    <div className="bg-card border rounded-md p-1.5">
      <div className="flex items-center gap-1 mb-0.5">
        <Target className="w-2.5 h-2.5 text-primary" />
        <span className="text-[9px] font-semibold truncate">{label}</span>
        <span className="ml-auto text-[8px] px-1 py-0 rounded bg-muted text-muted-foreground">{framework}</span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary/60 rounded-full" style={{ width: '72%' }} />
      </div>
    </div>
  )
}

// ============================================================================
// PERSONA SHOWCASE
// ============================================================================
function PersonaShowcase() {
  return (
    <section className="py-20 px-4 border-t border-border/40">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center space-y-3 mb-12"
        >
          <Badge variant="secondary" className="text-xs">13 specialists</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Pick the therapist <span className="text-primary">you actually need</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each specialist is trained in a distinct clinical framework — the same frameworks licensed therapists study for years. Switch any time, per session or mid-conversation.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {PERSONAS.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 8) * 0.04 }}
              className="group relative bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"
            >
              <div className={cn('absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r rounded-t-xl', p.gradient)} />
              <div className="flex items-start gap-2.5">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br flex-shrink-0', p.gradient)}>
                  {p.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate">{p.name}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight line-clamp-2">{p.title}</div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground/80 italic mt-2 line-clamp-2">{p.tagline}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// BRAIN LANGUAGE
// ============================================================================
function BrainLanguage() {
  return (
    <section className="py-20 px-4 border-t border-border/40 bg-muted/20">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
        >
          <Badge variant="secondary" className="text-xs mb-4">Brain Language — live analysis</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Watch your mind get <span className="text-primary">mapped in real time</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            As you talk, an AI psychoanalyst documents what's happening beneath the surface — active patterns, emotional spectrum, cognitive maps, and breakthrough moments. Nothing stays hidden from you.
          </p>
          <div className="space-y-3">
            {[
              { icon: Target, title: 'Active Patterns', desc: 'Schemas, defenses, archetypes detected live' },
              { icon: Eye, title: 'Key Insights', desc: 'The one thing happening beneath the surface' },
              { icon: Compass, title: 'Cognitive Map', desc: 'Core belief → trigger → response → hidden need' },
              { icon: Bookmark, title: 'Save to Memory', desc: 'Bookmark insights to revisit anytime' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
        >
          <BrainPanelMockup />
        </motion.div>
      </div>
    </section>
  )
}

function BrainPanelMockup() {
  const data = [
    { name: 'Anxiety', value: 42 },
    { name: 'Hope', value: 28 },
    { name: 'Sadness', value: 18 },
    { name: 'Anger', value: 12 },
  ]
  const colors = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b']

  return (
    <div className="bg-card border rounded-2xl shadow-xl p-5 space-y-4 max-w-sm mx-auto">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary" />
        <div className="text-sm font-bold">Brain Language</div>
        <Badge variant="secondary" className="ml-auto text-[10px]">7 saved</Badge>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/30 rounded-xl p-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
          </div>
          <div>
            <div className="text-xs font-semibold">Update Master Profile</div>
            <div className="text-[10px] text-muted-foreground">Enrich profile with insights</div>
          </div>
        </div>
      </div>

      {/* Spectrum */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Emotional Spectrum</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 flex-shrink-0">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={18} outerRadius={36} strokeWidth={2} stroke="white">
                  {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-1">
            {data.map((e, i) => (
              <div key={e.name} className="flex items-center gap-1.5 text-[11px]">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i] }} />
                <span className="text-muted-foreground flex-1">{e.name}</span>
                <span className="font-medium tabular-nums">{e.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Insight */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Eye className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Key Insight</span>
          <BookmarkCheck className="w-3 h-3 text-primary ml-auto" />
        </div>
        <div className="text-xs font-semibold mb-1">The Performance Trap</div>
        <div className="text-[11px] text-muted-foreground leading-snug">Achievement is being used as proof of worth. The underlying question: "am I lovable even when I'm not impressive?"</div>
      </div>

      {/* Pattern */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Active Patterns</div>
        <div className="space-y-1.5">
          <div className="bg-card border rounded-lg p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
                <AlertCircle className="w-2.5 h-2.5 text-primary" />
              </div>
              <span className="text-[11px] font-semibold">Unrelenting Standards</span>
              <span className="ml-auto text-[9px] px-1 rounded bg-muted">Schema</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary/60 rounded-full" style={{ width: '85%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MODES
// ============================================================================
function Modes() {
  const modes = [
    {
      icon: Ear,
      name: 'Listening',
      tagline: 'Just be heard',
      desc: 'Deep reflection and emotional attunement. No fixing. Person-centered and psychodynamic.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Lightbulb,
      name: 'Solutions',
      tagline: 'Get unstuck',
      desc: 'Behavioral experiments, DBT skills, Stoic exercises. Actionable frameworks and concrete steps.',
      gradient: 'from-amber-500 to-orange-500',
    },
    {
      icon: Swords,
      name: 'Challenger',
      tagline: 'Get sharpened',
      desc: 'Interrogates your claims. Reveals blind spots, emotional distortions, cognitive biases. Truth over comfort.',
      gradient: 'from-rose-500 to-red-500',
    },
  ]

  return (
    <section className="py-20 px-4 border-t border-border/40">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center space-y-3 mb-12"
        >
          <Badge variant="secondary" className="text-xs">Three modes</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Three ways to be met — <span className="text-primary">you choose</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Different moments need different conversations. Switch between modes in one tap, mid-session if you want.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4">
          {modes.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative bg-card border rounded-2xl p-6 overflow-hidden group hover:border-primary/40 transition-colors"
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity', m.gradient)} />
              <div className="relative">
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4', m.gradient)}>
                  <m.icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{m.name}</div>
                <h3 className="text-xl font-bold mb-2">{m.tagline}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// CLINICAL DEPTH
// ============================================================================
function ClinicalDepth() {
  const frameworks = [
    'CBT (Beck, Burns)',
    'DBT (Linehan)',
    'ACT (Hayes)',
    'Schema Therapy (Young)',
    'IFS (Schwartz)',
    'Polyvagal Theory (Porges)',
    'Somatic Experiencing (Levine)',
    'Attachment Theory (Bowlby)',
    'Jungian Depth Psychology',
    'Motivational Interviewing',
    'Gottman Method',
    'EFT (Sue Johnson)',
    'Solution-Focused (de Shazer)',
    'Person-Centered (Rogers)',
    'Stoicism (Aurelius, Epictetus)',
    'MBSR (Kabat-Zinn)',
    'NVC (Rosenberg)',
    'Trauma-Focused CBT',
    'EMDR principles',
    'Existential (Frankl, Yalom)',
  ]

  return (
    <section className="py-20 px-4 border-t border-border/40 bg-gradient-to-b from-muted/20 to-background">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center space-y-3 mb-10"
        >
          <Badge variant="secondary" className="text-xs">Clinical depth</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Trained in the <span className="text-primary">actual frameworks</span> clinicians use
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Not vague "AI wellness." Every specialist is prompted with specific modalities, foundational authors, and real clinical techniques.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {frameworks.map((f, i) => (
            <motion.span
              key={f}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.02 }}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
            >
              {f}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================================
// HOW IT WORKS
// ============================================================================
function HowItWorks() {
  const steps = [
    {
      icon: MessageCircle,
      title: 'Conversational onboarding',
      desc: 'No forms. A natural conversation where Sage learns your story, your patterns, and what you need.',
    },
    {
      icon: Fingerprint,
      title: 'Your psychoanalytic profile',
      desc: 'See yourself through a clinical lens — archetype, schemas, defenses, revelations you never articulated.',
    },
    {
      icon: Brain,
      title: 'Talk to your specialist',
      desc: 'Pick the therapist that fits the moment. Chat streams in real time. Brain Language maps your mind as you speak.',
    },
    {
      icon: Check,
      title: 'Sync insights to your profile',
      desc: 'One tap turns each session into lasting self-knowledge. Your master profile gets richer over time.',
    },
  ]

  return (
    <section className="py-20 px-4 border-t border-border/40">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center space-y-3 mb-14"
        >
          <Badge variant="secondary" className="text-xs">How it works</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Four steps to deeper self-understanding</h2>
        </motion.div>

        <div className="relative space-y-8 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative"
            >
              <div className="absolute -top-3 -left-2 text-6xl font-bold text-primary/10 select-none">
                {i + 1}
              </div>
              <div className="relative pl-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-bold mb-1.5">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// COMPARISON
// ============================================================================
function Comparison() {
  const rows = [
    { feature: '13 specialist therapists (each with clinical training)', us: true, a: true, b: false },
    { feature: 'Real-time brain language panel', us: true, a: false, b: false },
    { feature: 'Switch therapy mode (listen / solve / challenge)', us: true, a: false, b: false },
    { feature: 'Auto-generated psychoanalytic profile', us: true, a: false, b: true },
    { feature: 'Profile enriches automatically from each chat', us: true, a: false, b: false },
    { feature: 'Crisis-safe protocol in every mode', us: true, a: true, b: true },
    { feature: 'Your data stays private (no training)', us: true, a: true, b: true },
  ]

  return (
    <section className="py-20 px-4 border-t border-border/40 bg-muted/20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={fadeUp}
          className="text-center space-y-3 mb-10"
        >
          <Badge variant="secondary" className="text-xs">Why Tenzure</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">The features others don't build</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-card border rounded-2xl overflow-hidden shadow-lg"
        >
          <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 px-4 sm:px-6 py-3 border-b bg-muted/50 text-[11px] font-semibold uppercase tracking-wider">
            <div>Feature</div>
            <div className="text-center text-primary">Tenzure</div>
            <div className="text-center text-muted-foreground">Others A</div>
            <div className="text-center text-muted-foreground">Others B</div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.feature}
              className={cn(
                'grid grid-cols-[1fr_80px_80px_80px] gap-2 px-4 sm:px-6 py-3 text-sm items-center',
                i !== rows.length - 1 && 'border-b'
              )}
            >
              <div className="text-foreground">{r.feature}</div>
              <div className="text-center">
                {r.us ? <Check className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>}
              </div>
              <div className="text-center">
                {r.a ? <Check className="w-4 h-4 text-muted-foreground mx-auto" /> : <span className="text-muted-foreground">—</span>}
              </div>
              <div className="text-center">
                {r.b ? <Check className="w-4 h-4 text-muted-foreground mx-auto" /> : <span className="text-muted-foreground">—</span>}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ============================================================================
// SAFETY / PRIVACY
// ============================================================================
function Safety() {
  return (
    <section className="py-20 px-4 border-t border-border/40">
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        {[
          {
            icon: Shield,
            title: 'Crisis-safe, always',
            desc: 'Every mode automatically stops and surfaces 988 + crisis resources when distress signals are detected.',
          },
          {
            icon: Lock,
            title: 'Private by design',
            desc: 'End-to-end encryption, per-row security policies, and your data is never used to train external models.',
          },
          {
            icon: AlertCircle,
            title: 'Not a replacement',
            desc: 'Tenzure supplements human care. We clearly flag when professional support is needed.',
          },
        ].map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="bg-card border rounded-2xl p-6"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <s.icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold mb-1.5">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// FINAL CTA
// ============================================================================
function FinalCTA() {
  return (
    <section className="py-20 px-4 border-t border-border/40">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-primary/5 p-10 sm:p-16"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/30 blur-[100px] rounded-full -z-10" />
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-5">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          Start the conversation that changes how you see yourself
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-7">
          Free to start. Your first psychoanalytic profile takes 10 minutes of conversation. After that, every session makes it sharper.
        </p>
        <Button asChild size="lg" className="gap-2 h-12 px-8 text-base shadow-xl shadow-primary/30">
          <Link to="/auth">
            Start Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <p className="text-[11px] text-muted-foreground mt-4">
          No credit card · Cancel anytime · Crisis-safe
        </p>
      </motion.div>
    </section>
  )
}

// ============================================================================
// LANDING PAGE
// ============================================================================
export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <PersonaShowcase />
      <BrainLanguage />
      <Modes />
      <HowItWorks />
      <ClinicalDepth />
      <Comparison />
      <Safety />
      <FinalCTA />
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Tenzure is an AI wellness companion. It is not a replacement for licensed mental health care.
          </p>
          <p className="text-[11px] text-muted-foreground">
            If you are in crisis, call or text <strong>988</strong> (US) or your local emergency line.
          </p>
        </div>
      </footer>
    </div>
  )
}
