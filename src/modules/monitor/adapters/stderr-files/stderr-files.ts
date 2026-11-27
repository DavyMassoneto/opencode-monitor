import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs"
import { join } from "node:path"
import {
  STDERR_LOG_FAILED_KIND,
  STDERR_LOG_OPENED_KIND,
  type StderrLogOpen,
  type StderrStore,
} from "#monitor/modules/monitor/internal"
import { STDERR_DIRECTORY_FAILURE_TEXT, STDERR_SUFFIX, UNSAFE_SESSION_TEXT } from "./constants"
import { isSafeSessionId } from "./predicates"
import { StderrLogFile } from "./stderr-log-file"

export class StderrFiles implements StderrStore {
  private readonly root: string
  private readonly maxBytes: number
  private readonly retentionMs: number
  private readonly sessions = new Set<string>()

  constructor(root: string, maxBytes: number, retentionMs: number) {
    this.root = root
    this.maxBytes = maxBytes
    this.retentionMs = retentionMs
  }

  open(sessionID: string, monitorId: string): StderrLogOpen {
    if (!isSafeSessionId(sessionID)) {
      return { kind: STDERR_LOG_FAILED_KIND, reason: UNSAFE_SESSION_TEXT }
    }
    const directory = join(this.root, sessionID)
    try {
      mkdirSync(directory, { recursive: true })
    } catch (error) {
      return { kind: STDERR_LOG_FAILED_KIND, reason: `${STDERR_DIRECTORY_FAILURE_TEXT}${String(error)}` }
    }
    this.sessions.add(sessionID)
    return {
      kind: STDERR_LOG_OPENED_KIND,
      log: new StderrLogFile(join(directory, `${monitorId}${STDERR_SUFFIX}`), this.maxBytes),
    }
  }

  removeSession(sessionID: string): void {
    if (isSafeSessionId(sessionID)) {
      rmSync(join(this.root, sessionID), { recursive: true, force: true })
      this.sessions.delete(sessionID)
    }
  }

  removeAll(): void {
    for (const sessionID of this.sessions) {
      this.removeSession(sessionID)
    }
  }

  prune(now: number): void {
    if (existsSync(this.root)) {
      for (const sessionID of readdirSync(this.root).filter(isSafeSessionId)) {
        if (now - statSync(join(this.root, sessionID)).mtimeMs > this.retentionMs) {
          this.removeSession(sessionID)
        }
      }
    }
  }
}
