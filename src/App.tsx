import { Download, ImagePlus, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Controls, MobileEditor } from '@/components/Controls'
import { Kaleidoscope, type Params } from '@/components/Kaleidoscope'
import { Button } from '@/components/ui/button'

const DEFAULTS: Params = { segments: 5, rotation: 0, resultRotation: 0, offsetX: 0, offsetY: 0, zoom: 1, animate: false, frame: 'square' }

// checkerboard behind the canvas so the circle frame's transparency is visible
const CHECKER = { background: 'repeating-conic-gradient(#262626 0 25%, #1c1c1c 0 50%) 0 0 / 24px 24px' }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const wrap360 = (v: number) => ((v % 360) + 360) % 360

function download(blob: Blob) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'kaleidoscope.png'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 0)
}

export default function App() {
  const [params, setParams] = useState(DEFAULTS)
  const [url, setUrl] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())

  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url])

  const update = (p: Partial<Params>) => setParams((prev) => ({ ...prev, ...p }))
  const pick = () => inputRef.current?.click()
  const reset = () => update({ ...DEFAULTS, segments: params.segments, frame: params.frame, animate: params.animate })

  const loadFile = (file?: File) => {
    if (file?.type.startsWith('image/')) setUrl(URL.createObjectURL(file))
  }

  const save = () =>
    canvasRef.current?.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], 'kaleidoscope.png', { type: 'image/png' })
      // phones: the share sheet is the only web route into the photo gallery ("Save Image" / "Save to Photos")
      if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
        try {
          return await navigator.share({ files: [file] })
        } catch (e) {
          if ((e as DOMException).name === 'AbortError') return // user closed the sheet
        }
      }
      download(blob)
    }, 'image/png')

  // gestures: 1 finger drags the source, 2 fingers pinch-zoom and twist-rotate it
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ps = pointers.current
    const prev = ps.get(e.pointerId)
    if (!prev) return
    const size = e.currentTarget.clientWidth
    const others = [...ps.entries()].filter(([id]) => id !== e.pointerId).map(([, p]) => p)
    const cur = { x: e.clientX, y: e.clientY }
    ps.set(e.pointerId, cur)

    if (others.length === 0) {
      const dx = (cur.x - prev.x) / size
      const dy = (cur.y - prev.y) / size
      setParams((p) => ({
        ...p,
        offsetX: clamp(p.offsetX - dx / p.zoom, -1, 1),
        offsetY: clamp(p.offsetY + dy / p.zoom, -1, 1),
      }))
    } else if (others.length === 1) {
      const o = others[0]
      const scale = Math.hypot(cur.x - o.x, cur.y - o.y) / Math.max(1, Math.hypot(prev.x - o.x, prev.y - o.y))
      const turn = Math.atan2(cur.y - o.y, cur.x - o.x) - Math.atan2(prev.y - o.y, prev.x - o.x)
      setParams((p) => ({
        ...p,
        zoom: clamp(p.zoom * scale, 0.2, 4),
        rotation: wrap360(p.rotation + (turn * 180) / Math.PI), // clockwise twist = clockwise image
      }))
    }
  }

  const endPointer = (e: React.PointerEvent) => pointers.current.delete(e.pointerId)

  return (
    <div
      className="flex h-dvh flex-col bg-background text-foreground"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        loadFile(e.dataTransfer.files[0])
      }}
    >
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <h1 className="font-heading text-base font-semibold">Kaleidoscope</h1>
        <div className="flex gap-2">
          <Button variant="ghost" className="h-10 md:h-8" onClick={reset} disabled={!url} aria-label="Reset position and rotation">
            <RotateCcw /> <span className="max-md:sr-only">Reset</span>
          </Button>
          <Button variant="outline" className="h-10 md:h-8" onClick={pick}>
            <ImagePlus /> <span className="max-sm:sr-only">Choose image</span>
          </Button>
          <Button className="h-10 md:h-8" onClick={save} disabled={!url}>
            <Download /> <span className="max-sm:sr-only">Save</span>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <main
          className={`relative grid min-h-0 flex-1 place-items-center p-3 [container-type:size] md:p-6 ${dragging ? 'ring-2 ring-primary/40 ring-inset' : ''}`}
          style={CHECKER}
        >
          {url ? (
            <div
              className="size-[min(100cqw,100cqh)] cursor-grab touch-none active:cursor-grabbing"
              onPointerDown={(e) => {
                pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
                e.currentTarget.setPointerCapture(e.pointerId)
              }}
              onPointerMove={onPointerMove}
              onPointerUp={endPointer}
              onPointerCancel={endPointer}
            >
              <Kaleidoscope url={url} params={params} canvasRef={canvasRef} />
            </div>
          ) : (
            <button
              onClick={pick}
              className="flex size-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted text-muted-foreground hover:text-foreground"
            >
              <ImagePlus className="size-8" />
              <span className="text-lg font-medium">Choose or drop an image</span>
              <span className="text-sm">Stays on your device</span>
            </button>
          )}
          {url && (
            <p className="pointer-events-none absolute bottom-1 text-xs text-muted-foreground md:bottom-2">
              Drag to move · pinch to zoom · twist to rotate
            </p>
          )}
        </main>

        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l bg-card p-4 md:block">
          <Controls params={params} onChange={update} />
        </aside>

        <div className="shrink-0 rounded-t-2xl bg-card px-4 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
          <MobileEditor params={params} onChange={update} />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          loadFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
