import { type MonitorLimits } from "#monitor/modules/monitor/public"

export const TEST_SESSION_ID = "ses_monitor_test"
export const TEST_DESCRIPTION = "test output"
export const TEST_LABEL = "monitor: test output"
export const TEST_ENDED_LABEL = "monitor: test output (ended)"
export const MISSING_DIRECTORY = "/nonexistent/opencode-monitor"
export const LONG_RUNNING_GROUP = "sleep 30 & sleep 30"
export const SETTLE_MS = 200
export const PROBE_SIGNAL = 0
export const TEST_NOTICE_ID_PREFIX = "msg_test_"
export const OTHER_SESSION_ID = "ses_other_test"
export const DELIVERY_REJECTION = "Expected a string starting with msg_"
export const TERM_IGNORING_GROUP = "trap '' TERM; echo armed; sleep 30"
export const SESSION_LIMIT = 10
export const TEST_TIMEOUT_MS = 300_000
export const SHORT_TIMEOUT_MS = 300
export const HISTORY_LIMIT = 20
export const GROUP_EXIT_TIMEOUT_MS = 5000
export const STDERR_ROOT_PREFIX = "monitor-stderr-"
export const TEST_ENV_NAME = "MONITOR_TEST_VALUE"
export const TEST_LIMITS: MonitorLimits = {
  maxMonitorsPerSession: 10,
  lineMaxBytes: 4096,
  batchMaxLines: 50,
  pendingMaxLines: 1000,
  floodLinesPerSecond: 100,
  floodSeconds: 5,
  stderrMaxBytes: 5_242_880,
  retentionMs: 604_800_000,
}
export const TICKER_25_LINES = `"${process.execPath}" -e 'let n=0;const t=setInterval(()=>{console.log("tick");if(++n===25)clearInterval(t)},100)'`
export const STEADY_60_LINES = `"${process.execPath}" -e 'let n=0;const t=setInterval(()=>{console.log("steady");if(++n===60)clearInterval(t)},100)'`
export const SLOW_RUNNER_TIMEOUT_MS = 20_000
