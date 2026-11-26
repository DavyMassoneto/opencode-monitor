import { launchCommand, StderrFiles } from "../adapters"
import { MonitorRegistry } from "../internal"
import { type Monitors, type NoticeIdFactory, type NoticeSink } from "./contracts"

export function createMonitors(sink: NoticeSink, createNoticeId: NoticeIdFactory, stderrRoot: string): Monitors {
  const stderr = new StderrFiles(stderrRoot)

  stderr.prune(Date.now())
  return new MonitorRegistry({ sink, createNoticeId, launch: launchCommand, stderr })
}
