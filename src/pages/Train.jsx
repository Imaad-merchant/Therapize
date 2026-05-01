import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProfile } from '@/hooks/useProfile'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Plus,
  Sparkles,
  BookText,
  Loader2,
  Fingerprint,
  HelpCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'

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
  const { getAccessToken } = useAuth()
  const queryClient = useQueryClient()
  const { profile } = useProfile()
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [gapQuestions, setGapQuestions] = useState([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  const memories = profile?.questionnaire?.user_trained_memories || []

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

  const handleQuestionClick = (q) => {
    setInput(q)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/chat')} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/profile')} className="gap-1.5">
            <Fingerprint className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Profile</span>
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-4 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
          <BookText className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Train Your AI</h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto mt-2">
          Anything you tell Sage here is saved forever and woven into every future conversation.
        </p>
        {memories.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-2">
            <Badge variant="secondary" className="text-[10px] mr-1.5">{memories.length}</Badge>
            memories saved · view them on your{' '}
            <button
              onClick={() => navigate('/profile')}
              className="text-primary underline-offset-2 hover:underline"
            >
              profile
            </button>
          </p>
        )}
      </div>

      {/* Input */}
      <div className="max-w-4xl mx-auto px-4 pb-6">
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
            className="min-h-[110px] resize-none text-sm"
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

      {/* Suggested questions */}
      {memories.length > 0 && gapQuestions.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-16">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
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
                Click any question to answer it — your response fills in gaps Sage notices in your story.
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
        </div>
      )}
    </div>
  )
}
