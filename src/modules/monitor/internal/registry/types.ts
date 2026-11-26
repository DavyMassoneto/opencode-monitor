import {
  type MonitorRequest,
  type MonitorStatus,
  type NoticeIdFactory,
  type NoticeSink,
} from "#monitor/modules/monitor/public/contracts"
import { type CommandLauncher, type LaunchedCommand } from "../command-port"
import { type DeadlineTimer } from "../deadline"
import { type NoticeChannel } from "../notice"

export interface RegistryDependencies {
  sink: NoticeSink
  createNoticeId: NoticeIdFactory
  launch: CommandLauncher
}

export type MonitorEnding = "running" | "flooded" | "expired"

export interface RunningMonitor {
  id: string
  request: MonitorRequest
  command: LaunchedCommand
  channel: NoticeChannel
  startedAt: Date
  ending: MonitorEnding
  expiresAt?: Date
  deadline?: DeadlineTimer
}

export interface FinishedMonitor {
  monitor: RunningMonitor
  status: MonitorStatus
  endedAt: Date
}

export type SessionHistory = Map<string, FinishedMonitor[]>

export interface EndingNotice {
  status: MonitorStatus
  text: string
  labelSuffix: string
}
