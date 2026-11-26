import { MONITOR_FAILED_KIND, type Monitors } from "#monitor/modules"
import { assertShellPermission } from "./assert-shell-permission"
import { monitorRequest } from "./monitor-request"
import { type MonitorCallContext, type MonitorHost, type MonitorStartInput, type MonitorToolResult } from "./types"

export async function startMonitor(
  host: MonitorHost,
  monitors: Monitors,
  input: MonitorStartInput,
  context: MonitorCallContext,
): Promise<MonitorToolResult> {
  await assertShellPermission(host, input, context)
  const started = monitors.start(monitorRequest(input, context, host.location.directory))

  if (started.kind === MONITOR_FAILED_KIND) {
    throw new Error(started.reason)
  }
  return { content: JSON.stringify(started.summary) }
}
