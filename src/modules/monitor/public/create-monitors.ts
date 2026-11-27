import { launchCommand, StderrFiles } from "../adapters"
import { MonitorRegistry } from "../internal"
import { type MonitorSettings, type Monitors, type NoticeIdFactory, type NoticeSink } from "./contracts"

export function createMonitors(sink: NoticeSink, createNoticeId: NoticeIdFactory, settings: MonitorSettings): Monitors {
  const { limits, logger } = settings
  const stderr = new StderrFiles(settings.stderrRoot, limits.stderrMaxBytes, limits.retentionMs)

  stderr.prune(Date.now())
  return new MonitorRegistry({ sink, createNoticeId, launch: launchCommand, stderr, limits, logger })
}
