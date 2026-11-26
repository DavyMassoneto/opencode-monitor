import { describe, expect, test, vi } from "vitest"
import { TEST_LABEL } from "./constants"
import { isGroupAlive, makeMonitorSut, startedPid } from "./support"

async function stopFloodingCommand(): Promise<void> {
  const sut = makeMonitorSut()
  const pid = startedPid(sut, "yes flood")

  await vi.waitFor(() => expect(sut.sink.notices.at(-1)?.label).toBe(`${TEST_LABEL} (flooded)`), { timeout: 10_000 })
  expect(sut.sink.notices.at(-1)?.text).toContain("more than 100 lines per second for 5 seconds")
  await vi.waitFor(() => expect(isGroupAlive(pid)).toBe(false))
}

async function keepSteadyCommand(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "i=0; while [ $i -lt 60 ]; do echo steady; sleep 0.1; i=$((i+1)); done")
  await vi.waitFor(() => expect(sut.sink.notices.at(-1)?.text).toContain("command exited with code 0"), {
    timeout: 10_000,
  })
  expect(sut.sink.notices.map((notice) => notice.label)).not.toContain(`${TEST_LABEL} (flooded)`)
}

function registerTests(): void {
  test("para o comando que inunda a saída e avisa o motivo", stopFloodingCommand, 15_000)
  test("não para comando com saída constante abaixo do limite", keepSteadyCommand, 15_000)
}

describe("fim por inundação", registerTests)
