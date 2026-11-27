import { describe, expect, test, vi } from "vitest"
import { createMonitors } from "#monitor/modules/monitor/public"
import {
  DELIVERY_REJECTION,
  LONG_RUNNING_GROUP,
  OTHER_SESSION_ID,
  STDERR_ROOT_PREFIX,
  TEST_SESSION_ID,
} from "./constants"
import { FlakyNoticeSink, RecordingLogger, SequentialNoticeIds } from "./doubles"
import { makeMonitorSut, monitorRequest, startedMonitor, startedPid, temporaryDirectory, testSettings } from "./support"

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

  startedMonitor(sut, { ...monitorRequest(`echo skip; echo ERROR one; ${LONG_RUNNING_GROUP}`), pattern: /ERROR/ })
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  await vi.waitFor(() =>
    expect(sut.monitors.list(TEST_SESSION_ID)[0]?.lines).toEqual({
      received: 2,
      delivered: 1,
      pending: 0,
      dropped: 0,
      last: "ERROR one",
    }),
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

async function recoverAfterTransientFailure(): Promise<void> {
  const sink = new FlakyNoticeSink(1)
  const monitors = createMonitors(
    sink,
    new SequentialNoticeIds().create,
    testSettings(temporaryDirectory(STDERR_ROOT_PREFIX), new RecordingLogger()),
  )

  monitors.start(monitorRequest("echo ready"))
  await vi.waitFor(() => expect(sink.delivered).toHaveLength(2), { timeout: 3000 })
  expect(sink.delivered.map((notice) => notice.id)).toEqual(["msg_test_1", "msg_test_2"])
  expect(sink.attempts[0]?.id).toBe("msg_test_1")
  expect(monitors.list(TEST_SESSION_ID)[0]).toMatchObject({ delivery: { kind: "healthy" }, lines: { delivered: 1 } })
}

function registerTests(): void {
  test("lista o monitor ativo com entrega saudável", listRunningMonitor)
  test("não lista monitores de outra sessão", hideOtherSessions)
  test("registra no monitor a falha de entrega do aviso", recordDeliveryFailure)
  test("conta linhas recebidas e entregues e guarda a última", countLines)
  test("reenvia o aviso após falha temporária e volta a ficar saudável", recoverAfterTransientFailure)
  test("mantém na lista o monitor terminado, com status exited", keepFinishedMonitor)
}

describe("lista de monitores", registerTests)
