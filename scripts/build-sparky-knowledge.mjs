import fs from "fs"
import path from "path"

/**
 * Generador simple de knowledge base.
 * Mantiene el archivo generado pequeño y estable para prompts.
 *
 * Nota: esta primera versión deja un KB mínimo y editable en:
 * - c:\\v0-social\\docs\\sparky-knowledge-base.md
 *
 * Más adelante se puede enriquecer extrayendo rutas reales desde /app y /v0-social-mobile/app.
 */

const ROOT = process.cwd()
const outFile = path.join(ROOT, "lib", "sparky-knowledge.generated.ts")

function main() {
  if (!fs.existsSync(path.join(ROOT, "docs", "sparky-knowledge-base.md"))) {
    throw new Error("Missing docs/sparky-knowledge-base.md")
  }

  // El contenido “real” de KB está en el doc. El TS queda como mapa compacto.
  // (Mantenerlo short para no meter tokens innecesarios en cada request).
  const content = fs.readFileSync(outFile, "utf8")
  if (!content.includes("getSparkyKnowledgeForRoute")) {
    throw new Error("Unexpected output file. Refusing to overwrite.")
  }

  console.log("Sparky knowledge already present:", outFile)
}

main()

