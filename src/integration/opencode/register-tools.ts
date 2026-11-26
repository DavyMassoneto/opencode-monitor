import { type Monitors } from "#monitor/modules"
import {
  MONITOR_LIST_DESCRIPTION,
  MONITOR_LIST_TOOL,
  MONITOR_START_DESCRIPTION,
  MONITOR_START_TOOL,
  MONITOR_STOP_DESCRIPTION,
  MONITOR_STOP_TOOL,
} from "./constants"
import { listMonitors } from "./list-monitors"
import { MONITOR_LIST_INPUT, MONITOR_START_INPUT, MONITOR_STOP_INPUT } from "./schemas"
import { startMonitor } from "./start-monitor"
import { stopMonitor } from "./stop-monitor"
import { type MonitorHost } from "./types"

export async function registerMonitorTools(host: MonitorHost, monitors: Monitors): Promise<void> {
  await host.tool.transform((editor) => {
    editor.add({
      name: MONITOR_START_TOOL,
      description: MONITOR_START_DESCRIPTION,
      input: MONITOR_START_INPUT,
      execute: (input, context) => startMonitor(host, monitors, input, context),
    })
    editor.add({
      name: MONITOR_LIST_TOOL,
      description: MONITOR_LIST_DESCRIPTION,
      input: MONITOR_LIST_INPUT,
      execute: async (_input, context) => listMonitors(monitors, context),
    })
    editor.add({
      name: MONITOR_STOP_TOOL,
      description: MONITOR_STOP_DESCRIPTION,
      input: MONITOR_STOP_INPUT,
      execute: async (input, context) => stopMonitor(monitors, input, context),
    })
  })
}
