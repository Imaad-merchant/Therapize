import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { useChatStore } from '@/stores/chatStore'
import { useMemories } from '@/hooks/useMemories'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Brain,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Target,
  Shield,
  Eye,
  Compass,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  Heart,
  AlertTriangle,
  TrendingUp,
  Check,
  CircleCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const EMOTION_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
]

const PATTERN_ICONS = {
  pattern: TrendingUp,
  defense: Shield,
  schema: AlertTriangle,
  archetype: Zap,
}

const TRAJECTORY_ICONS = {
  deepening: TrendingUp,
  circling: Compass,
  avoiding: Shield,
  breaking_through: Zap,
  processing: Brain,
}

function EmotionSpectrum({ spectrum }) {
  if (!spectrum?.length) return null

  return (
    <div className="flex items-center gap-3">
      <div className="w-20 h-20 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={spectrum}
              dataKey="value"
              nameKey="emotion"
              cx="50%"
              cy="50%"
              innerRadius={18}
              outerRadius={36}
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              {spectrum.map((_, i) => (
                <Cell key={i} fill={EMOTION_COLORS[i % EMOTION_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-1.5">
        {spectrum.map((item, i) => (
          <div key={item.emotion} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: EMOTION_COLORS[i % EMOTION_COLORS.length] }}
            />
            <span className="text-xs text-muted-foreground capitalize flex-1">
              {item.emotion}
            </span>
            <span className="text-xs font-medium tabular-nums">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PatternCard({ pattern, onSave, isSaved }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = PATTERN_ICONS[pattern.type] || Target

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold truncate">{pattern.label}</span>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 flex-shrink-0">
              {pattern.framework}
            </Badge>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-muted-foreground mt-0.5 text-left hover:text-foreground transition-colors flex items-center gap-0.5"
          >
            {expanded ? pattern.description : pattern.description.slice(0, 60) + (pattern.description.length > 60 ? '...' : '')}
            {pattern.description.length > 60 && (
              expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={() => onSave(pattern)}
        >
          {isSaved ? (
            <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Bookmark className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
      {/* Confidence bar */}
      <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary/60 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(pattern.confidence || 0.5) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}

function KeyInsightCard({ insight, onSave, isSaved }) {
  if (!insight) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Eye className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Key Insight
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onSave(insight)}
        >
          {isSaved ? (
            <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Bookmark className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
      <h4 className="text-sm font-semibold mb-1.5">{insight.title}</h4>
      <p className="text-xs text-muted-foreground leading-relaxed">{insight.body}</p>
      {insight.quote && (
        <div className="mt-3 pl-3 border-l-2 border-primary/30">
          <p className="text-[11px] italic text-muted-foreground">"{insight.quote}"</p>
        </div>
      )}
    </motion.div>
  )
}

function CognitiveMap({ map }) {
  if (!map) return null

  const items = [
    { label: 'Core Belief', value: map.core_belief, icon: Brain },
    { label: 'Trigger', value: map.trigger, icon: Zap },
    { label: 'Response', value: map.behavioral_response, icon: Target },
    { label: 'Hidden Need', value: map.hidden_need, icon: Heart },
  ]

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start gap-2 p-2 rounded-lg bg-card border border-border"
        >
          <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
            <item.icon className="w-3 h-3 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {item.label}
            </span>
            <p className="text-xs leading-relaxed">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function SessionTrajectory({ trajectory }) {
  if (!trajectory) return null
  const Icon = TRAJECTORY_ICONS[trajectory.direction] || Compass

  const directionLabels = {
    deepening: 'Going Deeper',
    circling: 'Circling a Theme',
    avoiding: 'Deflecting',
    breaking_through: 'Breakthrough Moment',
    processing: 'Processing',
  }

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border">
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center',
          trajectory.direction === 'breaking_through'
            ? 'bg-green-500/10'
            : trajectory.direction === 'avoiding'
              ? 'bg-amber-500/10'
              : 'bg-primary/10'
        )}
      >
        <Icon
          className={cn(
            'w-4 h-4',
            trajectory.direction === 'breaking_through'
              ? 'text-green-500'
              : trajectory.direction === 'avoiding'
                ? 'text-amber-500'
                : 'text-primary'
          )}
        />
      </div>
      <div className="min-w-0">
        <span className="text-xs font-semibold">
          {directionLabels[trajectory.direction] || trajectory.direction}
        </span>
        <p className="text-[11px] text-muted-foreground truncate">{trajectory.note}</p>
      </div>
    </div>
  )
}

export function BrainPanel() {
  const { brainInsights, isAnalyzing, currentSessionId } = useChatStore()
  const { memories, saveMemory } = useMemories()
  const { user, getAccessToken } = useAuth()
  const queryClient = useQueryClient()
  const [syncing, setSyncing] = useState(false)
  const [justSynced, setJustSynced] = useState(false)
  const [changelogData, setChangelogData] = useState(null)

  const handleSyncToProfile = async () => {
    if (syncing) return
    setSyncing(true)
    try {
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Not signed in')
      }
      const res = await fetch('/api/profile/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: currentSessionId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || `Sync failed (${res.status})`)
      }
      // Force a hard refetch — not just invalidation — so Profile page updates immediately
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      await queryClient.refetchQueries({ queryKey: ['profile'] })
      setJustSynced(true)
      setChangelogData({
        summary: data.changes_summary,
        changelog: data.changelog || [],
      })
      setTimeout(() => setJustSynced(false), 5000)
    } catch (e) {
      console.error('Sync error:', e)
      toast.error('Could not sync to profile', {
        description: e.message || 'Check console for details',
      })
    } finally {
      setSyncing(false)
    }
  }

  // Check if insight is already saved by matching payload identity
  const isPatternSaved = (patternId) =>
    memories.some(
      (m) => m.source_type === 'pattern' && m.payload?.id === patternId
    )

  const isKeyInsightSaved = (insight) =>
    memories.some(
      (m) => m.source_type === 'key_insight' && m.payload?.title === insight.title
    )

  const handleSavePattern = (pattern) => {
    if (isPatternSaved(pattern.id)) return
    saveMemory.mutate({
      session_id: currentSessionId,
      source_type: 'pattern',
      payload: pattern,
    })
  }

  const handleSaveInsight = (insight) => {
    if (isKeyInsightSaved(insight)) return
    saveMemory.mutate({
      session_id: currentSessionId,
      source_type: 'key_insight',
      payload: insight,
    })
  }

  // Empty state
  if (!brainInsights && !isAnalyzing) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
          <Brain className="w-8 h-8 text-primary/40" />
        </div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-1">
          Brain Language
        </h3>
        <p className="text-xs text-muted-foreground/70 max-w-[200px]">
          As you talk, I'll map what's happening in your mind in real time.
        </p>
      </div>
    )
  }

  // Loading state
  if (isAnalyzing && !brainInsights) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-xs text-muted-foreground">Analyzing your mind...</p>
      </div>
    )
  }

  const insights = brainInsights

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-5">
        {/* Changelog banner (shows briefly after sync) */}
        <AnimatePresence>
          {changelogData && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="overflow-hidden"
            >
              <div className="relative bg-gradient-to-br from-green-500/10 to-primary/10 border border-green-500/30 rounded-xl p-3.5">
                <button
                  onClick={() => setChangelogData(null)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-green-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-green-600">
                    Profile Enriched
                  </span>
                </div>
                {changelogData.summary && (
                  <p className="text-xs text-muted-foreground mb-2.5 leading-relaxed pr-4">
                    {changelogData.summary}
                  </p>
                )}
                {changelogData.changelog.length > 0 && (
                  <div className="space-y-1.5">
                    {changelogData.changelog.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="font-semibold text-foreground">{c.field}</span>
                          <span className="text-muted-foreground"> — {c.summary}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold">Brain Language</h3>
          <div className="ml-auto flex items-center gap-1.5">
            {isAnalyzing && (
              <Loader2 className="w-3 h-3 text-primary animate-spin" />
            )}
            {memories.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {memories.length} saved
              </Badge>
            )}
          </div>
        </div>

        {/* Sync to Profile CTA */}
        <motion.button
          onClick={handleSyncToProfile}
          disabled={syncing}
          whileHover={{ scale: syncing ? 1 : 1.01 }}
          whileTap={{ scale: syncing ? 1 : 0.99 }}
          className={cn(
            'w-full relative overflow-hidden rounded-xl border p-3 text-left transition-colors',
            justSynced
              ? 'bg-green-500/10 border-green-500/40'
              : 'bg-gradient-to-br from-primary/10 to-primary/20 border-primary/40 hover:border-primary/60',
            syncing && 'opacity-70 cursor-wait'
          )}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
                justSynced ? 'bg-green-500' : 'bg-primary'
              )}
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
              ) : justSynced ? (
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              ) : (
                <CircleCheck className="w-4 h-4 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold">
                {justSynced
                  ? 'Profile Updated'
                  : syncing
                    ? 'Syncing to profile...'
                    : 'Update Master Profile'}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {justSynced
                  ? 'Insights merged into your profile'
                  : 'Add these insights to your master psychological profile'}
              </div>
            </div>
          </div>
        </motion.button>

        {/* Session Trajectory */}
        <AnimatePresence mode="wait">
          {insights?.session_trajectory && (
            <motion.div
              key={insights.session_trajectory.direction}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
            >
              <SessionTrajectory trajectory={insights.session_trajectory} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emotional Spectrum */}
        {insights?.emotional_state?.spectrum && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Emotional Spectrum
              </span>
            </div>
            <EmotionSpectrum spectrum={insights.emotional_state.spectrum} />
          </div>
        )}

        {/* Key Insight */}
        {insights?.key_insight && (
          <KeyInsightCard
            insight={insights.key_insight}
            onSave={handleSaveInsight}
            isSaved={isKeyInsightSaved(insights.key_insight)}
          />
        )}

        {/* Active Patterns */}
        {insights?.active_patterns?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Target className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Patterns
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {insights.active_patterns.map((pattern) => (
                  <PatternCard
                    key={pattern.id}
                    pattern={pattern}
                    onSave={handleSavePattern}
                    isSaved={isPatternSaved(pattern.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Cognitive Map */}
        {insights?.cognitive_map && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Compass className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cognitive Map
              </span>
            </div>
            <CognitiveMap map={insights.cognitive_map} />
          </div>
        )}

        {/* Themes */}
        {insights?.themes?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Themes
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {insights.themes.map((theme) => (
                <Badge key={theme} variant="secondary" className="text-[11px]">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
