import { closeSync, existsSync, openSync, readSync, statSync } from "node:fs"
import { LINE_BREAK, READ_FLAG, TAIL_LINE_BYTES } from "./constants"

export function readTail(path: string, count: number): string[] {
  if (!existsSync(path)) {
    return []
  }
  const size = statSync(path).size
  const length = Math.min(size, count * TAIL_LINE_BYTES)
  const buffer = Buffer.alloc(length)
  const descriptor = openSync(path, READ_FLAG)

  readSync(descriptor, buffer, 0, length, size - length)
  closeSync(descriptor)
  const lines = buffer.toString().split(LINE_BREAK)
  lines.pop()
  if (length < size) {
    lines.shift()
  }
  return lines.slice(-count)
}
