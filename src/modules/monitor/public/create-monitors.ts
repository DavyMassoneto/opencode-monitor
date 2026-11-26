import { launchCommand } from "../adapters"
import { MonitorRegistry } from "../internal"
import { type Monitors, type NoticeIdFactory, type NoticeSink } from "./contracts"

export function createMonitors(sink: NoticeSink, createNoticeId: NoticeIdFactory): Monitors {
  return new MonitorRegistry({ sink, createNoticeId, launch: launchCommand })
}
