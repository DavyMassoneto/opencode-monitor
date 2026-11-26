import { type Monitors } from "#monitor/modules"
import { SESSION_DELETED_EVENT, WATCH_FAILURE_TEXT } from "./constants"
import { type MonitorEventHost } from "./types"

export async function watchDeletedSessions(
  events: MonitorEventHost,
  monitors: Monitors,
  signal: AbortSignal,
): Promise<void> {
  try {
    for await (const event of events.subscribe({ types: [SESSION_DELETED_EVENT], signal })) {
      monitors.stopSession(event.data.sessionID)
    }
  } catch (error) {
    if (!signal.aborted) {
      console.error(WATCH_FAILURE_TEXT, error)
    }
  }
}
