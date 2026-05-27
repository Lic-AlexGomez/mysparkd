import { describe, expect, it } from "vitest"
import { parseMyDateCardsMineResponse } from "@/lib/parity/fastdate-mine"
import {
  isIpRegistrationBlockedMessage,
  ipRegistrationBlockedPresentation,
} from "@/lib/parity/auth-ip-errors"

describe("parseMyDateCardsMineResponse", () => {
  it("splits grouped API response", () => {
    const result = parseMyDateCardsMineResponse({
      activeCards: [{ id: "1", status: "ACTIVE" }],
      expiredCards: [{ id: "2", status: "EXPIRED" }],
    })
    expect(result.activeCards).toHaveLength(1)
    expect(result.expiredCards).toHaveLength(1)
  })

  it("falls back to flat array", () => {
    const result = parseMyDateCardsMineResponse([
      { id: "1", status: "ACTIVE" },
      { id: "2", status: "FINISHED" },
    ])
    expect(result.activeCards).toHaveLength(1)
    expect(result.expiredCards).toHaveLength(1)
  })
})

describe("auth IP errors", () => {
  it("detects IP block messages", () => {
    expect(isIpRegistrationBlockedMessage("Exceeded register from same IP address")).toBe(true)
    expect(isIpRegistrationBlockedMessage("Invalid password")).toBe(false)
  })

  it("returns user-facing copy", () => {
    expect(ipRegistrationBlockedPresentation().title).toBe("Límite de registros")
  })
})
