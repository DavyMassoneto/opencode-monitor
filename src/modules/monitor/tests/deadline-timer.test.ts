import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { DeadlineTimer } from "#monitor/modules/monitor/internal"

const MAX_TIMER_MS = 2_147_483_647

function useFakeClock(): void {
  vi.useFakeTimers()
}

function useRealClock(): void {
  vi.useRealTimers()
}

function waitBeyondTimerLimit(): void {
  const expire = vi.fn()
  new DeadlineTimer(new Date(Date.now() + MAX_TIMER_MS + 1000), expire).start()

  vi.advanceTimersByTime(MAX_TIMER_MS)
  expect(expire).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1000)
  expect(expire).toHaveBeenCalledTimes(1)
}

function expireOnTime(): void {
  const expire = vi.fn()
  new DeadlineTimer(new Date(Date.now() + 500), expire).start()

  vi.advanceTimersByTime(499)
  expect(expire).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1)
  expect(expire).toHaveBeenCalledTimes(1)
}

function skipCancelledDeadline(): void {
  const expire = vi.fn()
  const timer = new DeadlineTimer(new Date(Date.now() + MAX_TIMER_MS + 1000), expire)

  timer.start()
  vi.advanceTimersByTime(MAX_TIMER_MS)
  timer.cancel()
  vi.advanceTimersByTime(MAX_TIMER_MS)
  expect(expire).not.toHaveBeenCalled()
}

function registerTests(): void {
  beforeEach(useFakeClock)
  afterEach(useRealClock)
  test("espera prazos além do limite do setTimeout", waitBeyondTimerLimit)
  test("vence exatamente no prazo", expireOnTime)
  test("não vence depois de cancelado, mesmo após rearmar", skipCancelledDeadline)
}

describe("timer de prazo", registerTests)
