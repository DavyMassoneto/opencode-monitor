import {
  createMonitors,
  MONITOR_STARTED_KIND,
  type MonitorRequest,
  type MonitorStarted,
} from "#monitor/modules/monitor/public"
import { PROBE_SIGNAL, SETTLE_MS, TEST_DESCRIPTION, TEST_SESSION_ID } from "./constants"
import { RecordingNoticeSink, SequentialNoticeIds } from "./doubles"
import { type MonitorTestSut } from "./types"

export function makeMonitorSut(): MonitorTestSut {
  const sink = new RecordingNoticeSink()

  return { monitors: createMonitors(sink, new SequentialNoticeIds().create), sink }
}

export function monitorRequest(command: string): MonitorRequest {
  return { sessionID: TEST_SESSION_ID, command, description: TEST_DESCRIPTION, directory: process.cwd() }
}

export function startedMonitor(sut: MonitorTestSut, request: MonitorRequest): MonitorStarted {
  const started = sut.monitors.start(request)

  if (started.kind !== MONITOR_STARTED_KIND) {
    throw new Error(`monitor did not start: ${started.reason}`)
  }
  return started
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
