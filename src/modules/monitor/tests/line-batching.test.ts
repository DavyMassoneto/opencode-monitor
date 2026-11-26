import { describe, expect, test } from "vitest"
import { LineBatch } from "#monitor/modules/monitor/internal"

function waitForQuietGap(): void {
  const batch = new LineBatch(50)

  batch.add("a", 1000)
  batch.add("b", 1100)
  expect(batch.deadline()).toBe(1300)
}

function capWaitFromFirstLine(): void {
  const batch = new LineBatch(50)

  for (let at = 1000; at <= 1900; at += 100) {
    batch.add("x", at)
  }
  expect(batch.deadline()).toBe(2000)
}

function keepMostRecentLines(): void {
  const batch = new LineBatch(50)

  for (let index = 1; index <= 60; index += 1) {
    batch.add(`line ${index}`, 1000)
  }
  const content = batch.take()
  expect(content.lines).toHaveLength(50)
  expect(content.lines[0]).toBe("line 11")
  expect(content.omitted).toBe(10)
}

function emptyAfterTake(): void {
  const batch = new LineBatch(50)

  batch.add("a", 1000)
  batch.take()
  expect(batch.hasLines()).toBe(false)
  expect(batch.take()).toEqual({ lines: [], omitted: 0 })
}

function restartWaitAfterTake(): void {
  const batch = new LineBatch(50)

  batch.add("a", 1000)
  batch.take()
  batch.add("b", 5000)
  expect(batch.deadline()).toBe(5200)
}

function registerTests(): void {
  test("espera 200 ms sem linhas novas", waitForQuietGap)
  test("não espera mais de 1 s desde a primeira linha", capWaitFromFirstLine)
  test("guarda as 50 linhas mais recentes e conta as omitidas", keepMostRecentLines)
  test("fica vazio depois de entregar o lote", emptyAfterTake)
  test("recomeça a espera no lote seguinte", restartWaitAfterTake)
}

describe("agrupamento de linhas", registerTests)
