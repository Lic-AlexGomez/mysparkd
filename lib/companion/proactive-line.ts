import type { CompanionEvent } from "@/lib/companion/context-signals"
import type { RelationshipLevel } from "@/lib/companion/vibe-engine"
import type { SparkyMemory } from "@/lib/sparky-memory"
import { stableCompanionSeed, maybeAddMicroFlavor } from "@/lib/companion/micro-random"
import { pickInsideJokeLine } from "@/lib/companion/inside-jokes"
import { pickMomentMention } from "@/lib/companion/emotional-moments"
import { pickVocabularyLine, type VocabCategory } from "@/lib/companion/vocabulary"

export type PresenceProactiveEvent =
  | "peek_from_edge"
  | "curious_scan"
  | "micro_celebrate"
  | "idle_breath_glow"

function proactiveSeed(memory: SparkyMemory, now: Date, salt = 0): number {
  const recent = memory.repetitionState?.recentLineKeys?.length ?? 0
  return stableCompanionSeed(now, (memory.bondPoints ?? 0) + recent * 7 + salt)
}

function recentLineKeys(memory: SparkyMemory): string[] {
  return memory.repetitionState?.recentLineKeys ?? []
}

export function pickProactiveLine(opts: {
  memory: SparkyMemory
  relationshipLevel: RelationshipLevel
  event: PresenceProactiveEvent
  now?: Date
}): { line: string; key: string } | null {
  const now = opts.now ?? new Date()
  const seed = proactiveSeed(opts.memory, now, opts.event.length)
  const exclude = recentLineKeys(opts.memory)

  const joke = pickInsideJokeLine({ memory: opts.memory, relationshipLevel: opts.relationshipLevel, seed })
  if (joke && seed % 3 === 0) {
    return { line: maybeAddMicroFlavor(joke.line, seed), key: `joke:${joke.jokeId}` }
  }

  const moment = pickMomentMention({ memory: opts.memory, relationshipLevel: opts.relationshipLevel, seed })
  if (moment && seed % 4 === 0) {
    return { line: maybeAddMicroFlavor(moment.line, seed), key: `moment:${moment.momentId}` }
  }

  const category: VocabCategory =
    opts.event === "micro_celebrate" ? "celebrate_small" : opts.event === "peek_from_edge" ? "grind_tease" : "idle_comment"

  return {
    line: maybeAddMicroFlavor(
      pickVocabularyLine({
        category,
        relationshipLevel: opts.relationshipLevel,
        archetype: opts.memory.archetype,
        seed,
        excludeLineKeys: exclude,
      }),
      seed
    ),
    key: `vocab:${category}:${seed % 97}`,
  }
}

/** Líneas proactivas para eventos del companion (sin copy estático legacy). */
export function pickProactiveLineForCompanionEvent(opts: {
  memory: SparkyMemory
  relationshipLevel: RelationshipLevel
  event: CompanionEvent
  now?: Date
  daysSinceOpen?: number
}): { line: string; key: string } | null {
  const now = opts.now ?? new Date()
  const seed = proactiveSeed(opts.memory, now, opts.event.length + 11)
  const exclude = recentLineKeys(opts.memory)

  switch (opts.event) {
    case "user_idle":
    case "app_background":
      return null
    case "user_return_long_absence": {
      const moment = pickMomentMention({ memory: opts.memory, relationshipLevel: opts.relationshipLevel, seed })
      if (moment) return { line: moment.line, key: `moment:${moment.momentId}` }
      return {
        line: pickVocabularyLine({
          category: "comeback_tease",
          relationshipLevel: opts.relationshipLevel,
          archetype: opts.memory.archetype,
          seed,
          excludeLineKeys: exclude,
        }),
        key: `return:long:${seed % 97}`,
      }
    }
    case "user_return_after_days":
      return {
        line: pickVocabularyLine({
          category: "comeback_tease",
          relationshipLevel: opts.relationshipLevel,
          archetype: opts.memory.archetype,
          seed,
          excludeLineKeys: exclude,
        }),
        key: `return:days:${seed % 97}`,
      }
    case "app_open": {
      const category: VocabCategory =
        (opts.daysSinceOpen ?? 0) >= 2 ? "comeback_tease" : "greeting"
      return {
        line: maybeAddMicroFlavor(
          pickVocabularyLine({
            category,
            relationshipLevel: opts.relationshipLevel,
            archetype: opts.memory.archetype,
            seed,
            excludeLineKeys: exclude,
          }),
          seed
        ),
        key: `open:${category}:${seed % 97}`,
      }
    }
    case "success":
    case "achievement":
      return pickProactiveLine({
        memory: opts.memory,
        relationshipLevel: opts.relationshipLevel,
        event: "micro_celebrate",
        now,
      })
    case "error":
      return {
        line: maybeAddMicroFlavor(
          pickVocabularyLine({
            category: "idle_comment",
            relationshipLevel: opts.relationshipLevel,
            seed: seed + 3,
            excludeLineKeys: exclude,
          }),
          seed
        ),
        key: `error:${seed % 97}`,
      }
    case "loading_slow":
      return {
        line: maybeAddMicroFlavor("déjame ver…", seed),
        key: `loading:${seed % 97}`,
      }
    case "rage_click":
      return {
        line: maybeAddMicroFlavor("tranqui, respiro contigo", seed),
        key: `rage:${seed % 97}`,
      }
    case "scroll_fast":
    case "new_message":
      return pickProactiveLine({
        memory: opts.memory,
        relationshipLevel: opts.relationshipLevel,
        event: "peek_from_edge",
        now,
      })
    case "tour_complete":
      return pickProactiveLine({
        memory: opts.memory,
        relationshipLevel: opts.relationshipLevel,
        event: "micro_celebrate",
        now,
      })
    default:
      return null
  }
}
