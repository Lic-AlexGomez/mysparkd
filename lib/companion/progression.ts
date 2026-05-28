import type { SparkyArchetype, SparkyMemory } from "@/lib/sparky-memory"
import { relationshipLevelFromBondPoints } from "@/lib/companion/vibe-engine"

function chooseArchetype(memory: SparkyMemory): SparkyArchetype {
  if (memory.archetype) return memory.archetype
  if (memory.interactionStyle === "calm") return "deadpan"
  if (memory.interactionStyle === "fast") return "softChaotic"
  if ((memory.bondPoints ?? 0) >= 80) return "bestie"
  return "roomie"
}

export function applyLongTermProgression(memory: SparkyMemory): SparkyMemory {
  return {
    ...memory,
    relationshipLevel: relationshipLevelFromBondPoints(memory.bondPoints ?? 0),
    archetype: chooseArchetype(memory),
  }
}

