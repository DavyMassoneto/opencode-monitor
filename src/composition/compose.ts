import { CREATE_NOTICE_ID, type MonitorHost, registerMonitorTools, SyntheticNoticeSink } from "#monitor/integration"
import { createMonitors } from "#monitor/modules"
import { type MonitorCleanup } from "./types"

export async function compose(host: MonitorHost): Promise<MonitorCleanup> {
  const monitors = createMonitors(new SyntheticNoticeSink(host.session), CREATE_NOTICE_ID)

  await registerMonitorTools(host, monitors)
  return () => monitors.stopAll()
}
