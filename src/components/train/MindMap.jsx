import React, { useMemo, useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

/*
  Interactive mind map.
  Center: the user's name (or "You").
  Ring 1: category clusters (family, relationship, loss, trauma, identity, etc).
  Ring 2: the memory nodes themselves, orbiting their category.
  Edges: lines from center → category → memories, plus cross-edges to
  'connects_to_categories'.
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

class MindMapBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { err: null }
  }
  static getDerivedStateFromError(err) {
    return { err }
  }
  componentDidCatch(err, info) {
    console.error('MindMap crash:', err, info)
  }
  render() {
    if (this.state.err) {
      return (
        <div className="h-64 flex items-center justify-center border border-dashed rounded-xl text-center p-6">
          <div>
            <p className="text-sm font-medium">Mind map failed to render</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
              The underlying data is safe — try reloading or switching to another view.
            </p>
            <button
              onClick={() => this.setState({ err: null })}
              className="mt-3 text-xs underline text-primary"
            >
              Retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function MindMapInner({ memories, userName, height = 520 }) {
  const containerRef = useRef(null)
  const [size, setSize] = useState({ w: 900, h: height })
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const dragState = useRef(null)

  // Resize observer — debounced, with guard against feedback loops
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let rafId = null
    const ro = new ResizeObserver((entries) => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        for (const e of entries) {
          const w = Math.max(320, Math.floor(e.contentRect.width))
          setSize((prev) => (prev.w === w ? prev : { w, h: height }))
        }
      })
    })
    ro.observe(el)
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [height])

  // Safely coerce every memory into a usable node
  const safeMemories = useMemo(() => {
    if (!Array.isArray(memories)) return []
    return memories.filter(Boolean).map((m) => ({
      ...m,
      id: m.id || Math.random().toString(36).slice(2),
      category: (m.category && typeof m.category === 'string' && m.category) || 'other',
      title: m.title || (m.text ? m.text.slice(0, 40) : 'Memory'),
      summary: m.summary || m.text || '',
      emotional_intensity: typeof m.emotional_intensity === 'number' ? m.emotional_intensity : 0.5,
      connects_to_categories: Array.isArray(m.connects_to_categories) ? m.connects_to_categories : [],
      themes: Array.isArray(m.themes) ? m.themes : [],
    }))
  }, [memories])

  // Group memories by category
  const grouped = useMemo(() => {
    const g = {}
    for (const m of safeMemories) {
      const c = m.category
      if (!g[c]) g[c] = []
      g[c].push(m)
    }
    return g
  }, [safeMemories])

  const categories = Object.keys(grouped)
  const cx = size.w / 2
  const cy = size.h / 2
  const ringScale = Math.min(size.w, size.h)
  const ring1Radius = ringScale * 0.22
  const ring2Radius = ringScale * 0.4

  // Compute positions
  const layout = useMemo(() => {
    const nodes = {
      center: { x: cx, y: cy, label: userName || 'You' },
      categories: {},
      memories: [],
    }
    if (categories.length === 0) return nodes

    categories.forEach((cat, i) => {
      const angle = (i / categories.length) * Math.PI * 2 - Math.PI / 2
      const [x, y] = polar(cx, cy, ring1Radius, angle)
      nodes.categories[cat] = {
        x,
        y,
        angle,
        label: CATEGORY_META[cat]?.label || cat,
        color: CATEGORY_META[cat]?.color || '#6b7280',
      }

      const items = grouped[cat]
      const spread = Math.PI / 3
      items.forEach((m, j) => {
        const subAngle =
          items.length === 1
            ? angle
            : angle - spread / 2 + (spread * j) / Math.max(1, items.length - 1)
        const [mx, my] = polar(cx, cy, ring2Radius, subAngle)
        nodes.memories.push({
          ...m,
          x: mx,
          y: my,
          catColor: nodes.categories[cat].color,
        })
      })
    })

    return nodes
  }, [categories, grouped, cx, cy, ring1Radius, ring2Radius, userName])

  const onPointerDown = (e) => {
    dragState.current = {
      x: e.clientX,
      y: e.clientY,
      tx: transform.x,
      ty: transform.y,
    }
  }
  const onPointerMove = (e) => {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.x
    const dy = e.clientY - dragState.current.y
    setTransform((t) => ({
      ...t,
      x: dragState.current.tx + dx,
      y: dragState.current.ty + dy,
    }))
  }
  const onPointerUp = () => {
    dragState.current = null
  }
  const onWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.92 : 1.08
    setTransform((t) => ({
      ...t,
      k: Math.max(0.4, Math.min(2.5, t.k * delta)),
    }))
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

  if (safeMemories.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center border border-dashed rounded-xl text-center p-6"
        style={{ height }}
      >
        <div>
          <p className="text-sm font-medium">Mind map will appear here</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            Add memories and they'll be structured into categories automatically.
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
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 bg-card/80 backdrop-blur rounded-lg border p-1">
        <button
          onClick={() =>
            setTransform((t) => ({ ...t, k: Math.min(2.5, t.k * 1.15) }))
          }
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
          onClick={() =>
            setTransform((t) => ({ ...t, k: Math.max(0.4, t.k * 0.87) }))
          }
          className="w-7 h-7 rounded hover:bg-muted transition-colors text-sm font-semibold"
        >
          −
        </button>
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
        <defs>
          <radialGradient id="centerGrad">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          <circle cx={cx} cy={cy} r={ringScale * 0.45} fill="url(#centerGrad)" />

          {/* Center → category edges */}
          {categories.map((cat) => {
            const c = layout.categories[cat]
            if (!c) return null
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
            if (!c) return null
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
                strokeDasharray={
                  selected?.id === m.id || hovered === m.id ? '0' : '3 2'
                }
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
            <circle cx={cx} cy={cy} r="26" fill="#8b5cf6" />
            <circle
              cx={cx}
              cy={cy}
              r="34"
              fill="none"
              stroke="#8b5cf6"
              strokeOpacity="0.3"
              strokeWidth="2"
            />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize="10"
              fontWeight="700"
            >
              {String(layout.center.label || 'You').slice(0, 10)}
            </text>
          </g>

          {/* Category nodes */}
          {categories.map((cat) => {
            const c = layout.categories[cat]
            if (!c) return null
            return (
              <g key={cat}>
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="16"
                  fill={c.color}
                  fillOpacity="0.85"
                  stroke={c.color}
                  strokeWidth="2"
                />
                <text
                  x={c.x}
                  y={c.y + 28}
                  textAnchor="middle"
                  className="fill-foreground"
                  fontSize="9.5"
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
            const r = 6 + (m.emotional_intensity || 0.5) * 7
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
                  r={r + (isSel || isHover ? 3 : 0)}
                  fill={m.catColor}
                  fillOpacity={isSel ? 1 : 0.88}
                  stroke="white"
                  strokeWidth="2"
                />
                {(isHover || isSel) && (
                  <text
                    x={m.x}
                    y={m.y - r - 6}
                    textAnchor="middle"
                    className="fill-foreground"
                    fontSize="10"
                    fontWeight="600"
                    style={{ pointerEvents: 'none' }}
                  >
                    {m.title.slice(0, 22)}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="absolute top-2 left-2 z-10 bg-card/80 backdrop-blur rounded-lg border p-2 max-w-[150px] pointer-events-none">
        <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Categories
        </div>
        <div className="space-y-0.5 max-h-[90px] overflow-y-auto pointer-events-auto">
          {categories.slice(0, 8).map((c) => (
            <div key={c} className="flex items-center gap-1.5 text-[10px]">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: CATEGORY_META[c]?.color || '#6b7280' }}
              />
              <span className="text-muted-foreground truncate">
                {CATEGORY_META[c]?.label || c}
              </span>
              <span className="text-muted-foreground/60 ml-auto">
                {grouped[c].length}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-2 left-2 right-2 sm:right-auto sm:max-w-sm bg-card/95 backdrop-blur border rounded-xl shadow-xl p-3"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selected.catColor }}
                />
                <span className="text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
                  {CATEGORY_META[selected.category]?.label || selected.category}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground -mt-0.5 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <h3 className="text-xs font-bold mb-1">{selected.title}</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-1.5">
              {selected.summary}
            </p>
            {selected.clinical_significance && (
              <p className="text-[10px] italic text-primary/80 mb-1.5">
                {selected.clinical_significance}
              </p>
            )}
            {selected.themes?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {selected.themes.map((t) => (
                  <span
                    key={t}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                  >
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

export function MindMap(props) {
  return (
    <MindMapBoundary>
      <MindMapInner {...props} />
    </MindMapBoundary>
  )
}
