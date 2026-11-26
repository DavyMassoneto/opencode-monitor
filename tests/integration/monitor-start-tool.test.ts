import plugin from "@davy121/opencode-monitor"
import { Schema } from "effect"
import { describe, expect, test, vi } from "vitest"
import { compose, PLUGIN_ID } from "#monitor/composition"
import { MONITOR_START_INPUT } from "#monitor/integration"
import {
  HOST_SESSION_ID,
  isGroupAlive,
  MONITOR_START_TOOL,
  MonitorHostDouble,
  PERMISSION_DENIED_TEXT,
  settle,
  startToolPid,
} from "../fixtures"

function declarePluginId(): void {
  expect(plugin.id).toBe(PLUGIN_ID)
}

async function registerStartTool(): Promise<void> {
  const host = new MonitorHostDouble()

  await compose(host)
  expect(host.editor.tools.map((tool) => tool.id)).toEqual([MONITOR_START_TOOL])
}

async function askShellPermission(): Promise<void> {
  const host = new MonitorHostDouble()

  await compose(host)
  await startToolPid(host, "true")
  expect(host.permissionRequests).toEqual([
    expect.objectContaining({ sessionID: HOST_SESSION_ID, action: "shell", resources: ["true"], save: ["true"] }),
  ])
}

async function skipCommandWhenDenied(): Promise<void> {
  const host = new MonitorHostDouble()

  host.denyPermission = true
  await compose(host)
  await expect(startToolPid(host, "echo ran")).rejects.toThrow(PERMISSION_DENIED_TEXT)
  await settle()
  expect(host.messages).toHaveLength(0)
}

async function wakeSessionWithSynthetic(): Promise<void> {
  const host = new MonitorHostDouble()

  await compose(host)
  await startToolPid(host, "echo ready")
  await vi.waitFor(() => expect(host.messages).toHaveLength(2))
  expect(host.messages[0]).toMatchObject({
    sessionID: HOST_SESSION_ID,
    description: "monitor: build log",
    delivery: "steer",
    resume: true,
    metadata: { sequence: 1 },
  })
}

async function useOpenCodeMessageIds(): Promise<void> {
  const host = new MonitorHostDouble()

  await compose(host)
  await startToolPid(host, "echo ready")
  await vi.waitFor(() => expect(host.messages).toHaveLength(2))
  expect(host.messages.map((message) => message.id)).toEqual([
    expect.stringMatching(/^msg_[0-9a-f]{12}/),
    expect.stringMatching(/^msg_[0-9a-f]{12}/),
  ])
  expect(String(host.messages[0]?.id) < String(host.messages[1]?.id)).toBe(true)
}

async function rejectForeignMessageId(): Promise<void> {
  const host = new MonitorHostDouble()

  await expect(
    host.session.synthetic({ sessionID: HOST_SESSION_ID, id: "m_4d8ddbc4-1", text: "notice" }),
  ).rejects.toThrow('Expected a string starting with "msg_"')
}

function rejectEmptyCommand(): void {
  const decode = Schema.decodeUnknownSync(MONITOR_START_INPUT)

  expect(() => decode({ command: "", description: "build log" })).toThrow()
}

async function stopMonitorsOnCleanup(): Promise<void> {
  const host = new MonitorHostDouble()
  const cleanup = await compose(host)
  const pid = await startToolPid(host, "sleep 30 & sleep 30")

  cleanup()
  await vi.waitFor(() => expect(isGroupAlive(pid)).toBe(false))
}

function registerTests(): void {
  test("declara o plugin com o id do pacote", declarePluginId)
  test("registra a ferramenta monitor_start", registerStartTool)
  test("pede permissão de shell para o comando antes de executar", askShellPermission)
  test("não executa o comando quando a permissão é negada", skipCommandWhenDenied)
  test("entrega a linha por mensagem sintética que acorda a sessão", wakeSessionWithSynthetic)
  test("entrega com ids de mensagem do OpenCode em ordem crescente", useOpenCodeMessageIds)
  test("o host substituto recusa id de mensagem fora do formato do OpenCode", rejectForeignMessageId)
  test("recusa comando vazio na entrada da ferramenta", rejectEmptyCommand)
  test("encerra os monitores na limpeza do plugin", stopMonitorsOnCleanup)
}

describe("ferramenta monitor_start no host", registerTests)
