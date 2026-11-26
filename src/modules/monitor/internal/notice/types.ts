import { type MonitorRequest, type NoticeIdFactory, type NoticeSink } from "#monitor/modules/monitor/public/contracts"

export interface NoticeHeader {
  monitorId: string
  sequence: number
  description: string
}

export type FloodHandler = () => void

export interface ChannelSetup {
  sink: NoticeSink
  createNoticeId: NoticeIdFactory
  request: MonitorRequest
  monitorId: string
  onFlood: FloodHandler
}

export interface ChannelCounts {
  received: number
  delivered: number
  dropped: number
  last?: string
}
