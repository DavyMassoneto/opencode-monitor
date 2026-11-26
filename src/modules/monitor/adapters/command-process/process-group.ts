import { KILL_DELAY_MS, KILL_SIGNAL, STOP_SIGNAL } from "./constants"
import { signalProcessGroup } from "./signal-process-group"

export class ProcessGroup {
  private readonly pid: number
  private closed = false
  private killTimer?: NodeJS.Timeout

  constructor(pid: number) {
    this.pid = pid
  }

  stop(): void {
    if (!this.closed && !this.killTimer) {
      signalProcessGroup(this.pid, STOP_SIGNAL)
      this.killTimer = setTimeout(() => signalProcessGroup(this.pid, KILL_SIGNAL), KILL_DELAY_MS)
    }
  }

  markClosed(): void {
    this.closed = true
    clearTimeout(this.killTimer)
  }
}
