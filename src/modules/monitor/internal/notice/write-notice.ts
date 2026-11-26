import { NOTICE_LINE_SEPARATOR, NOTICE_TAG, NOTICE_UNTRUSTED_ATTRIBUTE } from "./constants"
import { escapeXml } from "./escape-xml"
import { type NoticeHeader } from "./types"

export function writeNotice(header: NoticeHeader, lines: readonly string[]): string {
  const description = escapeXml(header.description)
  const opening = `<${NOTICE_TAG} id="${header.monitorId}" seq="${header.sequence}" description="${description}" ${NOTICE_UNTRUSTED_ATTRIBUTE}>`

  return [opening, ...lines.map(escapeXml), `</${NOTICE_TAG}>`].join(NOTICE_LINE_SEPARATOR)
}
