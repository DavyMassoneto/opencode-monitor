import { type PendingLines } from "#monitor/modules/monitor/public/contracts"
import { type RunningMonitor } from "./types"

export function pendingOf(monitor: RunningMonitor, peek: boolean): PendingLines {
  const content = monitor.channel.fetch(peek)

  return { id: monitor.id, lines: content.lines, dropped: content.omitted }
}
