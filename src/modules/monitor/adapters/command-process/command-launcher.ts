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
import { type ProcessPlatform } from "../process-platform"
import { COMMAND_STDIO, LAUNCH_FAILURE_TEXT, PROCESS_ERROR_TEXT } from "./constants"
import { ProcessGroup } from "./process-group"
import { type ExitCodeValue, type ExitSignalValue } from "./types"

export function launchWith(
  platform: ProcessPlatform,
  request: CommandRequest,
  handlers: CommandHandlers,
): CommandLaunch {
  const shell = platform.shellInvocation(request.command)
  const child = spawn(shell.file, shell.args, {
    cwd: request.directory,
    env: { ...process.env, ...Object.fromEntries(request.environment) },
    detached: shell.detached,
    windowsHide: true,
    stdio: COMMAND_STDIO,
  })
  child.on("error", (error) => console.error(PROCESS_ERROR_TEXT, error))

  const { pid, stdout, stderr } = child
  if (!pid || !stdout || !stderr) {
    return { kind: COMMAND_FAILED_KIND, reason: LAUNCH_FAILURE_TEXT }
  }
  const group = new ProcessGroup(platform, pid)
  createInterface({ input: stdout, crlfDelay: Number.POSITIVE_INFINITY }).on("line", handlers.onLine)
  createInterface({ input: stderr, crlfDelay: Number.POSITIVE_INFINITY }).on("line", handlers.onStderr)
  child.on("close", (code, signal) => {
    group.release()
    handlers.onExit(exitOf(code, signal))
  })
  return { kind: COMMAND_LAUNCHED_KIND, pid, stop: () => group.stop() }
}

function exitOf(code: ExitCodeValue, signal: ExitSignalValue): CommandExit {
  if (typeof code === "number") {
    return { kind: EXIT_CODE_KIND, code }
  }
  return { kind: EXIT_SIGNAL_KIND, signal: String(signal) }
}
