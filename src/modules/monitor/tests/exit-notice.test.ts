import { describe, expect, test, vi } from "vitest"
import { TEST_ENDED_LABEL } from "./constants"
import { makeMonitorSut, startedPid } from "./support"

async function reportExitCode(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "exit 3")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  expect(sut.sink.notices[0]?.text).toContain("\ncommand exited with code 3 after 0 lines\n")
}

async function labelExitNotice(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "true")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  expect(sut.sink.notices[0]?.label).toBe(TEST_ENDED_LABEL)
}

async function reportSignal(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "kill -TERM $$")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  expect(sut.sink.notices[0]?.text).toContain("\ncommand stopped by signal SIGTERM after 0 lines\n")
}

async function deliverExitAfterLines(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "echo last")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  expect(sut.sink.notices.map((notice) => notice.sequence)).toEqual([1, 2])
  expect(sut.sink.notices[1]?.text).toContain("command exited with code 0")
}

async function reportLinesAndLastLine(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "echo first; echo second")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  expect(sut.sink.notices[1]?.text).toContain("\ncommand exited with code 0 after 2 lines; last line: second\n")
}

function registerTests(): void {
  test("avisa o código de saída quando o comando termina", reportExitCode)
  test("rotula o aviso final como encerrado", labelExitNotice)
  test("avisa o sinal quando o comando é morto", reportSignal)
  test("entrega o aviso final depois das linhas", deliverExitAfterLines)
  test("informa no aviso final o total de linhas e a última", reportLinesAndLastLine)
}

describe("aviso final do monitor", registerTests)
