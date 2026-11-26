import { describe, expect, test, vi } from "vitest"
import { LONG_RUNNING_GROUP } from "./constants"
import { isGroupAlive, makeMonitorSut, settle, startedPid } from "./support"

async function stopWholeGroup(): Promise<void> {
  const sut = makeMonitorSut()
  const pid = startedPid(sut, LONG_RUNNING_GROUP)

  expect(isGroupAlive(pid)).toBe(true)
  sut.monitors.stopAll()
  await vi.waitFor(() => expect(isGroupAlive(pid)).toBe(false))
}

async function skipNoticesAfterStop(): Promise<void> {
  const sut = makeMonitorSut()
  const pid = startedPid(sut, LONG_RUNNING_GROUP)

  sut.monitors.stopAll()
  await vi.waitFor(() => expect(isGroupAlive(pid)).toBe(false))
  await settle()
  expect(sut.sink.notices).toHaveLength(0)
}

async function toleratesFinishedGroup(): Promise<void> {
  const sut = makeMonitorSut()
  const pid = startedPid(sut, "true")

  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  expect(isGroupAlive(pid)).toBe(false)
  expect(() => sut.monitors.stopAll()).not.toThrow()
}

function registerTests(): void {
  test("para o grupo de processos inteiro", stopWholeGroup)
  test("não entrega avisos depois do encerramento", skipNoticesAfterStop)
  test("encerra sem erro quando o comando já terminou", toleratesFinishedGroup)
}

describe("encerramento dos monitores", registerTests)
