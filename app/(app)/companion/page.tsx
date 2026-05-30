"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Heart, LockKeyhole, Save, Sparkles } from "lucide-react"
import { SparkyCharacterWeb } from "@/components/sparky/SparkyCharacterWeb"
import { Button } from "@/components/ui/button"
import {
  COMPANION_CATALOG,
  getCompanionById,
  isCompanionUnlocked,
  type CompanionId,
} from "@/lib/companion/catalog"
import {
  AVATAR_STYLE_CATALOG,
  getAvatarStyleById,
  isAvatarStyleUnlocked,
  normalizeAvatarStyle,
  type AvatarStyleId,
} from "@/lib/companion/avatar-styles"
import { loadSparkyMemory, saveSparkyMemory } from "@/lib/sparky-memory"
import { getSparkBond } from "@/lib/sparky-bond"

type SaveState = "idle" | "saved" | "locked"

export default function CompanionPage() {
  const [memory, setMemory] = useState(() => loadSparkyMemory())
  const [selected, setSelected] = useState<CompanionId>(
    (memory.favoriteCompanion ?? "sparky") as CompanionId
  )
  const [styleSelected, setStyleSelected] = useState<AvatarStyleId>(() =>
    normalizeAvatarStyle(memory.avatarStyle)
  )
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const bond = getSparkBond(memory)

  useEffect(() => {
    setSelected((memory.favoriteCompanion ?? "sparky") as CompanionId)
    setStyleSelected(normalizeAvatarStyle(memory.avatarStyle))
  }, [memory.favoriteCompanion, memory.avatarStyle])

  useEffect(() => {
    setSaveState("idle")
  }, [selected, styleSelected])

  const selectedCompanion = getCompanionById(selected)
  const selectedStyle = getAvatarStyleById(styleSelected)
  const companionUnlocked = isCompanionUnlocked(selectedCompanion, bond.points)
  const styleUnlocked = isAvatarStyleUnlocked(selectedStyle, bond.points)
  const canSave = companionUnlocked && styleUnlocked
  const bondValue = Math.min(100, Math.max(0, bond.points))
  const hasChanges =
    selected !== ((memory.favoriteCompanion ?? "sparky") as CompanionId) ||
    styleSelected !== normalizeAvatarStyle(memory.avatarStyle)

  const nextUnlock = useMemo(() => {
    const lockedItems = [
      ...AVATAR_STYLE_CATALOG.map((item) => ({
        label: item.name,
        required: item.bondRequired ?? 0,
        unlocked: isAvatarStyleUnlocked(item, bond.points),
      })),
      ...COMPANION_CATALOG.map((item) => ({
        label: item.name,
        required: item.bondRequired ?? 0,
        unlocked: isCompanionUnlocked(item, bond.points),
      })),
    ]
      .filter((item) => !item.unlocked)
      .sort((a, b) => a.required - b.required)

    return lockedItems[0] ?? null
  }, [bond.points])

  const onSave = () => {
    if (!canSave) {
      setSaveState("locked")
      return
    }
    const next = {
      ...memory,
      favoriteCompanion: selected,
      avatarStyle: styleSelected,
    }
    setMemory(next)
    saveSparkyMemory(next)
    setSaveState("saved")
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_82%_22%,rgba(217,70,239,0.14),transparent_28%),linear-gradient(180deg,#08070d,#111018_52%,#08070d)] px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/feed"
            className="inline-flex h-10 items-center gap-2 rounded-[16px] bg-white/7 px-3 text-sm font-bold text-foreground transition hover:bg-white/12"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Feed
          </Link>
          <div className="flex items-center gap-2 rounded-[16px] bg-white/7 px-3 py-2 text-sm font-bold text-foreground">
            <Heart className="h-4 w-4 text-rose-200" aria-hidden />
            {bondValue}/100
          </div>
        </div>

        <section className="relative min-h-[360px] overflow-visible rounded-[32px] bg-white/[0.045] px-4 pb-5 pt-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:px-6">
          <div className="relative z-10 max-w-xl">
            <div className="flex items-center gap-2 text-rose-100">
              <Sparkles className="h-5 w-5" aria-hidden />
              <h1 className="text-3xl font-black sm:text-4xl">Mi rinconcito</h1>
            </div>
            <p className="mt-2 max-w-sm text-sm font-semibold leading-relaxed text-muted-foreground">
              {selectedCompanion.name} con estilo {selectedStyle.name}. {bond.label}
            </p>
          </div>

          <div className="relative mx-auto mt-3 flex h-[230px] max-w-md items-end justify-center overflow-visible">
            <div className="absolute bottom-6 h-24 w-72 rounded-full bg-gradient-to-r from-cyan-200/22 via-fuchsia-300/18 to-cyan-200/14 blur-3xl" />
            <div className="absolute left-1/2 top-5 h-40 w-40 -translate-x-1/2 rounded-full bg-cyan-100/10 blur-3xl" />
            <SparkyCharacterWeb
              companionId={selected}
              avatarStyle={styleSelected}
              expression="happy"
              size={172}
            />
          </div>

          <div className="relative z-10 mx-auto mt-3 max-w-md">
            <div
              className="h-2 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-label="Chispa de vinculo"
              aria-valuenow={bondValue}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-200 via-amber-200 to-cyan-200"
                style={{ width: `${bondValue}%` }}
              />
            </div>
            <p className="mt-2 text-center text-xs font-semibold text-muted-foreground">
              {nextUnlock ? `Proximo desbloqueo: ${nextUnlock.label} en ${nextUnlock.required}` : "Todo desbloqueado"}
            </p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[24px] bg-white/[0.045] p-4 shadow-xl shadow-black/20 backdrop-blur-xl sm:p-5">
            <h2 className="text-lg font-black">Estilo</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {AVATAR_STYLE_CATALOG.map((def) => {
                const unlocked = isAvatarStyleUnlocked(def, bond.points)
                const active = styleSelected === def.id
                return (
                  <button
                    key={def.id}
                    type="button"
                    disabled={!unlocked}
                    aria-pressed={active}
                    onClick={() => setStyleSelected(def.id)}
                    className={`min-h-[132px] rounded-[18px] border p-3 text-left transition ${
                      active
                        ? "border-rose-200/70 bg-rose-100/10"
                        : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"
                    } ${unlocked ? "" : "opacity-50"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <SparkyCharacterWeb
                        companionId={selected}
                        avatarStyle={def.id}
                        expression={active ? "excited" : "idle"}
                        size={50}
                      />
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/8 text-foreground">
                        {unlocked ? <Check className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm font-black">{def.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-muted-foreground">
                      {unlocked ? def.description : `Bond ${def.bondRequired}+`}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-[24px] bg-white/[0.045] p-4 shadow-xl shadow-black/20 backdrop-blur-xl sm:p-5">
            <h2 className="text-lg font-black">Criatura</h2>
            <div className="mt-3 grid grid-cols-1 gap-3">
              {COMPANION_CATALOG.map((def) => {
                const unlocked = isCompanionUnlocked(def, bond.points)
                const active = selected === def.id
                return (
                  <button
                    key={def.id}
                    type="button"
                    disabled={!unlocked}
                    aria-pressed={active}
                    onClick={() => setSelected(def.id)}
                    className={`grid min-h-[112px] grid-cols-[64px_1fr_auto] items-center gap-3 rounded-[18px] border p-3 text-left transition ${
                      active
                        ? "border-amber-200/70 bg-amber-100/10"
                        : "border-white/10 bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.06]"
                    } ${unlocked ? "" : "opacity-50"}`}
                  >
                    <SparkyCharacterWeb
                      companionId={def.id}
                      avatarStyle={styleSelected}
                      expression={active ? "happy" : "idle"}
                      size={58}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black">{def.name}</span>
                      <span className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-muted-foreground">
                        {unlocked ? def.description : `Bond ${def.bondRequired}+`}
                      </span>
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-foreground">
                      {unlocked ? <Check className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <div className="sticky bottom-3 z-10 rounded-[22px] bg-card/92 p-3 shadow-xl shadow-black/30 backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-sm font-bold ${saveState === "locked" ? "text-amber-100" : "text-muted-foreground"}`}>
              {saveState === "saved"
                ? "Guardado"
                : saveState === "locked"
                  ? "Aun esta bloqueado"
                  : `${selectedCompanion.name} / ${selectedStyle.name}`}
            </p>
            <Button
              className="h-11 rounded-[16px] bg-rose-200 px-5 font-black text-slate-950 hover:bg-amber-200"
              onClick={onSave}
              disabled={!hasChanges && saveState === "saved"}
            >
              <Save className="mr-2 h-4 w-4" aria-hidden />
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
