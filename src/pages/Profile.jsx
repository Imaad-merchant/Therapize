import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts'
import { useProfile } from '@/hooks/useProfile'
import { DEMO_PROFILE } from '@/lib/demo-profile'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Timeline } from '@/components/train/Timeline'
import { MindMap } from '@/components/train/MindMap'
import { Clock, Network } from 'lucide-react'
import {
  Brain,
  Heart,
  Shield,
  Eye,
  Zap,
  Target,
  Fingerprint,
  Layers,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Ghost,
  Flame,
  Lock,
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const CHART_COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444']

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
}

function Section({ icon: Icon, title, children, delay = 0, className }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className={cn('p-6 space-y-4', className)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        {children}
      </Card>
    </motion.div>
  )
}

function RevealCard({ title, insight, evidence, index }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card
        className="p-5 cursor-pointer hover:border-primary/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-2 flex-1">
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {insight}
            </p>
            {expanded && evidence && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-2 border-t mt-2"
              >
                <p className="text-xs text-muted-foreground italic">
                  "{evidence}"
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

// ============================================================================
// VISUAL SUMMARY — At a glance charts and comparables
// ============================================================================
function VisualSummary({ q }) {
  // Build emotional mix from dominant + suppressed
  const dominant = q.emotional_fingerprint?.dominant_emotions || []
  const suppressed = q.emotional_fingerprint?.suppressed_emotions || []

  const emotionPie = [
    ...dominant.slice(0, 3).map((e, i) => ({ name: e, value: 30 - i * 5 })),
    ...(suppressed[0] ? [{ name: `${suppressed[0]} (suppressed)`, value: 15 }] : []),
  ]
  const hasEmotionData = emotionPie.length > 0

  // Attachment breakdown — estimated mix
  const attachStyle = q.attachment_patterns?.primary_style?.toLowerCase() || ''
  const attachmentData = attachStyle
    ? [
        { name: 'Secure', value: attachStyle.includes('secure') ? 70 : attachStyle.includes('anxious-secure') ? 45 : 20 },
        { name: 'Anxious', value: attachStyle.includes('anxious') ? 55 : attachStyle.includes('disorganized') ? 40 : 15 },
        { name: 'Avoidant', value: attachStyle.includes('avoidant') || attachStyle.includes('dismissive') ? 60 : attachStyle.includes('disorganized') ? 35 : 15 },
        { name: 'Disorganized', value: attachStyle.includes('disorganized') ? 50 : 10 },
      ]
    : null

  // Radar — personality dimensions
  const radarData = [
    { trait: 'Openness', value: (q.strengths || []).length * 15 + 30 },
    { trait: 'Resilience', value: (q.strengths || []).length * 12 + 40 },
    { trait: 'Self-Awareness', value: (q.revelations || []).length * 10 + 30 },
    { trait: 'Vulnerability', value: q.relational_patterns?.vulnerability_capacity ? 55 : 35 },
    { trait: 'Growth Edge', value: (q.growth_edges || []).length * 12 + 35 },
    { trait: 'Shadow Integration', value: q.shadow_profile ? 45 : 25 },
  ].map((d) => ({ ...d, value: Math.min(d.value, 95) }))

  // Quick stats cards
  const stats = [
    { icon: Eye, label: 'Revelations', value: q.revelations?.length || 0, color: 'text-violet-500' },
    { icon: Lock, label: 'Core Schemas', value: q.core_schemas?.length || 0, color: 'text-rose-500' },
    { icon: Shield, label: 'Defenses', value: q.defense_mechanisms?.length || 0, color: 'text-amber-500' },
    { icon: Star, label: 'Strengths', value: q.strengths?.length || 0, color: 'text-emerald-500' },
  ]

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4 flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-lg bg-muted flex items-center justify-center', s.color)}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-2xl font-bold leading-none">{s.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Emotional mix pie */}
        {hasEmotionData && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold">Emotional Mix</h4>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-28 h-28 flex-shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={emotionPie}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={26}
                      outerRadius={50}
                      strokeWidth={2}
                      stroke="hsl(var(--background))"
                    >
                      {emotionPie.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                {emotionPie.map((e, i) => (
                  <div key={e.name} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-xs text-muted-foreground capitalize flex-1 truncate">{e.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Personality radar */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold">Psychological Profile</h4>
          </div>
          <div className="w-full h-40">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="trait"
                  tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Radar
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Attachment breakdown */}
      {attachmentData && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold">Attachment Mix</h4>
            </div>
            <Badge variant="secondary" className="text-[10px] capitalize">
              Primary: {q.attachment_patterns?.primary_style}
            </Badge>
          </div>
          <div className="space-y-2">
            {attachmentData.map((a, i) => (
              <div key={a.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{a.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{a.value}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${a.value}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: CHART_COLORS[i] }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Attachment isn't a single label — it's a <strong className="text-foreground">mix</strong>. Most people lean into one style but carry threads of others depending on the relationship.
          </p>
        </Card>
      )}

      {/* Strengths vs Growth Edges side by side */}
      {(q.strengths?.length > 0 || q.growth_edges?.length > 0) && (
        <div className="grid md:grid-cols-2 gap-3">
          {q.strengths?.length > 0 && (
            <Card className="p-4 border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600">What You Have</h4>
              </div>
              <ul className="space-y-1.5">
                {q.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {q.growth_edges?.length > 0 && (
            <Card className="p-4 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Where To Grow</h4>
              </div>
              <ul className="space-y-1.5">
                {q.growth_edges.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-primary mt-0.5">↗</span>
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ============================================================================
// TRAINED MEMORIES — things the user told Sage to remember
// ============================================================================
function TrainedMemoriesSection({ q, onNavigate }) {
  const memories = q.user_trained_memories || []

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-5 border-primary/30 bg-gradient-to-br from-primary/5 to-card">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Things You've Told Sage</h3>
              <p className="text-xs text-muted-foreground">
                {memories.length > 0
                  ? `Sage references these whenever they're relevant`
                  : 'Teach Sage things about you — and it will remember forever'}
              </p>
            </div>
          </div>
          <Button size="sm" variant={memories.length > 0 ? 'outline' : 'default'} onClick={onNavigate} className="gap-1.5 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            {memories.length > 0 ? 'Manage' : 'Train AI'}
          </Button>
        </div>
        {memories.length > 0 ? (
          <ul className="space-y-1.5 pt-1">
            {memories.slice(0, 4).map((m) => (
              <li key={m.id} className="flex items-start gap-2 text-xs">
                <span className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span className="text-muted-foreground leading-relaxed line-clamp-2">{m.text}</span>
              </li>
            ))}
            {memories.length > 4 && (
              <li className="text-[11px] text-primary pl-3">
                + {memories.length - 4} more
              </li>
            )}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground italic pt-1">
            Example: "My dad died when I was 12 — I still avoid Father's Day" — Sage will weave it into every future conversation.
          </p>
        )}
      </Card>
    </motion.div>
  )
}

export default function Profile() {
  const { profile, isLoading } = useProfile()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isDemo = searchParams.get('demo') === 'true'
  const activeProfile = isDemo ? DEMO_PROFILE : profile
  const q = activeProfile?.questionnaire || {}

  if (isLoading && !isDemo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!q.completed_at) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Complete the intake conversation first.
          </p>
          <Button onClick={() => navigate('/onboarding')}>
            Start Conversation
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
      {/* Back button */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/chat')}
            className="gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chat</span>
          </Button>
        </div>
      </div>

      {/* Compact Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-5 pb-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Fingerprint className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                {activeProfile?.display_name
                  ? `${activeProfile.display_name}, This Is You`
                  : 'This Is You'}
              </h1>
              {q.personality_archetype?.label && (
                <Badge variant="secondary" className="text-[11px]">
                  {q.personality_archetype.label}
                </Badge>
              )}
            </div>
            {q.the_headline && (
              <p className="text-sm text-muted-foreground italic mt-0.5 line-clamp-1">
                "{q.the_headline}"
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto mb-5">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="story" className="text-xs sm:text-sm">Your Life</TabsTrigger>
            <TabsTrigger value="patterns" className="text-xs sm:text-sm">Patterns</TabsTrigger>
            <TabsTrigger value="sessions" className="text-xs sm:text-sm">Sessions</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-5 mt-0">
            <VisualSummary q={q} />
            <TrainedMemoriesSection q={q} onNavigate={() => navigate('/train')} />

            {/* Revelations */}
            {q.revelations?.length > 0 && (
              <motion.div
                variants={stagger}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
              >
                <div className="flex items-center gap-3 mb-4 px-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Things You Might Not Realize
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Tap any card to see the evidence
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {q.revelations.map((r, i) => (
                    <RevealCard key={i} index={i} {...r} />
                  ))}
                </div>
              </motion.div>
            )}
          </TabsContent>

          {/* STORY TAB — Life context + Timeline + MindMap */}
          <TabsContent value="story" className="space-y-5 mt-0">
            {q.life_context_document && (
              <Section icon={Brain} title="Your Story" delay={0.05}>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {q.life_context_document}
                </div>
              </Section>
            )}

            {(q.user_trained_memories?.length || 0) > 0 ? (
              <div className="grid lg:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold">Timeline</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {q.user_trained_memories.length}
                    </Badge>
                  </div>
                  <div className="max-h-[480px] overflow-y-auto pr-1">
                    <Timeline memories={q.user_trained_memories} />
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Network className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold">Mind Map</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {q.user_trained_memories.length}
                    </Badge>
                  </div>
                  <MindMap
                    memories={q.user_trained_memories}
                    userName={activeProfile?.display_name || 'You'}
                    height={460}
                  />
                </Card>
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold mb-1">No memories yet</h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                  Train Sage with memories from your past — they'll appear on a timeline and connect in a mind map.
                </p>
                <Button size="sm" onClick={() => navigate('/train')} className="gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Train Sage
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* PATTERNS TAB */}
          <TabsContent value="patterns" className="space-y-5 mt-0">
            {/* Inner World */}
        {q.inner_world && (
          <Section icon={Ghost} title="Your Inner World" delay={0.1}>
            <div className="space-y-4">
              {q.inner_world.core_belief && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Core Belief
                  </p>
                  <p className="text-sm">{q.inner_world.core_belief}</p>
                </div>
              )}
              {q.inner_world.inner_critic_voice && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Your Inner Critic Says
                  </p>
                  <p className="text-sm italic text-primary/80">
                    {q.inner_world.inner_critic_voice}
                  </p>
                </div>
              )}
              {q.inner_world.what_they_crave && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    What You Crave Most
                  </p>
                  <p className="text-sm">{q.inner_world.what_they_crave}</p>
                </div>
              )}
              {q.inner_world.what_they_avoid && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    What You Avoid
                  </p>
                  <p className="text-sm">{q.inner_world.what_they_avoid}</p>
                </div>
              )}
              {q.inner_world.superpower && (
                <div className="space-y-1 bg-primary/5 rounded-lg p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    Your Superpower
                  </p>
                  <p className="text-sm">{q.inner_world.superpower}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Attachment */}
        {q.attachment_patterns?.primary_style && (
          <Section icon={Heart} title="How You Attach" delay={0.1}>
            <div className="space-y-4">
              <Badge variant="outline" className="text-sm capitalize">
                {q.attachment_patterns.primary_style}
              </Badge>
              {q.attachment_patterns.how_it_shows_up && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {q.attachment_patterns.how_it_shows_up}
                </p>
              )}
              {q.attachment_patterns.in_relationships && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    In Relationships
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {q.attachment_patterns.in_relationships}
                  </p>
                </div>
              )}
              {q.attachment_patterns.origin_story && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Where This Comes From
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {q.attachment_patterns.origin_story}
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Shadow Profile */}
        {q.shadow_profile && (
          <Section icon={Layers} title="Your Shadow" delay={0.1}>
            <p className="text-xs text-muted-foreground mb-2">
              The parts of yourself you keep hidden — even from you
            </p>
            <div className="space-y-4">
              {q.shadow_profile.rejected_self && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    What You Reject
                  </p>
                  <p className="text-sm">{q.shadow_profile.rejected_self}</p>
                </div>
              )}
              {q.shadow_profile.projection_pattern && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    What You Project
                  </p>
                  <p className="text-sm">
                    {q.shadow_profile.projection_pattern}
                  </p>
                </div>
              )}
              {q.shadow_profile.the_mask && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    The Mask
                  </p>
                  <p className="text-sm">{q.shadow_profile.the_mask}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Core Schemas */}
        {q.core_schemas?.length > 0 && (
          <Section icon={Lock} title="Deep Patterns Running Your Life" delay={0.1}>
            <div className="space-y-5">
              {q.core_schemas.map((s, i) => (
                <div key={i} className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    {s.schema || s}
                  </Badge>
                  {s.how_it_runs_their_life && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {s.how_it_runs_their_life}
                    </p>
                  )}
                  {s.they_might_not_realize && (
                    <p className="text-xs text-primary/70 italic">
                      What you might not see: {s.they_might_not_realize}
                    </p>
                  )}
                  {i < q.core_schemas.length - 1 && (
                    <Separator className="mt-3" />
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Defense Mechanisms */}
        {q.defense_mechanisms?.length > 0 && (
          <Section icon={Shield} title="Your Defense System" delay={0.1}>
            <p className="text-xs text-muted-foreground mb-2">
              How you protect yourself from pain
            </p>
            <div className="space-y-3">
              {q.defense_mechanisms.map((d, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {d.mechanism || d}
                    </p>
                    {d.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {d.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Emotional Fingerprint */}
        {q.emotional_fingerprint && (
          <Section icon={Flame} title="Your Emotional Fingerprint" delay={0.1}>
            <div className="space-y-4">
              {q.emotional_fingerprint.dominant_emotions?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Dominant Emotions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {q.emotional_fingerprint.dominant_emotions.map((e, i) => (
                      <Badge key={i} variant="secondary">
                        {e}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {q.emotional_fingerprint.suppressed_emotions?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Suppressed Emotions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {q.emotional_fingerprint.suppressed_emotions.map((e, i) => (
                      <Badge key={i} variant="outline">
                        {e}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {q.emotional_fingerprint.regulation_style && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Regulation Style
                  </p>
                  <p className="text-sm">
                    {q.emotional_fingerprint.regulation_style}
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Relational Patterns */}
        {q.relational_patterns && (
          <Section
            icon={MessageCircle}
            title="How You Relate"
            delay={0.1}
          >
            <div className="space-y-4">
              {q.relational_patterns.role_in_relationships && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Your Role
                  </p>
                  <p className="text-sm">
                    {q.relational_patterns.role_in_relationships}
                  </p>
                </div>
              )}
              {q.relational_patterns.conflict_style && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    In Conflict
                  </p>
                  <p className="text-sm">
                    {q.relational_patterns.conflict_style}
                  </p>
                </div>
              )}
              {q.relational_patterns.vulnerability_capacity && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Vulnerability
                  </p>
                  <p className="text-sm">
                    {q.relational_patterns.vulnerability_capacity}
                  </p>
                </div>
              )}
              {q.relational_patterns.pattern_they_repeat && (
                <div className="space-y-1 bg-primary/5 rounded-lg p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">
                    Pattern You Keep Repeating
                  </p>
                  <p className="text-sm">
                    {q.relational_patterns.pattern_they_repeat}
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Behavioral Patterns */}
        {q.behavioral_patterns && (
          <Section icon={Zap} title="Your Behavioral Wiring" delay={0.1}>
            <div className="space-y-4">
              {q.behavioral_patterns.under_stress && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Under Stress
                  </p>
                  <p className="text-sm">
                    {q.behavioral_patterns.under_stress}
                  </p>
                </div>
              )}
              {q.behavioral_patterns.self_sabotage && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Self-Sabotage Pattern
                  </p>
                  <p className="text-sm">
                    {q.behavioral_patterns.self_sabotage}
                  </p>
                </div>
              )}
              {q.behavioral_patterns.decision_making && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Decision Making
                  </p>
                  <p className="text-sm">
                    {q.behavioral_patterns.decision_making}
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Existential Landscape */}
        {q.existential_landscape && (
          <Section icon={Target} title="Your Existential Landscape" delay={0.1}>
            <div className="space-y-4">
              {q.existential_landscape.meaning_sources && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Where You Find Meaning
                  </p>
                  <p className="text-sm">
                    {q.existential_landscape.meaning_sources}
                  </p>
                </div>
              )}
              {q.existential_landscape.authenticity_gap && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    The Authenticity Gap
                  </p>
                  <p className="text-sm">
                    {q.existential_landscape.authenticity_gap}
                  </p>
                </div>
              )}
              {q.existential_landscape.core_fears && (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Deepest Fears
                  </p>
                  <p className="text-sm">
                    {q.existential_landscape.core_fears}
                  </p>
                </div>
              )}
            </div>
          </Section>
        )}

        {!q.inner_world &&
          !q.attachment_patterns?.primary_style &&
          !q.shadow_profile &&
          !q.core_schemas?.length &&
          !q.defense_mechanisms?.length &&
          !q.emotional_fingerprint &&
          !q.relational_patterns &&
          !q.behavioral_patterns &&
          !q.existential_landscape && (
            <Card className="p-8 text-center border-dashed">
              <p className="text-sm text-muted-foreground">
                Patterns will appear here as you have more conversations with Sage.
              </p>
            </Card>
          )}
          </TabsContent>

          {/* SESSIONS TAB */}
          <TabsContent value="sessions" className="space-y-5 mt-0">
        {/* Session Notes — auto-synced from each chat */}
        {q.session_notes?.length > 0 && (
          <Section icon={MessageCircle} title="Session Notes" delay={0.1}>
            <p className="text-xs text-muted-foreground mb-3">
              Auto-captured reflections from each of your conversations
            </p>
            <div className="space-y-2">
              {q.session_notes
                .slice()
                .reverse()
                .slice(0, 8)
                .map((n, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                    <div className="w-1 rounded-full bg-primary/40 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{typeof n === 'string' ? n : n.note}</p>
                      {typeof n !== 'string' && n.at && (
                        <span className="text-[10px] text-muted-foreground mt-1.5 block">
                          {new Date(n.at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </Section>
        )}

        {/* Quick history notes if any */}
        {q.history_notes?.length > 0 && (
          <Section icon={Lock} title="Your Story Threads" delay={0.1}>
            <p className="text-xs text-muted-foreground mb-3">
              Pieces of your past that keep surfacing in sessions
            </p>
            <ul className="space-y-1.5">
              {q.history_notes.slice(0, 12).map((h, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary/60 mt-1">◆</span>
                  <span className="leading-relaxed">{h}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {!q.session_notes?.length && !q.history_notes?.length && (
          <Card className="p-8 text-center border-dashed">
            <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No session notes yet</h3>
            <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
              Start a conversation with Sage and reflections will be auto-captured here.
            </p>
            <Button size="sm" onClick={() => navigate('/chat')} className="gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              Start a session
            </Button>
          </Card>
        )}
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-3 pt-8"
        >
          <Separator />
          <div className="pt-3 space-y-2">
            <p className="text-muted-foreground text-xs max-w-md mx-auto">
              Every conversation adds more. Sage auto-updates this profile as you talk.
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Button size="sm" onClick={() => navigate('/chat')} className="gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                Start a session
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate('/train')} className="gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Train Sage
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
