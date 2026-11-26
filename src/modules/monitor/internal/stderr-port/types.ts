export interface StderrLog {
  readonly path: string
  append(line: string): void
  tail(count: number): string[]
  close(): void
}

export interface StderrLogOpened {
  kind: "opened"
  log: StderrLog
}

export interface StderrLogFailed {
  kind: "failed"
  reason: string
}

export type StderrLogOpen = StderrLogOpened | StderrLogFailed

export interface StderrStore {
  open(sessionID: string, monitorId: string): StderrLogOpen
  removeSession(sessionID: string): void
  removeAll(): void
  prune(now: number): void
}
