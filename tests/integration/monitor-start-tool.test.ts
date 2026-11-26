import plugin from "@davy121/opencode-monitor"
import { Schema } from "effect"
import { describe, expect, test, vi } from "vitest"
import { PLUGIN_ID } from "#monitor/composition"
import { MONITOR_START_INPUT } from "#monitor/integration"
import {
  MONITOR_START_TOOL,
  MonitorHostDouble,
  mountPlugin,
  PERMISSION_DENIED_TEXT,
  registeredTool,
  settle,
  startToolPid,
  toolCallContext,
  waitForGroupExit,
} from "../fixtures"

function declarePluginId(): void {
  expect(plugin.id).toBe(PLUGIN_ID)
}

async function registerMonitorTools(): Promise<void> {
  const host = new MonitorHostDouble()

  await mountPlugin(host)
  expect(host.editor.tools.map((tool) => tool.id)).toEqual([
    MONITOR_START_TOOL,
    "monitor_list",
    "monitor_stop",
    "monitor_fetch",
  ])
}

async function askShellPermission(): Promise<void> {
  const host = new MonitorHostDouble()

  await mountPlugin(host)
  await startToolPid(host, "true")
  expect(host.permissionRequests).toEqual([
    expect.objectContaining({ sessionID: host.sessionID, action: "shell", resources: ["true"], save: ["true"] }),
  ])
}

async function skipCommandWhenDenied(): Promise<void> {
  const host = new MonitorHostDouble()

  host.denyPermission = true
  await mountPlugin(host)
  await expect(startToolPid(host, "echo ran")).rejects.toThrow(PERMISSION_DENIED_TEXT)
  await settle()
  expect(host.messages).toHaveLength(0)
}

async function wakeSessionWithSynthetic(): Promise<void> {
  const host = new MonitorHostDouble()

  await mountPlugin(host)
  await startToolPid(host, "echo ready")
  await vi.waitFor(() => expect(host.messages).toHaveLength(2))
  expect(host.messages[0]).toMatchObject({
    sessionID: host.sessionID,
    description: "monitor: build log",
    delivery: "steer",
    resume: true,
    metadata: { sequence: 1 },
  })
}

async function useOpenCodeMessageIds(): Promise<void> {
  const host = new MonitorHostDouble()

  await mountPlugin(host)
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
    host.session.synthetic({ sessionID: host.sessionID, id: "m_4d8ddbc4-1", text: "notice" }),
  ).rejects.toThrow('Expected a string starting with "msg_"')
}

function rejectEmptyCommand(): void {
  const decode = Schema.decodeUnknownSync(MONITOR_START_INPUT)

  expect(() => decode({ command: "", description: "build log" })).toThrow()
}

function rejectInvalidPattern(): void {
  const decode = Schema.decodeUnknownSync(MONITOR_START_INPUT)

  expect(() => decode({ command: "true", description: "build log", pattern: "(unclosed" })).toThrow(
    "a valid JavaScript regular expression",
  )
}

function compileValidPattern(): void {
  const input = Schema.decodeUnknownSync(MONITOR_START_INPUT)({
    command: "true",
    description: "build log",
    pattern: "READY|ERROR",
  })

  expect(input.pattern?.test("ERROR now")).toBe(true)
  expect(input.pattern?.test("waiting")).toBe(false)
}

function describePatternForModel(): void {
  const { schema } = Schema.toJsonSchemaDocument(MONITOR_START_INPUT)

  expect(schema).toMatchObject({
    properties: {
      pattern: {
        type: "string",
        minLength: 1,
        description: expect.stringContaining("Match failure states as well as success"),
      },
    },
  })
  expect(JSON.stringify(schema)).not.toContain('"null"')
}

function rejectNullPattern(): void {
  const decode = Schema.decodeUnknownSync(MONITOR_START_INPUT)

  expect(() => decode({ command: "true", description: "build log", pattern: null })).toThrow()
}

async function filterThroughTool(): Promise<void> {
  const host = new MonitorHostDouble()

  await mountPlugin(host)
  await registeredTool(host, MONITOR_START_TOOL).execute(
    Schema.decodeUnknownSync(MONITOR_START_INPUT)({
      command: "printf 'noise\\nREADY\\n'",
      description: "build log",
      pattern: "READY",
    }),
    toolCallContext(host),
  )
  await vi.waitFor(() => expect(host.messages).toHaveLength(2))
  expect(host.messages[0]?.text).toContain("\nREADY\n")
  expect(host.messages[0]?.text).not.toContain("noise")
}

async function stopMonitorsOnCleanup(): Promise<void> {
  const host = new MonitorHostDouble()
  const cleanup = await mountPlugin(host)
  const pid = await startToolPid(host, "sleep 30 & sleep 30")

  cleanup()
  await waitForGroupExit(pid)
}

function registerTests(): void {
  test("declara o plugin com o id do pacote", declarePluginId)
  test("registra as ferramentas monitor_start, monitor_list, monitor_stop e monitor_fetch", registerMonitorTools)
  test("pede permissão de shell para o comando antes de executar", askShellPermission)
  test("não executa o comando quando a permissão é negada", skipCommandWhenDenied)
  test("entrega a linha por mensagem sintética que acorda a sessão", wakeSessionWithSynthetic)
  test("entrega com ids de mensagem do OpenCode em ordem crescente", useOpenCodeMessageIds)
  test("o host substituto recusa id de mensagem fora do formato do OpenCode", rejectForeignMessageId)
  test("recusa comando vazio na entrada da ferramenta", rejectEmptyCommand)
  test("recusa padrão que não é expressão regular válida", rejectInvalidPattern)
  test("compila o padrão válido na entrada da ferramenta", compileValidPattern)
  test("anuncia o padrão ao modelo como texto descrito, sem null", describePatternForModel)
  test("recusa padrão nulo", rejectNullPattern)
  test("filtra as linhas pelo padrão recebido na ferramenta", filterThroughTool)
  test("encerra os monitores na limpeza do plugin", stopMonitorsOnCleanup)
}

describe("ferramenta monitor_start no host", registerTests)
