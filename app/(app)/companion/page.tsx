"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { SparkyCharacterWeb } from "@/components/sparky/SparkyCharacterWeb"
import { Button } from "@/components/ui/button"
import {
  COMPANION_CATALOG,
  getCompanionById,
  isCompanionUnlocked,
  type CompanionId,
} from "@/lib/companion/catalog"
import { loadSparkyMemory, saveSparkyMemory } from "@/lib/sparky-memory"
import { getSparkBond } from "@/lib/sparky-bond"

export default function CompanionPage() {
  const [memory, setMemory] = useState(() => loadSparkyMemory())
  const [selected, setSelected] = useState<CompanionId>(
    (memory.favoriteCompanion ?? "sparky") as CompanionId
  )
  const bond = getSparkBond(memory)

  useEffect(() => {
    setSelected((memory.favoriteCompanion ?? "sparky") as CompanionId)
  }, [memory.favoriteCompanion])

  const onSave = () => {
    const def = getCompanionById(selected)
    if (!isCompanionUnlocked(def, bond.points)) return
    const next = { ...memory, favoriteCompanion: selected }
    setMemory(next)
    saveSparkyMemory(next)
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Elige tu companion</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Bond {bond.points}/100 · {bond.label}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {COMPANION_CATALOG.map((def) => {
          const unlocked = isCompanionUnlocked(def, bond.points)
          const active = selected === def.id
          return (
            <button
              key={def.id}
              type="button"
              disabled={!unlocked}
              onClick={() => setSelected(def.id)}
              className={`rounded-xl border p-4 text-center transition ${
                active ? "border-primary ring-2 ring-primary/40" : "border-border"
              } ${unlocked ? "" : "opacity-45"}`}
            >
              <SparkyCharacterWeb companionId={def.id} expression="happy" size={56} className="mx-auto" />
              <p className="mt-2 font-semibold">{def.name}</p>
              <p className="text-xs text-muted-foreground">
                {unlocked ? def.description : `Bond ${def.bondRequired}+`}
              </p>
            </button>
          )
        })}
      </div>

      <Button className="mt-6 w-full" onClick={onSave}>
        Guardar · {getCompanionById(selected).name}
      </Button>

      <Link href="/feed" className="mt-4 inline-block text-sm text-primary underline">
        Volver al feed
      </Link>
    </main>
  )
}
