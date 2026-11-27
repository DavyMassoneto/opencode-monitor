import { MS_PER_SECOND } from "./constants"

export class FloodMeter {
  private readonly linesPerSecond: number
  private readonly seconds: number
  private second = Number.NEGATIVE_INFINITY
  private count = 0
  private floodedSeconds = 0

  constructor(linesPerSecond: number, seconds: number) {
    this.linesPerSecond = linesPerSecond
    this.seconds = seconds
  }

  record(now: number): boolean {
    const second = Math.floor(now / MS_PER_SECOND)

    if (second !== this.second) {
      this.advance(second)
    }
    this.count += 1
    return this.count > this.linesPerSecond && this.floodedSeconds >= this.seconds - 1
  }

  private advance(second: number): void {
    const continuesFlood = second === this.second + 1 && this.count > this.linesPerSecond

    if (continuesFlood) {
      this.floodedSeconds += 1
    } else {
      this.floodedSeconds = 0
    }
    this.second = second
    this.count = 0
  }
}
