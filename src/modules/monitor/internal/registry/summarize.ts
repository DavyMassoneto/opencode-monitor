import { type MonitorSummary } from "#monitor/modules/monitor/public/contracts"
import { type RunningMonitor } from "./types"

export function summarize(id: string, monitor: RunningMonitor): MonitorSummary {
  return {
    id,
    description: monitor.request.description,
    command: monitor.request.command,
    pid: monitor.command.pid,
    startedAt: monitor.startedAt.toISOString(),
    lines: monitor.channel.lines,
    delivery: monitor.channel.delivery,
  }
}
