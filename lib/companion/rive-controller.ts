import type { SparkyExpression } from "@/components/sparky/sparky-types"

export const SPARKY_RIVE_STATE_MACHINE = "SparkyMachine"

export const SPARKY_RIVE_INPUTS = {
  mood: "mood",
  speaking: "speaking",
  gazeX: "gazeX",
  gazeY: "gazeY",
  celebrate: "celebrate",
} as const

export function expressionToRiveMoodValue(expression: SparkyExpression): number {
  switch (expression) {
    case "idle":
      return 0
    case "happy":
      return 1
    case "sleepy":
      return 2
    case "thinking":
      return 3
    case "excited":
      return 4
    case "celebrating":
      return 5
    case "sad":
      return 6
    case "confused":
      return 7
    case "scared":
      return 8
    case "wink":
      return 9
    case "speaking":
      return 10
    default:
      return 0
  }
}

export function expressionToRiveAnimation(expression: SparkyExpression): string {
  switch (expression) {
    case "celebrating":
      return "celebrate"
    case "excited":
      return "excited"
    case "happy":
      return "happy"
    case "sleepy":
      return "sleepy"
    case "thinking":
      return "thinking"
    case "sad":
      return "sad"
    case "confused":
      return "confused"
    case "scared":
      return "scared"
    case "wink":
      return "wink"
    case "speaking":
      return "speaking"
    case "idle":
    default:
      return "idle"
  }
}
