export interface MonitorRequest {
  sessionID: string
  command: string
  description: string
  directory: string
}

export interface MonitorStarted {
  kind: "started"
  id: string
  pid: number
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

export interface MonitorSummary {
  id: string
  description: string
  command: string
  pid: number
  delivery: DeliveryState
}

export interface Monitors {
  start(request: MonitorRequest): MonitorStart
  list(sessionID: string): MonitorSummary[]
  stopAll(): void
}
