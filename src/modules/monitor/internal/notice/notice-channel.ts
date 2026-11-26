import {
  DELIVERY_FAILED_KIND,
  DELIVERY_HEALTHY_KIND,
  type DeliveryState,
  type Notice,
} from "#monitor/modules/monitor/public/contracts"
import { FloodMeter } from "../flood-detection"
import { LineBatch } from "../line-batching"
import { cleanLine } from "../line-cleaning"
import { redactSecrets } from "../secret-redaction"
import { NOTICE_LABEL_PREFIX, NOTICE_LINE_COUNT_CLOSING, NOTICE_LINE_COUNT_OPENING } from "./constants"
import { type ChannelSetup } from "./types"
import { writeNotice } from "./write-notice"

export class NoticeChannel {
  private readonly setup: ChannelSetup
  private readonly batch = new LineBatch()
  private readonly flood = new FloodMeter()
  private sequence = 0
  private pending: Promise<void> = Promise.resolve()
  private delivering = false
  private flushDue = false
  private scheduled = false
  private timer?: NodeJS.Timeout
  private accepting = true
  private silenced = false
  private state: DeliveryState = { kind: DELIVERY_HEALTHY_KIND }

  constructor(setup: ChannelSetup) {
    this.setup = setup
  }

  get delivery(): DeliveryState {
    return this.state
  }

  receiveLine(raw: string): void {
    const line = cleanLine(raw)

    if (this.accepting && this.isWanted(line)) {
      const now = Date.now()
      if (this.flood.record(now)) {
        this.accepting = false
        this.setup.onFlood()
      } else {
        this.batch.add(redactSecrets(line), now)
        this.schedule(now)
      }
    }
  }

  private isWanted(line: string): boolean {
    const { pattern } = this.setup.request

    return !pattern || pattern.test(line)
  }

  end(line: string, labelSuffix: string): void {
    this.accepting = false
    this.cancelTimer()
    this.flushBatch()
    this.enqueue([line], 0, `${NOTICE_LABEL_PREFIX}${this.setup.request.description}${labelSuffix}`)
  }

  close(): void {
    this.accepting = false
    this.silenced = true
    this.cancelTimer()
  }

  private schedule(now: number): void {
    if (!this.scheduled) {
      this.scheduled = true
      this.timer = setTimeout(() => this.onDeadline(), this.batch.deadline() - now)
    }
  }

  private onDeadline(): void {
    const now = Date.now()

    this.scheduled = false
    if (this.batch.deadline() > now) {
      this.schedule(now)
    } else if (this.delivering) {
      this.flushDue = true
    } else {
      this.flushBatch()
    }
  }

  private cancelTimer(): void {
    clearTimeout(this.timer)
    this.scheduled = false
  }

  private flushBatch(): void {
    if (this.batch.hasLines()) {
      const content = this.batch.take()
      const count = content.lines.length + content.omitted
      this.enqueue(content.lines, content.omitted, this.batchLabel(count))
    }
  }

  private batchLabel(count: number): string {
    const label = `${NOTICE_LABEL_PREFIX}${this.setup.request.description}`

    if (count > 1) {
      return `${label}${NOTICE_LINE_COUNT_OPENING}${count}${NOTICE_LINE_COUNT_CLOSING}`
    }
    return label
  }

  private enqueue(lines: readonly string[], omitted: number, label: string): void {
    if (!this.silenced) {
      this.sequence += 1
      const notice = this.notice(lines, omitted, label)
      this.delivering = true
      this.pending = this.pending
        .then(() => this.setup.sink.deliver(notice))
        .catch((error: Error) => {
          this.state = { kind: DELIVERY_FAILED_KIND, noticeId: notice.id, reason: error.message }
        })
        .finally(() => this.afterDelivery())
    }
  }

  private afterDelivery(): void {
    this.delivering = false
    if (this.flushDue) {
      this.flushDue = false
      this.flushBatch()
    }
  }

  private notice(lines: readonly string[], omitted: number, label: string): Notice {
    const { request, monitorId } = this.setup
    const header = { monitorId, sequence: this.sequence, description: request.description }

    return {
      sessionID: request.sessionID,
      id: this.setup.createNoticeId(),
      monitorId,
      sequence: this.sequence,
      label,
      text: writeNotice(header, lines, omitted),
    }
  }
}
