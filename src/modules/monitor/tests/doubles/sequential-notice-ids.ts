import { type NoticeIdFactory } from "#monitor/modules/monitor/public"
import { TEST_NOTICE_ID_PREFIX } from "../constants"

export class SequentialNoticeIds {
  private count = 0

  readonly create: NoticeIdFactory = () => {
    this.count += 1
    return `${TEST_NOTICE_ID_PREFIX}${this.count}`
  }
}
