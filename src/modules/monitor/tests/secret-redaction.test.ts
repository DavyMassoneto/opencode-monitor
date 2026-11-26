import { describe, expect, test } from "vitest"
import { redactSecrets } from "#monitor/modules/monitor/internal"

function redactApiKey(): void {
  expect(redactSecrets("key=sk-proj_abcdefghijklmnop1234")).toBe("key=[redacted]")
}

function redactGithubToken(): void {
  expect(redactSecrets("token ghp_abcdefghijklmnopqrstuvwxyz0123")).toBe("token [redacted]")
}

function redactAwsAccessKey(): void {
  expect(redactSecrets("AKIAABCDEFGHIJKLMNOP used")).toBe("[redacted] used")
}

function redactBearerToken(): void {
  expect(redactSecrets("Authorization: Bearer eyJhbGciOi.payload.sig")).toBe("Authorization: [redacted]")
}

function keepShortLookalikes(): void {
  expect(redactSecrets("task-sk-1 ghp_short AKIA123 Bearer x")).toBe("task-sk-1 ghp_short AKIA123 Bearer x")
}

function redactEveryOccurrence(): void {
  expect(redactSecrets("sk-aaaaaaaaaaaaaaaaaaaa and sk-bbbbbbbbbbbbbbbbbbbb")).toBe("[redacted] and [redacted]")
}

function registerTests(): void {
  test("oculta chave de API sk-", redactApiKey)
  test("oculta token do GitHub", redactGithubToken)
  test("oculta chave de acesso da AWS", redactAwsAccessKey)
  test("oculta token Bearer", redactBearerToken)
  test("não oculta textos curtos parecidos com segredos", keepShortLookalikes)
  test("oculta todas as ocorrências da linha", redactEveryOccurrence)
}

describe("redação de segredos", registerTests)
