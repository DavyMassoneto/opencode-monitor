import { describe, expect, test, vi } from "vitest"
import { launchWith, PosixPlatform, ProcessGroup } from "#monitor/modules/monitor/adapters"
import { TEST_SESSION_ID } from "./constants"
import { ForeignIdentityPlatform } from "./doubles"
import {
  isGroupAlive,
  isProcessAlive,
  makeMonitorSut,
  monitorRequest,
  settle,
  startedMonitor,
  waitForGroupExit,
} from "./support"

const posix = new PosixPlatform()

function launchedPid(command: string): number {
  const launched = launchWith(
    posix,
    { command, directory: process.cwd(), environment: new Map<string, string>() },
    { onLine: () => {}, onStderr: () => {}, onExit: () => {} },
  )
  if (launched.kind !== "launched") {
    throw new Error(launched.reason)
  }
  return launched.pid
}

async function stopCommandReplacedByExec(): Promise<void> {
  const sut = makeMonitorSut()
  const { id, pid } = startedMonitor(sut, monitorRequest("sleep 30"))

  await settle()
  sut.monitors.stop(TEST_SESSION_ID, id)
  await waitForGroupExit(pid)
}

function readStableIdentity(): void {
  const pid = launchedPid("sleep 30")
  const identity = posix.readIdentity(pid)

  expect(identity).toMatch(new RegExp(`^${pid}\\s+\\S`))
  expect(posix.readIdentity(pid)).toBe(identity)
  process.kill(-pid, "SIGKILL")
}

async function spareGroupWithAnotherIdentity(): Promise<void> {
  const pid = launchedPid("sleep 30")

  new ProcessGroup(new ForeignIdentityPlatform(), pid).stop()
  await settle()
  expect(isGroupAlive(pid)).toBe(true)
  process.kill(-pid, "SIGKILL")
  await waitForGroupExit(pid)
}

async function stopLeftoversWhenCommandExits(): Promise<void> {
  const sut = makeMonitorSut()

  startedMonitor(sut, monitorRequest("sleep 30 >/dev/null 2>&1 & echo $! ; echo started"))
  await vi.waitFor(() => expect(sut.sink.notices.at(-1)?.text).toContain("command exited with code 0"))
  const leftover = Number(sut.sink.notices[0]?.text.split("\n")[1])
  expect(leftover).toBeGreaterThan(0)
  await vi.waitFor(() => expect(isProcessAlive(leftover)).toBe(false), { timeout: 5000 })
}

function readNothingForMissingProcess(): void {
  expect(posix.readIdentity(999_999)).toBe("")
}

function registerTests(): void {
  test("para o comando que o shell substituiu com exec", stopCommandReplacedByExec)
  test("lê grupo e início do processo, estáveis entre leituras", readStableIdentity)
  test("não sinaliza grupo cujo líder tem outra identidade", spareGroupWithAnotherIdentity)
  test("para os processos que sobraram quando o comando termina", stopLeftoversWhenCommandExits)
  test("não lê identidade de processo inexistente", readNothingForMissingProcess)
}

describe("identidade do processo antes de sinalizar", registerTests)
