import { useMemo, useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

/*
  Interactive mind map.
  Center: the user's name (or "You").
  Ring 1: category clusters (family, relationship, loss, trauma, identity, etc).
  Ring 2: the memory nodes themselves, orbiting their category.
  Edges: lines from center → category → memories, plus cross-edges to
  'connects_to_categories'.

  Fully responsive SVG that auto-fits. Node click opens a side panel
  with full detail. Hover shows themes. Drag the canvas to pan,
  scroll-wheel zooms.
*/

const CATEGORY_META = {
  family: { label: 'Family', color: '#f59e0b' },
  relationship: { label: 'Relationships', color: '#ec4899' },
  loss: { label: 'Loss', color: '#64748b' },
  trauma: { label: 'Trauma', color: '#ef4444' },
  identity: { label: 'Identity', color: '#8b5cf6' },
  health: { label: 'Health', color: '#10b981' },
  career: { label: 'Career', color: '#3b82f6' },
  substance: { label: 'Substance', color: '#f97316' },
  belief: { label: 'Beliefs', color: '#a855f7' },
  achievement: { label: 'Achievements', color: '#22c55e' },
  childhood: { label: 'Childhood', color: '#f59e0b' },
  body: { label: 'Body', color: '#06b6d4' },
  other: { label: 'Other', color: '#6b7280' },
}

function polar(cx, cy, r, angleRad) {
  return [cx + Math.cos(angleRad) * r, cy + Math.sin(angleRad) * r]
}

export function MindMap({ memories, userName }) {
  const containerRef = useRef(null)
  const [size, setSize] = useState({ w: 900, h: 600 })
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const dragState = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setSize({
          w: Math.max(400, e.contentRect.width),
          h: Math.max(400, Math.min(900, e.contentRect.width * 0.7)),
        })
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Group memories by category
  const grouped = useMemo(() => {
    const g = {}
    for (const m of memories) {
      const c = m.category || 'other'
      if (!g[c]) g[c] = []
      g[c].push(m)
    }
    return g
  }, [memories])

  const categories = Object.keys(grouped)
  const cx = size.w / 2
  const cy = size.h / 2
  const ring1Radius = Math.min(size.w, size.h) * 0.24
  const ring2Radius = Math.min(size.w, size.h) * 0.42

  // Compute positions
  const layout = useMemo(() => {
    const nodes = {
      center: { x: cx, y: cy, label: userName || 'You' },
      categories: {},
      memories: [],
    }

    categories.forEach((cat, i) => {
      const angle = (i / categories.length) * Math.PI * 2 - Math.PI / 2
      const [x, y] = polar(cx, cy, ring1Radius, angle)
      nodes.categories[cat] = { x, y, angle, label: CATEGORY_META[cat]?.label || cat, color: CATEGORY_META[cat]?.color || '#6b7280' }

      const items = grouped[cat]
      const spread = Math.PI / 3
      items.forEach((m, j) => {
        const subAngle =
          items.length === 1
            ? angle
            : angle - spread / 2 + (spread * j) / (items.length - 1 || 1)
        const [mx, my] = polar(cx, cy, ring2Radius, subAngle)
        nodes.memories.push({ ...m, x: mx, y: my, catColor: nodes.categories[cat].color, category: cat })
      })
    })

    return nodes
  }, [categories, grouped, cx, cy, ring1Radius, ring2Radius, userName])

  // Pan handlers
  const onPointerDown = (e) => {
    dragState.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y }
  }
  const onPointerMove = (e) => {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.x
    const dy = e.clientY - dragState.current.y
    setTransform((t) => ({ ...t, x: dragState.current.tx + dx, y: dragState.current.ty + dy }))
  }
  const onPointerUp = () => {
    dragState.current = null
  }
  const onWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.92 : 1.08
    setTransform((t) => ({ ...t, k: Math.max(0.4, Math.min(2.5, t.k * delta)) }))
  }

  // Cross-category edges
  const crossEdges = useMemo(() => {
    const edges = []
    for (const m of layout.memories) {
      const connects = m.connects_to_categories || []
      for (const target of connects) {
        if (layout.categories[target] && target !== m.category) {
          edges.push({
            id: `${m.id}-${target}`,
            x1: m.x,
            y1: m.y,
            x2: layout.categories[target].x,
            y2: layout.categories[target].y,
            color: m.catColor,
          })
        }
      }
    }
    return edges
  }, [layout])

  if (memories.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center border border-dashed rounded-xl text-center">
        <div>
          <p className="text-sm font-medium">No memories yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Add memories in the List tab. The mind map will structure them automatically.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-gradient-to-br from-background to-primary/5 border rounded-2xl overflow-hidden select-none"
      style={{ height: size.h }}
      onWheel={onWheel}
    >
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 bg-card/80 backdrop-blur rounded-lg border p-1">
        <button
          onClick={() => setTransform((t) => ({ ...t, k: Math.min(2.5, t.k * 1.15) }))}
          className="w-7 h-7 rounded hover:bg-muted transition-colors text-sm font-semibold"
        >
          +
        </button>
        <button
          onClick={() => setTransform({ x: 0, y: 0, k: 1 })}
          className="w-7 h-7 rounded hover:bg-muted transition-colors text-[10px]"
          title="Reset"
        >
          ⌂
        </button>
        <button
          onClick={() => setTransform((t) => ({ ...t, k: Math.max(0.4, t.k * 0.87) }))}
          className="w-7 h-7 rounded hover:bg-muted transition-colors text-sm font-semibold"
        >
          −
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-3 left-3 z-10 bg-card/80 backdrop-blur rounded-lg border p-2 max-w-[160px]">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Categories
        </div>
        <div className="space-y-0.5">
          {categories.slice(0, 6).map((c) => (
            <div key={c} className="flex items-center gap-1.5 text-[11px]">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_META[c]?.color }} />
              <span className="text-muted-foreground">{CATEGORY_META[c]?.label || c}</span>
              <span className="text-muted-foreground/60 ml-auto">{grouped[c].length}</span>
            </div>
          ))}
        </div>
      </div>

      <svg
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          {/* Background grid */}
          <defs>
            <radialGradient id="centerGrad">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={Math.min(size.w, size.h) * 0.45} fill="url(#centerGrad)" />

          {/* Center → category edges */}
          {categories.map((cat) => {
            const c = layout.categories[cat]
            return (
              <line
                key={cat}
                x1={cx}
                y1={cy}
                x2={c.x}
                y2={c.y}
                stroke={c.color}
                strokeOpacity="0.35"
                strokeWidth="1.5"
              />
            )
          })}

          {/* Category → memory edges */}
          {layout.memories.map((m) => {
            const c = layout.categories[m.category]
            return (
              <line
                key={'cat-' + m.id}
                x1={c.x}
                y1={c.y}
                x2={m.x}
                y2={m.y}
                stroke={m.catColor}
                strokeOpacity="0.5"
                strokeWidth="1.2"
                strokeDasharray={selected?.id === m.id || hovered === m.id ? '0' : '3 2'}
              />
            )
          })}

          {/* Cross-category dotted edges */}
          {crossEdges.map((e) => (
            <line
              key={e.id}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke={e.color}
              strokeOpacity="0.25"
              strokeWidth="0.8"
              strokeDasharray="2 3"
            />
          ))}

          {/* Center node */}
          <g>
            <circle cx={cx} cy={cy} r="28" fill="#8b5cf6" />
            <circle cx={cx} cy={cy} r="36" fill="none" stroke="#8b5cf6" strokeOpacity="0.3" strokeWidth="2" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="11" fontWeight="700">
              {(layout.center.label || 'You').slice(0, 10)}
            </text>
          </g>

          {/* Category nodes */}
          {categories.map((cat) => {
            const c = layout.categories[cat]
            return (
              <g key={cat}>
                <circle cx={c.x} cy={c.y} r="18" fill={c.color} fillOpacity="0.85" stroke={c.color} strokeWidth="2" />
                <text
                  x={c.x}
                  y={c.y + 32}
                  textAnchor="middle"
                  fill="currentColor"
                  className="fill-foreground"
                  fontSize="10"
                  fontWeight="600"
                >
                  {c.label} ({grouped[cat].length})
                </text>
              </g>
            )
          })}

          {/* Memory nodes */}
          {layout.memories.map((m) => {
            const isSel = selected?.id === m.id
            const isHover = hovered === m.id
            const size = 7 + (m.emotional_intensity || 0.5) * 8
            return (
              <g
                key={m.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelected(m)
                }}
                onMouseEnter={() => setHovered(m.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={size + (isSel || isHover ? 3 : 0)}
                  fill={m.catColor}
                  fillOpacity={isSel ? 1 : 0.88}
                  stroke="white"
                  strokeWidth="2"
                />
                {(isHover || isSel) && (
                  <text
                    x={m.x}
                    y={m.y - size - 8}
                    textAnchor="middle"
                    fill="currentColor"
                    className="fill-foreground"
                    fontSize="10"
                    fontWeight="600"
                    style={{ pointerEvents: 'none' }}
                  >
                    {m.title}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-card/95 backdrop-blur border rounded-xl shadow-xl p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selected.catColor }} />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {CATEGORY_META[selected.category]?.label || selected.category}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground -mt-0.5 text-lg leading-none">×</button>
            </div>
            <h3 className="text-sm font-bold mb-1">{selected.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">{selected.summary}</p>
            {selected.clinical_significance && (
              <p className="text-[11px] italic text-primary/80 mb-2">{selected.clinical_significance}</p>
            )}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-2">
              {selected.dominant_emotion && <span>💭 {selected.dominant_emotion}</span>}
              {selected.estimated_age_at_event && <span>Age {selected.estimated_age_at_event}</span>}
              {selected.time_period && selected.time_period !== 'unknown' && <span>{selected.time_period.replace('_', ' ')}</span>}
            </div>
            {selected.themes?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selected.themes.map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
