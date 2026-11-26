import { Schema } from "effect"
import { describe, expect, test, vi } from "vitest"
import { MONITOR_START_INPUT } from "#monitor/integration"
import {
  MonitorHostDouble,
  mountPlugin,
  registeredTool,
  STARTED_SUMMARY,
  type StartedToolResult,
  type StartOverrides,
  toolCallContext,
} from "../fixtures"

async function startWith(host: MonitorHostDouble, input: StartOverrides): Promise<StartedToolResult> {
  const decoded = Schema.decodeUnknownSync(MONITOR_START_INPUT)({
    command: "sleep 30",
    description: "build log",
    ...input,
  })
  const result = await registeredTool(host, "monitor_start").execute(decoded, toolCallContext(host))

  return Schema.decodeUnknownSync(STARTED_SUMMARY)(result.content)
}

async function applyDefaultTimeout(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)
  const summary = await startWith(host, {})

  expect(Date.parse(String(summary.expiresAt)) - Date.parse(summary.startedAt)).toBe(300_000)
}

async function applyRequestedTimeout(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)

  await startWith(host, { timeout_ms: 300 })
  await vi.waitFor(() => expect(host.messages).toHaveLength(1))
  expect(host.messages[0]?.description).toBe("monitor: build log (expired)")
}

async function ignoreTimeoutWhenPersistent(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)
  const summary = await startWith(host, { persistent: true, timeout_ms: 300 })

  expect(summary.expiresAt).toBeUndefined()
}

function rejectInvalidTimeouts(): void {
  const decode = Schema.decodeUnknownSync(MONITOR_START_INPUT)

  for (const timeout of [0, -1, 1.5, "1000", null]) {
    expect(() => decode({ command: "true", description: "build log", timeout_ms: timeout })).toThrow()
  }
}

function rejectNonBooleanPersistent(): void {
  const decode = Schema.decodeUnknownSync(MONITOR_START_INPUT)

  expect(() => decode({ command: "true", description: "build log", persistent: "yes" })).toThrow()
}

function registerTests(): void {
  test("aplica o prazo padrão de 5 minutos", applyDefaultTimeout)
  test("aplica o timeout_ms pedido e avisa quando vence", applyRequestedTimeout)
  test("ignora timeout_ms quando o monitor é persistente", ignoreTimeoutWhenPersistent)
  test("recusa timeout_ms que não é inteiro positivo", rejectInvalidTimeouts)
  test("recusa persistent que não é booleano", rejectNonBooleanPersistent)
}

describe("duração do monitor na ferramenta", registerTests)
