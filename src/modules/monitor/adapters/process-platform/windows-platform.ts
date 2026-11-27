import { spawnSync } from "node:child_process"
import {
  IDENTITY_QUERY_CLOSING,
  IDENTITY_QUERY_OPENING,
  LINE_SEPARATOR,
  POWERSHELL_COMMAND_ARGS,
  TASKKILL_PATH,
  TASKKILL_STAGE_ARGS,
  TEXT_ENCODING,
  TREE_SCRIPT_CLOSING,
  TREE_SCRIPT_MIDDLE,
  TREE_SCRIPT_OPENING,
  UTF8_PREAMBLE,
} from "./constants"
import { type ProcessPlatform, type ShellInvocation, type StopStage } from "./types"

export class WindowsPlatform implements ProcessPlatform {
  private readonly powershell: string

  constructor(powershell: string) {
    this.powershell = powershell
  }

  shellInvocation(command: string): ShellInvocation {
    return { file: this.powershell, args: [...POWERSHELL_COMMAND_ARGS, `${UTF8_PREAMBLE}${command}`], detached: false }
  }

  readIdentity(pid: number): string {
    return this.query(`${IDENTITY_QUERY_OPENING}${pid}${IDENTITY_QUERY_CLOSING}`)
  }

  hasTreeMembers(pid: number, identity: string): boolean {
    return this.descendants(pid, identity).length > 0
  }

  stopTree(pid: number, identity: string, stage: StopStage): void {
    const members = [String(pid), ...this.descendants(pid, identity)]

    for (const member of members) {
      spawnSync(TASKKILL_PATH, ["/PID", member, ...TASKKILL_STAGE_ARGS[stage]], { windowsHide: true })
    }
  }

  private descendants(pid: number, identity: string): string[] {
    if (!identity) {
      return []
    }
    return this.query(`${TREE_SCRIPT_OPENING}${identity}${TREE_SCRIPT_MIDDLE}${pid}${TREE_SCRIPT_CLOSING}`)
      .split(LINE_SEPARATOR)
      .filter(Boolean)
  }

  private query(script: string): string {
    const result = spawnSync(this.powershell, [...POWERSHELL_COMMAND_ARGS, script], {
      encoding: TEXT_ENCODING,
      windowsHide: true,
    })

    if (result.status === 0) {
      return result.stdout.trim()
    }
    return ""
  }
}
