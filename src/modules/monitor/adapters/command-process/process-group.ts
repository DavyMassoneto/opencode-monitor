import { KILL_DELAY_MS, KILL_SIGNAL, STOP_SIGNAL } from "./constants"
import { hasGroupMembers } from "./predicates"
import { readProcessIdentity } from "./read-process-identity"
import { signalProcessGroup } from "./signal-process-group"

export class ProcessGroup {
  private readonly pid: number
  private readonly identity: string
  private killTimer?: NodeJS.Timeout

  constructor(pid: number, identity: string) {
    this.pid = pid
    this.identity = identity
  }

  stop(): void {
    if (!this.killTimer) {
      this.signal(STOP_SIGNAL)
      this.killTimer = setTimeout(() => this.signal(KILL_SIGNAL), KILL_DELAY_MS)
    }
  }

  release(): void {
    if (hasGroupMembers(this.pid)) {
      this.stop()
    } else {
      clearTimeout(this.killTimer)
    }
  }

  private signal(signal: NodeJS.Signals): void {
    const current = readProcessIdentity(this.pid)

    if (!current || current === this.identity) {
      signalProcessGroup(this.pid, signal)
    }
  }
}
