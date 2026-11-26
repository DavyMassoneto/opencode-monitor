import {
  NOTICE_LINE_SEPARATOR,
  NOTICE_TAG,
  NOTICE_UNTRUSTED_ATTRIBUTE,
  OMITTED_LINES_CLOSING,
  OMITTED_LINES_OPENING,
} from "./constants"
import { escapeXml } from "./escape-xml"
import { type NoticeHeader } from "./types"

export function writeNotice(header: NoticeHeader, lines: readonly string[], omitted: number): string {
  const description = escapeXml(header.description)
  const opening = `<${NOTICE_TAG} id="${header.monitorId}" seq="${header.sequence}" description="${description}" ${NOTICE_UNTRUSTED_ATTRIBUTE}>`
  const body = lines.map(escapeXml)

  if (omitted > 0) {
    body.unshift(`${OMITTED_LINES_OPENING}${omitted}${OMITTED_LINES_CLOSING}`)
  }
  return [opening, ...body, `</${NOTICE_TAG}>`].join(NOTICE_LINE_SEPARATOR)
}
