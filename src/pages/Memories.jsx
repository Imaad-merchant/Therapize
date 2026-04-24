import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useMemories } from '@/hooks/useMemories'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  ArrowLeft,
  Bookmark,
  Target,
  Eye,
  Compass,
  Trash2,
  Loader2,
  MessageCircle,
  Brain,
  Zap,
  Shield,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_META = {
  pattern: { icon: Target, label: 'Pattern', color: 'text-violet-500', bg: 'bg-violet-500/10' },
  key_insight: { icon: Eye, label: 'Key Insight', color: 'text-primary', bg: 'bg-primary/10' },
  cognitive_map: { icon: Compass, label: 'Cognitive Map', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  theme: { icon: Brain, label: 'Theme', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
}

const PATTERN_TYPE_ICONS = {
  defense: Shield,
  schema: AlertTriangle,
  archetype: Zap,
  pattern: TrendingUp,
}

function PatternCard({ memory, onDelete }) {
  const p = memory.payload || {}
  const Icon = PATTERN_TYPE_ICONS[p.type] || Target

  return (
    <Card className="p-4 group hover:border-primary/40 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-violet-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold">{p.label}</h4>
            {p.framework && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 flex-shrink-0">
                {p.framework}
              </Badge>
            )}
          </div>
          {p.description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
          )}
          {typeof p.confidence === 'number' && (
            <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500/60 rounded-full"
                style={{ width: `${p.confidence * 100}%` }}
              />
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(memory.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  )
}

function InsightCard({ memory, onDelete }) {
  const i = memory.payload || {}

  return (
    <Card className="p-4 group border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Eye className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="secondary" className="text-[9px] bg-primary/15 text-primary border-0">
              Key Insight
            </Badge>
            {i.title && <h4 className="text-sm font-bold">{i.title}</h4>}
          </div>
          {i.body && (
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">{i.body}</p>
          )}
          {i.quote && (
            <div className="mt-2 pl-3 border-l-2 border-primary/30">
              <p className="text-[11px] italic text-muted-foreground">"{i.quote}"</p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(memory.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  )
}

export default function Memories() {
  const navigate = useNavigate()
  const { memories, isLoading, deleteMemory } = useMemories()

  const grouped = memories.reduce((acc, m) => {
    const key = m.source_type || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  const sections = [
    { key: 'key_insight', title: 'Key Insights', items: grouped.key_insight || [] },
    { key: 'pattern', title: 'Patterns', items: grouped.pattern || [] },
    { key: 'cognitive_map', title: 'Cognitive Maps', items: grouped.cognitive_map || [] },
    { key: 'theme', title: 'Themes', items: grouped.theme || [] },
  ].filter((s) => s.items.length > 0)

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/chat')} className="gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chat</span>
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Saved Memories</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Insights you've bookmarked during your sessions. Revisit them, reflect on them, or remove ones that no longer resonate.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
            <span>{memories.length} saved total</span>
            {sections.map((s) => (
              <span key={s.key}>• {s.items.length} {s.title.toLowerCase()}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : memories.length === 0 ? (
          <Card className="p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Bookmark className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <h3 className="font-semibold mb-1.5">No saved memories yet</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
              During a chat, click the bookmark icon on any insight or pattern in the Brain Language panel to save it here.
            </p>
            <Button onClick={() => navigate('/chat')} className="gap-2">
              <MessageCircle className="w-4 h-4" />
              Start a session
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            <AnimatePresence>
              {sections.map((section) => {
                const meta = TYPE_META[section.key]
                return (
                  <motion.div
                    key={section.key}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', meta?.bg)}>
                        {meta && <meta.icon className={cn('w-4 h-4', meta.color)} />}
                      </div>
                      <h2 className="text-lg font-semibold">{section.title}</h2>
                      <Badge variant="secondary" className="text-[10px]">{section.items.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {section.items.map((m) =>
                        section.key === 'key_insight' ? (
                          <InsightCard key={m.id} memory={m} onDelete={(id) => deleteMemory.mutate(id)} />
                        ) : (
                          <PatternCard key={m.id} memory={m} onDelete={(id) => deleteMemory.mutate(id)} />
                        )
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
