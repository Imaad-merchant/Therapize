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
import {
  ArrowLeft,
  Brain,
  MessageCircle,
  Plus,
  Trash2,
  Sparkles,
  BookText,
  Loader2,
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
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { profile, isLoading } = useProfile()
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const memories = profile?.questionnaire?.user_trained_memories || []

  const handleAdd = async () => {
    const text = input.trim()
    if (!text || saving) return
    setSaving(true)
    try {
      const newMemory = {
        id: crypto.randomUUID(),
        text,
        added_at: new Date().toISOString(),
      }
      const updated = [newMemory, ...memories]
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
      setInput('')
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Added to AI memory', {
        description: "Sage will reference this whenever it's relevant.",
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
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BookText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Train Your AI</h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Tell Sage anything about yourself you want it to remember. Your past, people you love, what you're going through, inside jokes, medication you take — anything. It'll be woven into every future conversation.
          </p>
        </motion.div>
      </div>

      {/* Input */}
      <div className="max-w-3xl mx-auto px-4 pb-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Plus className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Add a memory</span>
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
            className="min-h-[100px] resize-none text-sm"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] text-muted-foreground">
              {input.length} / 2000 chars · Cmd+Enter to save
            </span>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!input.trim() || saving || input.length > 2000}
              className="gap-1.5"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Save memory
            </Button>
          </div>
        </Card>

        {/* Sample prompts */}
        {memories.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4"
          >
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Examples to spark ideas
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {SAMPLE_PROMPTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-left text-xs p-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors leading-relaxed text-muted-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Saved memories list */}
      <div className="max-w-3xl mx-auto px-4 pb-20">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Brain className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">What Sage knows about you</h2>
          <Badge variant="secondary" className="text-[10px]">
            {memories.length}
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : memories.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">
            Nothing saved yet. Add memories above and they'll show up here.
          </Card>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {memories.map((m, i) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10, height: 0, marginBottom: 0 }}
                >
                  <Card className="p-4 group">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        <span className="text-[10px] text-muted-foreground mt-1.5 block">
                          Added {new Date(m.added_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId === m.id}
                        className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(m.id)}
                      >
                        {deletingId === m.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
