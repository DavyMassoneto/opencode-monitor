import {
  MONITOR_FAILED_KIND,
  MONITOR_NOT_FOUND_KIND,
  MONITOR_STARTED_KIND,
  MONITOR_STOPPED_KIND,
  type MonitorRequest,
  type MonitorStart,
  type MonitorStop,
  type MonitorSummary,
  type Monitors,
} from "#monitor/modules/monitor/public/contracts"
import { COMMAND_FAILED_KIND, type CommandExit } from "../command-port"
import { exitLine, NoticeChannel } from "../notice"
import {
  ENDED_LABEL_SUFFIX,
  ENDING_FLOODED,
  ENDING_RUNNING,
  FLOODED_LABEL_SUFFIX,
  FLOODED_TEXT,
  MAX_MONITORS_PER_SESSION,
  MONITOR_TIMEOUT_MS,
  SESSION_LIMIT_TEXT,
} from "./constants"
import { createMonitorId } from "./monitor-id"
import { summarize } from "./summarize"
import { type RegistryDependencies, type RunningMonitor } from "./types"

export class MonitorRegistry implements Monitors {
  private readonly dependencies: RegistryDependencies
  private readonly running = new Map<string, RunningMonitor>()

  constructor(dependencies: RegistryDependencies) {
    this.dependencies = dependencies
  }

  start(request: MonitorRequest): MonitorStart {
    if (this.list(request.sessionID).length >= MAX_MONITORS_PER_SESSION) {
      return { kind: MONITOR_FAILED_KIND, reason: SESSION_LIMIT_TEXT }
    }
    return this.launch(request)
  }

  list(sessionID: string): MonitorSummary[] {
    const summaries: MonitorSummary[] = []

    for (const [id, monitor] of this.running) {
      if (monitor.request.sessionID === sessionID) {
        summaries.push(summarize(id, monitor))
      }
    }
    return summaries
  }

  stop(sessionID: string, id: string): MonitorStop {
    const monitor = this.running.get(id)

    if (!monitor || monitor.request.sessionID !== sessionID) {
      return { kind: MONITOR_NOT_FOUND_KIND, id }
    }
    this.halt(id, monitor)
    return { kind: MONITOR_STOPPED_KIND, summary: summarize(id, monitor) }
  }

  stopSession(sessionID: string): void {
    for (const [id, monitor] of this.running) {
      if (monitor.request.sessionID === sessionID) {
        this.halt(id, monitor)
      }
    }
  }

  stopAll(): void {
    for (const [id, monitor] of this.running) {
      this.halt(id, monitor)
    }
  }

  private launch(request: MonitorRequest): MonitorStart {
    const id = createMonitorId()
    const { sink, createNoticeId, launch } = this.dependencies
    const channel = new NoticeChannel({ sink, createNoticeId, request, monitorId: id, onFlood: () => this.flood(id) })
    const command = launch(
      { command: request.command, directory: request.directory },
      { onLine: (line) => channel.receiveLine(line), onExit: (exit) => this.finish(id, exit) },
    )

    if (command.kind === COMMAND_FAILED_KIND) {
      return { kind: MONITOR_FAILED_KIND, reason: command.reason }
    }
    const timer = setTimeout(() => command.stop(), MONITOR_TIMEOUT_MS)
    this.running.set(id, { request, command, channel, timer, startedAt: new Date(), ending: ENDING_RUNNING })
    return { kind: MONITOR_STARTED_KIND, id, pid: command.pid }
  }

  private halt(id: string, monitor: RunningMonitor): void {
    clearTimeout(monitor.timer)
    monitor.channel.close()
    monitor.command.stop()
    this.running.delete(id)
  }

  private flood(id: string): void {
    const monitor = this.running.get(id)

    if (monitor) {
      monitor.ending = ENDING_FLOODED
      monitor.command.stop()
    }
  }

  private finish(id: string, exit: CommandExit): void {
    const monitor = this.running.get(id)

    if (monitor) {
      clearTimeout(monitor.timer)
      this.running.delete(id)
      if (monitor.ending === ENDING_FLOODED) {
        monitor.channel.end(FLOODED_TEXT, FLOODED_LABEL_SUFFIX)
      } else {
        monitor.channel.end(exitLine(exit), ENDED_LABEL_SUFFIX)
      }
    }
  }
}
