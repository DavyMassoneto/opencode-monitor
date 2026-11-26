import { type MonitorStatus, type MonitorSummary, STATUS_RUNNING } from "#monitor/modules/monitor/public/contracts"
import { type FinishedMonitor, type RunningMonitor } from "./types"

export function summarizeRunning(monitor: RunningMonitor): MonitorSummary {
  const summary = baseSummary(monitor, STATUS_RUNNING)

  if (monitor.expiresAt) {
    summary.expiresAt = monitor.expiresAt.toISOString()
  }
  return summary
}

export function summarizeFinished(finished: FinishedMonitor): MonitorSummary {
  return { ...baseSummary(finished.monitor, finished.status), endedAt: finished.endedAt.toISOString() }
}

function baseSummary(monitor: RunningMonitor, status: MonitorStatus): MonitorSummary {
  return {
    id: monitor.id,
    description: monitor.request.description,
    command: monitor.request.command,
    pid: monitor.command.pid,
    status,
    startedAt: monitor.startedAt.toISOString(),
    lines: monitor.channel.lines,
    delivery: monitor.channel.delivery,
  }
}
