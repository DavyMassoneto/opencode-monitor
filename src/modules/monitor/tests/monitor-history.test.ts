import { describe, expect, test, vi } from "vitest"
import { HISTORY_LIMIT, LONG_RUNNING_GROUP, OTHER_SESSION_ID, TEST_SESSION_ID } from "./constants"
import { makeMonitorSut, monitorRequest, startedMonitor } from "./support"

async function keepLastTwentyFinished(): Promise<void> {
  const sut = makeMonitorSut()
  const ids: string[] = []

  for (let index = 1; index <= HISTORY_LIMIT + 1; index += 1) {
    ids.push(startedMonitor(sut, monitorRequest("true")).id)
    await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(index))
  }
  const listed = sut.monitors.list(TEST_SESSION_ID).map((summary) => summary.id)
  expect(listed).toEqual(ids.slice(1))
}

async function listRunningBeforeFinished(): Promise<void> {
  const sut = makeMonitorSut()
  const finished = startedMonitor(sut, monitorRequest("true"))

  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  const running = startedMonitor(sut, monitorRequest(LONG_RUNNING_GROUP))
  expect(sut.monitors.list(TEST_SESSION_ID).map((summary) => summary.id)).toEqual([running.id, finished.id])
  sut.monitors.stopAll()
}

async function forgetDeletedSessionHistory(): Promise<void> {
  const sut = makeMonitorSut()

  startedMonitor(sut, monitorRequest("true"))
  startedMonitor(sut, { ...monitorRequest("true"), sessionID: OTHER_SESSION_ID })
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  sut.monitors.stopSession(TEST_SESSION_ID)
  expect(sut.monitors.list(TEST_SESSION_ID)).toEqual([])
  expect(sut.monitors.list(OTHER_SESSION_ID)).toHaveLength(1)
}

function rejectStoppingFinished(): void {
  const sut = makeMonitorSut()
  const { id } = startedMonitor(sut, monitorRequest(LONG_RUNNING_GROUP))

  sut.monitors.stop(TEST_SESSION_ID, id)
  expect(sut.monitors.stop(TEST_SESSION_ID, id)).toEqual({ kind: "not_found", id })
}

function registerTests(): void {
  test("guarda os 20 últimos monitores finalizados da sessão", keepLastTwentyFinished)
  test("lista os ativos antes dos finalizados", listRunningBeforeFinished)
  test("esquece o histórico da sessão apagada", forgetDeletedSessionHistory)
  test("recusa parar de novo um monitor já finalizado", rejectStoppingFinished)
}

describe("histórico de monitores", registerTests)
