export const MONITOR_ID_PREFIX = "m_"
export const MONITOR_ID_BYTES = 4
export const MONITOR_ID_ENCODING = "hex"
export const MONITOR_TIMEOUT_MS = 300_000
export const MAX_MONITORS_PER_SESSION = 10
export const SESSION_LIMIT_TEXT = `this session already has ${MAX_MONITORS_PER_SESSION} running monitors: stop one with monitor_stop before starting another`
export const ENDING_RUNNING = "running"
export const ENDING_FLOODED = "flooded"
export const ENDED_LABEL_SUFFIX = " (ended)"
export const FLOODED_LABEL_SUFFIX = " (flooded)"
export const FLOODED_TEXT =
  "monitor stopped: the command printed more than 100 lines per second for 5 seconds. Start it again with a stricter filter, such as grep --line-buffered with the states you need."
