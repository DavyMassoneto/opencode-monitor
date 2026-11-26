import { realpathSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Schema } from "effect"
import { describe, expect, test, vi } from "vitest"
import { MONITOR_FETCH_INPUT, MONITOR_START_INPUT } from "#monitor/integration"
import {
  MonitorHostDouble,
  mountPlugin,
  PERMISSION_DENIED_TEXT,
  registeredTool,
  STARTED_SUMMARY,
  type StartedToolResult,
  type StartInput,
  settle,
  temporaryDirectory,
  toolCallContext,
} from "../fixtures"

async function startWith(host: MonitorHostDouble, input: StartInput): Promise<StartedToolResult> {
  const decoded = Schema.decodeUnknownSync(MONITOR_START_INPUT)({ description: "build log", ...input })
  const result = await registeredTool(host, "monitor_start").execute(decoded, toolCallContext(host))

  return Schema.decodeUnknownSync(STARTED_SUMMARY)(result.content)
}

async function runInRelativeDirectory(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)

  await startWith(host, { command: "pwd", cwd: "src" })
  await vi.waitFor(() => expect(host.messages).toHaveLength(2))
  expect(host.messages[0]?.text).toContain(`\n${realpathSync("src")}\n`)
  expect(host.permissionRequests.map((request) => request.action)).toEqual(["shell"])
}

async function askForExternalDirectory(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)
  const outside = temporaryDirectory("monitor-outside-")

  await startWith(host, { command: "pwd", cwd: outside })
  expect(host.permissionRequests[0]).toMatchObject({
    action: "external_directory",
    resources: [join(outside, "*")],
    save: [join(outside, "*")],
  })
  await vi.waitFor(() => expect(host.messages[0]?.text).toContain(`\n${outside}\n`))
}

async function refuseDeniedExternalDirectory(): Promise<void> {
  const host = new MonitorHostDouble()
  const outside = temporaryDirectory("monitor-outside-")

  host.deniedResources.push(/\/\*$/)
  await mountPlugin(host)
  await expect(startWith(host, { command: "echo ran", cwd: outside })).rejects.toThrow(PERMISSION_DENIED_TEXT)
  await settle()
  expect(host.messages).toHaveLength(0)
}

async function refuseMissingDirectory(): Promise<void> {
  const host = new MonitorHostDouble()

  await mountPlugin(host)
  await expect(startWith(host, { command: "true", cwd: "does-not-exist" })).rejects.toThrow(
    "the working directory does not exist or is not a directory",
  )
  expect(host.permissionRequests).toHaveLength(0)
}

async function passEnvironment(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)

  await startWith(host, { command: "echo $DEPLOY_TARGET", env: { DEPLOY_TARGET: "staging" } })
  await vi.waitFor(() => expect(host.messages).toHaveLength(2))
  expect(host.messages[0]?.text).toContain("\nstaging\n")
}

function rejectInvalidEnvironment(): void {
  const decode = Schema.decodeUnknownSync(MONITOR_START_INPUT)

  expect(() => decode({ command: "true", description: "x", env: { "BAD-NAME": "1" } })).toThrow()
  expect(() => decode({ command: "true", description: "x", env: { GOOD: 1 } })).toThrow()
}

async function reportStderrPath(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)
  const summary = await startWith(host, { command: "true" })

  expect(summary.stderrPath).toBe(join(tmpdir(), "opencode-monitor", host.sessionID, `${summary.id}.stderr.log`))
}

async function captureStderrThroughTool(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)

  await startWith(host, { command: "echo broken >&2", capture_stderr: true })
  await vi.waitFor(() => expect(host.messages).toHaveLength(2))
  expect(host.messages[0]?.text).toContain("\nstderr: broken\n")
}

async function fetchStderrThroughTool(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)
  const { id } = await startWith(host, { command: "seq 1 3 >&2" })

  await vi.waitFor(() => expect(host.messages).toHaveLength(1))
  await settle()
  const result = await registeredTool(host, "monitor_fetch").execute({ id, stderr_lines: 2 }, toolCallContext(host))
  expect(JSON.parse(String(result.content))).toEqual([{ id, lines: [], dropped: 0, stderr: ["2", "3"] }])
}

function rejectInvalidStderrLines(): void {
  const decode = Schema.decodeUnknownSync(MONITOR_FETCH_INPUT)

  for (const count of [0, 1001, 2.5, "10"]) {
    expect(() => decode({ stderr_lines: count })).toThrow()
  }
}

function registerTests(): void {
  test("roda em cwd relativo ao diretório da sessão sem pedir diretório externo", runInRelativeDirectory)
  test("pede external_directory para cwd fora do projeto", askForExternalDirectory)
  test("não executa quando o diretório externo é negado", refuseDeniedExternalDirectory)
  test("recusa cwd inexistente antes de pedir permissão", refuseMissingDirectory)
  test("passa env ao comando", passEnvironment)
  test("recusa env com nome inválido ou valor que não é texto", rejectInvalidEnvironment)
  test("informa o caminho do arquivo de stderr", reportStderrPath)
  test("capture_stderr pela ferramenta avisa as linhas de stderr", captureStderrThroughTool)
  test("monitor_fetch com stderr_lines devolve o fim do stderr", fetchStderrThroughTool)
  test("recusa stderr_lines fora de 1 a 1000", rejectInvalidStderrLines)
}

describe("diretório, ambiente e stderr na ferramenta", registerTests)
