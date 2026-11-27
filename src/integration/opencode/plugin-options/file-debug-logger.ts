import { appendFileSync, existsSync, mkdirSync, renameSync, statSync } from "node:fs"
import { dirname } from "node:path"
import { type MonitorLogger } from "#monitor/modules"
import { DEBUG_LOG_MAX_BYTES, DEBUG_ROTATED_SUFFIX, LOG_LINE_BREAK } from "./constants"

export class FileDebugLogger implements MonitorLogger {
  private readonly path: string
  private readonly enabled: boolean

  constructor(path: string, enabled: boolean) {
    this.path = path
    this.enabled = enabled
  }

  debug(message: string): void {
    if (this.enabled) {
      mkdirSync(dirname(this.path), { recursive: true })
      if (existsSync(this.path) && statSync(this.path).size > DEBUG_LOG_MAX_BYTES) {
        renameSync(this.path, `${this.path}${DEBUG_ROTATED_SUFFIX}`)
      }
      appendFileSync(this.path, `${new Date().toISOString()} ${message}${LOG_LINE_BREAK}`)
    }
  }
}
