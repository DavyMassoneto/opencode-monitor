import { describe, expect, test } from "vitest"
import { cleanLine } from "#monitor/modules/monitor/internal"

function keepPlainText(): void {
  expect(cleanLine("ERROR db timeout\tafter 30s", 4096)).toBe("ERROR db timeout\tafter 30s")
}

function stripColorSequences(): void {
  expect(cleanLine("\u001b[1;31mFAILED\u001b[0m build", 4096)).toBe("FAILED build")
}

function stripTitleSequences(): void {
  expect(cleanLine("\u001b]0;window title\u0007ready", 4096)).toBe("ready")
  expect(cleanLine("\u001b]8;;https://x.test\u001b\\link", 4096)).toBe("link")
}

function stripControlCharacters(): void {
  expect(cleanLine("a\u0000b\u0008c\rd\u007fe\u009bf", 4096)).toBe("abcdef")
}

function truncateLongLine(): void {
  const cleaned = cleanLine("x".repeat(10_000), 4096)

  expect(Buffer.byteLength(cleaned)).toBeLessThanOrEqual(4096)
  expect(cleaned.endsWith("…")).toBe(true)
}

function keepMultibyteCharactersWhole(): void {
  const cleaned = cleanLine("é".repeat(3000), 4096)

  expect(cleaned).not.toContain("\uFFFD")
  expect(cleaned.replace("…", "")).toMatch(/^é+$/)
}

function keepLineAtLimit(): void {
  const atLimit = "y".repeat(4096)

  expect(cleanLine(atLimit, 4096)).toBe(atLimit)
}

function registerTests(): void {
  test("mantém texto comum e tabulação", keepPlainText)
  test("remove sequências de cor", stripColorSequences)
  test("remove sequências de título e hyperlink", stripTitleSequences)
  test("remove caracteres de controle", stripControlCharacters)
  test("corta a linha acima de 4 KB com reticências", truncateLongLine)
  test("não parte caractere multibyte no corte", keepMultibyteCharactersWhole)
  test("não corta a linha que cabe no limite", keepLineAtLimit)
}

describe("limpeza da linha", registerTests)
