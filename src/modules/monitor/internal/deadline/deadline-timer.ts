import { MAX_TIMER_MS } from "./constants"
import { type ExpireHandler } from "./types"

export class DeadlineTimer {
  private readonly expiresAt: Date
  private readonly onExpire: ExpireHandler
  private timer?: NodeJS.Timeout

  constructor(expiresAt: Date, onExpire: ExpireHandler) {
    this.expiresAt = expiresAt
    this.onExpire = onExpire
  }

  start(): void {
    const remaining = this.expiresAt.getTime() - Date.now()

    if (remaining > MAX_TIMER_MS) {
      this.timer = setTimeout(() => this.start(), MAX_TIMER_MS)
    } else {
      this.timer = setTimeout(this.onExpire, remaining)
    }
  }

  cancel(): void {
    clearTimeout(this.timer)
  }
}
