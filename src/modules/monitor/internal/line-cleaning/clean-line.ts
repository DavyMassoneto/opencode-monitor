import {
  BELL_CODE,
  CSI_INTRODUCER_CODE,
  ESCAPE_CODE,
  OSC_INTRODUCER_CODE,
  OSC_STRING_TERMINATOR_LENGTH,
  TRAILING_REPLACEMENT_CHARACTERS,
  TRUNCATION_MARK,
} from "./constants"
import { isFinalByte, isVisibleCode } from "./predicates"

export function cleanLine(raw: string, maxBytes: number): string {
  return truncateToLimit(stripTerminalCodes(raw), maxBytes)
}

function stripTerminalCodes(text: string): string {
  let visible = ""
  let index = 0

  while (index < text.length) {
    const code = text.charCodeAt(index)
    if (code === ESCAPE_CODE) {
      index = escapeEnd(text, index + 1)
    } else {
      if (isVisibleCode(code)) {
        visible += text.charAt(index)
      }
      index += 1
    }
  }
  return visible
}

function escapeEnd(text: string, start: number): number {
  const introducer = text.charCodeAt(start)

  if (introducer === CSI_INTRODUCER_CODE) {
    return controlSequenceEnd(text, start + 1)
  }
  if (introducer === OSC_INTRODUCER_CODE) {
    return operatingCommandEnd(text, start + 1)
  }
  return start + 1
}

function controlSequenceEnd(text: string, start: number): number {
  let index = start

  while (index < text.length && !isFinalByte(text.charCodeAt(index))) {
    index += 1
  }
  return index + 1
}

function operatingCommandEnd(text: string, start: number): number {
  let index = start

  while (index < text.length) {
    const code = text.charCodeAt(index)
    if (code === BELL_CODE) {
      return index + 1
    }
    if (code === ESCAPE_CODE) {
      return index + OSC_STRING_TERMINATOR_LENGTH
    }
    index += 1
  }
  return index
}

function truncateToLimit(text: string, maxBytes: number): string {
  if (Buffer.byteLength(text) <= maxBytes) {
    return text
  }
  const room = maxBytes - Buffer.byteLength(TRUNCATION_MARK)
  const kept = Buffer.from(text).subarray(0, room).toString()

  return `${kept.replace(TRAILING_REPLACEMENT_CHARACTERS, "")}${TRUNCATION_MARK}`
}
