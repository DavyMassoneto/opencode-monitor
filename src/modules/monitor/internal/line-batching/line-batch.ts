import { BATCH_MAX_WAIT_MS, BATCH_QUIET_MS } from "./constants"
import { type BatchContent } from "./types"

export class LineBatch {
  private readonly capacity: number
  private lines: string[] = []
  private omitted = 0
  private firstAt = 0
  private lastAt = 0

  constructor(capacity: number) {
    this.capacity = capacity
  }

  get size(): number {
    return this.lines.length
  }

  get dropped(): number {
    return this.omitted
  }

  hasLines(): boolean {
    return this.lines.length > 0
  }

  add(line: string, now: number): void {
    if (!this.hasLines()) {
      this.firstAt = now
    }
    this.lines.push(line)
    if (this.lines.length > this.capacity) {
      this.lines.shift()
      this.omitted += 1
    }
    this.lastAt = now
  }

  deadline(): number {
    return Math.min(this.lastAt + BATCH_QUIET_MS, this.firstAt + BATCH_MAX_WAIT_MS)
  }

  peek(): BatchContent {
    return { lines: [...this.lines], omitted: this.omitted }
  }

  take(): BatchContent {
    const content = { lines: this.lines, omitted: this.omitted }

    this.lines = []
    this.omitted = 0
    return content
  }
}
