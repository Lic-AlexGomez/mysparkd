"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { SparkyGaze } from "@/lib/hooks/use-sparky-gaze-web"
import {
  resolveSparkyFace,
  moodToExpression,
  type Sparky3DMood,
  type SparkyFaceState,
} from "@/lib/companion/sparky-face-web"

type SceneProps = {
  mood: Sparky3DMood
  gaze: SparkyGaze
  reduceMotion: boolean
  wardrobeAccessory: string | null
  interactive: boolean
  hovered: boolean
  clickPulse: number
  compact?: boolean
}

type MoodVisual = {
  body: string
  core: string
  aura: string
  emissiveBoost: number
  floatSpeed: number
  floatAmp: number
  breathAmp: number
  wobbleAmp: number
}

const MOOD_VISUALS: Record<Sparky3DMood, MoodVisual> = {
  idle: {
    body: "#7dd3fc",
    core: "#f0abfc",
    aura: "#e879f9",
    emissiveBoost: 0.1,
    floatSpeed: 1,
    floatAmp: 0.06,
    breathAmp: 0.015,
    wobbleAmp: 0.01,
  },
  happy: {
    body: "#8be9ff",
    core: "#f472b6",
    aura: "#c084fc",
    emissiveBoost: 0.18,
    floatSpeed: 1.05,
    floatAmp: 0.065,
    breathAmp: 0.018,
    wobbleAmp: 0.012,
  },
  curious: {
    body: "#93c5fd",
    core: "#e879f9",
    aura: "#a78bfa",
    emissiveBoost: 0.14,
    floatSpeed: 1.08,
    floatAmp: 0.062,
    breathAmp: 0.016,
    wobbleAmp: 0.011,
  },
  thinking: {
    body: "#a5f3fc",
    core: "#c084fc",
    aura: "#f0abfc",
    emissiveBoost: 0.16,
    floatSpeed: 0.9,
    floatAmp: 0.055,
    breathAmp: 0.014,
    wobbleAmp: 0.009,
  },
  sad: {
    body: "#7dd3fc",
    core: "#93c5fd",
    aura: "#c4b5fd",
    emissiveBoost: 0.05,
    floatSpeed: 0.72,
    floatAmp: 0.04,
    breathAmp: 0.01,
    wobbleAmp: 0.007,
  },
  excited: {
    body: "#67e8f9",
    core: "#f472b6",
    aura: "#f0abfc",
    emissiveBoost: 0.28,
    floatSpeed: 1.25,
    floatAmp: 0.08,
    breathAmp: 0.02,
    wobbleAmp: 0.015,
  },
  confused: {
    body: "#93c5fd",
    core: "#e879f9",
    aura: "#c084fc",
    emissiveBoost: 0.12,
    floatSpeed: 1.04,
    floatAmp: 0.065,
    breathAmp: 0.015,
    wobbleAmp: 0.013,
  },
}

function SparkyEye({
  side,
  face,
  mood,
  compact = false,
  position,
}: {
  side: "left" | "right"
  face: SparkyFaceState
  mood: Sparky3DMood
  compact?: boolean
  position: [number, number, number]
}) {
  const groupRef = useRef<THREE.Group>(null)
  const irisRef = useRef<THREE.Group>(null)
  const open = side === "left" ? face.leftEyeOpen : face.rightEyeOpen
  const isSad = mood === "sad"
  const r = compact ? 0.145 : 0.135

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, open, 0.22)
    }
    if (irisRef.current) {
      irisRef.current.position.x = THREE.MathUtils.lerp(irisRef.current.position.x, face.pupilX * 0.015, 0.14)
      irisRef.current.position.y = THREE.MathUtils.lerp(
        irisRef.current.position.y,
        face.pupilY * 0.015 + (isSad ? -0.005 : 0),
        0.14
      )
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh scale={[1, 1.1, 1]}>
        <circleGeometry args={[r, 28]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh scale={[1.02, 1.12, 1]}>
        <ringGeometry args={[r * 0.98, r * 1.02, 32]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.85} />
      </mesh>
      <group ref={irisRef} position={[0, 0.008, 0.002]}>
        <mesh scale={[0.62, 0.66, 1]}>
          <circleGeometry args={[r, 24]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh scale={[0.32, 0.35, 1]}>
          <circleGeometry args={[r, 16]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.35} />
        </mesh>
        <mesh scale={0.14}>
          <circleGeometry args={[r, 12]} />
          <meshBasicMaterial color="#1e3a5f" />
        </mesh>
        <mesh position={[r * 0.28, r * 0.3, 0.003]} scale={0.22}>
          <circleGeometry args={[r, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[-r * 0.2, -r * 0.18, 0.003]} scale={0.09}>
          <circleGeometry args={[r, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  )
}

function SparkyMouth({ mouth }: { mouth: SparkyFaceState["mouth"] }) {
  if (mouth === "none") return null

  if (mouth === "open") {
    return (
      <mesh position={[0, -0.14, 0.86]} scale={[0.1, 0.08, 0.05]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
    )
  }

  if (mouth === "o") {
    return (
      <mesh position={[0, -0.13, 0.85]} scale={[0.055, 0.07, 0.03]}>
        <torusGeometry args={[1, 0.22, 8, 20]} />
        <meshStandardMaterial color="#334155" roughness={0.65} />
      </mesh>
    )
  }

  const sad = mouth === "sad"
  return (
    <mesh
      position={[0, sad ? -0.2 : -0.18, 0.84]}
      rotation={[sad ? -0.5 : 0.42, 0, 0]}
      scale={[0.14, 0.14, 0.022]}
    >
      <torusGeometry args={[1, 0.08, 8, 24, Math.PI]} />
      <meshStandardMaterial color="#475569" roughness={0.6} />
    </mesh>
  )
}

function SparkyLimbs({ mood }: { mood: Sparky3DMood }) {
  const visual = MOOD_VISUALS[mood]

  return (
    <group>
      <mesh position={[-0.24, -0.62, 0.22]} scale={[0.1, 0.08, 0.06]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshPhysicalMaterial
          color={visual.body}
          transparent
          opacity={0.6}
          transmission={0.35}
          roughness={0.15}
        />
      </mesh>
      <mesh position={[0.24, -0.62, 0.22]} scale={[0.1, 0.08, 0.06]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshPhysicalMaterial
          color={visual.body}
          transparent
          opacity={0.6}
          transmission={0.35}
          roughness={0.15}
        />
      </mesh>
    </group>
  )
}

function CheekLights({ compact }: { compact: boolean }) {
  const s = compact ? 0.045 : 0.05
  return (
    <>
      <mesh position={[-0.32, compact ? -0.06 : -0.04, 0.86]} scale={[s * 1.5, s, s * 0.35]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#fda4af" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0.32, compact ? -0.06 : -0.04, 0.86]} scale={[s * 1.5, s, s * 0.35]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#fda4af" transparent opacity={0.4} />
      </mesh>
    </>
  )
}

function SparkyParticles({ mood }: { mood: Sparky3DMood }) {
  const ref = useRef<THREE.Group>(null)
  const visual = MOOD_VISUALS[mood]
  const nodes = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2
        return { x: Math.cos(a) * 1.15, y: Math.sin(a * 2) * 0.12, z: Math.sin(a) * 0.5, s: 0.02 + (i % 2) * 0.008 }
      }),
    []
  )

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.elapsedTime * 0.35
  })

  return (
    <group ref={ref}>
      {nodes.map((n, i) => (
        <mesh key={i} position={[n.x, n.y, n.z]} scale={n.s}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={i % 2 ? visual.core : visual.aura} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function SparkyMesh({
  mood,
  gaze,
  reduceMotion,
  wardrobeAccessory,
  interactive,
  hovered,
  clickPulse,
  compact = false,
}: SceneProps) {
  const rootRef = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Mesh>(null)
  const bodyMatRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const coreMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const [blink, setBlink] = useState(false)
  const [jumpKick, setJumpKick] = useState(0)
  const expression = moodToExpression(mood)
  const visual = MOOD_VISUALS[mood]
  const lastClickRef = useRef(0)

  useEffect(() => {
    if (reduceMotion) return
    let cancelled = false
    let timeout = 0
    const schedule = () => {
      if (cancelled) return
      timeout = window.setTimeout(() => {
        setBlink(true)
        window.setTimeout(() => setBlink(false), 100)
        schedule()
      }, 2500 + Math.random() * 2500)
    }
    schedule()
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [reduceMotion])

  const face = useMemo(() => resolveSparkyFace(expression, blink, gaze), [expression, blink, gaze])
  const displayMouth = mood === "sad" ? face.mouth : mood === "excited" ? "open" : "smile"

  useEffect(() => {
    if (clickPulse <= 0) return
    if (lastClickRef.current === clickPulse) return
    lastClickRef.current = clickPulse
    setJumpKick(1)
    const id = window.setTimeout(() => setJumpKick(0), 220)
    return () => clearTimeout(id)
  }, [clickPulse])

  useFrame(({ clock }) => {
    if (!rootRef.current || !bodyRef.current) return
    const t = clock.elapsedTime
    const wave = Math.sin(t * (1.8 * visual.floatSpeed))
    const wobble = Math.sin(t * (1.2 * visual.floatSpeed) + 0.6)

    if (!reduceMotion) {
      rootRef.current.position.y = Math.sin(t * visual.floatSpeed) * visual.floatAmp + jumpKick * 0.1
      rootRef.current.rotation.z = THREE.MathUtils.lerp(
        rootRef.current.rotation.z,
        face.bodyTilt + wobble * visual.wobbleAmp,
        0.08
      )
      rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, gaze.x * 0.22, 0.06)
      const breath = 1 + Math.sin(t * 2) * visual.breathAmp
      const boost = (interactive && hovered ? 1.05 : 1) * (1 + clickPulse * 0.12)
      rootRef.current.scale.setScalar(breath * face.bodyPulse * boost)
    }

    const sx = 1.02 + wave * 0.015
    const sy = 0.97 + wave * 0.02 + (mood === "sad" ? -0.02 : 0)
    bodyRef.current.scale.set(
      THREE.MathUtils.lerp(bodyRef.current.scale.x, sx, 0.1),
      THREE.MathUtils.lerp(bodyRef.current.scale.y, sy, 0.1),
      THREE.MathUtils.lerp(bodyRef.current.scale.z, 1.0, 0.1)
    )

    if (bodyMatRef.current) {
      bodyMatRef.current.emissiveIntensity =
        0.18 + visual.emissiveBoost + (hovered ? 0.08 : 0) + clickPulse * 0.2
    }
    if (coreMatRef.current) {
      coreMatRef.current.emissiveIntensity = 0.55 + visual.emissiveBoost + clickPulse * 0.2
    }
  })

  const eyeY = compact ? 0.05 : 0.07

  return (
    <group ref={rootRef}>
      <mesh scale={0.4}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          ref={coreMatRef}
          color={visual.core}
          emissive={visual.core}
          emissiveIntensity={0.35}
          transparent
          opacity={0.5}
        />
      </mesh>

      <mesh ref={bodyRef} scale={[1.02, 0.98, 1]}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshPhysicalMaterial
          ref={bodyMatRef}
          color={visual.body}
          emissive="#67e8f9"
          emissiveIntensity={0.12}
          roughness={0.12}
          metalness={0}
          transmission={0.52}
          thickness={0.9}
          clearcoat={0.7}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.88}
        />
      </mesh>

      <mesh scale={1.06}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={visual.aura} transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>

      <mesh position={[-0.2, 0.32, 0.74]} scale={[0.18, 0.12, 0.06]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>

      <SparkyLimbs mood={mood} />

      <SparkyEye side="left" mood={mood} face={face} compact={compact} position={[-0.3, eyeY, 0.88]} />
      <SparkyEye side="right" mood={mood} face={face} compact={compact} position={[0.3, eyeY, 0.88]} />
      <CheekLights compact={compact} />
      <SparkyMouth mouth={displayMouth} />

      {!compact ? <SparkyParticles mood={mood} /> : null}
    </group>
  )
}

function SparkyScene(props: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.55} color="#e0f2fe" />
      <directionalLight position={[2, 4, 3]} intensity={0.9} color="#ffffff" />
      <pointLight position={[-1.5, 1, 2]} intensity={0.5} color="#22d3ee" />
      <pointLight position={[1.5, 0.5, 2]} intensity={0.4} color="#e879f9" />
      <SparkyMesh {...props} />
    </>
  )
}

export type SparkyThreeCanvasProps = SceneProps & {
  size: number
  frameScale?: number
}

export function SparkyThreeCanvas({
  size,
  frameScale = 1,
  mood,
  gaze,
  reduceMotion,
  wardrobeAccessory,
  interactive,
  hovered,
  clickPulse,
  compact = false,
}: SparkyThreeCanvasProps) {
  const frameWidth = size * frameScale
  const frameHeight = size * 1.12 * frameScale

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{
        position: [0, 0.05, 2.8],
        fov: compact ? 40 : 36,
        near: 0.1,
        far: 20,
      }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{
        width: frameWidth,
        height: frameHeight,
        marginLeft: -(frameWidth - size) / 2,
        marginTop: -(frameHeight - size * 1.12) / 2,
        background: "transparent",
      }}
    >
      <SparkyScene
        mood={mood}
        gaze={gaze}
        reduceMotion={reduceMotion}
        wardrobeAccessory={wardrobeAccessory}
        interactive={interactive}
        hovered={hovered}
        clickPulse={clickPulse}
        compact={compact}
      />
    </Canvas>
  )
}
