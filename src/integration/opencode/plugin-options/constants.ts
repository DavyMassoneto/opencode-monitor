import { type MonitorLimits } from "#monitor/modules"

export const DEFAULT_LIMITS: MonitorLimits = {
  maxMonitorsPerSession: 10,
  lineMaxBytes: 4096,
  batchMaxLines: 50,
  pendingMaxLines: 1000,
  floodLinesPerSecond: 100,
  floodSeconds: 5,
  stderrMaxBytes: 5_242_880,
  retentionMs: 604_800_000,
}
export const MS_PER_DAY = 86_400_000
export const MIN_LINE_MAX_BYTES = 16
export const DEBUG_ENVIRONMENT_VARIABLE = "OPENCODE_MONITOR_DEBUG"
export const DEBUG_ENABLED_VALUES: readonly string[] = ["1", "true"]
export const DEBUG_LOG_NAME = "debug.log"
export const DEBUG_LOG_MAX_BYTES = 1_048_576
export const DEBUG_ROTATED_SUFFIX = ".1"
export const LOG_LINE_BREAK = "\n"
