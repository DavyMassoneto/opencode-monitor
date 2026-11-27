import {
  type MonitorLimits,
  STATUS_EXITED,
  STATUS_EXPIRED,
  STATUS_FLOODED,
  TIMED_LIFETIME_KIND,
} from "#monitor/modules/monitor/public/contracts"
import { type CommandExit } from "../command-port"
import { exitLine } from "../notice"
import {
  ENDED_LABEL_SUFFIX,
  ENDING_EXPIRED,
  ENDING_FLOODED,
  EXIT_LINES_CLOSING,
  EXIT_LINES_OPENING,
  EXPIRED_CLOSING,
  EXPIRED_LABEL_SUFFIX,
  EXPIRED_OPENING,
  FLOODED_CLOSING,
  FLOODED_LABEL_SUFFIX,
  FLOODED_MIDDLE,
  FLOODED_OPENING,
  LAST_LINE_OPENING,
} from "./constants"
import { type EndingNotice, type RunningMonitor } from "./types"

export function endingNotice(monitor: RunningMonitor, exit: CommandExit, limits: MonitorLimits): EndingNotice {
  const { lifetime } = monitor.request

  if (monitor.ending === ENDING_FLOODED) {
    const { floodLinesPerSecond, floodSeconds } = limits
    const text = `${FLOODED_OPENING}${floodLinesPerSecond}${FLOODED_MIDDLE}${floodSeconds}${FLOODED_CLOSING}`
    return { status: STATUS_FLOODED, text, labelSuffix: FLOODED_LABEL_SUFFIX }
  }
  if (monitor.ending === ENDING_EXPIRED && lifetime.kind === TIMED_LIFETIME_KIND) {
    const text = `${EXPIRED_OPENING}${lifetime.timeoutMs}${EXPIRED_CLOSING}`
    return { status: STATUS_EXPIRED, text, labelSuffix: EXPIRED_LABEL_SUFFIX }
  }
  return { status: STATUS_EXITED, text: exitText(monitor, exit), labelSuffix: ENDED_LABEL_SUFFIX }
}

function exitText(monitor: RunningMonitor, exit: CommandExit): string {
  const { received, last } = monitor.channel.lines
  const text = `${exitLine(exit)}${EXIT_LINES_OPENING}${received}${EXIT_LINES_CLOSING}`

  if (typeof last === "string") {
    return `${text}${LAST_LINE_OPENING}${last}`
  }
  return text
}
