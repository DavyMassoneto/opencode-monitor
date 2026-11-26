import { MONITOR_NOT_FOUND_KIND, type Monitors } from "#monitor/modules"
import { MONITOR_NOT_FOUND_TEXT } from "./constants"
import { type MonitorCallContext, type MonitorStopInput, type MonitorToolResult } from "./types"

export function stopMonitor(
  monitors: Monitors,
  input: MonitorStopInput,
  context: MonitorCallContext,
): MonitorToolResult {
  const stopped = monitors.stop(context.sessionID, input.id)

  if (stopped.kind === MONITOR_NOT_FOUND_KIND) {
    throw new Error(`${MONITOR_NOT_FOUND_TEXT}${stopped.id}`)
  }
  return { content: JSON.stringify(stopped.summary) }
}
