import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  CREATE_NOTICE_ID,
  type MonitorHost,
  registerMonitorTools,
  SyntheticNoticeSink,
  watchDeletedSessions,
} from "#monitor/integration"
import { createMonitors } from "#monitor/modules"
import { STDERR_ROOT_NAME } from "./constants"
import { type MonitorCleanup } from "./types"

export async function compose(host: MonitorHost): Promise<MonitorCleanup> {
  const monitors = createMonitors(
    new SyntheticNoticeSink(host.session),
    CREATE_NOTICE_ID,
    join(tmpdir(), STDERR_ROOT_NAME),
  )
  const watching = new AbortController()

  await registerMonitorTools(host, monitors)
  watchDeletedSessions(host.event, monitors, watching.signal)
  return () => {
    watching.abort()
    monitors.stopAll()
  }
}
