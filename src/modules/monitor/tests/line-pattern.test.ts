import { describe, expect, test, vi } from "vitest"
import { makeMonitorSut, monitorRequest, settle } from "./support"

async function deliverOnlyMatchingLines(): Promise<void> {
  const sut = makeMonitorSut()

  sut.monitors.start({ ...monitorRequest("printf 'ok 1\\nERROR db\\nok 2\\n'"), pattern: /ERROR|FAILED/ })
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  expect(sut.sink.notices[0]?.text).toContain("\nERROR db\n")
  expect(sut.sink.notices[0]?.text).not.toContain("ok 1")
}

async function stayQuietWithoutMatches(): Promise<void> {
  const sut = makeMonitorSut()

  sut.monitors.start({ ...monitorRequest("printf 'ok 1\\nok 2\\n'; sleep 0.5"), pattern: /ERROR/ })
  await settle()
  expect(sut.sink.notices).toHaveLength(0)
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(1))
  expect(sut.sink.notices[0]?.text).toContain("command exited with code 0")
}

async function matchCleanedText(): Promise<void> {
  const sut = makeMonitorSut()

  sut.monitors.start({ ...monitorRequest("printf '\\033[31mERROR\\033[0m\\n'"), pattern: /^ERROR$/ })
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2))
  expect(sut.sink.notices[0]?.text).toContain("\nERROR\n")
}

async function ignoreFilteredLinesForFlood(): Promise<void> {
  const sut = makeMonitorSut()

  sut.monitors.start({ ...monitorRequest("yes noise | head -n 200000; echo DONE"), pattern: /DONE/ })
  await vi.waitFor(() => expect(sut.sink.notices).toHaveLength(2), { timeout: 5000 })
  expect(sut.sink.notices[0]?.text).toContain("\nDONE\n")
  expect(sut.sink.notices[1]?.label).not.toContain("flooded")
}

function registerTests(): void {
  test("entrega só as linhas que casam com o padrão", deliverOnlyMatchingLines)
  test("não avisa nada quando nenhuma linha casa", stayQuietWithoutMatches)
  test("aplica o padrão sobre o texto já sem códigos de terminal", matchCleanedText)
  test("linhas descartadas pelo padrão não contam para inundação", ignoreFilteredLinesForFlood)
}

describe("filtro por padrão", registerTests)
