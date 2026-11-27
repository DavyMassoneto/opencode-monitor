import { launchWith, StderrFiles, selectPlatform } from "../adapters"
import { MonitorRegistry } from "../internal"
import { type MonitorSettings, type Monitors, type NoticeIdFactory, type NoticeSink } from "./contracts"

export function createMonitors(sink: NoticeSink, createNoticeId: NoticeIdFactory, settings: MonitorSettings): Monitors {
  const { limits, logger } = settings
  const stderr = new StderrFiles(settings.stderrRoot, limits.stderrMaxBytes, limits.retentionMs)
  const platform = selectPlatform(process.platform)

  stderr.prune(Date.now())
  return new MonitorRegistry({
    sink,
    createNoticeId,
    launch: (request, handlers) => launchWith(platform, request, handlers),
    stderr,
    limits,
    logger,
  })
}
