import { describe, expect, test, vi } from "vitest"
import { SLOW_RUNNER_TIMEOUT_MS, STEADY_60_LINES, TEST_LABEL } from "./constants"
import { makeMonitorSut, startedPid, waitForGroupExit } from "./support"

async function stopFloodingCommand(): Promise<void> {
  const sut = makeMonitorSut()
  const pid = startedPid(sut, "yes flood")

  await vi.waitFor(() => expect(sut.sink.notices.at(-1)?.label).toBe(`${TEST_LABEL} (flooded)`), {
    timeout: SLOW_RUNNER_TIMEOUT_MS,
  })
  expect(sut.sink.notices.at(-1)?.text).toContain("more than 100 lines per second for 5 seconds")
  await waitForGroupExit(pid)
}

async function keepSteadyCommand(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, STEADY_60_LINES)
  await vi.waitFor(() => expect(sut.sink.notices.at(-1)?.text).toContain("command exited with code 0"), {
    timeout: SLOW_RUNNER_TIMEOUT_MS,
  })
  expect(sut.sink.notices.map((notice) => notice.label)).not.toContain(`${TEST_LABEL} (flooded)`)
}

function registerTests(): void {
  test("para o comando que inunda a saída e avisa o motivo", stopFloodingCommand, 30_000)
  test("não para comando com saída constante abaixo do limite", keepSteadyCommand, 30_000)
}

describe("fim por inundação", registerTests)
