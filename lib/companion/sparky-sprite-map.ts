import type { SparkyExpression } from "@/components/sparky/sparky-types"

/** Hoja SPARKY SPRITESHEET V1 — cuadrícula 8×3 (1024×558 px). */
export const SPARKY_SPRITE_SHEET = {
  url: "/assets/sparky_spritesheet.png",
  width: 1024,
  height: 558,
  cols: 8,
  rows: 3,
  /** Ancho de celda uniforme (1024 / 8). */
  cellWidth: 128,
  /** Alto de fila uniforme (558 / 3). */
  cellHeight: 186,
  /** Referencia visual ~150px (escala desde cellWidth). */
  displayCell: 150,
} as const

export type SpriteCell = {
  col: number
  row: number
  /** Celdas horizontales que ocupa (poses fila 0 = 2). */
  span?: number
}

/** Expresiones → celda en la cuadrícula uniforme. */
export const SPARKY_EXPRESSION_SPRITE: Record<SparkyExpression, SpriteCell> = {
  idle: { col: 2, row: 0, span: 2 },
  happy: { col: 0, row: 1 },
  wink: { col: 7, row: 1 },
  sleepy: { col: 2, row: 1 },
  thinking: { col: 4, row: 1 },
  excited: { col: 3, row: 1 },
  celebrating: { col: 3, row: 1 },
  speaking: { col: 0, row: 1 },
  confused: { col: 6, row: 1 },
  sad: { col: 5, row: 1 },
  scared: { col: 6, row: 1 },
}

/** Frames de animación “Thinking 1–5” (fila 3, cols 0–4). */
export const SPARKY_THINKING_FRAMES: SpriteCell[] = [
  { col: 0, row: 2 },
  { col: 1, row: 2 },
  { col: 2, row: 2 },
  { col: 3, row: 2 },
  { col: 4, row: 2 },
]

export function spriteBackgroundPosition(
  cell: SpriteCell,
  displaySize: number
): { backgroundSize: string; backgroundPosition: string } {
  const { cellWidth, cellHeight, width, height } = SPARKY_SPRITE_SHEET
  const scale = displaySize / cellWidth
  const span = cell.span ?? 1
  const offsetX = cell.col * cellWidth + ((span - 1) * cellWidth) / 2
  const offsetY = cell.row * cellHeight + (cellHeight - cellWidth) / 2

  return {
    backgroundSize: `${width * scale}px ${height * scale}px`,
    backgroundPosition: `${-offsetX * scale}px ${-offsetY * scale}px`,
  }
}
