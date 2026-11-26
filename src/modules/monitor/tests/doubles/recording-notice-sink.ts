import { type Notice, type NoticeSink } from "#monitor/modules/monitor/public"

export class RecordingNoticeSink implements NoticeSink {
  readonly notices: Notice[] = []
  readonly attempts: Notice[] = []
  rejection = ""

  async deliver(notice: Notice): Promise<void> {
    this.attempts.push(notice)
    if (this.rejection) {
      throw new Error(this.rejection)
    }
    this.notices.push(notice)
  }
}
