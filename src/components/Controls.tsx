import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import type { Params } from './Kaleidoscope'

type NumKey = 'segments' | 'rotation' | 'resultRotation' | 'offsetX' | 'offsetY' | 'zoom'

const SLIDERS: { key: NumKey; label: string; min: number; max: number; step: number; fmt: (v: number) => string }[] = [
  { key: 'segments', label: 'Segments', min: 3, max: 24, step: 1, fmt: (v) => String(v) },
  { key: 'rotation', label: 'Source rotation', min: 0, max: 360, step: 1, fmt: (v) => `${v}°` },
  { key: 'resultRotation', label: 'Result rotation', min: 0, max: 360, step: 1, fmt: (v) => `${v}°` },
  { key: 'offsetX', label: 'Offset X', min: -1, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
  { key: 'offsetY', label: 'Offset Y', min: -1, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
  { key: 'zoom', label: 'Zoom', min: 0.2, max: 4, step: 0.01, fmt: (v) => `${v.toFixed(2)}×` },
]

export function Controls({
  params,
  onChange,
  onPick,
  onSave,
  hasImage,
}: {
  params: Params
  onChange: (p: Partial<Params>) => void
  onPick: () => void
  onSave: () => void
  hasImage: boolean
}) {
  return (
    <Card className="w-full md:w-80">
      <CardHeader>
        <CardTitle>Kaleidoscope</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex gap-2">
          <Button className="flex-1" variant="outline" onClick={onPick}>
            Choose image
          </Button>
          <Button className="flex-1" onClick={onSave} disabled={!hasImage}>
            Save PNG
          </Button>
        </div>

        {SLIDERS.map(({ key, label, min, max, step, fmt }) => (
          <div key={key} className="flex flex-col gap-2">
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
        ))}

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
      </CardContent>
    </Card>
  )
}
