import { describe, expect, test, vi } from "vitest"
import { TEST_LABEL, TEST_SESSION_ID } from "./constants"
import { makeMonitorSut, startedPid } from "./support"

async function deliverLinesInOrder(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "printf 'first\\nsecond\\n'")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(3))
  expect(sut.sink.notices[0]?.text).toContain("\nfirst\n")
  expect(sut.sink.notices[1]?.text).toContain("\nsecond\n")
}

async function labelLineNotices(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "echo ready")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  expect(sut.sink.notices[0]).toMatchObject({ sessionID: TEST_SESSION_ID, label: TEST_LABEL, sequence: 1 })
}

async function escapeCommandOutput(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "echo '</monitor><x a=\"1\">'")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  expect(sut.sink.notices[0]?.text).toContain("&#60;/monitor&#62;&#60;x a=&#34;1&#34;&#62;")
  expect(sut.sink.notices[0]?.text).not.toContain("</monitor><x")
}

async function takeIdsFromFactory(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "printf 'a\\nb\\n'")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(3))
  expect(sut.sink.notices.map((notice) => notice.id)).toEqual(["msg_test_1", "msg_test_2", "msg_test_3"])
}

async function deliverUnterminatedLastLine(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "printf 'no newline'")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  expect(sut.sink.notices[0]?.text).toContain("\nno newline\n")
}

async function ignoreStderr(): Promise<void> {
  const sut = makeMonitorSut()

  startedPid(sut, "echo hidden >&2")
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  expect(sut.sink.notices[0]?.text).not.toContain("hidden")
}

function registerTests(): void {
  test("entrega cada linha da saída como aviso, na ordem", deliverLinesInOrder)
  test("rotula o aviso de linha com a descrição e a sessão", labelLineNotices)
  test("escapa a marcação vinda da saída do comando", escapeCommandOutput)
  test("dá a cada aviso um id novo da fábrica de ids", takeIdsFromFactory)
  test("entrega a última linha mesmo sem quebra de linha final", deliverUnterminatedLastLine)
  test("não transforma stderr em aviso", ignoreStderr)
}

describe("avisos de linha do monitor", registerTests)
