import { describe, expect, test, vi } from "vitest"
import { DELIVERY_REJECTION, LONG_RUNNING_GROUP, OTHER_SESSION_ID, TEST_SESSION_ID } from "./constants"
import { makeMonitorSut, monitorRequest, startedPid } from "./support"

function listRunningMonitor(): void {
  const sut = makeMonitorSut()
  const pid = startedPid(sut, LONG_RUNNING_GROUP)

  expect(sut.monitors.list(TEST_SESSION_ID)).toEqual([
    expect.objectContaining({ command: LONG_RUNNING_GROUP, pid, delivery: { kind: "healthy" } }),
  ])
  sut.monitors.stopAll()
}

function hideOtherSessions(): void {
  const sut = makeMonitorSut()

  startedPid(sut, LONG_RUNNING_GROUP)
  expect(sut.monitors.list(OTHER_SESSION_ID)).toEqual([])
  sut.monitors.stopAll()
}

async function recordDeliveryFailure(): Promise<void> {
  const sut = makeMonitorSut()

  sut.sink.rejection = DELIVERY_REJECTION
  startedPid(sut, `echo ready; ${LONG_RUNNING_GROUP}`)
  await vi.waitFor(() =>
    expect(sut.monitors.list(TEST_SESSION_ID)[0]?.delivery).toEqual({
      kind: "failed",
      noticeId: "msg_test_1",
      reason: DELIVERY_REJECTION,
    }),
  )
  sut.monitors.stopAll()
}

async function countLines(): Promise<void> {
  const sut = makeMonitorSut()

  sut.monitors.start({ ...monitorRequest(`echo skip; echo ERROR one; ${LONG_RUNNING_GROUP}`), pattern: /ERROR/ })
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  await vi.waitFor(() =>
    expect(sut.monitors.list(TEST_SESSION_ID)[0]?.lines).toEqual({ received: 2, delivered: 1, last: "ERROR one" }),
  )
  sut.monitors.stopAll()
}

async function keepFinishedMonitor(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "true")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  expect(sut.monitors.list(TEST_SESSION_ID)).toEqual([
    expect.objectContaining({ status: "exited", endedAt: expect.any(String) }),
  ])
}

function registerTests(): void {
  test("lista o monitor ativo com entrega saudável", listRunningMonitor)
  test("não lista monitores de outra sessão", hideOtherSessions)
  test("registra no monitor a falha de entrega do aviso", recordDeliveryFailure)
  test("conta linhas recebidas e entregues e guarda a última", countLines)
  test("mantém na lista o monitor terminado, com status exited", keepFinishedMonitor)
}

describe("lista de monitores", registerTests)
