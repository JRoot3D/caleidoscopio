import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { Params } from './Kaleidoscope'

type NumKey = 'segments' | 'rotation' | 'resultRotation' | 'offsetX' | 'offsetY' | 'zoom'
type SliderDef = { key: NumKey; label: string; min: number; max: number; step: number; fmt: (v: number) => string }

const deg = (v: number) => `${Math.round(v)}°`
const S: Record<NumKey, SliderDef> = {
  segments: { key: 'segments', label: 'Segments', min: 3, max: 24, step: 1, fmt: String },
  rotation: { key: 'rotation', label: 'Source rotation', min: 0, max: 360, step: 1, fmt: deg },
  resultRotation: { key: 'resultRotation', label: 'Result rotation', min: 0, max: 360, step: 1, fmt: deg },
  offsetX: { key: 'offsetX', label: 'Offset X', min: -1, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
  offsetY: { key: 'offsetY', label: 'Offset Y', min: -1, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
  zoom: { key: 'zoom', label: 'Zoom', min: 0.2, max: 4, step: 0.01, fmt: (v) => `${v.toFixed(2)}×` },
}

const TABS = ['Shape', 'Rotate', 'Move'] as const
type Tab = (typeof TABS)[number]

type Props = { params: Params; onChange: (p: Partial<Params>) => void; onReset: () => void }

export function Controls({ params, onChange, onReset }: Props) {
  const [tab, setTab] = useState<Tab>('Shape')

  const slider = ({ key, label, min, max, step, fmt }: SliderDef) => (
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

  const groups: Record<Tab, ReactNode> = {
    Shape: (
      <>
        {slider(S.segments)}
        <div className="flex items-center justify-between">
          <Label>Frame</Label>
          <div className="flex gap-1" role="radiogroup" aria-label="Frame">
            {(['square', 'circle'] as const).map((frame) => (
              <Button
                key={frame}
                role="radio"
                aria-checked={params.frame === frame}
                variant={params.frame === frame ? 'default' : 'outline'}
                onClick={() => onChange({ frame })}
                className="h-10 px-4 capitalize md:h-8"
              >
                {frame}
              </Button>
            ))}
          </div>
        </div>
      </>
    ),
    Rotate: (
      <>
        {slider(S.rotation)}
        {slider(S.resultRotation)}
        <div className="flex h-10 items-center justify-between md:h-auto">
          <Label htmlFor="animate">Animate</Label>
          <Switch id="animate" checked={params.animate} onCheckedChange={(animate) => onChange({ animate })} />
        </div>
      </>
    ),
    Move: (
      <>
        {slider(S.offsetX)}
        {slider(S.offsetY)}
        {slider(S.zoom)}
        <Button variant="outline" className="h-10 md:h-8" onClick={onReset}>
          Reset position & rotation
        </Button>
      </>
    ),
  }

  return (
    <div className="flex flex-col gap-4">
      {/* mobile: one group at a time so the panel never scrolls */}
      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 md:hidden">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'h-10 rounded-md text-sm font-medium transition-colors',
              tab === t ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {TABS.map((t) => (
        <section key={t} className={cn('flex-col gap-5', tab === t ? 'flex' : 'hidden md:flex')}>
          <h2 className="hidden text-xs font-medium tracking-wide text-muted-foreground uppercase md:block">{t}</h2>
          {groups[t]}
        </section>
      ))}
    </div>
  )
}
