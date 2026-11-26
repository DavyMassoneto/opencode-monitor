import { MONITOR_FAILED_KIND, type Monitors } from "#monitor/modules"
import { assertDirectoryPermission } from "./assert-directory-permission"
import { assertShellPermission } from "./assert-shell-permission"
import { monitorRequest } from "./monitor-request"
import { type MonitorCallContext, type MonitorHost, type MonitorStartInput, type MonitorToolResult } from "./types"
import { workingDirectory } from "./working-directory"

export async function startMonitor(
  host: MonitorHost,
  monitors: Monitors,
  input: MonitorStartInput,
  context: MonitorCallContext,
): Promise<MonitorToolResult> {
  const directory = workingDirectory(host.location, input)

  await assertDirectoryPermission(host, directory, input, context)
  await assertShellPermission(host, input, context)
  const started = monitors.start(monitorRequest(input, context, directory))

  if (started.kind === MONITOR_FAILED_KIND) {
    throw new Error(started.reason)
  }
  return { content: JSON.stringify(started.summary) }
}
