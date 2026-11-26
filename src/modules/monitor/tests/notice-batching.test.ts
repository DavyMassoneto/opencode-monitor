import { describe, expect, test, vi } from "vitest"
import { TEST_LABEL } from "./constants"
import { makeMonitorSut, startedPid } from "./support"

async function groupQuickLines(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "for i in 1 2 3 4 5 6 7 8 9 10; do echo line $i; done; sleep 0.5")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  expect(sut.sink.notices[0]?.label).toBe(`${TEST_LABEL} (10 lines)`)
  expect(sut.sink.notices[0]?.text).toContain("\nline 1\n")
  expect(sut.sink.notices[0]?.text).toContain("\nline 10\n")
}

async function reportOmittedLines(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "seq 1 60")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  expect(sut.sink.notices[0]?.label).toBe(`${TEST_LABEL} (60 lines)`)
  expect(sut.sink.notices[0]?.text).toContain("\n… 10 earlier lines omitted\n11\n")
  expect(sut.sink.notices[0]?.text).not.toContain("\n10\n")
}

async function flushContinuousStream(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "i=0; while [ $i -lt 25 ]; do echo tick; sleep 0.1; i=$((i+1)); done")
  await vi.waitFor(() => expect(sut.sink.notices.at(-1)?.text).toContain("command exited"), { timeout: 6000 })
  expect(sut.sink.notices.length).toBeGreaterThanOrEqual(3)
}

async function keepSeparateLinesApart(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "echo one; sleep 0.5; echo two")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(3))
  expect(sut.sink.notices[0]?.label).toBe(TEST_LABEL)
  expect(sut.sink.notices[1]?.text).toContain("\ntwo\n")
}

async function cleanTerminalCodes(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "printf '\\033[31mred\\033[0m\\n'")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  expect(sut.sink.notices[0]?.text).toContain("\nred\n")
}

async function redactSecretsInNotices(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "echo token ghp_abcdefghijklmnopqrstuvwxyz0123")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  expect(sut.sink.notices[0]?.text).toContain("\ntoken [redacted]\n")
  expect(sut.sink.notices[0]?.text).not.toContain("ghp_")
}

function registerTests(): void {
  test("junta num aviso as linhas que chegam juntas", groupQuickLines)
  test("avisa quantas linhas antigas o lote omitiu", reportOmittedLines)
  test("entrega fluxo contínuo em vários avisos", flushContinuousStream)
  test("separa linhas que chegam com intervalo", keepSeparateLinesApart)
  test("remove códigos de terminal antes de avisar", cleanTerminalCodes)
  test("oculta segredos antes de avisar", redactSecretsInNotices)
}

describe("agrupamento dos avisos", registerTests)
