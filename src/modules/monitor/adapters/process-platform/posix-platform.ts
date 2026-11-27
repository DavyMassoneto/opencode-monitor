import { spawnSync } from "node:child_process"
import {
  POSIX_COMMAND_FLAG,
  POSIX_SHELL,
  POSIX_STAGE_SIGNALS,
  PROBE_SIGNAL,
  PS_FORMAT,
  PS_PATH,
  TEXT_ENCODING,
} from "./constants"
import { isGoneProcessError } from "./predicates"
import { type ProcessPlatform, type ShellInvocation, type StopStage } from "./types"

export class PosixPlatform implements ProcessPlatform {
  shellInvocation(command: string): ShellInvocation {
    return { file: POSIX_SHELL, args: [POSIX_COMMAND_FLAG, command], detached: true }
  }

  readIdentity(pid: number): string {
    const result = spawnSync(PS_PATH, ["-o", PS_FORMAT, "-p", String(pid)], { encoding: TEXT_ENCODING })

    if (result.status === 0) {
      return result.stdout.trim()
    }
    return ""
  }

  hasTreeMembers(pid: number, _identity: string): boolean {
    try {
      process.kill(-pid, PROBE_SIGNAL)
      return true
    } catch {
      return false
    }
  }

  stopTree(pid: number, _identity: string, stage: StopStage): void {
    try {
      process.kill(-pid, POSIX_STAGE_SIGNALS[stage])
    } catch (error) {
      if (!(error instanceof Error && isGoneProcessError(error))) {
        throw error
      }
    }
  }
}
