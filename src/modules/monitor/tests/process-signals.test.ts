import { describe, expect, test, vi } from "vitest"
import { launchCommand } from "#monitor/modules/monitor/adapters"
import { LONG_RUNNING_GROUP } from "./constants"
import { makeMonitorSut, monitorRequest, startedMonitor, waitForGroupExit } from "./support"

function processError(code: string): Error {
  return Object.assign(new Error(code), { code })
}

async function tolerateExitedGroup(): Promise<void> {
  const launched = launchCommand(
    { command: LONG_RUNNING_GROUP, directory: process.cwd(), environment: new Map<string, string>() },
    { onLine: () => {}, onStderr: () => {}, onExit: () => {} },
  )
  if (launched.kind !== "launched") {
    throw new Error(launched.reason)
  }
  const kill = vi.spyOn(process, "kill").mockImplementationOnce(() => {
    throw processError("EPERM")
  })

  expect(() => launched.stop()).not.toThrow()
  kill.mockRestore()
  process.kill(-launched.pid, "SIGKILL")
  await waitForGroupExit(launched.pid)
}

function propagateUnexpectedSignalError(): void {
  const sut = makeMonitorSut()
  const { pid } = startedMonitor(sut, monitorRequest(LONG_RUNNING_GROUP))
  const kill = vi.spyOn(process, "kill").mockImplementationOnce(() => {
    throw processError("EINVAL")
  })

  expect(() => sut.monitors.stopAll()).toThrow("EINVAL")
  kill.mockRestore()
  process.kill(-pid, "SIGKILL")
}

async function stopManyFreshlyExitedMonitors(): Promise<void> {
  for (let round = 0; round < 5; round += 1) {
    const sut = makeMonitorSut()
    const pids = Array.from(
      { length: 30 },
      (_, index) => startedMonitor(sut, { ...monitorRequest("true"), sessionID: `ses_stress_${index}` }).pid,
    )
    await new Promise<void>((resolve) => setTimeout(resolve, round * 3))
    expect(() => sut.monitors.stopAll()).not.toThrow()
    await Promise.all(pids.map(waitForGroupExit))
  }
}

function registerTests(): void {
  test("ignora EPERM de grupo que já terminou e ainda não foi recolhido", tolerateExitedGroup)
  test("propaga erro inesperado ao sinalizar o grupo", propagateUnexpectedSignalError)
  test("para dezenas de monitores recém-terminados sem erro", stopManyFreshlyExitedMonitors, 20_000)
}

describe("sinais para o grupo de processos", registerTests)
