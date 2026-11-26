import {
  DELIVERY_FAILED_KIND,
  DELIVERY_HEALTHY_KIND,
  type DeliveryState,
  type LineCounts,
  MODE_MANUAL,
  type Notice,
} from "#monitor/modules/monitor/public/contracts"
import { FloodMeter } from "../flood-detection"
import { BATCH_MAX_LINES, type BatchContent, LineBatch, PENDING_MAX_LINES } from "../line-batching"
import { cleanLine } from "../line-cleaning"
import { redactSecrets } from "../secret-redaction"
import {
  NO_PREFIX,
  NOTICE_LABEL_PREFIX,
  NOTICE_LINE_COUNT_CLOSING,
  NOTICE_LINE_COUNT_OPENING,
  STDERR_PREFIX,
} from "./constants"
import { type ChannelCounts, type ChannelSetup } from "./types"
import { writeNotice } from "./write-notice"

export class NoticeChannel {
  private readonly setup: ChannelSetup
  private readonly manual: boolean
  private readonly batch: LineBatch
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
  private readonly counts: ChannelCounts = { received: 0, delivered: 0, dropped: 0 }

  constructor(setup: ChannelSetup) {
    this.setup = setup
    this.manual = setup.request.mode === MODE_MANUAL
    this.batch = new LineBatch(this.manual ? PENDING_MAX_LINES : BATCH_MAX_LINES)
  }

  get delivery(): DeliveryState {
    return this.state
  }

  get lines(): LineCounts {
    return { ...this.counts, pending: this.batch.size, dropped: this.counts.dropped + this.batch.dropped }
  }

  fetch(peek: boolean): BatchContent {
    if (peek) {
      return this.batch.peek()
    }
    const content = this.batch.take()
    this.counts.dropped += content.omitted
    return content
  }

  receiveLine(raw: string): void {
    this.accept(cleanLine(raw), NO_PREFIX)
  }

  receiveStderr(raw: string): void {
    const line = cleanLine(raw)

    this.setup.log.append(redactSecrets(line))
    if (this.setup.request.captureStderr) {
      this.accept(line, STDERR_PREFIX)
    }
  }

  private accept(line: string, prefix: string): void {
    this.counts.received += 1
    if (this.accepting && this.isWanted(line)) {
      const now = Date.now()
      if (this.flood.record(now)) {
        this.accepting = false
        this.setup.onFlood()
      } else {
        this.counts.last = `${prefix}${redactSecrets(line)}`
        this.batch.add(this.counts.last, now)
        if (!this.manual) {
          this.schedule(now)
        }
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
    this.setup.log.close()
    if (!this.manual) {
      this.flushBatch()
      this.enqueue([line], 0, `${NOTICE_LABEL_PREFIX}${this.setup.request.description}${labelSuffix}`, 0)
    }
  }

  close(): void {
    this.accepting = false
    this.silenced = true
    this.cancelTimer()
    this.setup.log.close()
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
      this.counts.dropped += content.omitted
      this.enqueue(content.lines, content.omitted, this.batchLabel(count), content.lines.length)
    }
  }

  private batchLabel(count: number): string {
    const label = `${NOTICE_LABEL_PREFIX}${this.setup.request.description}`

    if (count > 1) {
      return `${label}${NOTICE_LINE_COUNT_OPENING}${count}${NOTICE_LINE_COUNT_CLOSING}`
    }
    return label
  }

  private enqueue(lines: readonly string[], omitted: number, label: string, outputLines: number): void {
    if (!this.silenced) {
      this.sequence += 1
      const notice = this.notice(lines, omitted, label)
      this.delivering = true
      this.pending = this.pending
        .then(() => this.setup.sink.deliver(notice))
        .then(() => {
          this.counts.delivered += outputLines
        })
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
      mode: request.mode,
      id: this.setup.createNoticeId(),
      monitorId,
      sequence: this.sequence,
      label,
      text: writeNotice(header, lines, omitted),
    }
  }
}
