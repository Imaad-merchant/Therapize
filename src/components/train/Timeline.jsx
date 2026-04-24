import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const PERIOD_ORDER = {
  childhood: 0,
  adolescence: 1,
  young_adulthood: 2,
  adulthood: 3,
  recent: 4,
  ongoing: 5,
  unknown: 6,
}

const PERIOD_LABEL = {
  childhood: 'Childhood',
  adolescence: 'Adolescence',
  young_adulthood: 'Young Adulthood',
  adulthood: 'Adulthood',
  recent: 'Recent',
  ongoing: 'Ongoing',
  unknown: 'Unspecified',
}

const CATEGORY_COLOR = {
  family: '#f59e0b',
  relationship: '#ec4899',
  loss: '#64748b',
  trauma: '#ef4444',
  identity: '#8b5cf6',
  health: '#10b981',
  career: '#3b82f6',
  substance: '#f97316',
  belief: '#a855f7',
  achievement: '#22c55e',
  childhood: '#f59e0b',
  body: '#06b6d4',
  other: '#6b7280',
}

export function Timeline({ memories }) {
  const [selected, setSelected] = useState(null)

  // Group and sort by period then age
  const groups = useMemo(() => {
    const g = {}
    for (const m of memories) {
      const p = m.time_period || 'unknown'
      if (!g[p]) g[p] = []
      g[p].push(m)
    }
    for (const k of Object.keys(g)) {
      g[k].sort((a, b) => {
        const aAge = a.estimated_age_at_event ?? 999
        const bAge = b.estimated_age_at_event ?? 999
        if (aAge !== bAge) return aAge - bAge
        return new Date(a.added_at) - new Date(b.added_at)
      })
    }
    return g
  }, [memories])

  const periods = Object.keys(groups).sort(
    (a, b) => (PERIOD_ORDER[a] ?? 99) - (PERIOD_ORDER[b] ?? 99)
  )

  if (memories.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center border border-dashed rounded-xl text-center">
        <div>
          <p className="text-sm font-medium">Timeline will appear here</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Add memories in the List tab — they'll be auto-placed in life stages.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Vertical spine */}
      <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-border to-border/40" />

      <div className="space-y-10">
        {periods.map((period, pi) => (
          <motion.div
            key={period}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.4, delay: pi * 0.05 }}
          >
            {/* Period header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs flex-shrink-0 shadow-lg shadow-primary/30 relative z-10">
                {pi + 1}
              </div>
              <div>
                <h3 className="text-base font-bold">{PERIOD_LABEL[period]}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {groups[period].length} {groups[period].length === 1 ? 'memory' : 'memories'}
                </p>
              </div>
            </div>

            {/* Events */}
            <div className="ml-12 space-y-3">
              {groups[period].map((m, i) => (
                <motion.button
                  key={m.id}
                  onClick={() => setSelected(selected?.id === m.id ? null : m)}
                  initial={{ opacity: 0, x: 8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    'relative w-full text-left bg-card border rounded-xl p-4 hover:border-primary/40 transition-colors',
                    selected?.id === m.id && 'border-primary/60 ring-2 ring-primary/20'
                  )}
                >
                  {/* Horizontal spine connector */}
                  <div className="absolute -left-[30px] top-5 w-4 h-0.5 bg-border" />
                  <div
                    className="absolute -left-[35px] top-[14px] w-3 h-3 rounded-full border-2 border-background"
                    style={{ backgroundColor: CATEGORY_COLOR[m.category] || '#6b7280' }}
                  />

                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-sm font-semibold leading-tight">{m.title}</h4>
                    {m.estimated_age_at_event != null && (
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                        Age {m.estimated_age_at_event}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.summary}</p>

                  <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider"
                      style={{
                        backgroundColor: (CATEGORY_COLOR[m.category] || '#6b7280') + '20',
                        color: CATEGORY_COLOR[m.category] || '#6b7280',
                      }}
                    >
                      {m.category}
                    </span>
                    {m.dominant_emotion && (
                      <span className="text-[10px] text-muted-foreground italic">
                        {m.dominant_emotion}
                      </span>
                    )}
                    {m.themes?.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] text-muted-foreground/80">
                        · {t}
                      </span>
                    ))}
                  </div>

                  {selected?.id === m.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="overflow-hidden mt-3 pt-3 border-t"
                    >
                      {m.clinical_significance && (
                        <p className="text-xs italic text-primary/80 mb-2">
                          {m.clinical_significance}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        <strong className="text-foreground/80">Original: </strong>
                        {m.text}
                      </p>
                      {m.ai_callback_hints?.length > 0 && (
                        <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/20">
                          <div className="text-[9px] font-semibold uppercase tracking-wider text-primary mb-1">
                            Sage will reference this like:
                          </div>
                          <ul className="space-y-0.5">
                            {m.ai_callback_hints.slice(0, 2).map((h, j) => (
                              <li key={j} className="text-[10px] italic text-muted-foreground">
                                "{h}"
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
