import {
  Asterisk,
  Circle,
  Minus,
  MoveHorizontal,
  MoveVertical,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCw,
  Square,
  ZoomIn,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { Params } from './Kaleidoscope'
import { Ruler } from './Ruler'

type NumKey = 'segments' | 'rotation' | 'resultRotation' | 'offsetX' | 'offsetY' | 'zoom'
type Def = {
  key: NumKey
  label: string
  min: number
  max: number
  step: number
  tick: number // ruler spacing
  major: number // ruler: labelled every N ticks
  fmt: (v: number) => string
  icon: LucideIcon
  tile: string // mobile tile colour
}

const deg = (v: number) => `${Math.round(v)}°`
const D: Record<NumKey, Def> = {
  segments: { key: 'segments', label: 'Segments', min: 3, max: 24, step: 1, tick: 1, major: 5, fmt: String, icon: Asterisk, tile: 'bg-orange-200' },
  rotation: { key: 'rotation', label: 'Source rotation', min: 0, max: 360, step: 1, tick: 5, major: 6, fmt: deg, icon: RotateCw, tile: 'bg-amber-100' },
  resultRotation: { key: 'resultRotation', label: 'Result rotation', min: 0, max: 360, step: 1, tick: 5, major: 6, fmt: deg, icon: RefreshCw, tile: 'bg-yellow-200' },
  offsetX: { key: 'offsetX', label: 'Offset X', min: -1, max: 1, step: 0.01, tick: 0.02, major: 5, fmt: (v) => v.toFixed(2), icon: MoveHorizontal, tile: 'bg-sky-200' },
  offsetY: { key: 'offsetY', label: 'Offset Y', min: -1, max: 1, step: 0.01, tick: 0.02, major: 5, fmt: (v) => v.toFixed(2), icon: MoveVertical, tile: 'bg-sky-200' },
  zoom: { key: 'zoom', label: 'Zoom', min: 0.2, max: 4, step: 0.01, tick: 0.1, major: 5, fmt: (v) => `${v.toFixed(2)}×`, icon: ZoomIn, tile: 'bg-blue-200' },
}
const ORDER: NumKey[] = ['segments', 'rotation', 'resultRotation', 'offsetX', 'offsetY', 'zoom']

type Props = { params: Params; onChange: (p: Partial<Params>) => void }

const clampTo = (d: Def, v: number) => Math.min(d.max, Math.max(d.min, +v.toFixed(4)))

/** Desktop side panel: every control visible at once. */
export function Controls({ params, onChange }: Props) {
  const slider = ({ key, label, min, max, step, fmt }: Def) => (
    <div key={key} className="flex flex-col gap-3">
      <div className="flex justify-between text-sm">
        <Label>{label}</Label>
        <span className="tabular-nums text-muted-foreground">{fmt(params[key])}</span>
      </div>
      <Slider
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={[params[key]]}
        onValueChange={(v) => onChange({ [key]: Array.isArray(v) ? v[0] : v })}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      {ORDER.map((k) => slider(D[k]))}
      <div className="flex items-center justify-between">
        <Label>Frame</Label>
        <div className="flex gap-1" role="radiogroup" aria-label="Frame">
          {(['square', 'circle'] as const).map((frame) => (
            <Button
              key={frame}
              size="sm"
              role="radio"
              aria-checked={params.frame === frame}
              variant={params.frame === frame ? 'default' : 'outline'}
              onClick={() => onChange({ frame })}
              className="capitalize"
            >
              {frame}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="animate">Animate</Label>
        <Switch id="animate" checked={params.animate} onCheckedChange={(animate) => onChange({ animate })} />
      </div>
    </div>
  )
}

function Tile({ icon: Icon, label, color, active, onClick, pressed }: {
  icon: LucideIcon
  label: string
  color: string
  active?: boolean
  pressed?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={pressed ?? active}
      className={cn(
        'flex h-20 w-24 shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-xl text-[11px] font-medium tracking-wide text-neutral-900 uppercase transition',
        color,
        active ? 'ring-2 ring-white ring-offset-2 ring-offset-card' : 'opacity-80',
      )}
    >
      <Icon className="size-7" strokeWidth={2.25} />
      {label}
    </button>
  )
}

/** Mobile bottom editor: pick a parameter tile, tune it with −/+ and a drag ruler. */
export function MobileEditor({ params, onChange }: Props) {
  const [sel, setSel] = useState<NumKey>('segments')
  const d = D[sel]
  const set = (v: number) => onChange({ [sel]: clampTo(d, v) })

  return (
    <div className="flex flex-col gap-3">
      <div className="text-center">
        <div className="text-xs tracking-wider text-muted-foreground uppercase">{d.label}</div>
        <div className="text-3xl font-light tabular-nums">{d.fmt(params[sel])}</div>
      </div>

      <div className="flex items-center gap-2">
        <button aria-label={`Decrease ${d.label}`} onClick={() => set(params[sel] - d.step)} className="grid size-14 shrink-0 place-items-center rounded-full bg-muted active:bg-muted/60">
          <Minus />
        </button>
        <Ruler value={params[sel]} min={d.min} max={d.max} step={d.step} tick={d.tick} major={d.major} onChange={set} />
        <button aria-label={`Increase ${d.label}`} onClick={() => set(params[sel] + d.step)} className="grid size-14 shrink-0 place-items-center rounded-full bg-muted active:bg-muted/60">
          <Plus />
        </button>
      </div>

      <div className="-mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none]">
        {ORDER.map((k) => (
          <Tile key={k} icon={D[k].icon} label={D[k].label.replace('rotation', 'rot.')} color={D[k].tile} active={sel === k} onClick={() => setSel(k)} />
        ))}
        <Tile
          icon={params.frame === 'circle' ? Circle : Square}
          label={params.frame}
          color="bg-violet-200"
          pressed={params.frame === 'circle'}
          onClick={() => onChange({ frame: params.frame === 'circle' ? 'square' : 'circle' })}
        />
        <Tile
          icon={params.animate ? Pause : Play}
          label={params.animate ? 'Stop' : 'Animate'}
          color="bg-emerald-200"
          pressed={params.animate}
          onClick={() => onChange({ animate: !params.animate })}
        />
      </div>
    </div>
  )
}
