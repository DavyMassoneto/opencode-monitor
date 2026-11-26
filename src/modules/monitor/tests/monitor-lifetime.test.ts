import { describe, expect, test, vi } from "vitest"
import { LONG_RUNNING_GROUP, SHORT_TIMEOUT_MS, TEST_LABEL, TEST_SESSION_ID } from "./constants"
import {
  isGroupAlive,
  makeMonitorSut,
  persistentRequest,
  settle,
  startedMonitor,
  timedRequest,
  waitForGroupExit,
} from "./support"

async function expireTimedMonitor(): Promise<void> {
  const sut = makeMonitorSut()
  const { pid } = startedMonitor(sut, timedRequest(LONG_RUNNING_GROUP, SHORT_TIMEOUT_MS))

  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  expect(sut.sink.notices[0]?.label).toBe(`${TEST_LABEL} (expired)`)
  expect(sut.sink.notices[0]?.text).toContain("monitor expired after 300 ms")
  expect(sut.sink.notices[0]?.text).toContain("start it again with monitor_start")
  await waitForGroupExit(pid)
}

async function listExpiredMonitor(): Promise<void> {
  const sut = makeMonitorSut()
  const { id } = startedMonitor(sut, timedRequest(LONG_RUNNING_GROUP, SHORT_TIMEOUT_MS))

  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  expect(sut.monitors.list(TEST_SESSION_ID)).toEqual([expect.objectContaining({ id, status: "expired" })])
}

function reportExpiry(): void {
  const sut = makeMonitorSut()
  const summary = startedMonitor(sut, timedRequest(LONG_RUNNING_GROUP, 60_000))

  expect(Date.parse(String(summary.expiresAt)) - Date.parse(summary.startedAt)).toBe(60_000)
  sut.monitors.stopAll()
}

async function keepPersistentMonitor(): Promise<void> {
  const sut = makeMonitorSut()
  const summary = startedMonitor(sut, persistentRequest(LONG_RUNNING_GROUP))

  expect(summary).not.toHaveProperty("expiresAt")
  await settle()
  await settle()
  expect(isGroupAlive(summary.pid)).toBe(true)
  expect(sut.sink.notices).toHaveLength(0)
  sut.monitors.stopAll()
}

async function exitBeforeDeadline(): Promise<void> {
  const sut = makeMonitorSut()

  startedMonitor(sut, timedRequest("true", SHORT_TIMEOUT_MS))
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  await settle()
  await settle()
  expect(sut.sink.notices).toHaveLength(1)
  expect(sut.sink.notices[0]?.label).toBe(`${TEST_LABEL} (ended)`)
}

function registerTests(): void {
  test("encerra o monitor no prazo e avisa que pode ser rearmado", expireTimedMonitor)
  test("lista o monitor vencido como expired", listExpiredMonitor)
  test("informa quando o monitor vence", reportExpiry)
  test("monitor persistente não vence nem tem prazo", keepPersistentMonitor)
  test("comando que termina antes do prazo não gera aviso de expirado", exitBeforeDeadline)
}

describe("duração do monitor", registerTests)
