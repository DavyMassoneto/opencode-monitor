import { randomBytes } from "node:crypto"
import { MONITOR_ID_BYTES, MONITOR_ID_ENCODING, MONITOR_ID_PREFIX } from "./constants"

export function createMonitorId(): string {
  return `${MONITOR_ID_PREFIX}${randomBytes(MONITOR_ID_BYTES).toString(MONITOR_ID_ENCODING)}`
}
