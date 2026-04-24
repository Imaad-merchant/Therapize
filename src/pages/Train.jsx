import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MindMap } from '@/components/train/MindMap'
import { Timeline } from '@/components/train/Timeline'
import {
  ArrowLeft,
  Brain,
  MessageCircle,
  Plus,
  Trash2,
  Sparkles,
  BookText,
  Loader2,
  Fingerprint,
  Clock,
  Network,
  Maximize2,
  HelpCircle,
  List,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const SAMPLE_PROMPTS = [
  "My dad died when I was 12. I still have trouble around Father's Day.",
  'I was bullied in middle school and still feel insecure in groups.',
  "I'm in grad school for psychology — lots of my metaphors come from there.",
  "My mom has OCD. I learned to be hyper-vigilant growing up.",
  "I broke up with my partner of 6 years last month. It's fresh.",
  "I'm trying to stop drinking. 47 days sober as of today.",
]

export default function Train() {
  const navigate = useNavigate()
  const { user, getAccessToken } = useAuth()
  const queryClient = useQueryClient()
  const { profile, isLoading } = useProfile()
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [expanded, setExpanded] = useState(null) // 'map' | 'timeline' | 'list' | null
  const [gapQuestions, setGapQuestions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  const memories = profile?.questionnaire?.user_trained_memories || []
  const userName = profile?.display_name || 'You'

  // Fetch suggested questions
  const fetchGapQuestions = async () => {
    setLoadingQuestions(true)
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/train', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setGapQuestions(data.gap_questions || [])
      }
    } catch (e) {
      console.error('Failed to load suggested questions:', e)
    } finally {
      setLoadingQuestions(false)
    }
  }

  useEffect(() => {
    if (memories.length > 0 && gapQuestions.length === 0 && !loadingQuestions) {
      fetchGapQuestions()
    }
    // eslint-disable-next-line
  }, [memories.length])

  const handleAdd = async (presetText) => {
    const text = (presetText ?? input).trim()
    if (!text || saving) return
    setSaving(true)
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not save')
      if (!presetText) setInput('')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      // Refresh gap questions so list updates as user fills in memories
      fetchGapQuestions()
      toast.success('Memory saved', {
        description: data.memory?.title
          ? `Filed under "${data.memory.category}" — ${data.memory.title}`
          : "Sage will reference this whenever it's relevant.",
      })
    } catch (e) {
      toast.error('Could not save', { description: e.message })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      const updated = memories.filter((m) => m.id !== id)
      const { error } = await supabase
        .from('profiles')
        .update({
          questionnaire: {
            ...(profile?.questionnaire || {}),
            user_trained_memories: updated,
          },
        })
        .eq('id', user.id)
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    } catch (e) {
      toast.error('Could not delete', { description: e.message })
    } finally {
      setDeletingId(null)
    }
  }

  const handleQuestionClick = (q) => {
    setInput(q)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/chat')} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/profile')} className="gap-1.5">
            <Fingerprint className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
          <BookText className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Train Your AI</h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto mt-2">
          Anything you tell Sage here is auto-categorized, placed on your timeline, and linked in your mind map.
        </p>
      </div>

      {/* Input */}
      <div className="max-w-6xl mx-auto px-4 pb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Plus className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Add a memory</span>
            <span className="text-[10px] text-muted-foreground ml-auto">Auto-categorized on save</span>
          </div>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleAdd()
              }
            }}
            placeholder="e.g. My dad died when I was 14. I still carry guilt about our last argument..."
            className="min-h-[90px] resize-none text-sm"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] text-muted-foreground">
              {input.length} / 2000 · Cmd+Enter to save
            </span>
            <Button
              size="sm"
              onClick={() => handleAdd()}
              disabled={!input.trim() || saving || input.length > 2000}
              className="gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              {saving ? 'Structuring...' : 'Save memory'}
            </Button>
          </div>
        </Card>

        {/* Sample prompts for empty state */}
        {memories.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-4">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Examples</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {SAMPLE_PROMPTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-left text-xs p-3 rounded-lg border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors leading-relaxed text-muted-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Dashboard grid */}
      {memories.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 pb-16 space-y-6">
          {/* Suggested questions — always first */}
          {gapQuestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-4 border-primary/30 bg-gradient-to-br from-primary/5 to-card">
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-bold">Questions Sage wants to ask you</h3>
                  <Badge variant="secondary" className="text-[10px]">{gapQuestions.length}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-6 h-6 ml-auto text-muted-foreground"
                    onClick={fetchGapQuestions}
                    disabled={loadingQuestions}
                    title="Refresh suggestions"
                  >
                    {loadingQuestions ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mb-3">
                  Click any question to answer it — your response fills in gaps across your timeline and mind map.
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {gapQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuestionClick(q.question)}
                      className="group text-left p-3 rounded-lg border bg-card hover:border-primary/60 hover:bg-primary/5 transition-all"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium leading-relaxed">{q.question}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {q.category && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wider">
                                {q.category}
                              </span>
                            )}
                            {q.reason && (
                              <span className="text-[10px] text-muted-foreground italic truncate">
                                {q.reason}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Timeline + MindMap side by side on large, stacked on small */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Timeline block */}
            <DashboardBlock
              title="Timeline"
              icon={Clock}
              count={memories.length}
              onExpand={() => setExpanded('timeline')}
            >
              <div className="max-h-[420px] overflow-y-auto pr-1">
                <Timeline memories={memories} />
              </div>
            </DashboardBlock>

            {/* Mind Map block */}
            <DashboardBlock
              title="Mind Map"
              icon={Network}
              count={memories.length}
              onExpand={() => setExpanded('map')}
            >
              <MindMap memories={memories} userName={userName} height={420} />
            </DashboardBlock>
          </div>

          {/* List block — full width */}
          <DashboardBlock
            title="All memories"
            icon={List}
            count={memories.length}
            onExpand={() => setExpanded('list')}
          >
            <div className="max-h-[360px] overflow-y-auto pr-1 space-y-2">
              <AnimatePresence initial={false}>
                {memories.map((m) => (
                  <MemoryCard
                    key={m.id}
                    memory={m}
                    deletingId={deletingId}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          </DashboardBlock>
        </div>
      )}

      {/* Expand modal */}
      <Dialog open={!!expanded} onOpenChange={(v) => !v && setExpanded(null)}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b flex items-center gap-2 flex-shrink-0">
            {expanded === 'map' && <Network className="w-4 h-4 text-primary" />}
            {expanded === 'timeline' && <Clock className="w-4 h-4 text-primary" />}
            {expanded === 'list' && <List className="w-4 h-4 text-primary" />}
            <h2 className="font-bold">
              {expanded === 'map' && 'Mind Map'}
              {expanded === 'timeline' && 'Timeline'}
              {expanded === 'list' && 'All Memories'}
            </h2>
            <Badge variant="secondary" className="text-[10px]">{memories.length}</Badge>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {expanded === 'map' && <MindMap memories={memories} userName={userName} height={700} />}
            {expanded === 'timeline' && <Timeline memories={memories} />}
            {expanded === 'list' && (
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {memories.map((m) => (
                    <MemoryCard
                      key={m.id}
                      memory={m}
                      deletingId={deletingId}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DashboardBlock({ title, icon: Icon, count, onExpand, children }) {
  return (
    <Card className="p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold">{title}</h3>
        <Badge variant="secondary" className="text-[10px]">{count}</Badge>
        <Button
          variant="ghost"
          size="icon"
          onClick={onExpand}
          className="w-7 h-7 ml-auto text-muted-foreground hover:text-foreground"
          title="Expand"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      {children}
    </Card>
  )
}

function MemoryCard({ memory: m, deletingId, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10, height: 0, marginBottom: 0 }}
    >
      <div className="p-3 rounded-lg border bg-card group">
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <h4 className="text-xs font-bold">{m.title || 'Memory'}</h4>
              {m.category && (
                <span className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold bg-primary/10 text-primary">
                  {m.category}
                </span>
              )}
              {m.estimated_age_at_event != null && (
                <span className="text-[9px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Age {m.estimated_age_at_event}
                </span>
              )}
            </div>
            {m.summary && (
              <p className="text-[11px] text-muted-foreground leading-relaxed">{m.summary}</p>
            )}
            {m.themes?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {m.themes.slice(0, 4).map((t) => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            disabled={deletingId === m.id}
            className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={() => onDelete(m.id)}
          >
            {deletingId === m.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
