import { expect, vi } from "vitest"
import {
  createMonitors,
  MONITOR_STARTED_KIND,
  type MonitorRequest,
  type MonitorSummary,
} from "#monitor/modules/monitor/public"
import {
  GROUP_EXIT_TIMEOUT_MS,
  PROBE_SIGNAL,
  SETTLE_MS,
  TEST_DESCRIPTION,
  TEST_SESSION_ID,
  TEST_TIMEOUT_MS,
} from "./constants"
import { RecordingNoticeSink, SequentialNoticeIds } from "./doubles"
import { type MonitorTestSut } from "./types"

export function makeMonitorSut(): MonitorTestSut {
  const sink = new RecordingNoticeSink()

  return { monitors: createMonitors(sink, new SequentialNoticeIds().create), sink }
}

export function monitorRequest(command: string): MonitorRequest {
  return {
    sessionID: TEST_SESSION_ID,
    command,
    description: TEST_DESCRIPTION,
    directory: process.cwd(),
    lifetime: { kind: "timed", timeoutMs: TEST_TIMEOUT_MS },
  }
}

export function startedMonitor(sut: MonitorTestSut, request: MonitorRequest): MonitorSummary {
  const started = sut.monitors.start(request)

  if (started.kind !== MONITOR_STARTED_KIND) {
    throw new Error(`monitor did not start: ${started.reason}`)
  }
  return started.summary
}

export function startedPid(sut: MonitorTestSut, command: string): number {
  return startedMonitor(sut, monitorRequest(command)).pid
}

export function isGroupAlive(pid: number): boolean {
  try {
    process.kill(-pid, PROBE_SIGNAL)
    return true
  } catch {
    return false
  }
}

export async function settle(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, SETTLE_MS))
}

export function persistentRequest(command: string): MonitorRequest {
  return { ...monitorRequest(command), lifetime: { kind: "persistent" } }
}

export function timedRequest(command: string, timeoutMs: number): MonitorRequest {
  return { ...monitorRequest(command), lifetime: { kind: "timed", timeoutMs } }
}

export async function waitForGroupExit(pid: number): Promise<void> {
  await vi.waitFor(() => expect(isGroupAlive(pid)).toBe(false), { timeout: GROUP_EXIT_TIMEOUT_MS })
}
