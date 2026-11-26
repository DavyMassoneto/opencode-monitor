import { FLOOD_LINES_PER_SECOND, FLOOD_SECONDS, MS_PER_SECOND } from "./constants"

export class FloodMeter {
  private second = Number.NEGATIVE_INFINITY
  private count = 0
  private floodedSeconds = 0

  record(now: number): boolean {
    const second = Math.floor(now / MS_PER_SECOND)

    if (second !== this.second) {
      this.advance(second)
    }
    this.count += 1
    return this.count > FLOOD_LINES_PER_SECOND && this.floodedSeconds >= FLOOD_SECONDS - 1
  }

  private advance(second: number): void {
    const continuesFlood = second === this.second + 1 && this.count > FLOOD_LINES_PER_SECOND

    if (continuesFlood) {
      this.floodedSeconds += 1
    } else {
      this.floodedSeconds = 0
    }
    this.second = second
    this.count = 0
  }
}
