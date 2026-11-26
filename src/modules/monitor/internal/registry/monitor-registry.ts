import {
  MONITOR_FAILED_KIND,
  MONITOR_STARTED_KIND,
  type MonitorRequest,
  type MonitorStart,
  type MonitorSummary,
  type Monitors,
} from "#monitor/modules/monitor/public/contracts"
import { COMMAND_FAILED_KIND, type CommandExit } from "../command-port"
import { NoticeChannel } from "../notice"
import { MONITOR_TIMEOUT_MS } from "./constants"
import { createMonitorId } from "./monitor-id"
import { type RegistryDependencies, type RunningMonitor } from "./types"

export class MonitorRegistry implements Monitors {
  private readonly dependencies: RegistryDependencies
  private readonly running = new Map<string, RunningMonitor>()

  constructor(dependencies: RegistryDependencies) {
    this.dependencies = dependencies
  }

  start(request: MonitorRequest): MonitorStart {
    const id = createMonitorId()
    const channel = new NoticeChannel(this.dependencies.sink, this.dependencies.createNoticeId, request, id)
    const command = this.dependencies.launch(
      { command: request.command, directory: request.directory },
      { onLine: (line) => channel.sendLine(line), onExit: (exit) => this.finish(id, exit) },
    )

    if (command.kind === COMMAND_FAILED_KIND) {
      return { kind: MONITOR_FAILED_KIND, reason: command.reason }
    }
    const timer = setTimeout(() => command.stop(), MONITOR_TIMEOUT_MS)
    this.running.set(id, { request, command, channel, timer })
    return { kind: MONITOR_STARTED_KIND, id, pid: command.pid }
  }

  list(sessionID: string): MonitorSummary[] {
    const summaries: MonitorSummary[] = []

    for (const [id, monitor] of this.running) {
      if (monitor.request.sessionID === sessionID) {
        summaries.push({
          id,
          description: monitor.request.description,
          command: monitor.request.command,
          pid: monitor.command.pid,
          delivery: monitor.channel.delivery,
        })
      }
    }
    return summaries
  }

  stopAll(): void {
    for (const monitor of this.running.values()) {
      clearTimeout(monitor.timer)
      monitor.channel.close()
      monitor.command.stop()
    }
    this.running.clear()
  }

  private finish(id: string, exit: CommandExit): void {
    const monitor = this.running.get(id)

    if (monitor) {
      clearTimeout(monitor.timer)
      this.running.delete(id)
      monitor.channel.sendExit(exit)
    }
  }
}
