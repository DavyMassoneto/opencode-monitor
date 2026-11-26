import { type MonitorRequest, type NoticeIdFactory, type NoticeSink } from "#monitor/modules/monitor/public/contracts"
import { type CommandLauncher, type LaunchedCommand } from "../command-port"
import { type NoticeChannel } from "../notice"

export interface RegistryDependencies {
  sink: NoticeSink
  createNoticeId: NoticeIdFactory
  launch: CommandLauncher
}

export type MonitorEnding = "running" | "flooded"

export interface RunningMonitor {
  request: MonitorRequest
  command: LaunchedCommand
  channel: NoticeChannel
  timer: NodeJS.Timeout
  startedAt: Date
  ending: MonitorEnding
}
