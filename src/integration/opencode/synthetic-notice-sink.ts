import { type Notice, type NoticeSink } from "#monitor/modules"
import { NOTICE_DELIVERY } from "./constants"
import { type MonitorSessionHost } from "./types"

export class SyntheticNoticeSink implements NoticeSink {
  private readonly session: MonitorSessionHost

  constructor(session: MonitorSessionHost) {
    this.session = session
  }

  async deliver(notice: Notice): Promise<void> {
    await this.session.synthetic({
      sessionID: notice.sessionID,
      id: notice.id,
      text: notice.text,
      description: notice.label,
      delivery: NOTICE_DELIVERY,
      resume: true,
      metadata: { monitorId: notice.monitorId, sequence: notice.sequence },
    })
  }
}
