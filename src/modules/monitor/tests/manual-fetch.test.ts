import { describe, expect, test, vi } from "vitest"
import { LONG_RUNNING_GROUP, OTHER_SESSION_ID, TEST_SESSION_ID } from "./constants"
import { makeMonitorSut, manualRequest, monitorRequest, settle, startedMonitor } from "./support"

async function sendNothingInManualMode(): Promise<void> {
  const sut = makeMonitorSut()
  const { id } = startedMonitor(sut, manualRequest("echo one; echo two"))

  await vi.waitFor(() => expect(sut.monitors.list(TEST_SESSION_ID)[0]?.status).toBe("exited"))
  await settle()
  expect(sut.sink.notices).toHaveLength(0)
  expect(sut.monitors.list(TEST_SESSION_ID)[0]).toMatchObject({ id, mode: "manual", lines: { pending: 2 } })
}

async function takePendingLines(): Promise<void> {
  const sut = makeMonitorSut()
  const { id } = startedMonitor(sut, manualRequest("echo one; echo two"))

  await vi.waitFor(() => expect(sut.monitors.list(TEST_SESSION_ID)[0]?.lines.pending).toBe(2))
  expect(sut.monitors.fetch({ sessionID: TEST_SESSION_ID, id, peek: false })).toEqual({
    kind: "fetched",
    monitors: [{ id, lines: ["one", "two"], dropped: 0 }],
  })
  expect(sut.monitors.fetch({ sessionID: TEST_SESSION_ID, id, peek: false })).toEqual({
    kind: "fetched",
    monitors: [{ id, lines: [], dropped: 0 }],
  })
}

async function peekWithoutTaking(): Promise<void> {
  const sut = makeMonitorSut()
  const { id } = startedMonitor(sut, manualRequest("echo one"))

  await vi.waitFor(() => expect(sut.monitors.list(TEST_SESSION_ID)[0]?.lines.pending).toBe(1))
  sut.monitors.fetch({ sessionID: TEST_SESSION_ID, id, peek: true })
  expect(sut.monitors.fetch({ sessionID: TEST_SESSION_ID, id, peek: true })).toMatchObject({
    monitors: [{ lines: ["one"] }],
  })
}

async function keepLastThousandLines(): Promise<void> {
  const sut = makeMonitorSut()
  const { id } = startedMonitor(sut, manualRequest("seq 1 1500"))

  await vi.waitFor(() => expect(sut.monitors.list(TEST_SESSION_ID)[0]?.status).toBe("exited"))
  const fetched = sut.monitors.fetch({ sessionID: TEST_SESSION_ID, id, peek: false })
  expect(fetched).toMatchObject({ monitors: [{ dropped: 500 }] })
  expect(fetched.kind === "fetched" && fetched.monitors[0]?.lines).toHaveLength(1000)
  expect(fetched.kind === "fetched" && fetched.monitors[0]?.lines[0]).toBe("501")
  expect(sut.monitors.list(TEST_SESSION_ID)[0]?.lines).toMatchObject({ pending: 0, dropped: 500 })
}

async function fetchEveryMonitorWithLines(): Promise<void> {
  const sut = makeMonitorSut()
  const withLines = startedMonitor(sut, manualRequest("echo one"))

  startedMonitor(sut, manualRequest(LONG_RUNNING_GROUP))
  await vi.waitFor(() => expect(sut.monitors.list(TEST_SESSION_ID)[1]?.lines.pending).toBe(1))
  expect(sut.monitors.fetch({ sessionID: TEST_SESSION_ID, peek: false })).toEqual({
    kind: "fetched",
    monitors: [{ id: withLines.id, lines: ["one"], dropped: 0 }],
  })
  sut.monitors.stopAll()
}

function rejectUnknownMonitor(): void {
  const sut = makeMonitorSut()

  expect(sut.monitors.fetch({ sessionID: TEST_SESSION_ID, id: "m_00000000", peek: false })).toEqual({
    kind: "not_found",
    id: "m_00000000",
  })
}

function rejectOtherSessionMonitor(): void {
  const sut = makeMonitorSut()
  const { id } = startedMonitor(sut, manualRequest(LONG_RUNNING_GROUP))

  expect(sut.monitors.fetch({ sessionID: OTHER_SESSION_ID, id, peek: false })).toEqual({ kind: "not_found", id })
  sut.monitors.stopAll()
}

async function leaveNothingPendingAfterDelivery(): Promise<void> {
  const sut = makeMonitorSut()
  const { id } = startedMonitor(sut, monitorRequest("echo one"))

  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  expect(sut.monitors.fetch({ sessionID: TEST_SESSION_ID, id, peek: false })).toMatchObject({
    monitors: [{ lines: [] }],
  })
}

function registerTests(): void {
  test("modo manual não envia aviso, nem o final", sendNothingInManualMode)
  test("fetch devolve e consome as linhas pendentes", takePendingLines)
  test("fetch com peek lê sem consumir", peekWithoutTaking)
  test("guarda as 1000 linhas mais recentes e conta as descartadas", keepLastThousandLines)
  test("fetch sem id devolve só os monitores com linhas pendentes", fetchEveryMonitorWithLines)
  test("fetch recusa id desconhecido", rejectUnknownMonitor)
  test("fetch recusa monitor de outra sessão", rejectOtherSessionMonitor)
  test("nos modos com aviso, nada fica pendente depois da entrega", leaveNothingPendingAfterDelivery)
}

describe("modo manual e leitura das linhas", registerTests)
