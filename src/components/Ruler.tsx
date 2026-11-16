import { useLayoutEffect, useRef, useState } from 'react'

type Props = {
  value: number
  min: number
  max: number
  step: number // values snap to this
  tick: number // value between two ticks
  major: number // every Nth tick is long and labelled
  onChange: (v: number) => void
}

const PX = 12 // pixels between ticks

/** Horizontal tick ruler you drag under a fixed centre marker. */
export function Ruler({ value, min, max, step, tick, major, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; v: number } | null>(null)
  const [w, setW] = useState(300)

  useLayoutEffect(() => {
    const el = ref.current!
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const half = w / 2 / PX // ticks visible on each side
  const ticks = []
  for (let k = Math.ceil(value / tick - half); k <= Math.floor(value / tick + half); k++) {
    const v = k * tick
    if (v < min - 1e-9 || v > max + 1e-9) continue
    const x = w / 2 + (v / tick - value / tick) * PX
    const isMajor = k % major === 0
    ticks.push(
      <g key={k}>
        <line x1={x} x2={x} y1={isMajor ? 22 : 30} y2={44} stroke="currentColor" strokeOpacity={isMajor ? 0.9 : 0.4} />
        {isMajor && (
          <text x={x} y={14} textAnchor="middle" fontSize={12} fill="currentColor" fillOpacity={0.7}>
            {+v.toFixed(2)}
          </text>
        )}
      </g>,
    )
  }

  return (
    <div
      ref={ref}
      className="relative h-14 flex-1 cursor-ew-resize touch-none overflow-hidden select-none [mask-image:linear-gradient(90deg,transparent,#000_15%,#000_85%,transparent)]"
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, v: value }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        if (!drag.current) return
        const raw = drag.current.v - ((e.clientX - drag.current.x) / PX) * tick
        onChange(Math.min(max, Math.max(min, +(Math.round(raw / step) * step).toFixed(4))))
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <svg width={w} height={44} className="text-foreground">
        {ticks}
      </svg>
      <div className="absolute bottom-0 left-1/2 size-0 -translate-x-1/2 border-x-[7px] border-b-[10px] border-x-transparent border-b-sky-400" />
    </div>
  )
}
