import { describe, expect, it } from "vitest"

import plugin from "../src/index.ts"

describe("plugin", () => {
  it("exposes its id", () => {
    expect(plugin.id).toBe("davy121.monitor")
  })
})
