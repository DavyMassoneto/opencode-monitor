import { type FetchRequest, type PendingLines } from "#monitor/modules/monitor/public/contracts"
import { type RunningMonitor } from "./types"

export function pendingOf(monitor: RunningMonitor, request: FetchRequest): PendingLines {
  const content = monitor.channel.fetch(request.peek)
  const pending: PendingLines = { id: monitor.id, lines: content.lines, dropped: content.omitted }

  if (request.stderrLines > 0) {
    pending.stderr = monitor.log.tail(request.stderrLines)
  }
  return pending
}
