import { MONITOR_FAILED_KIND, type Monitors } from "#monitor/modules"
import { MONITOR_RUNNING_STATUS, MONITOR_START_TOOL, PERMISSION_SOURCE_TYPE, SHELL_PERMISSION } from "./constants"
import {
  type MonitorCallContext,
  type MonitorHost,
  type MonitorPattern,
  type MonitorStartInput,
  type MonitorToolResult,
} from "./types"

export async function startMonitor(
  host: MonitorHost,
  monitors: Monitors,
  input: MonitorStartInput,
  context: MonitorCallContext,
): Promise<MonitorToolResult> {
  await host.permission.assert({
    sessionID: context.sessionID,
    agent: context.agent,
    source: { type: PERMISSION_SOURCE_TYPE, messageID: context.messageID, id: context.id },
    action: SHELL_PERMISSION,
    resources: [input.command],
    save: [input.command],
    metadata: { tool: MONITOR_START_TOOL, description: input.description },
  })
  const started = monitors.start({
    sessionID: context.sessionID,
    command: input.command,
    description: input.description,
    directory: host.location.directory,
    ...patternOf(input),
  })

  if (started.kind === MONITOR_FAILED_KIND) {
    throw new Error(started.reason)
  }
  return { content: JSON.stringify({ id: started.id, pid: started.pid, status: MONITOR_RUNNING_STATUS }) }
}

function patternOf(input: MonitorStartInput): MonitorPattern {
  if (input.pattern) {
    return { pattern: input.pattern }
  }
  return {}
}
