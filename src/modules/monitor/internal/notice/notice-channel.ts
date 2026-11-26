import {
  DELIVERY_FAILED_KIND,
  DELIVERY_HEALTHY_KIND,
  type DeliveryState,
  type MonitorRequest,
  type Notice,
  type NoticeIdFactory,
  type NoticeSink,
} from "#monitor/modules/monitor/public/contracts"
import { type CommandExit } from "../command-port"
import { NOTICE_ENDED_SUFFIX, NOTICE_LABEL_PREFIX } from "./constants"
import { exitLine } from "./exit-line"
import { writeNotice } from "./write-notice"

export class NoticeChannel {
  private readonly sink: NoticeSink
  private readonly createNoticeId: NoticeIdFactory
  private readonly request: MonitorRequest
  private readonly monitorId: string
  private sequence = 0
  private pending: Promise<void> = Promise.resolve()
  private open = true
  private state: DeliveryState = { kind: DELIVERY_HEALTHY_KIND }

  constructor(sink: NoticeSink, createNoticeId: NoticeIdFactory, request: MonitorRequest, monitorId: string) {
    this.sink = sink
    this.createNoticeId = createNoticeId
    this.request = request
    this.monitorId = monitorId
  }

  get delivery(): DeliveryState {
    return this.state
  }

  sendLine(line: string): void {
    this.send(line, `${NOTICE_LABEL_PREFIX}${this.request.description}`)
  }

  sendExit(exit: CommandExit): void {
    this.send(exitLine(exit), `${NOTICE_LABEL_PREFIX}${this.request.description}${NOTICE_ENDED_SUFFIX}`)
  }

  close(): void {
    this.open = false
  }

  private send(line: string, label: string): void {
    if (this.open) {
      this.sequence += 1
      const notice = this.notice(line, label)
      this.pending = this.pending
        .then(() => this.sink.deliver(notice))
        .catch((error: Error) => {
          this.state = { kind: DELIVERY_FAILED_KIND, noticeId: notice.id, reason: error.message }
        })
    }
  }

  private notice(line: string, label: string): Notice {
    const header = { monitorId: this.monitorId, sequence: this.sequence, description: this.request.description }

    return {
      sessionID: this.request.sessionID,
      id: this.createNoticeId(),
      monitorId: this.monitorId,
      sequence: this.sequence,
      label,
      text: writeNotice(header, [line]),
    }
  }
}
