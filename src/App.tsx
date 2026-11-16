import { useEffect, useRef, useState } from 'react'
import { Controls } from '@/components/Controls'
import { Kaleidoscope, type Params } from '@/components/Kaleidoscope'

const DEFAULTS: Params = { segments: 3, rotation: 0, offsetX: 0, offsetY: 0, zoom: 1, animate: false }

export default function App() {
  const [params, setParams] = useState(DEFAULTS)
  const [url, setUrl] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url])

  const loadFile = (file?: File) => {
    if (file?.type.startsWith('image/')) setUrl(URL.createObjectURL(file))
  }

  const save = () =>
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'kaleidoscope.png'
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 0)
    }, 'image/png')

  return (
    <div
      className="flex h-dvh flex-col gap-4 bg-background p-4 text-foreground md:flex-row"
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
      <main
        className={`relative min-h-0 flex-1 overflow-hidden rounded-xl border ${dragging ? 'border-primary ring-2 ring-primary/40' : 'border-border'}`}
      >
        {url ? (
          <Kaleidoscope url={url} params={params} canvasRef={canvasRef} />
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex size-full flex-col items-center justify-center gap-2 border-2 border-dashed border-muted rounded-xl text-muted-foreground hover:text-foreground"
          >
            <span className="text-lg font-medium">Drop or choose an image</span>
            <span className="text-sm">PNG, JPG, WebP… stays on your device</span>
          </button>
        )}
      </main>

      <aside className="max-h-[45dvh] overflow-y-auto md:max-h-none">
        <Controls
          params={params}
          onChange={(p) => setParams((prev) => ({ ...prev, ...p }))}
          onPick={() => inputRef.current?.click()}
          onSave={save}
          hasImage={!!url}
        />
      </aside>

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
