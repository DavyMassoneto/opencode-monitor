import { existsSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, test } from "vitest"
import { compose } from "#monitor/composition"
import { MonitorHostDouble, PERMISSION_DENIED_TEXT, settle, startToolPid } from "../fixtures"

function canaryFile(): string {
  const file = join(mkdtempSync(join(tmpdir(), "monitor-canary-")), "target")

  writeFileSync(file, "keep")
  return file
}

async function denyHiddenSubcommand(): Promise<void> {
  const host = new MonitorHostDouble()
  const target = canaryFile()

  host.deniedResources.push(/^rm /)
  await compose(host)
  await expect(startToolPid(host, `echo ok; rm ${target}`)).rejects.toThrow(PERMISSION_DENIED_TEXT)
  await settle()
  expect(existsSync(target)).toBe(true)
}

async function denySubstitutedCommand(): Promise<void> {
  const host = new MonitorHostDouble()
  const target = canaryFile()

  host.deniedResources.push(/^rm /)
  await compose(host)
  await expect(startToolPid(host, `echo "$(rm ${target})"`)).rejects.toThrow(PERMISSION_DENIED_TEXT)
  await settle()
  expect(existsSync(target)).toBe(true)
}

async function checkEverySubcommand(): Promise<void> {
  const host = new MonitorHostDouble()
  const cleanup = await compose(host)

  await startToolPid(host, "tail -f app.log | grep --line-buffered ERROR")
  expect(host.permissionRequests).toEqual([
    expect.objectContaining({
      action: "shell",
      resources: ["tail -f app.log", "grep --line-buffered ERROR"],
      save: ["tail -f app.log", "grep --line-buffered ERROR"],
    }),
  ])
  cleanup()
}

async function askAnyDirectoryForOpaqueCommand(): Promise<void> {
  const host = new MonitorHostDouble()
  const cleanup = await compose(host)

  await startToolPid(host, "eval echo ok")
  expect(host.permissionRequests).toEqual([
    expect.objectContaining({ action: "shell", resources: ["eval echo ok"], save: [] }),
    expect.objectContaining({ action: "external_directory", resources: ["*"], save: [] }),
  ])
  cleanup()
}

async function denyOpaqueCommandWithMatchingRule(): Promise<void> {
  const host = new MonitorHostDouble()

  host.deniedResources.push(/^\*$/)
  await compose(host)
  await expect(startToolPid(host, "bash -c 'echo ok'")).rejects.toThrow(PERMISSION_DENIED_TEXT)
}

function registerTests(): void {
  test("recusa comando composto com subcomando negado, sem executar nada", denyHiddenSubcommand)
  test("recusa subcomando negado dentro de $( )", denySubstitutedCommand)
  test("pede permissão para cada subcomando", checkEverySubcommand)
  test("comando não analisável pede o comando inteiro e qualquer diretório", askAnyDirectoryForOpaqueCommand)
  test("comando não analisável é recusado quando qualquer diretório é negado", denyOpaqueCommandWithMatchingRule)
}

describe("permissão de shell do monitor_start", registerTests)
