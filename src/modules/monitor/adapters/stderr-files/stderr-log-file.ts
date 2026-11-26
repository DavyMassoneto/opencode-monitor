import { createWriteStream, openSync, renameSync, type WriteStream } from "node:fs"
import { type StderrLog } from "#monitor/modules/monitor/internal"
import { APPEND_FLAG, LINE_BREAK, ROTATED_SUFFIX, STDERR_MAX_BYTES, STDERR_WRITE_FAILURE_TEXT } from "./constants"
import { readTail } from "./read-tail"

export class StderrLogFile implements StderrLog {
  readonly path: string
  private stream: WriteStream
  private bytes = 0
  private closed = false

  constructor(path: string) {
    this.path = path
    this.stream = this.openStream()
  }

  append(line: string): void {
    const entry = `${line}${LINE_BREAK}`
    const size = Buffer.byteLength(entry)

    if (!this.closed) {
      if (this.bytes + size > STDERR_MAX_BYTES) {
        this.rotate()
      }
      this.stream.write(entry)
      this.bytes += size
    }
  }

  tail(count: number): string[] {
    const current = readTail(this.path, count)

    if (current.length >= count) {
      return current
    }
    return [...readTail(`${this.path}${ROTATED_SUFFIX}`, count - current.length), ...current]
  }

  close(): void {
    this.closed = true
    this.stream.end()
  }

  private rotate(): void {
    this.stream.end()
    renameSync(this.path, `${this.path}${ROTATED_SUFFIX}`)
    this.stream = this.openStream()
    this.bytes = 0
  }

  private openStream(): WriteStream {
    const stream = createWriteStream(this.path, { fd: openSync(this.path, APPEND_FLAG) })

    stream.on("error", (error) => console.error(STDERR_WRITE_FAILURE_TEXT, this.path, error))
    return stream
  }
}
