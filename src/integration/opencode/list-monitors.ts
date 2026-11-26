import { type Monitors } from "#monitor/modules"
import { type MonitorCallContext, type MonitorToolResult } from "./types"

export function listMonitors(monitors: Monitors, context: MonitorCallContext): MonitorToolResult {
  return { content: JSON.stringify(monitors.list(context.sessionID)) }
}
