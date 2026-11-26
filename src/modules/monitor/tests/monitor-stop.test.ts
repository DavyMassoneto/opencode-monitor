import { describe, expect, test, vi } from "vitest"
import { LONG_RUNNING_GROUP, OTHER_SESSION_ID, TERM_IGNORING_GROUP, TEST_SESSION_ID } from "./constants"
import { isGroupAlive, makeMonitorSut, monitorRequest, settle, startedMonitor, waitForGroupExit } from "./support"

async function stopOneMonitor(): Promise<void> {
  const sut = makeMonitorSut()
  const { id, pid } = startedMonitor(sut, monitorRequest(LONG_RUNNING_GROUP))

  expect(sut.monitors.stop(TEST_SESSION_ID, id)).toMatchObject({
    kind: "stopped",
    summary: { id, pid, status: "stopped" },
  })
  await waitForGroupExit(pid)
  expect(sut.monitors.list(TEST_SESSION_ID)).toEqual([expect.objectContaining({ id, status: "stopped" })])
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
  await waitForGroupExit(pid)
}

async function stopOnlyOneSession(): Promise<void> {
  const sut = makeMonitorSut()
  const own = startedMonitor(sut, monitorRequest(LONG_RUNNING_GROUP))
  const other = startedMonitor(sut, { ...monitorRequest(LONG_RUNNING_GROUP), sessionID: OTHER_SESSION_ID })

  sut.monitors.stopSession(TEST_SESSION_ID)
  await waitForGroupExit(own.pid)
  expect(sut.monitors.list(OTHER_SESSION_ID)).toEqual([expect.objectContaining({ id: other.id })])
  expect(isGroupAlive(other.pid)).toBe(true)
  sut.monitors.stopAll()
}

async function leaveNoProcessWhenStoppedAtOnce(): Promise<void> {
  const sut = makeMonitorSut()
  const pids: number[] = []

  for (let index = 0; index < 20; index += 1) {
    const { id, pid } = startedMonitor(sut, { ...monitorRequest(LONG_RUNNING_GROUP), sessionID: `ses_burst_${index}` })
    await new Promise<void>((resolve) => setTimeout(resolve, index % 4))
    sut.monitors.stop(`ses_burst_${index}`, id)
    pids.push(pid)
  }
  await Promise.all(pids.map(waitForGroupExit))
}

function registerTests(): void {
  test("para um monitor pelo id e o lista como stopped", stopOneMonitor)
  test("não envia aviso quando o monitor é parado", sendNoNoticeOnStop)
  test("recusa parar id desconhecido", rejectUnknownId)
  test("recusa parar monitor de outra sessão", rejectOtherSessionMonitor)
  test("mata com SIGKILL o grupo que ignora SIGTERM", killGroupIgnoringTerm, 10_000)
  test("para só os monitores da sessão encerrada", stopOnlyOneSession)
  test("não deixa processo vivo mesmo parando logo após iniciar", leaveNoProcessWhenStoppedAtOnce, 15_000)
}

describe("parada de monitores", registerTests)
