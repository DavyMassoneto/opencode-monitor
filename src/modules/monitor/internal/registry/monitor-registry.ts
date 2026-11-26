import {
  type FetchRequest,
  LINES_FETCHED_KIND,
  MONITOR_FAILED_KIND,
  MONITOR_NOT_FOUND_KIND,
  MONITOR_STARTED_KIND,
  MONITOR_STOPPED_KIND,
  type MonitorFetch,
  type MonitorRequest,
  type MonitorStart,
  type MonitorStatus,
  type MonitorStop,
  type MonitorSummary,
  type Monitors,
  STATUS_STOPPED,
  TIMED_LIFETIME_KIND,
} from "#monitor/modules/monitor/public/contracts"
import { COMMAND_FAILED_KIND, type CommandExit } from "../command-port"
import { DeadlineTimer } from "../deadline"
import { NoticeChannel } from "../notice"
import {
  ENDING_EXPIRED,
  ENDING_FLOODED,
  ENDING_RUNNING,
  MAX_MONITORS_PER_SESSION,
  SESSION_LIMIT_TEXT,
} from "./constants"
import { endingNotice } from "./ending-notice"
import { MonitorHistory } from "./monitor-history"
import { createMonitorId } from "./monitor-id"
import { pendingOf } from "./pending-of"
import { summarizeFinished, summarizeRunning } from "./summarize"
import { type MonitorEnding, type RegistryDependencies, type RunningMonitor } from "./types"

export class MonitorRegistry implements Monitors {
  private readonly dependencies: RegistryDependencies
  private readonly running = new Map<string, RunningMonitor>()
  private readonly history = new MonitorHistory()

  constructor(dependencies: RegistryDependencies) {
    this.dependencies = dependencies
  }

  start(request: MonitorRequest): MonitorStart {
    if (this.runningIn(request.sessionID).length >= MAX_MONITORS_PER_SESSION) {
      return { kind: MONITOR_FAILED_KIND, reason: SESSION_LIMIT_TEXT }
    }
    return this.launch(request)
  }

  list(sessionID: string): MonitorSummary[] {
    return [...this.runningIn(sessionID).map(summarizeRunning), ...this.history.list(sessionID).map(summarizeFinished)]
  }

  stop(sessionID: string, id: string): MonitorStop {
    const monitor = this.running.get(id)

    if (!monitor || monitor.request.sessionID !== sessionID) {
      return { kind: MONITOR_NOT_FOUND_KIND, id }
    }
    this.halt(monitor)
    return { kind: MONITOR_STOPPED_KIND, summary: this.retire(monitor, STATUS_STOPPED) }
  }

  fetch(request: FetchRequest): MonitorFetch {
    const monitors = this.knownIn(request.sessionID)

    if (request.id) {
      const monitor = monitors.find((candidate) => candidate.id === request.id)
      if (!monitor) {
        return { kind: MONITOR_NOT_FOUND_KIND, id: request.id }
      }
      return { kind: LINES_FETCHED_KIND, monitors: [pendingOf(monitor, request.peek)] }
    }
    const fetched = monitors.map((monitor) => pendingOf(monitor, request.peek))
    return {
      kind: LINES_FETCHED_KIND,
      monitors: fetched.filter((pending) => pending.lines.length > 0 || pending.dropped > 0),
    }
  }

  stopSession(sessionID: string): void {
    for (const monitor of this.runningIn(sessionID)) {
      this.halt(monitor)
    }
    this.history.forget(sessionID)
  }

  stopAll(): void {
    for (const monitor of this.running.values()) {
      this.halt(monitor)
    }
    this.history.clear()
  }

  private knownIn(sessionID: string): RunningMonitor[] {
    return [...this.runningIn(sessionID), ...this.history.list(sessionID).map((finished) => finished.monitor)]
  }

  private runningIn(sessionID: string): RunningMonitor[] {
    return Array.from(this.running.values()).filter((monitor) => monitor.request.sessionID === sessionID)
  }

  private launch(request: MonitorRequest): MonitorStart {
    const id = createMonitorId()
    const { sink, createNoticeId, launch } = this.dependencies
    const channel = new NoticeChannel({
      sink,
      createNoticeId,
      request,
      monitorId: id,
      onFlood: () => this.endEarly(id, ENDING_FLOODED),
    })
    const command = launch(
      { command: request.command, directory: request.directory },
      { onLine: (line) => channel.receiveLine(line), onExit: (exit) => this.finish(id, exit) },
    )

    if (command.kind === COMMAND_FAILED_KIND) {
      return { kind: MONITOR_FAILED_KIND, reason: command.reason }
    }
    const monitor: RunningMonitor = { id, request, command, channel, startedAt: new Date(), ending: ENDING_RUNNING }
    this.arm(monitor)
    this.running.set(id, monitor)
    return { kind: MONITOR_STARTED_KIND, summary: summarizeRunning(monitor) }
  }

  private arm(monitor: RunningMonitor): void {
    const { lifetime } = monitor.request

    if (lifetime.kind === TIMED_LIFETIME_KIND) {
      monitor.expiresAt = new Date(monitor.startedAt.getTime() + lifetime.timeoutMs)
      monitor.deadline = new DeadlineTimer(monitor.expiresAt, () => this.endEarly(monitor.id, ENDING_EXPIRED))
      monitor.deadline.start()
    }
  }

  private halt(monitor: RunningMonitor): void {
    monitor.deadline?.cancel()
    monitor.channel.close()
    monitor.command.stop()
    this.running.delete(monitor.id)
  }

  private retire(monitor: RunningMonitor, status: MonitorStatus): MonitorSummary {
    const finished = { monitor, status, endedAt: new Date() }

    this.history.record(finished)
    return summarizeFinished(finished)
  }

  private endEarly(id: string, ending: MonitorEnding): void {
    const monitor = this.running.get(id)

    if (monitor) {
      monitor.ending = ending
      monitor.command.stop()
    }
  }

  private finish(id: string, exit: CommandExit): void {
    const monitor = this.running.get(id)

    if (monitor) {
      const notice = endingNotice(monitor, exit)
      monitor.deadline?.cancel()
      this.running.delete(id)
      monitor.channel.end(notice.text, notice.labelSuffix)
      this.retire(monitor, notice.status)
    }
  }
}
