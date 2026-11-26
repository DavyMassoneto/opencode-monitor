import { describe, expect, test } from "vitest"
import {
  isGroupAlive,
  MonitorHostDouble,
  mountPlugin,
  registeredTool,
  settle,
  startTool,
  startToolPid,
  toolCallContext,
  waitForGroupExit,
} from "../fixtures"

async function listSessionMonitors(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)
  const id = (await startTool(host, "sleep 30")).id
  const result = await registeredTool(host, "monitor_list").execute({}, toolCallContext(host))

  expect(JSON.parse(String(result.content))).toEqual([
    expect.objectContaining({
      id,
      command: "sleep 30",
      description: "build log",
      lines: { received: 0, delivered: 0, pending: 0, dropped: 0 },
    }),
  ])
}

async function stopThroughTool(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)
  const id = (await startTool(host, "sleep 30")).id
  const result = await registeredTool(host, "monitor_stop").execute({ id }, toolCallContext(host))

  expect(JSON.parse(String(result.content))).toMatchObject({ id })
  await settle()
  expect(host.messages).toHaveLength(0)
}

async function rejectUnknownStop(): Promise<void> {
  const host = new MonitorHostDouble()

  await mountPlugin(host)
  await expect(
    registeredTool(host, "monitor_stop").execute({ id: "m_00000000" }, toolCallContext(host)),
  ).rejects.toThrow("no running monitor with this id in this session: m_00000000")
}

async function stopDeletedSession(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)
  const pid = await startToolPid(host, "sleep 30 & sleep 30")

  host.event.emitDeleted(host.sessionID)
  await waitForGroupExit(pid)
}

async function ignoreOtherDeletedSession(): Promise<void> {
  const host = new MonitorHostDouble()
  await mountPlugin(host)
  const pid = await startToolPid(host, "sleep 30")

  host.event.emitDeleted("ses_unrelated")
  await settle()
  expect(isGroupAlive(pid)).toBe(true)
}

async function subscribeOnlyToDeletions(): Promise<void> {
  const host = new MonitorHostDouble()
  const cleanup = await mountPlugin(host)

  expect(host.event.subscriptions).toEqual([expect.objectContaining({ types: ["session.deleted"] })])
  cleanup()
  expect(host.event.subscriptions[0]?.signal.aborted).toBe(true)
}

function registerTests(): void {
  test("monitor_list devolve os monitores da sessão", listSessionMonitors)
  test("monitor_stop para o monitor sem gerar aviso", stopThroughTool)
  test("monitor_stop recusa id desconhecido", rejectUnknownStop)
  test("para os monitores da sessão apagada", stopDeletedSession)
  test("não para monitores quando outra sessão é apagada", ignoreOtherDeletedSession)
  test("assina só session.deleted e cancela na limpeza", subscribeOnlyToDeletions)
}

describe("ferramentas de controle no host", registerTests)
