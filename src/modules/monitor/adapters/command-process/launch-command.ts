import { spawn } from "node:child_process"
import { createInterface } from "node:readline"
import {
  COMMAND_FAILED_KIND,
  COMMAND_LAUNCHED_KIND,
  type CommandExit,
  type CommandHandlers,
  type CommandLaunch,
  type CommandRequest,
  EXIT_CODE_KIND,
  EXIT_SIGNAL_KIND,
} from "#monitor/modules/monitor/internal"
import { COMMAND_STDIO, LAUNCH_FAILURE_TEXT, PROCESS_ERROR_TEXT, SHELL_COMMAND_FLAG, SHELL_PATH } from "./constants"
import { stopProcessGroup } from "./stop-process-group"
import { type ExitCodeValue, type ExitSignalValue } from "./types"

export function launchCommand(request: CommandRequest, handlers: CommandHandlers): CommandLaunch {
  const child = spawn(SHELL_PATH, [SHELL_COMMAND_FLAG, request.command], {
    cwd: request.directory,
    detached: true,
    stdio: COMMAND_STDIO,
  })
  child.on("error", (error) => console.error(PROCESS_ERROR_TEXT, error))

  const { pid, stdout } = child
  if (!pid || !stdout) {
    return { kind: COMMAND_FAILED_KIND, reason: LAUNCH_FAILURE_TEXT }
  }
  createInterface({ input: stdout, crlfDelay: Number.POSITIVE_INFINITY }).on("line", handlers.onLine)
  child.on("close", (code, signal) => handlers.onExit(exitOf(code, signal)))
  return { kind: COMMAND_LAUNCHED_KIND, pid, stop: () => stopProcessGroup(pid) }
}

function exitOf(code: ExitCodeValue, signal: ExitSignalValue): CommandExit {
  if (typeof code === "number") {
    return { kind: EXIT_CODE_KIND, code }
  }
  return { kind: EXIT_SIGNAL_KIND, signal: String(signal) }
}
