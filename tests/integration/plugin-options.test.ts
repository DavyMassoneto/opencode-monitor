import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "vitest"
import { compose } from "#monitor/composition"
import { type EnvironmentValue, resolveSettings } from "#monitor/integration"
import { MonitorHostDouble, temporaryDirectory } from "../fixtures"

function noEnvironment(): EnvironmentValue {
  return process.env.MONITOR_TEST_UNSET_VARIABLE
}

function useSpecDefaults(): void {
  expect(resolveSettings({}, noEnvironment, "/tmp/root").limits).toEqual({
    maxMonitorsPerSession: 10,
    lineMaxBytes: 4096,
    batchMaxLines: 50,
    pendingMaxLines: 1000,
    floodLinesPerSecond: 100,
    floodSeconds: 5,
    stderrMaxBytes: 5_242_880,
    retentionMs: 604_800_000,
  })
}

function applyOverrides(): void {
  const { limits } = resolveSettings({ maxMonitorsPerSession: 3, retentionDays: 2 }, noEnvironment, "/tmp/root")

  expect(limits).toMatchObject({ maxMonitorsPerSession: 3, retentionMs: 172_800_000, batchMaxLines: 50 })
}

function rejectInvalidValues(): void {
  for (const options of [
    { maxMonitorsPerSession: 0 },
    { floodSeconds: -1 },
    { batchMaxLines: 1.5 },
    { lineMaxBytes: 8 },
    { debug: "yes" },
  ]) {
    expect(() => resolveSettings(options, noEnvironment, "/tmp/root")).toThrow()
  }
}

function rejectUnknownOption(): void {
  expect(() => resolveSettings({ maxMonitorPerSession: 3 }, noEnvironment, "/tmp/root")).toThrow("maxMonitorPerSession")
}

function keepDebugLogOffByDefault(): void {
  const root = temporaryDirectory("monitor-options-")

  resolveSettings({}, noEnvironment, root).logger.debug("hidden")
  expect(existsSync(join(root, "debug.log"))).toBe(false)
}

function writeDebugLogWhenEnabled(): void {
  const root = temporaryDirectory("monitor-options-")

  resolveSettings({ debug: true }, noEnvironment, root).logger.debug("m_1 started: true")
  expect(readFileSync(join(root, "debug.log"), "utf8")).toMatch(/^\d{4}-\d\d-\d\dT[\d:.]+Z m_1 started: true\n$/)
}

function enableDebugByEnvironment(): void {
  const root = temporaryDirectory("monitor-options-")

  resolveSettings({}, (name) => (name === "OPENCODE_MONITOR_DEBUG" ? "1" : noEnvironment()), root).logger.debug(
    "from env",
  )
  expect(readFileSync(join(root, "debug.log"), "utf8")).toContain("from env")
}

function rotateLargeDebugLog(): void {
  const root = temporaryDirectory("monitor-options-")

  writeFileSync(join(root, "debug.log"), "x".repeat(1_048_577))
  resolveSettings({ debug: true }, noEnvironment, root).logger.debug("after rotation")
  expect(readFileSync(join(root, "debug.log"), "utf8")).toContain("after rotation")
  expect(readFileSync(join(root, "debug.log.1"), "utf8")).toHaveLength(1_048_577)
}

function keepWorkingWhenDebugLogFails(): void {
  const root = temporaryDirectory("monitor-options-")
  const blocked = join(root, "not-a-directory")

  writeFileSync(blocked, "file")
  expect(() => resolveSettings({ debug: true }, noEnvironment, blocked).logger.debug("lost")).not.toThrow()
}

async function refuseToLoadWithInvalidOptions(): Promise<void> {
  const host = Object.assign(new MonitorHostDouble(), { options: { maxMonitorsPerSession: "ten" } })

  await expect(compose(host)).rejects.toThrow()
  expect(host.editor.tools).toHaveLength(0)
}

function registerTests(): void {
  test("usa os limites da especificação quando não há opções", useSpecDefaults)
  test("aplica as opções informadas e converte retentionDays", applyOverrides)
  test("recusa valores inválidos", rejectInvalidValues)
  test("recusa opção desconhecida, nomeando a chave", rejectUnknownOption)
  test("não escreve log de depuração por padrão", keepDebugLogOffByDefault)
  test("escreve o log de depuração quando debug está ligado", writeDebugLogWhenEnabled)
  test("liga o log de depuração pela variável OPENCODE_MONITOR_DEBUG", enableDebugByEnvironment)
  test("rotaciona o log de depuração acima de 1 MB", rotateLargeDebugLog)
  test("falha ao escrever o log de depuração não interrompe o monitor", keepWorkingWhenDebugLogFails)
  test("o plugin não carrega com opções inválidas", refuseToLoadWithInvalidOptions)
}

describe("opções do plugin", registerTests)
