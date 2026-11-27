import { HISTORY_PER_SESSION } from "./constants"
import { type FinishedMonitor, type SessionHistory } from "./types"

export class MonitorHistory {
  private readonly sessions: SessionHistory = new Map()

  record(finished: FinishedMonitor): void {
    const { sessionID } = finished.monitor.request
    const entries = this.sessions.get(sessionID)

    if (entries) {
      entries.push(finished)
      if (entries.length > HISTORY_PER_SESSION) {
        entries.shift()
      }
    } else {
      this.sessions.set(sessionID, [finished])
    }
  }

  list(sessionID: string): readonly FinishedMonitor[] {
    const entries = this.sessions.get(sessionID)

    if (entries) {
      return entries
    }
    return []
  }

  all(): FinishedMonitor[] {
    return Array.from(this.sessions.values()).flat()
  }

  forget(sessionID: string): void {
    this.sessions.delete(sessionID)
  }

  clear(): void {
    this.sessions.clear()
  }
}
