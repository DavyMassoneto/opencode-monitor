import { type Monitors } from "#monitor/modules"
import { MONITOR_START_DESCRIPTION, MONITOR_START_TOOL } from "./constants"
import { MONITOR_START_INPUT } from "./schemas"
import { startMonitor } from "./start-monitor"
import { type MonitorHost } from "./types"

export async function registerMonitorTools(host: MonitorHost, monitors: Monitors): Promise<void> {
  await host.tool.transform((editor) => {
    editor.add({
      name: MONITOR_START_TOOL,
      description: MONITOR_START_DESCRIPTION,
      input: MONITOR_START_INPUT,
      execute: (input, context) => startMonitor(host, monitors, input, context),
    })
  })
}
