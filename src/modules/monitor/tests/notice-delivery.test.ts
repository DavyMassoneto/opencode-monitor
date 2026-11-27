import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { NoticeDelivery } from "#monitor/modules/monitor/internal"
import { FlakyNoticeSink } from "./doubles"
import { testNotice } from "./support"

function useFakeClock(): void {
  vi.useFakeTimers()
}

function useRealClock(): void {
  vi.useRealTimers()
}

async function retryWithSameId(): Promise<void> {
  const sink = new FlakyNoticeSink(2)
  const failures: string[] = []
  const result = new NoticeDelivery(sink).send(testNotice("msg_same"), (reason) => failures.push(reason))

  await vi.advanceTimersByTimeAsync(500)
  await vi.advanceTimersByTimeAsync(1000)
  expect(await result).toEqual({ kind: "delivered" })
  expect(sink.attempts.map((notice) => notice.id)).toEqual(["msg_same", "msg_same", "msg_same"])
  expect(failures).toEqual(["temporary failure 1", "temporary failure 2"])
}

async function backOffExponentially(): Promise<void> {
  const sink = new FlakyNoticeSink(3)
  const result = new NoticeDelivery(sink).send(testNotice("msg_backoff"), () => {})

  await vi.advanceTimersByTimeAsync(499)
  expect(sink.attempts).toHaveLength(1)
  await vi.advanceTimersByTimeAsync(1)
  expect(sink.attempts).toHaveLength(2)
  await vi.advanceTimersByTimeAsync(999)
  expect(sink.attempts).toHaveLength(2)
  await vi.advanceTimersByTimeAsync(1)
  expect(sink.attempts).toHaveLength(3)
  await vi.advanceTimersByTimeAsync(2000)
  expect(await result).toEqual({ kind: "delivered" })
}

async function giveUpAfterSixAttempts(): Promise<void> {
  const sink = new FlakyNoticeSink(100)
  const result = new NoticeDelivery(sink).send(testNotice("msg_down"), () => {})

  await vi.advanceTimersByTimeAsync(60_000)
  expect(await result).toEqual({ kind: "gave_up", reason: "temporary failure 6" })
  expect(sink.attempts).toHaveLength(6)
}

async function stopRetryingWhenCancelled(): Promise<void> {
  const sink = new FlakyNoticeSink(100)
  const delivery = new NoticeDelivery(sink)
  const result = delivery.send(testNotice("msg_cancel"), () => {})

  await vi.advanceTimersByTimeAsync(100)
  delivery.cancel()
  expect(await result).toEqual({ kind: "cancelled" })
  await vi.advanceTimersByTimeAsync(60_000)
  expect(sink.attempts).toHaveLength(1)
  expect(vi.getTimerCount()).toBe(0)
}

async function deliverAtFirstAttempt(): Promise<void> {
  const sink = new FlakyNoticeSink(0)

  expect(await new NoticeDelivery(sink).send(testNotice("msg_ok"), () => {})).toEqual({ kind: "delivered" })
  expect(vi.getTimerCount()).toBe(0)
}

function registerTests(): void {
  beforeEach(useFakeClock)
  afterEach(useRealClock)
  test("reenvia o aviso com o mesmo id até conseguir", retryWithSameId)
  test("espera 500 ms, 1 s, 2 s... entre as tentativas", backOffExponentially)
  test("desiste depois de 6 tentativas e informa o último erro", giveUpAfterSixAttempts)
  test("para de reenviar quando cancelado e não deixa timer", stopRetryingWhenCancelled)
  test("entrega na primeira tentativa sem criar timer", deliverAtFirstAttempt)
}

describe("reenvio de avisos", registerTests)
