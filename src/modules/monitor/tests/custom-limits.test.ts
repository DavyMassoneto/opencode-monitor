import { describe, expect, test, vi } from "vitest"
import { createMonitors, type MonitorLimits } from "#monitor/modules/monitor/public"
import { LONG_RUNNING_GROUP, STDERR_ROOT_PREFIX, TEST_LIMITS, TEST_SESSION_ID } from "./constants"
import { RecordingLogger, RecordingNoticeSink, SequentialNoticeIds } from "./doubles"
import { manualRequest, monitorRequest, startedMonitor, temporaryDirectory } from "./support"
import { type MonitorTestSut } from "./types"

function sutWith(overrides: Partial<MonitorLimits>): MonitorTestSut {
  const sink = new RecordingNoticeSink()
  const logger = new RecordingLogger()
  const stderrRoot = temporaryDirectory(STDERR_ROOT_PREFIX)
  const limits = { ...TEST_LIMITS, ...overrides }
  const monitors = createMonitors(sink, new SequentialNoticeIds().create, { stderrRoot, limits, logger })

  return { monitors, sink, stderrRoot, pids: [], logger }
}

function applySessionLimit(): void {
  const sut = sutWith({ maxMonitorsPerSession: 2 })

  startedMonitor(sut, monitorRequest(LONG_RUNNING_GROUP))
  startedMonitor(sut, monitorRequest(LONG_RUNNING_GROUP))
  expect(sut.monitors.start(monitorRequest(LONG_RUNNING_GROUP))).toEqual({
    kind: "failed",
    reason: "this session already has 2 running monitors: stop one with monitor_stop before starting another",
  })
  sut.monitors.stopAll()
}

async function applyLineLimit(): Promise<void> {
  const sut = sutWith({ lineMaxBytes: 16 })

  startedMonitor(sut, monitorRequest("echo 0123456789abcdefghij"))
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  expect(sut.sink.notices[0]?.text).toContain("\n0123456789abc…\n")
}

async function applyBatchLimit(): Promise<void> {
  const sut = sutWith({ batchMaxLines: 3 })

  startedMonitor(sut, monitorRequest("seq 1 5"))
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  expect(sut.sink.notices[0]?.text).toContain("\n… 2 earlier lines omitted\n3\n4\n5\n")
}

async function applyPendingLimit(): Promise<void> {
  const sut = sutWith({ pendingMaxLines: 4 })
  const { id } = startedMonitor(sut, manualRequest("seq 1 10"))

  await vi.waitFor(() => expect(sut.monitors.list(TEST_SESSION_ID)[0]?.status).toBe("exited"))
  expect(sut.monitors.fetch({ sessionID: TEST_SESSION_ID, id, peek: false, stderrLines: 0 })).toMatchObject({
    monitors: [{ lines: ["7", "8", "9", "10"], dropped: 6 }],
  })
}

async function applyFloodLimit(): Promise<void> {
  const sut = sutWith({ floodLinesPerSecond: 10, floodSeconds: 2 })

  startedMonitor(sut, monitorRequest("yes flood"))
  await vi.waitFor(() => expect(sut.sink.notices.at(-1)?.label).toContain("(flooded)"), { timeout: 5000 })
  expect(sut.sink.notices.at(-1)?.text).toContain("more than 10 lines per second for 2 seconds")
}

async function logLifecycle(): Promise<void> {
  const sut = sutWith({})
  const { id } = startedMonitor(sut, monitorRequest("true"))

  await vi.waitFor(() => expect(sut.logger.messages).toEqual([`${id} started: true`, `${id} ended: exited`]))
}

function registerTests(): void {
  test("aplica o limite de monitores por sessão configurado", applySessionLimit)
  test("aplica o tamanho máximo de linha configurado", applyLineLimit)
  test("aplica o limite de linhas por aviso configurado", applyBatchLimit)
  test("aplica o limite de linhas pendentes configurado", applyPendingLimit)
  test("aplica o limite de inundação configurado e o descreve no aviso", applyFloodLimit, 10_000)
  test("registra início e fim do monitor no log de depuração", logLifecycle)
}

describe("limites configurados", registerTests)
