import { Schema } from "effect"
import { describe, expect, test, vi } from "vitest"
import { MONITOR_START_INPUT } from "#monitor/integration"
import {
  type DeliveredOptions,
  MonitorHostDouble,
  mountPlugin,
  registeredTool,
  type StartOverrides,
  settle,
  toolCallContext,
} from "../fixtures"

async function startWith(host: MonitorHostDouble, command: string, input: StartOverrides): Promise<string> {
  const decoded = Schema.decodeUnknownSync(MONITOR_START_INPUT)({ command, description: "build log", ...input })
  const result = await registeredTool(host, "monitor_start").execute(decoded, toolCallContext(host))

  return String(result.content)
}

async function deliveredOptions(input: StartOverrides): Promise<DeliveredOptions> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)

  await startWith(host, "echo ready", input)
  await vi.waitFor(() => expect(host.messages).toHaveLength(2))
  return { delivery: host.messages[0]?.delivery, resume: host.messages[0]?.resume }
}

async function wakeByDefault(): Promise<void> {
  expect(await deliveredOptions({})).toEqual({ delivery: "steer", resume: true })
}

async function queueAfterWork(): Promise<void> {
  expect(await deliveredOptions({ delivery: "queue" })).toEqual({ delivery: "queue", resume: true })
}

async function waitSilently(): Promise<void> {
  expect(await deliveredOptions({ delivery: "silent" })).toEqual({ delivery: undefined, resume: false })
}

async function sendNothingWhenManual(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)

  await startWith(host, "echo ready", { delivery: "manual" })
  await settle()
  await settle()
  expect(host.messages).toHaveLength(0)
}

async function fetchThroughTool(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)

  await startWith(host, "echo one; echo two", { delivery: "manual" })
  await settle()
  const result = await registeredTool(host, "monitor_fetch").execute({}, toolCallContext(host))
  expect(JSON.parse(String(result.content))).toEqual([expect.objectContaining({ lines: ["one", "two"], dropped: 0 })])
}

async function rejectUnknownFetch(): Promise<void> {
  const host = new MonitorHostDouble()

  await mountPlugin(host)
  await expect(
    registeredTool(host, "monitor_fetch").execute({ id: "m_00000000" }, toolCallContext(host)),
  ).rejects.toThrow("no monitor with this id in this session: m_00000000")
}

function rejectUnknownMode(): void {
  const decode = Schema.decodeUnknownSync(MONITOR_START_INPUT)

  expect(() => decode({ command: "true", description: "build log", delivery: "loud" })).toThrow()
}

function registerTests(): void {
  test("wake é o padrão: entrega antes da próxima chamada e acorda a sessão", wakeByDefault)
  test("queue entrega depois do trabalho atual e acorda a sessão", queueAfterWork)
  test("silent deixa o aviso na caixa sem acordar a sessão", waitSilently)
  test("manual não envia mensagem nenhuma", sendNothingWhenManual)
  test("monitor_fetch devolve as linhas pendentes como resultado", fetchThroughTool)
  test("monitor_fetch recusa id desconhecido", rejectUnknownFetch)
  test("recusa modo de entrega desconhecido", rejectUnknownMode)
}

describe("modos de entrega na ferramenta", registerTests)
