import { describe, expect, test } from "vitest"
import { MISSING_DIRECTORY } from "./constants"
import { makeMonitorSut, monitorRequest, startedMonitor } from "./support"

function returnStartedProcess(): void {
  const sut = makeMonitorSut()
  const started = sut.monitors.start(monitorRequest("true"))

  expect(started).toMatchObject({
    kind: "started",
    summary: { id: expect.stringMatching(/^m_[0-9a-f]{8}$/), pid: expect.any(Number), status: "running" },
  })
}

function giveDistinctMonitorIds(): void {
  const sut = makeMonitorSut()
  const first = startedMonitor(sut, monitorRequest("true"))
  const second = startedMonitor(sut, monitorRequest("true"))

  expect(first.id).not.toBe(second.id)
}

async function rejectMissingDirectory(): Promise<void> {
  const sut = makeMonitorSut()
  const started = sut.monitors.start({ ...monitorRequest("true"), directory: MISSING_DIRECTORY })

  expect(started).toMatchObject({ kind: "failed", reason: expect.stringContaining("could not start") })
}

function registerTests(): void {
  test("devolve o id e o pid do monitor iniciado", returnStartedProcess)
  test("dá ids diferentes a monitores diferentes", giveDistinctMonitorIds)
  test("recusa iniciar em diretório inexistente", rejectMissingDirectory)
}

describe("início do monitor", registerTests)
