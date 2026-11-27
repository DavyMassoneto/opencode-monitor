import { type Notice, type NoticeSink } from "#monitor/modules/monitor/public/contracts"
import { CANCELLED_KIND, DELIVERED_KIND, GAVE_UP_KIND, RETRY_ATTEMPTS, RETRY_BASE_MS, RETRY_MAX_MS } from "./constants"
import { type DeliveryResult, type FailureHandler, type WakeHandler } from "./types"

export class NoticeDelivery {
  private readonly sink: NoticeSink
  private cancelled = false
  private timer?: NodeJS.Timeout
  private wake: WakeHandler = () => {}

  constructor(sink: NoticeSink) {
    this.sink = sink
  }

  async send(notice: Notice, onFailure: FailureHandler): Promise<DeliveryResult> {
    let reason = ""

    for (let attempt = 0; attempt < RETRY_ATTEMPTS && !this.cancelled; attempt += 1) {
      if (attempt > 0) {
        await this.pause(Math.min(RETRY_BASE_MS * 2 ** (attempt - 1), RETRY_MAX_MS))
      }
      if (!this.cancelled) {
        try {
          await this.sink.deliver(notice)
          return { kind: DELIVERED_KIND }
        } catch (error) {
          reason = error instanceof Error ? error.message : String(error)
          onFailure(reason)
        }
      }
    }
    if (this.cancelled) {
      return { kind: CANCELLED_KIND }
    }
    return { kind: GAVE_UP_KIND, reason }
  }

  cancel(): void {
    this.cancelled = true
    clearTimeout(this.timer)
    this.wake()
  }

  private async pause(delayMs: number): Promise<void> {
    await new Promise<void>((resolve) => {
      this.wake = resolve
      this.timer = setTimeout(resolve, delayMs)
    })
  }
}
