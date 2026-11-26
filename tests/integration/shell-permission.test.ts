import { existsSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test } from "vitest"
import {
  MonitorHostDouble,
  mountPlugin,
  PERMISSION_DENIED_TEXT,
  settle,
  startToolPid,
  temporaryDirectory,
} from "../fixtures"

function canaryFile(): string {
  const file = join(temporaryDirectory("monitor-canary-"), "target")

  writeFileSync(file, "keep")
  return file
}

async function denyHiddenSubcommand(): Promise<void> {
  const host = new MonitorHostDouble()
  const target = canaryFile()

  host.deniedResources.push(/^rm /)
  await mountPlugin(host)
  await expect(startToolPid(host, `echo ok; rm ${target}`)).rejects.toThrow(PERMISSION_DENIED_TEXT)
  await settle()
  expect(existsSync(target)).toBe(true)
}

async function denySubstitutedCommand(): Promise<void> {
  const host = new MonitorHostDouble()
  const target = canaryFile()

  host.deniedResources.push(/^rm /)
  await mountPlugin(host)
  await expect(startToolPid(host, `echo "$(rm ${target})"`)).rejects.toThrow(PERMISSION_DENIED_TEXT)
  await settle()
  expect(existsSync(target)).toBe(true)
}

async function checkEverySubcommand(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)

  await startToolPid(host, "tail -f app.log | grep --line-buffered ERROR")
  expect(host.permissionRequests).toEqual([
    expect.objectContaining({
      action: "shell",
      resources: ["tail -f app.log", "grep --line-buffered ERROR"],
      save: ["tail -f app.log", "grep --line-buffered ERROR"],
    }),
  ])
}

async function askAnyDirectoryForOpaqueCommand(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)

  await startToolPid(host, "eval echo ok")
  expect(host.permissionRequests).toEqual([
    expect.objectContaining({ action: "shell", resources: ["eval echo ok"], save: [] }),
    expect.objectContaining({ action: "external_directory", resources: ["*"], save: [] }),
  ])
}

async function denyOpaqueCommandWithMatchingRule(): Promise<void> {
  const host = new MonitorHostDouble()

  host.deniedResources.push(/^\*$/)
  await mountPlugin(host)
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
