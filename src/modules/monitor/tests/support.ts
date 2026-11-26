import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { expect, onTestFinished, vi } from "vitest"
import {
  createMonitors,
  type EnvironmentVariables,
  MONITOR_STARTED_KIND,
  type MonitorRequest,
  type MonitorSummary,
} from "#monitor/modules/monitor/public"
import {
  GROUP_EXIT_TIMEOUT_MS,
  PROBE_SIGNAL,
  SETTLE_MS,
  STDERR_ROOT_PREFIX,
  TEST_DESCRIPTION,
  TEST_SESSION_ID,
  TEST_TIMEOUT_MS,
} from "./constants"
import { RecordingNoticeSink, SequentialNoticeIds } from "./doubles"
import { type MonitorTestSut } from "./types"

export function makeMonitorSut(): MonitorTestSut {
  const sink = new RecordingNoticeSink()
  const stderrRoot = mkdtempSync(join(tmpdir(), STDERR_ROOT_PREFIX))
  const monitors = createMonitors(sink, new SequentialNoticeIds().create, stderrRoot)
  const pids: number[] = []

  onTestFinished(async () => {
    monitors.stopAll()
    await Promise.all(pids.map(waitForGroupExit))
    rmSync(stderrRoot, { recursive: true, force: true })
  })
  return { monitors, sink, stderrRoot, pids }
}

export function monitorRequest(command: string): MonitorRequest {
  return {
    sessionID: TEST_SESSION_ID,
    command,
    description: TEST_DESCRIPTION,
    directory: process.cwd(),
    lifetime: { kind: "timed", timeoutMs: TEST_TIMEOUT_MS },
    mode: "wake",
    environment: new Map<string, string>(),
    captureStderr: false,
  }
}

export function startedMonitor(sut: MonitorTestSut, request: MonitorRequest): MonitorSummary {
  const started = sut.monitors.start(request)

  if (started.kind !== MONITOR_STARTED_KIND) {
    throw new Error(`monitor did not start: ${started.reason}`)
  }
  sut.pids.push(started.summary.pid)
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

export function manualRequest(command: string): MonitorRequest {
  return { ...monitorRequest(command), mode: "manual" }
}

export function singleVariable(name: string, value: string): EnvironmentVariables {
  return new Map<string, string>().set(name, value)
}

export function temporaryDirectory(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix))

  onTestFinished(() => rmSync(directory, { recursive: true, force: true }))
  return directory
}
