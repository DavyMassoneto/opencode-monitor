import { KILL_STAGE, type ProcessPlatform, type StopStage, TERMINATE_STAGE } from "../process-platform"
import { KILL_DELAY_MS } from "./constants"

export class ProcessGroup {
  private readonly platform: ProcessPlatform
  private readonly pid: number
  private readonly identity: string
  private killTimer?: NodeJS.Timeout

  constructor(platform: ProcessPlatform, pid: number) {
    this.platform = platform
    this.pid = pid
    this.identity = platform.readIdentity(pid)
  }

  stop(): void {
    if (!this.killTimer) {
      this.stopIfOwned(TERMINATE_STAGE)
      this.killTimer = setTimeout(() => this.stopIfOwned(KILL_STAGE), KILL_DELAY_MS)
    }
  }

  release(): void {
    if (this.platform.hasTreeMembers(this.pid, this.identity)) {
      this.stop()
    } else {
      clearTimeout(this.killTimer)
    }
  }

  private stopIfOwned(stage: StopStage): void {
    const current = this.platform.readIdentity(this.pid)

    if (!current || current === this.identity) {
      this.platform.stopTree(this.pid, this.identity, stage)
    }
  }
}
