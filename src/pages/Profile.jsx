import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProfile } from '@/hooks/useProfile'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  Sparkles,
  Ghost,
  Flame,
  Lock,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

export default function Profile() {
  const { profile, isLoading } = useProfile()
  const navigate = useNavigate()
  const q = profile?.questionnaire || {}

  if (isLoading) {
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="max-w-3xl mx-auto px-4 pt-16 pb-12 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Fingerprint className="w-10 h-10 text-primary" />
            </div>

            {q.personality_archetype?.label && (
              <Badge
                variant="secondary"
                className="text-sm px-4 py-1.5 font-medium"
              >
                {q.personality_archetype.label}
              </Badge>
            )}

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {profile?.display_name
                ? `${profile.display_name}, This Is You`
                : 'This Is You'}
            </h1>

            {q.the_headline && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed italic"
              >
                "{q.the_headline}"
              </motion.p>
            )}

            {q.personality_archetype?.description && (
              <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                {q.personality_archetype.description}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pb-20 space-y-6">
        {/* Life Context */}
        {q.life_context_document && (
          <Section icon={Brain} title="Your Story" delay={0.1}>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {q.life_context_document}
            </div>
          </Section>
        )}

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

        {/* Strengths & Growth */}
        <div className="grid md:grid-cols-2 gap-4">
          {q.strengths?.length > 0 && (
            <Section icon={Star} title="Your Strengths">
              <div className="space-y-2">
                {q.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                    <p className="text-sm">{s}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {q.growth_edges?.length > 0 && (
            <Section icon={Sparkles} title="Growth Edges">
              <div className="space-y-2">
                {q.growth_edges.map((g, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <p className="text-sm">{g}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4 pt-8"
        >
          <Separator />
          <div className="pt-4 space-y-3">
            <h3 className="text-xl font-semibold">
              This is your starting point
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Sage now understands you at a level most people never reach with a
              therapist in the first session. Every conversation from here is
              built on this foundation.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/chat')}
              className="gap-2 mt-4"
            >
              Begin Your First Session
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
