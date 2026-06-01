import { describe, expect, it } from "vitest"
import { getSparkyKnowledgeForRoute } from "@/lib/sparky-knowledge.generated"

describe("sparky knowledge", () => {
  it("returns non-empty strings for known routes", () => {
    expect(getSparkyKnowledgeForRoute("feed")).toContain("Feed")
    expect(getSparkyKnowledgeForRoute("events")).toContain("Eventos")
  })
})

