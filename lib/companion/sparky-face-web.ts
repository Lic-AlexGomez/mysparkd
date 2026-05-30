import type { SparkyExpression } from "@/components/sparky/sparky-types"
import type { SparkyGaze } from "@/lib/hooks/use-sparky-gaze-web"

/** Por debajo de este tamaño (px) Sparky usa SVG nítido; arriba usa Three.js. */
export const SPARKY_3D_MIN_SIZE = 80

export type Sparky3DMood =
  | "idle"
  | "happy"
  | "curious"
  | "thinking"
  | "sad"
  | "excited"
  | "confused"

export type SparkyFaceState = {
  eyeOpen: number
  leftEyeOpen: number
  rightEyeOpen: number
  pupilX: number
  pupilY: number
  pupilScale: number
  mouth: "smile" | "open" | "sad" | "o" | "none"
  browTilt: number
  thinking: boolean
  celebrate: boolean
  starEyes: boolean
  bodyTilt: number
  bodyPulse: number
}

/** Paleta Sparky 3D — índigo / cian / violeta, sin rosa. */
export const SPARKY_3D_PALETTE = {
  body: "#8be9ff",
  bodyDeep: "#155e75",
  bodyHighlight: "#a5f3fc",
  core: "#f472b6",
  spark: "#f0fdff",
  iris: "#22d3ee",
  pupil: "#18304f",
  eyeWhite: "#ecfeff",
  rim: "#e879f9",
  shadow: "#0f172a",
} as const

export function moodToExpression(mood: Sparky3DMood): SparkyExpression {
  if (mood === "happy") return "happy"
  if (mood === "curious") return "speaking"
  if (mood === "thinking") return "thinking"
  if (mood === "sad") return "sad"
  if (mood === "excited") return "excited"
  if (mood === "confused") return "confused"
  return "idle"
}

export function resolveSparkyFace(
  expression: SparkyExpression,
  blink: boolean,
  gaze: SparkyGaze
): SparkyFaceState {
  const isWink = expression === "wink"
  const isThinking = expression === "thinking" || expression === "confused"
  const isExcited = expression === "excited" || expression === "celebrating"
  const isSleepy = expression === "sleepy"
  const isSad = expression === "sad"
  const isScared = expression === "scared"
  const isHappy = expression === "happy" || expression === "idle"
  const isSpeaking = expression === "speaking"

  const pupilScale = isScared ? 0.55 : isExcited ? 1.15 : 1

  const pupilX = isThinking ? 0.18 : gaze.x * 0.22
  const pupilY = isThinking ? -0.28 : isSleepy || isSad ? 0.12 : gaze.y * 0.18

  let eyeOpen = 1
  let leftEyeOpen = 1
  let rightEyeOpen = 1

  if (blink) {
    eyeOpen = 0.06
    leftEyeOpen = 0.06
    rightEyeOpen = 0.06
  } else if (isWink) {
    leftEyeOpen = 1
    rightEyeOpen = 0.1
  } else if (isSleepy || isSad) {
    eyeOpen = 0.38
    leftEyeOpen = 0.38
    rightEyeOpen = 0.38
  }

  let mouth: SparkyFaceState["mouth"] = "smile"
  if (isSad || isSleepy) mouth = "sad"
  else if (isScared) mouth = "o"
  else if (isSpeaking || isExcited) mouth = "open"
  else if (isHappy) mouth = "smile"

  return {
    eyeOpen,
    leftEyeOpen,
    rightEyeOpen,
    pupilX,
    pupilY,
    pupilScale,
    mouth,
    browTilt: isThinking ? (expression === "confused" ? 0.35 : 0.22) : 0,
    thinking: isThinking,
    celebrate: expression === "celebrating",
    starEyes: isExcited,
    bodyTilt: isThinking ? 0 : gaze.x * 0.18,
    bodyPulse: isExcited ? 1.06 : 1,
  }
}
