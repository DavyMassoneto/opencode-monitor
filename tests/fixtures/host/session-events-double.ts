import { type MonitorEventHost, type SessionDeletedEvent, type SessionDeletedSubscription } from "#monitor/integration"
import { type WakeSubscriber } from "./types"

export class SessionEventsDouble implements MonitorEventHost {
  private readonly queue: SessionDeletedEvent[] = []
  private wake: WakeSubscriber = () => {}
  readonly subscriptions: SessionDeletedSubscription[] = []

  emitDeleted(sessionID: string): void {
    this.queue.push({ data: { sessionID } })
    this.wake()
  }

  async *subscribe(options: SessionDeletedSubscription): AsyncIterable<SessionDeletedEvent> {
    this.subscriptions.push(options)
    while (!options.signal.aborted) {
      const event = this.queue.shift()
      if (event) {
        yield event
      } else {
        await new Promise<void>((resolve) => {
          this.wake = resolve
          options.signal.addEventListener("abort", () => resolve(), { once: true })
        })
      }
    }
  }
}
