import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import * as THREE from 'three'

export type Params = {
  segments: number
  rotation: number // degrees
  offsetX: number
  offsetY: number
  zoom: number
  animate: boolean
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); // full-screen quad, camera ignored
  }
`

const fragmentShader = /* glsl */ `
  #define PI 3.141592653589793
  uniform sampler2D uTex;
  uniform float uSegments, uRotation, uZoom, uAspect, uImgAspect;
  uniform vec2 uOffset;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float r = length(p);
    float a = atan(p.y, p.x) + uRotation;
    float w = PI / uSegments;            // segments = mirrored pairs, so odd counts stay seamless
    a = abs(mod(a, 2.0 * w) - w);        // fold every angle into one mirrored wedge
    vec2 q = r * vec2(cos(a), sin(a)) / uZoom + uOffset;
    gl_FragColor = texture2D(uTex, q * vec2(1.0 / uImgAspect, 1.0) + 0.5);
    #include <colorspace_fragment>
  }
`

function Quad({ texture, params }: { texture: THREE.Texture; params: Params }) {
  const spin = useRef(0)
  const mat = useRef<THREE.ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uTex: { value: texture },
      uSegments: { value: 3 },
      uRotation: { value: 0 },
      uZoom: { value: 1 },
      uAspect: { value: 1 },
      uImgAspect: { value: 1 },
      uOffset: { value: new THREE.Vector2() },
    }),
    [texture],
  )

  useFrame((state, delta) => {
    if (!mat.current) return
    const u = mat.current.uniforms // R3F copies the uniforms prop, so write to the material's own object
    if (params.animate) spin.current = (spin.current + delta * 0.3) % (Math.PI * 2)
    const img = texture.image as { width: number; height: number }
    u.uSegments.value = params.segments
    u.uRotation.value = THREE.MathUtils.degToRad(params.rotation) + spin.current
    u.uZoom.value = params.zoom
    u.uOffset.value.set(params.offsetX, params.offsetY)
    u.uAspect.value = state.size.width / state.size.height
    u.uImgAspect.value = img.width / img.height
  })

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial ref={mat} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  )
}

export function Kaleidoscope({
  url,
  params,
  canvasRef,
}: {
  url: string
  params: Params
  canvasRef: RefObject<HTMLCanvasElement | null>
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let tex: THREE.Texture | null = null
    let cancelled = false
    new THREE.TextureLoader().load(url, (t) => {
      t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping
      t.colorSpace = THREE.SRGBColorSpace
      if (cancelled) return t.dispose()
      tex = t
      setTexture(t)
    })
    return () => {
      cancelled = true
      tex?.dispose()
    }
  }, [url])

  return (
    <Canvas
      gl={{ preserveDrawingBuffer: true }} // needed so toBlob() reads the last frame, not a cleared buffer
      dpr={[1, 2]}
      onCreated={({ gl }) => (canvasRef.current = gl.domElement)}
    >
      {texture && <Quad texture={texture} params={params} />}
    </Canvas>
  )
}
