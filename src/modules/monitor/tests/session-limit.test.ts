import { describe, expect, test } from "vitest"
import { LONG_RUNNING_GROUP, OTHER_SESSION_ID, SESSION_LIMIT } from "./constants"
import { makeMonitorSut, monitorRequest, startedMonitor } from "./support"
import { type MonitorTestSut } from "./types"

function fillSession(sut: MonitorTestSut): string[] {
  return Array.from({ length: SESSION_LIMIT }, () => startedMonitor(sut, monitorRequest(LONG_RUNNING_GROUP)).id)
}

function rejectEleventhMonitor(): void {
  const sut = makeMonitorSut()

  fillSession(sut)
  expect(sut.monitors.start(monitorRequest(LONG_RUNNING_GROUP))).toEqual({
    kind: "failed",
    reason: expect.stringContaining("already has 10 running monitors"),
  })
  sut.monitors.stopAll()
}

function acceptOtherSessionAtLimit(): void {
  const sut = makeMonitorSut()

  fillSession(sut)
  expect(startedMonitor(sut, { ...monitorRequest(LONG_RUNNING_GROUP), sessionID: OTHER_SESSION_ID })).toMatchObject({
    status: "running",
  })
  sut.monitors.stopAll()
}

function acceptAfterStop(): void {
  const sut = makeMonitorSut()
  const [first] = fillSession(sut)

  sut.monitors.stop(monitorRequest(LONG_RUNNING_GROUP).sessionID, String(first))
  expect(startedMonitor(sut, monitorRequest(LONG_RUNNING_GROUP))).toMatchObject({ status: "running" })
  sut.monitors.stopAll()
}

function registerTests(): void {
  test("recusa o 11º monitor ativo da sessão", rejectEleventhMonitor)
  test("o limite de uma sessão não afeta outra", acceptOtherSessionAtLimit)
  test("libera vaga quando um monitor é parado", acceptAfterStop)
}

describe("limite de monitores por sessão", registerTests)
