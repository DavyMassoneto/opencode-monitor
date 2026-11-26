import { describe, expect, test, vi } from "vitest"
import { LONG_RUNNING_GROUP, OTHER_SESSION_ID, TERM_IGNORING_GROUP, TEST_SESSION_ID } from "./constants"
import { isGroupAlive, makeMonitorSut, monitorRequest, settle, startedMonitor } from "./support"

async function stopOneMonitor(): Promise<void> {
  const sut = makeMonitorSut()
  const { id, pid } = startedMonitor(sut, monitorRequest(LONG_RUNNING_GROUP))

  expect(sut.monitors.stop(TEST_SESSION_ID, id)).toMatchObject({ kind: "stopped", summary: { id, pid } })
  await vi.waitFor(() => expect(isGroupAlive(pid)).toBe(false))
  expect(sut.monitors.list(TEST_SESSION_ID)).toEqual([])
}

async function sendNoNoticeOnStop(): Promise<void> {
  const sut = makeMonitorSut()
  const { id } = startedMonitor(sut, monitorRequest(LONG_RUNNING_GROUP))

  sut.monitors.stop(TEST_SESSION_ID, id)
  await settle()
  expect(sut.sink.notices).toHaveLength(0)
}

function rejectUnknownId(): void {
  const sut = makeMonitorSut()

  expect(sut.monitors.stop(TEST_SESSION_ID, "m_00000000")).toEqual({ kind: "not_found", id: "m_00000000" })
}

function rejectOtherSessionMonitor(): void {
  const sut = makeMonitorSut()
  const { id } = startedMonitor(sut, monitorRequest(LONG_RUNNING_GROUP))

  expect(sut.monitors.stop(OTHER_SESSION_ID, id)).toEqual({ kind: "not_found", id })
  expect(sut.monitors.list(TEST_SESSION_ID)).toHaveLength(1)
  sut.monitors.stopAll()
}

async function killGroupIgnoringTerm(): Promise<void> {
  const sut = makeMonitorSut()
  const { id, pid } = startedMonitor(sut, monitorRequest(TERM_IGNORING_GROUP))

  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  sut.monitors.stop(TEST_SESSION_ID, id)
  await settle()
  expect(isGroupAlive(pid)).toBe(true)
  await vi.waitFor(() => expect(isGroupAlive(pid)).toBe(false), { timeout: 5000 })
}

async function stopOnlyOneSession(): Promise<void> {
  const sut = makeMonitorSut()
  const own = startedMonitor(sut, monitorRequest(LONG_RUNNING_GROUP))
  const other = startedMonitor(sut, { ...monitorRequest(LONG_RUNNING_GROUP), sessionID: OTHER_SESSION_ID })

  sut.monitors.stopSession(TEST_SESSION_ID)
  await vi.waitFor(() => expect(isGroupAlive(own.pid)).toBe(false))
  expect(sut.monitors.list(OTHER_SESSION_ID)).toEqual([expect.objectContaining({ id: other.id })])
  expect(isGroupAlive(other.pid)).toBe(true)
  sut.monitors.stopAll()
}

function registerTests(): void {
  test("para um monitor pelo id e tira da lista", stopOneMonitor)
  test("não envia aviso quando o monitor é parado", sendNoNoticeOnStop)
  test("recusa parar id desconhecido", rejectUnknownId)
  test("recusa parar monitor de outra sessão", rejectOtherSessionMonitor)
  test("mata com SIGKILL o grupo que ignora SIGTERM", killGroupIgnoringTerm, 10_000)
  test("para só os monitores da sessão encerrada", stopOnlyOneSession)
}

describe("parada de monitores", registerTests)
