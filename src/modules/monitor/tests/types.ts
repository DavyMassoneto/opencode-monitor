import { type Monitors } from "#monitor/modules/monitor/public"
import { type RecordingLogger, type RecordingNoticeSink } from "./doubles"

export interface MonitorTestSut {
  monitors: Monitors
  sink: RecordingNoticeSink
  stderrRoot: string
  pids: number[]
  logger: RecordingLogger
}
