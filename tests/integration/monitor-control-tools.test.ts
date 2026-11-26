import { describe, expect, test, vi } from "vitest"
import { compose } from "#monitor/composition"
import {
  HOST_SESSION_ID,
  isGroupAlive,
  MonitorHostDouble,
  registeredTool,
  settle,
  startTool,
  startToolPid,
  toolCallContext,
} from "../fixtures"

async function listSessionMonitors(): Promise<void> {
  const host = new MonitorHostDouble()
  const cleanup = await compose(host)
  const id = (await startTool(host, "sleep 30")).id
  const result = await registeredTool(host, "monitor_list").execute({}, toolCallContext())

  expect(JSON.parse(String(result.content))).toEqual([
    expect.objectContaining({
      id,
      command: "sleep 30",
      description: "build log",
      lines: { received: 0, delivered: 0 },
    }),
  ])
  cleanup()
}

async function stopThroughTool(): Promise<void> {
  const host = new MonitorHostDouble()
  const cleanup = await compose(host)
  const id = (await startTool(host, "sleep 30")).id
  const result = await registeredTool(host, "monitor_stop").execute({ id }, toolCallContext())

  expect(JSON.parse(String(result.content))).toMatchObject({ id })
  await settle()
  expect(host.messages).toHaveLength(0)
  cleanup()
}

async function rejectUnknownStop(): Promise<void> {
  const host = new MonitorHostDouble()

  await compose(host)
  await expect(registeredTool(host, "monitor_stop").execute({ id: "m_00000000" }, toolCallContext())).rejects.toThrow(
    "no running monitor with this id in this session: m_00000000",
  )
}

async function stopDeletedSession(): Promise<void> {
  const host = new MonitorHostDouble()
  const cleanup = await compose(host)
  const pid = await startToolPid(host, "sleep 30 & sleep 30")

  host.event.emitDeleted(HOST_SESSION_ID)
  await vi.waitFor(() => expect(isGroupAlive(pid)).toBe(false))
  cleanup()
}

async function ignoreOtherDeletedSession(): Promise<void> {
  const host = new MonitorHostDouble()
  const cleanup = await compose(host)
  const pid = await startToolPid(host, "sleep 30")

  host.event.emitDeleted("ses_unrelated")
  await settle()
  expect(isGroupAlive(pid)).toBe(true)
  cleanup()
}

async function subscribeOnlyToDeletions(): Promise<void> {
  const host = new MonitorHostDouble()
  const cleanup = await compose(host)

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
