import { describe, expect, test } from "vitest"
import { FloodMeter } from "#monitor/modules/monitor/internal"

function recordSeconds(meter: FloodMeter, linesPerSecond: number, seconds: number): boolean[] {
  const verdicts: boolean[] = []

  for (let second = 0; second < seconds; second += 1) {
    for (let line = 0; line < linesPerSecond; line += 1) {
      verdicts.push(meter.record(second * 1000 + Math.floor((line * 1000) / linesPerSecond)))
    }
  }
  return verdicts
}

function floodAfterFiveSeconds(): void {
  const verdicts = recordSeconds(new FloodMeter(), 101, 5)

  expect(verdicts.indexOf(true)).toBe(101 * 5 - 1)
}

function acceptLimitRate(): void {
  expect(recordSeconds(new FloodMeter(), 100, 30)).not.toContain(true)
}

function acceptShortBurst(): void {
  expect(recordSeconds(new FloodMeter(), 5000, 4)).not.toContain(true)
}

function resetAfterQuietSecond(): void {
  const meter = new FloodMeter()

  recordSeconds(meter, 101, 4)
  meter.record(4500)
  const verdicts: boolean[] = []
  for (let line = 0; line < 101; line += 1) {
    verdicts.push(meter.record(5000 + line))
  }
  expect(verdicts).not.toContain(true)
}

function registerTests(): void {
  test("acusa inundação com mais de 100 linhas/s por 5 s seguidos", floodAfterFiveSeconds)
  test("aceita 100 linhas/s por tempo indefinido", acceptLimitRate)
  test("aceita rajada curta acima do limite", acceptShortBurst)
  test("zera a contagem depois de um segundo calmo", resetAfterQuietSecond)
}

describe("detecção de inundação", registerTests)
