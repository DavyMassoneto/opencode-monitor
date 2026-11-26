export interface TimedLifetime {
  kind: "timed"
  timeoutMs: number
}

export interface PersistentLifetime {
  kind: "persistent"
}

export type MonitorLifetime = TimedLifetime | PersistentLifetime

export interface MonitorRequest {
  sessionID: string
  command: string
  description: string
  directory: string
  lifetime: MonitorLifetime
  pattern?: RegExp
}

export interface MonitorStarted {
  kind: "started"
  summary: MonitorSummary
}

export interface MonitorFailed {
  kind: "failed"
  reason: string
}

export type MonitorStart = MonitorStarted | MonitorFailed

export interface Notice {
  sessionID: string
  id: string
  monitorId: string
  sequence: number
  label: string
  text: string
}

export interface NoticeSink {
  deliver(notice: Notice): Promise<void>
}

export type NoticeIdFactory = () => string

export interface DeliveryHealthy {
  kind: "healthy"
}

export interface DeliveryFailed {
  kind: "failed"
  noticeId: string
  reason: string
}

export type DeliveryState = DeliveryHealthy | DeliveryFailed

export interface LineCounts {
  received: number
  delivered: number
  last?: string
}

export type MonitorStatus = "running" | "exited" | "stopped" | "expired" | "flooded"

export interface MonitorSummary {
  id: string
  description: string
  command: string
  pid: number
  status: MonitorStatus
  startedAt: string
  expiresAt?: string
  endedAt?: string
  lines: LineCounts
  delivery: DeliveryState
}

export interface MonitorStopped {
  kind: "stopped"
  summary: MonitorSummary
}

export interface MonitorNotFound {
  kind: "not_found"
  id: string
}

export type MonitorStop = MonitorStopped | MonitorNotFound

export interface Monitors {
  start(request: MonitorRequest): MonitorStart
  list(sessionID: string): MonitorSummary[]
  stop(sessionID: string, id: string): MonitorStop
  stopSession(sessionID: string): void
  stopAll(): void
}
