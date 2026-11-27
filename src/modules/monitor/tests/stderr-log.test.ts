import { existsSync, mkdirSync, readFileSync, statSync, utimesSync } from "node:fs"
import { dirname, join } from "node:path"
import { describe, expect, test, vi } from "vitest"
import { createMonitors } from "#monitor/modules/monitor/public"
import { OTHER_SESSION_ID, STDERR_ROOT_PREFIX, TEST_ENV_NAME, TEST_LABEL, TEST_SESSION_ID } from "./constants"
import { RecordingLogger, RecordingNoticeSink, SequentialNoticeIds } from "./doubles"
import {
  makeMonitorSut,
  monitorRequest,
  settle,
  singleVariable,
  startedMonitor,
  temporaryDirectory,
  testSettings,
} from "./support"

async function writeCleanedStderr(): Promise<void> {
  const sut = makeMonitorSut()
  const { stderrPath } = startedMonitor(
    sut,
    monitorRequest("printf '\\033[31mfail\\033[0m ghp_abcdefghijklmnopqrstuvwxyz0123\\n' >&2"),
  )

  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  await settle()
  expect(stderrPath).toBe(
    join(sut.stderrRoot, TEST_SESSION_ID, `${sut.monitors.list(TEST_SESSION_ID)[0]?.id}.stderr.log`),
  )
  expect(readFileSync(stderrPath, "utf8")).toBe("fail [redacted]\n")
}

async function captureStderrAsEvents(): Promise<void> {
  const sut = makeMonitorSut()

  startedMonitor(sut, {
    ...monitorRequest("echo ERROR out; echo ERROR err >&2; echo skip >&2"),
    captureStderr: true,
    pattern: /^ERROR/,
  })
  await vi.waitFor(() => expect(sut.sink.notices.at(-1)?.text).toContain("command exited"))
  const lines = sut.sink.notices.flatMap((notice) => notice.text.split("\n"))
  expect(lines).toContain("ERROR out")
  expect(lines).toContain("stderr: ERROR err")
  expect(lines.join("\n")).not.toContain("skip")
}

async function fetchStderrTail(): Promise<void> {
  const sut = makeMonitorSut()
  const { id } = startedMonitor(sut, monitorRequest("seq 1 5 >&2"))

  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  await settle()
  expect(sut.monitors.fetch({ sessionID: TEST_SESSION_ID, id, peek: false, stderrLines: 2 })).toEqual({
    kind: "fetched",
    monitors: [{ id, lines: [], dropped: 0, stderr: ["4", "5"] }],
  })
}

async function rotateLargeStderr(): Promise<void> {
  const sut = makeMonitorSut()
  const { stderrPath } = startedMonitor(sut, monitorRequest("head -c 6000000 /dev/zero | tr '\\0' x | fold -w 999 >&2"))

  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1), { timeout: 10_000 })
  await settle()
  expect(statSync(`${stderrPath}.1`).size).toBeLessThanOrEqual(5_242_880)
  expect(statSync(stderrPath).size).toBeLessThan(5_242_880)
  expect(statSync(`${stderrPath}.1`).size + statSync(stderrPath).size).toBe(6_006_007)
}

async function removeDeletedSessionFiles(): Promise<void> {
  const sut = makeMonitorSut()
  const own = startedMonitor(sut, monitorRequest("echo own >&2"))
  const other = startedMonitor(sut, { ...monitorRequest("echo other >&2"), sessionID: OTHER_SESSION_ID })

  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  sut.monitors.stopSession(TEST_SESSION_ID)
  expect(existsSync(dirname(own.stderrPath))).toBe(false)
  expect(existsSync(other.stderrPath)).toBe(true)
}

async function removeAllFilesOnStopAll(): Promise<void> {
  const sut = makeMonitorSut()
  const own = startedMonitor(sut, monitorRequest("echo own >&2"))
  const other = startedMonitor(sut, { ...monitorRequest("echo other >&2"), sessionID: OTHER_SESSION_ID })

  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  sut.monitors.stopAll()
  expect(existsSync(dirname(own.stderrPath))).toBe(false)
  expect(existsSync(dirname(other.stderrPath))).toBe(false)
}

function pruneExpiredSessions(): void {
  const root = temporaryDirectory(STDERR_ROOT_PREFIX)
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)

  for (const name of ["ses_old", "ses_recent", "notes"]) {
    mkdirSync(join(root, name))
  }
  utimesSync(join(root, "ses_old"), eightDaysAgo, eightDaysAgo)
  utimesSync(join(root, "notes"), eightDaysAgo, eightDaysAgo)
  createMonitors(new RecordingNoticeSink(), new SequentialNoticeIds().create, testSettings(root, new RecordingLogger()))
  expect(existsSync(join(root, "ses_old"))).toBe(false)
  expect(existsSync(join(root, "ses_recent"))).toBe(true)
  expect(existsSync(join(root, "notes"))).toBe(true)
}

function rejectUnsafeSessionId(): void {
  const sut = makeMonitorSut()

  expect(sut.monitors.start({ ...monitorRequest("true"), sessionID: "../escape" })).toEqual({
    kind: "failed",
    reason: "the session id cannot be used as a directory name",
  })
  expect(existsSync(join(sut.stderrRoot, "..", "escape"))).toBe(false)
}

async function passEnvironment(): Promise<void> {
  const sut = makeMonitorSut()

  startedMonitor(sut, {
    ...monitorRequest(`echo $${TEST_ENV_NAME}`),
    environment: singleVariable(TEST_ENV_NAME, "from env"),
  })
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  expect(sut.sink.notices[0]).toMatchObject({ label: TEST_LABEL, text: expect.stringContaining("\nfrom env\n") })
}

function registerTests(): void {
  test("grava o stderr limpo e sem segredos no arquivo do monitor", writeCleanedStderr)
  test("capture_stderr transforma o stderr em eventos com prefixo e aplica o padrão", captureStderrAsEvents)
  test("fetch com stderrLines devolve as últimas linhas do stderr", fetchStderrTail)
  test("rotaciona o stderr acima de 5 MB e mantém um arquivo anterior", rotateLargeStderr, 15_000)
  test("remove os arquivos da sessão apagada e mantém os das outras", removeDeletedSessionFiles)
  test("remove todos os arquivos criados quando o plugin é descarregado", removeAllFilesOnStopAll)
  test("apaga sessões com mais de 7 dias e preserva o resto", pruneExpiredSessions)
  test("recusa session id que não serve como nome de pasta", rejectUnsafeSessionId)
  test("passa as variáveis de ambiente ao comando", passEnvironment)
}

describe("stderr e ambiente do monitor", registerTests)
