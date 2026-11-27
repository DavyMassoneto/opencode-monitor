import { type Notice, type NoticeSink } from "#monitor/modules/monitor/public"

export class FlakyNoticeSink implements NoticeSink {
  readonly attempts: Notice[] = []
  readonly delivered: Notice[] = []
  failures: number

  constructor(failures: number) {
    this.failures = failures
  }

  async deliver(notice: Notice): Promise<void> {
    this.attempts.push(notice)
    if (this.failures > 0) {
      this.failures -= 1
      throw new Error(`temporary failure ${this.attempts.length}`)
    }
    this.delivered.push(notice)
  }
}
